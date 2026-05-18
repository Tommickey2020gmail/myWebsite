---
title: Shadowsocks 技术速记
title_en: Shadowsocks — A Technical Primer
description: 从协议设计、组件分工到 Ubuntu 部署清单——ss-libev + Privoxy 的最小可用配置，以及为什么 SS 在 DPI 演进面前需要叠加伪装。
description_en: Protocol design, component roles, and a minimum-viable Ubuntu deployment of ss-libev + Privoxy — plus why plain SS needs obfuscation layers in the age of active probing.
lang: zh
status: seedling
created: 2026-05-18
tags: [networking, proxy, shadowsocks, infra]
---

> 本文从纯技术角度梳理 Shadowsocks 的协议设计、部署方式与局限。作为网络工程笔记备查。

## 一、Shadowsocks 是什么

Shadowsocks（SS）是 clowwindy 在 2012 年开源的轻量级 SOCKS5 代理协议。设计目标是把 TCP/UDP 流量加密后转发，让"代理流量"在网络层看起来像普通加密流，从而绕过基于特征匹配的 DPI 过滤。

**核心特点**：

- 协议简洁，基于 SOCKS5，无复杂握手
- AEAD 加密（`chacha20-ietf-poly1305`、`aes-256-gcm` 等）
- 跨平台多语言实现（Python / C / Go / Rust）
- C/S 架构：服务端 `ss-server` + 客户端 `ss-local`
- 单连接内存几 MB，适合低配 VPS、树莓派等小机型

**主流实现**：

| 实现 | 语言 | 状态 |
|------|------|------|
| shadowsocks-python | Python | 最早版本，已停更 |
| shadowsocks-libev | C | 主流推荐，性能好 |
| shadowsocks-rust | Rust | 新兴主流，社区活跃 |
| go-shadowsocks2 | Go | 官方 Go 实现 |

## 二、架构与组件

典型部署链路：

```
[浏览器 / 应用]
      ↓  HTTP
[Privoxy]        本地 8118  (HTTP → SOCKS5 转换)
      ↓  SOCKS5
[ss-local]       本地 1080  (加密)
      ↓  加密 TCP
[ss-server]      远端 VPS   (解密)
      ↓  明文
[目标网站]
```

各组件分工：

- **ss-server** — 部署在 VPS 上，监听端口，解密后转发到目标
- **ss-local** — 部署在本机，作为本地 SOCKS5 入口，加密后送给 ss-server
- **Privoxy** — HTTP → SOCKS5 桥接，给那些只支持 HTTP 代理的工具（`apt`、`wget`、老 SDK）用

> 为什么需要 Privoxy？因为很多命令行工具和老应用只认 HTTP 代理协议，不认 SOCKS5。Privoxy 充当协议转换桥。

## 三、最小部署清单（Ubuntu / Debian）

### 3.1 服务端：ss-server

```bash
sudo apt update
sudo apt install shadowsocks-libev -y
sudo nano /etc/shadowsocks-libev/config.json
```

服务端配置：

```json
{
  "server": "0.0.0.0",
  "server_port": 8388,
  "password": "your_strong_password_here",
  "timeout": 300,
  "method": "chacha20-ietf-poly1305",
  "mode": "tcp_and_udp",
  "fast_open": false
}
```

启动 + 开机自启 + 放行防火墙：

```bash
sudo systemctl enable shadowsocks-libev
sudo systemctl restart shadowsocks-libev
sudo systemctl status shadowsocks-libev

sudo ufw allow 8388/tcp
sudo ufw allow 8388/udp
```

### 3.2 客户端：ss-local

```bash
sudo apt install shadowsocks-libev -y
sudo nano /etc/shadowsocks-libev/ss-local.json
```

客户端配置：

```json
{
  "server": "your.vps.ip.address",
  "server_port": 8388,
  "local_address": "127.0.0.1",
  "local_port": 1080,
  "password": "your_strong_password_here",
  "timeout": 300,
  "method": "chacha20-ietf-poly1305",
  "mode": "tcp_and_udp"
}
```

启动（先前台调试，确认无误再交给 systemd）：

```bash
# 前台测试
ss-local -c /etc/shadowsocks-libev/ss-local.json

# 后台 systemd 启动
sudo systemctl enable shadowsocks-libev-local@ss-local
sudo systemctl start shadowsocks-libev-local@ss-local
```

### 3.3 Privoxy：HTTP → SOCKS5

```bash
sudo apt install privoxy -y
sudo nano /etc/privoxy/config
```

在配置末尾加：

```
listen-address  127.0.0.1:8118
forward-socks5t / 127.0.0.1:1080 .
```

启动：

```bash
sudo systemctl enable privoxy
sudo systemctl restart privoxy
```

### 3.4 验证

```bash
export http_proxy=http://127.0.0.1:8118
export https_proxy=http://127.0.0.1:8118
curl -I https://www.google.com
```

返回 `HTTP/2 200` 即成功。

## 四、桌面 / 移动客户端

不想搞命令行的可以直接用 GUI 客户端：

- **Windows**：Shadowsocks-Windows、Clash for Windows（已停更但仍可用）
- **macOS**：ShadowsocksX-NG、ClashX
- **Android**：Shadowsocks for Android
- **iOS**：Shadowrocket、Quantumult（App Store 国区已下架，需海外账号）

## 五、技术优势

**1. 轻量高效**
单进程内存 < 20 MB；libev 实现单核可处理千兆带宽。在树莓派或最低配 VPS 上都能跑。

**2. 部署门槛极低**
相比 OpenVPN、WireGuard 的证书 / 密钥分发流程，SS 5 分钟就能搭起来。

**3. AEAD 加密**
现代 SS 使用 Authenticated Encryption with Associated Data：

- `chacha20-ietf-poly1305` — 移动端首选，无硬件加速也快
- `aes-256-gcm` — 服务端首选，CPU 有 AES-NI 时极快

**4. 抗简单 DPI**
加密后看起来像随机字节流，不会触发基于固定特征的 DPI 命中。

**5. 模块化**
`ss-local / ss-server / ss-redir / ss-tunnel` 各司其职，可叠加 `obfs-plugin`、`v2ray-plugin` 做进一步伪装。

## 六、局限性

技术评估要客观，纯 SS 也有明显短板：

- **随机流量也是一种特征** — 高级 DPI 会做主动探测（"看着像加密流但不像任何已知协议"本身就可识别），所以才有 SS + obfs、SSR、V2Ray (VMess / VLESS)、Trojan 等后续演化
- **UDP 转发不够稳** — 早期版本对 UDP 支持有限
- **无内置流量伪装** — 需要配合 obfs / v2ray-plugin 做 TLS 模拟
- **原作者已退场** — clowwindy 在 2015 年因压力删库，现由 shadowsocks-libev 与 shadowsocks-rust 社区接力维护

## 七、一句话总结

SS 是"代理协议"的极简范式：拿 SOCKS5 + AEAD 加密换来部署成本极低、单机性能极高。但"对抗 DPI"是一个持续演进的军备竞赛，纯 SS 在 2026 年的网络环境里更适合作为**学习样本**和**内部网络的轻量级 SOCKS5 中转**，而不是面向高强度封锁的最终方案——后者要看 V2Ray / Trojan / Hysteria 这条线。

---

## English

> A technical primer on Shadowsocks: protocol design, component roles, a minimal Ubuntu deployment, and an honest look at its limits.

### What it is

Shadowsocks (SS) is a lightweight SOCKS5 proxy protocol open-sourced by clowwindy in 2012. It encrypts TCP/UDP traffic with AEAD ciphers (`chacha20-ietf-poly1305`, `aes-256-gcm`) and forwards it through a remote server. The original design goal was to evade signature-based DPI by making proxy traffic look like opaque random bytes.

Key characteristics: simple protocol (no fancy handshake), small memory footprint (a few MB per connection), and multi-language implementations across Python, C (libev), Go, and Rust. `libev` and `rust` are the recommended forks today; the original Python implementation has been unmaintained for years.

### Architecture

A typical deployment chains `application → Privoxy (8118) → ss-local (1080) → ss-server → target`. `ss-server` lives on a remote VPS; `ss-local` runs on the user's machine as a SOCKS5 entry point. Privoxy bridges HTTP-only clients (like `apt` or older CLI tools) into the SOCKS5 chain.

### Minimum deployment

On both server and client, install `shadowsocks-libev` via apt. The server config binds `0.0.0.0:8388` with a strong password and `chacha20-ietf-poly1305`. The client mirrors that config and exposes `127.0.0.1:1080` as a local SOCKS5 endpoint. Privoxy is installed alongside the client, configured with `forward-socks5t / 127.0.0.1:1080 .` and `listen-address 127.0.0.1:8118`. Verify with `curl -I https://www.google.com` after exporting `http_proxy=http://127.0.0.1:8118`.

### Strengths

- **Efficiency** — `libev` saturates gigabit on a single core; memory under 20 MB
- **Simplicity** — minutes to deploy compared to OpenVPN / WireGuard cert flows
- **AEAD** — `chacha20-ietf-poly1305` for mobile, `aes-256-gcm` for AES-NI servers
- **Modular** — `ss-redir`, `ss-tunnel`, `obfs-plugin`, `v2ray-plugin` compose well

### Limits

Plain SS shows a tell to active-probing DPI: random-looking traffic that fits no known protocol is itself a fingerprint. That tension drove subsequent designs (SSR, V2Ray VMess/VLESS, Trojan, Hysteria) that wrap the payload in TLS or QUIC to look like ordinary HTTPS. UDP was unreliable in early versions, and the original author stopped maintaining the project in 2015 — `shadowsocks-libev` and `shadowsocks-rust` are the active community forks.

### Bottom line

In 2026, SS is best understood as the canonical minimal proxy design — excellent for learning, internal SOCKS5 relays, and low-friction deployments. For hostile network environments, layer it under obfuscation plugins or move to the V2Ray / Trojan / Hysteria family.
