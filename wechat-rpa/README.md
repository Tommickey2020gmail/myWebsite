# 公众号自动发布（RPA）

个人未认证订阅号没有发布 API 权限，但网页后台本来就能群发（每天 1 次）。
这个工具用 Playwright 驱动浏览器，**模拟你本人在网页后台操作**，绕过 API 限制。

整条链分两段：

1. **Linux 仓库**：`pnpm wechat:export <文章.md>` → 生成 `wechat-export/<slug>/`（含 `meta.json` / `body.html` / 封面图 / 插图）
2. **Windows（这里）**：把那个 `<slug>` 文件夹拷进 `bundles/`，运行本工具自动建草稿/群发

## 在 Windows 上构建 exe

前置：装好 **Python 3.10+**（python.org，安装时勾选 “Add to PATH”）。

双击 `build.bat`，等它跑完 → 产物在 `dist\publish.exe`。

## 使用

1. 把网站那边生成的 `wechat-export\<slug>\` 整个文件夹拷到本目录的 `bundles\` 下
2. **首次联调**（强烈建议，命令行里跑，有头 + 只存草稿 + 出错暂停）：
   ```
   dist\publish.exe --debug --draft-only
   ```
   - 第一次会打开微信登录页 → 用管理员微信扫码；登录态存进 `.wx-profile\`，之后免扫码
   - 跑通后去手机/后台预览草稿，确认排版没问题
3. **日常全自动群发**：直接双击 `dist\publish.exe`（自动取 `bundles\` 下最新的一个）

## 联调说明（重要）

微信公众平台的页面元素（选择器）会随改版变化，且**图片上传/替换那一段需要在真实页面上对着 DOM 补全**（代码里已标注 `NOTE`）。

- 所有选择器集中在 `publish.py` 顶部的 `SEL` 常量区
- 用 `--debug` 跑，出错时会弹出 Playwright Inspector 并暂停，可在真实页面取选择器
- 把报错/截图发给我，我来改 `SEL` 和图片上传逻辑

## 注意

- 订阅号**每天仅 1 次群发**，且发出基本撤不回 —— 首次务必先 `--draft-only` 验证
- 不要把 `.wx-profile/`（含登录态）提交到 git 或分享给别人
