# 评论后端部署：Waline 自托管 (Docker + SQLite)

> 给 tommickey.cn 上线评论功能的服务器侧步骤。前端已经在主仓库里 (`src/components/Comments.astro` + 三个 detail 页面)，等后端跑起来、CF Pages 设置好环境变量后就会自动激活。

## 架构

```
读者 → tommickey.cn (Cloudflare Pages, 静态)
         │
         │ 点开「展开评论」时按需加载
         ▼
       comment.tommickey.cn
         │ (Cloudflare Tunnel, dashboard 管 ingress)
         ▼
       服务器: cloudflared 容器 ──docker net──▶ waline 容器 (SQLite)
```

- 主站：静态站，CF Pages 上保持不变
- 评论后端：跑在你自己的服务器上 (跟 AppCenter 同台)，通过 Cloudflare Tunnel 暴露
- 不开任何对外端口，不用申请证书，不用配 nginx
- 数据：单文件 SQLite 落在主机上，方便 rsync 备份

## 1. 服务器侧 (一次性)

假设服务器已有 Docker 和 Nginx (跟 AppCenter 一样的环境)。

### 1.1 选好持久化目录

```bash
sudo mkdir -p /srv/waline/data
sudo chown 1000:1000 /srv/waline/data   # waline 容器以 uid 1000 运行
```

### 1.2 准备 .env

`/srv/waline/.env`（**chmod 600**，别提交进 git）：

```ini
# Cloudflare Tunnel token（从 Zero Trust → Networks → Tunnels 拿）
TUNNEL_TOKEN=eyJh......

# Waline JWT secret，先生成：openssl rand -hex 32
JWT_TOKEN=64位16进制字符串

# 你的管理员邮箱
AUTHOR_EMAIL=youraddr@example.com
```

```bash
sudo install -m 600 /dev/stdin /srv/waline/.env <<'EOF'
TUNNEL_TOKEN=粘贴你的token
JWT_TOKEN=粘贴openssl rand -hex 32的输出
AUTHOR_EMAIL=youraddr@example.com
EOF
```

### 1.3 创建 docker-compose.yml

`/srv/waline/docker-compose.yml`：

```yaml
services:
  waline:
    container_name: waline
    image: lizheming/waline:latest
    restart: unless-stopped
    expose:
      - "8360"           # 仅暴露给同一 docker network，不映射到主机
    volumes:
      - ./data:/app/data
    environment:
      TZ: "Asia/Shanghai"
      SQLITE_PATH: "/app/data"
      JWT_TOKEN: "${JWT_TOKEN}"
      SITE_NAME: "tommickey.cn"
      SITE_URL: "https://tommickey.cn"
      SECURE_DOMAINS: "tommickey.cn,www.tommickey.cn"
      AUTHOR_EMAIL: "${AUTHOR_EMAIL}"
      # 可选：邮件通知
      # SMTP_SERVICE: "QQ"
      # SMTP_USER: "youraddr@qq.com"
      # SMTP_PASS: "smtp-auth-code"
      # 可选：webhook（飞书/钉钉/Discord/Telegram）
      # WEBHOOK: "https://..."
    networks:
      - waline-net

  cloudflared:
    container_name: waline-tunnel
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
    depends_on:
      - waline
    networks:
      - waline-net

networks:
  waline-net:
    driver: bridge
```

启动：

```bash
cd /srv/waline
docker compose up -d
docker compose logs -f waline       # 等到 "Server is listening on: http://0.0.0.0:8360"
docker compose logs -f cloudflared  # 等到 "Registered tunnel connection"
```

### 1.4 Cloudflare 仪表盘配 Public Hostname

进 https://one.dash.cloudflare.com/ → Networks → Tunnels → 点你的 tunnel → **Public Hostname** → **Add a public hostname**：

| 字段 | 值 |
|------|------|
| Subdomain | `comment` |
| Domain | `tommickey.cn` |
| Path | （留空） |
| Type | `HTTP` |
| URL | `waline:8360` |

> 这里写 `waline:8360`（容器名），不是 `localhost:8360` —— cloudflared 容器是通过 `waline-net` 访问 waline 容器的，主机上 8360 根本没开。

保存后 CF 自动加 CNAME 到 `<tunnel-id>.cfargotunnel.com`，无需手动改 DNS。如果之前手动加过 `comment.tommickey.cn` 的 A/CNAME，先删掉再保存。

### 1.5 注册管理员

打开 `https://comment.tommickey.cn/ui/register`，**第一个**注册的账号自动成为管理员。注册完后建议关闭路径访问（前置 Nginx auth 或 IP 白名单），但 Waline 默认只允许同一邮箱二次注册管理员，已经够安全。

管理面板：`https://comment.tommickey.cn/ui/`

## 2. Cloudflare Pages 侧

打开主站项目 → Settings → Environment variables → Production：

```
PUBLIC_WALINE_SERVER = https://comment.tommickey.cn
```

加完触发一次 redeploy，评论区就会出现在所有 garden / essays / projects 详情页底部。

## 3. 验证

随便挑一篇文章页（如 `/essays/the-loop-and-the-self/`）：

1. 拉到底部应能看到「💬 展开评论 / Show comments」
2. 点开后 `@waline/client` 从 unpkg 加载，~50KB gz
3. 输入昵称（不强制邮箱）和评论提交，刷新应能看到

## 4. 备份

SQLite 单文件，`rsync` 即可：

```bash
# 每天凌晨 3 点 cron
0 3 * * * rsync -a /srv/waline/data/ /backup/waline/$(date +\%F)/
```

## 5. 已知小问题 / 留意

- **首次评论不会触发邮件通知**，除非你配置了 SMTP。轻量替代：用 `WEBHOOK` 推送到飞书/钉钉。
- **评论里 Markdown / 表情默认开着**，主题色和暗色模式已通过 `dark: 'html.dark'` 跟随主站。
- **path 用 `window.location.pathname`**，而本站 URL 都带尾斜杠，所以 path 稳定不会换。如果以后改了 URL 结构，老评论会"找不到归属" — 后台可批量改 path。
- **反垃圾**：默认开启 Akismet 兼容接口；想接 Cloudflare Turnstile 的话需要前端再注入 token，留作后续。
- **数据迁移**：Waline 后台有 export/import；如果以后想换到 Vercel + LeanCloud 也能搬。
