#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
公众号自动发布（RPA）—— 驱动微信公众平台网页后台，模拟真人操作。

个人未认证订阅号没有发布 API 权限，但网页后台本来就能群发（每天 1 次）。
本脚本用 Playwright 驱动一个带持久登录态的 Chromium，按真人流程：
  登录(首次扫码) → 新建图文 → 填标题/作者/正文 → 上传封面+插图 → 保存草稿 →（可选）群发

输入：一个 bundle 目录（由网站仓库的 `pnpm wechat:export` 生成），含
  meta.json / body.html / cover 图 / inline 图。

用法（开发/联调，建议先用有头模式 + 只存草稿）：
  python publish.py ./bundles/feeding-the-gravediggers --debug --draft-only
打包成 exe 后：
  双击 publish.exe  → 自动取 ./bundles/ 下最新的一个目录，全自动群发

⚠ 第一次运行：会打开登录页，请用管理员微信扫码；登录态保存在 ./.wx-profile/，
  之后一段时间内免扫码。Cookie 过期后会再次要求扫码。

⚠ 选择器随微信改版会变 —— 全部集中在下方 SEL 常量区，联调时改这里即可。
  用 --debug 跑（有头 + 出错暂停），配合浏览器开发者工具核对真实 DOM。
"""

import argparse
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

HERE = Path(__file__).resolve().parent
PROFILE_DIR = HERE / ".wx-profile"      # 持久登录态
BUNDLES_DIR = HERE / "bundles"

MP_HOME = "https://mp.weixin.qq.com/"

# ──────────────────────────────────────────────────────────────────────────
# 选择器 / URL —— 会随微信公众平台改版变化，联调时只改这里
# 用 --debug 跑，出错会 page.pause() 打开 Inspector，可在真实页面上取选择器
# ──────────────────────────────────────────────────────────────────────────
SEL = {
    # 登录成功的判据：登录后 URL 带 token，且首页出现侧边栏
    "login_ok_marker": "#menuBar, .weui-desktop-menu, .new-creation__menu",
    # 首页「写新图文 / 新的创作」入口（多个候选，任一命中即可）
    "new_article_entry": [
        "text=图文消息",
        "text=写新图文",
        ".new-creation__menu-item:has-text('图文')",
        "a:has-text('图文消息')",
    ],
    # ——编辑器（通常在新标签页打开，且正文在 iframe 里）——
    "editor_iframe": "iframe#ueditor_0, iframe.edui-editor-iframe, iframe[id^='ueditor']",
    "title_input": "#title, textarea[placeholder*='标题'], input[placeholder*='标题']",
    "author_input": "#author, input[placeholder*='作者']",
    # 正文 iframe 内的可编辑 body
    "editor_body": "body",
    # 摘要：通常要先展开「更多」/「摘要」面板
    "digest_textarea": "#js_description, textarea[placeholder*='摘要']",
    # 封面选择入口 + 上传 file input
    "cover_entry": "text=封面, .js_cover_area, .cover_area",
    "cover_upload_input": "input[type=file]",
    # 正文工具栏「图片」按钮 + 其上传 file input
    "toolbar_image_btn": "#js_image, .edui-for-insertimage, [title='图片']",
    "image_upload_input": "input[type=file]",
    # 确认/插入按钮
    "dialog_confirm": "button:has-text('确定'), button:has-text('插入'), button:has-text('完成')",
    # 保存草稿
    "save_draft_btn": "#js_submit, button:has-text('保存为草稿'), button:has-text('保存草稿')",
    # 群发流程
    "send_btn": "#js_send, button:has-text('群发'), button:has-text('发表')",
    "send_confirm_btn": "button:has-text('继续群发'), button:has-text('确定'), button:has-text('确认')",
}

DEFAULT_TIMEOUT = 30_000


def log(msg):
    print(f"[wx] {msg}", flush=True)


def pick_bundle(arg):
    if arg:
        p = Path(arg).resolve()
        if not p.is_dir():
            sys.exit(f"bundle 目录不存在: {p}")
        return p
    # 无参数：取 bundles/ 下最新修改的子目录
    if not BUNDLES_DIR.is_dir():
        sys.exit(f"未指定 bundle，且 {BUNDLES_DIR} 不存在")
    subs = [d for d in BUNDLES_DIR.iterdir() if d.is_dir()]
    if not subs:
        sys.exit(f"{BUNDLES_DIR} 下没有 bundle 目录")
    return max(subs, key=lambda d: d.stat().st_mtime)


def load_bundle(bundle: Path):
    meta = json.loads((bundle / "meta.json").read_text("utf-8"))
    body_html = (bundle / "body.html").read_text("utf-8")
    return meta, body_html


def first_visible(page, selectors, timeout=8000):
    """返回 selectors 列表里第一个可见的 locator，超时则 None。"""
    if isinstance(selectors, str):
        selectors = [selectors]
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        for s in selectors:
            loc = page.locator(s).first
            try:
                if loc.is_visible():
                    return loc
            except Exception:
                pass
        page.wait_for_timeout(300)
    return None


def ensure_login(page, debug):
    log("打开公众平台首页…")
    page.goto(MP_HOME, wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    if first_visible(page, SEL["login_ok_marker"], timeout=4000):
        log("已是登录态。")
        return
    log("未登录 —— 请用管理员微信【扫码登录】，脚本等待中…")
    # 等待登录成功标志出现（最多 5 分钟，给扫码留足时间）
    marker = first_visible(page, SEL["login_ok_marker"], timeout=300_000)
    if not marker:
        if debug:
            page.pause()
        sys.exit("登录超时/失败。")
    log("登录成功。")


def open_new_article(context, page, debug):
    entry = first_visible(page, SEL["new_article_entry"], timeout=15000)
    if not entry:
        if debug:
            log("找不到「写新图文」入口，暂停供你核对 DOM。")
            page.pause()
        sys.exit("未找到新建图文入口（核对 SEL['new_article_entry']）。")
    # 编辑器多在新标签页打开
    try:
        with context.expect_page(timeout=DEFAULT_TIMEOUT) as pop:
            entry.click()
        editor = pop.value
        editor.wait_for_load_state("domcontentloaded")
        log("编辑器已在新标签页打开。")
        return editor
    except PWTimeout:
        log("未弹出新标签页，沿用当前页作为编辑器。")
        page.wait_for_timeout(1500)
        return page


def fill_article(editor, meta, body_html, debug):
    editor.set_default_timeout(DEFAULT_TIMEOUT)

    title = first_visible(editor, SEL["title_input"], timeout=15000)
    if not title:
        if debug:
            editor.pause()
        sys.exit("找不到标题输入框（核对 SEL['title_input']）。")
    title.fill(meta["title"])
    log(f"标题: {meta['title']}")

    if meta.get("author"):
        au = first_visible(editor, SEL["author_input"], timeout=4000)
        if au:
            au.fill(meta["author"])
            log(f"作者: {meta['author']}")

    # 正文：注入到 iframe 内的可编辑 body
    frame_el = first_visible(editor, SEL["editor_iframe"], timeout=15000)
    if not frame_el:
        if debug:
            editor.pause()
        sys.exit("找不到正文 iframe（核对 SEL['editor_iframe']）。")
    frame = frame_el.element_handle().content_frame()
    frame.eval_on_selector(
        SEL["editor_body"],
        "(el, html) => { el.innerHTML = html; }",
        body_html,
    )
    log("正文 HTML 已注入。")

    # 摘要
    if meta.get("digest"):
        dg = first_visible(editor, SEL["digest_textarea"], timeout=4000)
        if dg:
            dg.fill(meta["digest"])
            log("摘要已填。")

    # NOTE: 正文里的 <img src='inline-*.jpeg'> 此刻是死链 —— 微信不认外链/本地图。
    # 需在此处逐张：点工具栏图片按钮 → 上传 bundle 里的图 → 取回 mmbiz URL →
    # 替换 iframe 内对应占位 <img> 的 src。封面同理走封面上传。
    # 这两段强依赖真实 DOM，留待 --debug 联调时按 SEL 注释补全。
    log("⚠ 图片上传/替换尚未联调（见代码 NOTE）—— 当前正文图片为占位。")


def save_draft(editor, debug):
    btn = first_visible(editor, SEL["save_draft_btn"], timeout=10000)
    if not btn:
        if debug:
            editor.pause()
        log("找不到「保存草稿」按钮（核对 SEL['save_draft_btn']）。")
        return False
    btn.click()
    editor.wait_for_timeout(2500)
    log("已保存草稿。")
    return True


def mass_send(editor, debug):
    btn = first_visible(editor, SEL["send_btn"], timeout=10000)
    if not btn:
        if debug:
            editor.pause()
        log("找不到「群发」按钮（核对 SEL['send_btn']）。")
        return False
    btn.click()
    editor.wait_for_timeout(1500)
    confirm = first_visible(editor, SEL["send_confirm_btn"], timeout=8000)
    if confirm:
        confirm.click()
        editor.wait_for_timeout(2500)
    log("已触发群发。")
    return True


def main():
    ap = argparse.ArgumentParser(description="公众号自动发布 (RPA)")
    ap.add_argument("bundle", nargs="?", help="bundle 目录；缺省取 bundles/ 下最新")
    ap.add_argument("--debug", action="store_true", help="有头模式 + 出错暂停 Inspector")
    ap.add_argument("--draft-only", action="store_true", help="只存草稿，不群发（首次联调强烈建议）")
    args = ap.parse_args()

    bundle = pick_bundle(args.bundle)
    meta, body_html = load_bundle(bundle)
    log(f"bundle: {bundle.name}  （封面 {meta.get('cover')} / 插图 {len(meta.get('content_images', []))} 张）")

    headless = not args.debug
    with sync_playwright() as pw:
        context = pw.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            args=["--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.set_default_timeout(DEFAULT_TIMEOUT)
        try:
            ensure_login(page, args.debug)
            editor = open_new_article(context, page, args.debug)
            fill_article(editor, meta, body_html, args.debug)
            save_draft(editor, args.debug)
            if args.draft_only:
                log("--draft-only：已停在草稿，请到手机/后台预览确认后手动群发。")
            else:
                mass_send(editor, args.debug)
            log("完成。")
        finally:
            if args.debug:
                log("调试模式：浏览器保持打开，按 Enter 关闭。")
                try:
                    input()
                except EOFError:
                    pass
            context.close()


if __name__ == "__main__":
    main()
