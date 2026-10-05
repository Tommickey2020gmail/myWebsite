"""CBT 介绍片 · 17 镜。2026-10-05 重做视觉：原来只有文字和细线，太素。

现在：实心色块 + 柔和投影 + 环形数字 + 分节底色。全部还是代码画的，成本 0。

🔴 纪律没变：
  · 一镜只装一两句旁白
  · 只画旁白真说过的东西；屏上数字只用「旁白念过的」和「定义性的」两类
    —— 不放任何临床疗效统计
  · 安全区：内容不过 y=1010（字幕 ~1080、角标 ~1210）
"""
from lib import *

ANX, CALM = 72, 15          # 第 6 / 7 镜共用：旁白说"情绪就不同"，环和数字都读它
CY, MID = 275, W / 2

COG = (236, 241, 236)       # 认知段的浅底
BEH = (248, 236, 229)       # 行为段的浅底
NEU = (240, 238, 233)


def _t(c, s, t, sub=None, tint=None):
    if tint:
        c.tint(tint)
    a = ease(seg(t, 0, .16))
    c.text((MID, CY - 28 + (1 - a) * 14), s, 44, alpha(FG, a), anchor='mm')
    if sub:
        c.text((MID, CY + 34), sub, 25, alpha(MUTED, ease(seg(t, .1, .28))), anchor='mm', bold=False)


# 1 以为 CBT 就是"想开点"
def s1(c, t):
    _t(c, '认知行为疗法', t, tint=NEU)
    for i, w in enumerate(('「想开点」', '「多往好处想」')):
        a = ease(seg(t, .18 + i * .14, .42 + i * .14))
        c.chip((110, 520 + i * 130, 610, 630 + i * 130), w, 42, fill=(226, 222, 214), a=a)
    k = ease(seg(t, .66, .92))
    for i in range(2):
        y = 575 + i * 130
        if k > 0:
            c.line([(150, y), (150 + 420 * k, y)], ACCENT, 6)


# 2 不是更积极，是更准确
def s2(c, t):
    _t(c, '它要的不是', t, tint=NEU)
    a = ease(seg(t, .12, .35))
    c.chip((150, 460, 570, 572), '更积极', 50, fill=(228, 224, 216), a=a, shadow=False)
    k = ease(seg(t, .36, .58))
    if k > 0:
        c.line([(195, 516), (195 + 330 * k, 516)], ACCENT, 6)
    c.text((MID, 640), '而是', 26, alpha(MUTED, ease(seg(t, .5, .72))), anchor='mm', bold=False)
    c.chip((130, 700, 590, 844), '更准确', 66, fill=ACCENT, fg=BG, a=ease(seg(t, .58, .86)))


# 3 三个格子
def s3(c, t):
    _t(c, '模型只有三个格子', t, tint=COG)
    cols = ((214, 228, 216), (ACCENT, ), (214, 228, 216))
    for i, n in enumerate(('情境', '想法', '情绪')):
        y = 440 + i * 180
        a = ease(seg(t, .18 + i * .16, .42 + i * .16))
        fill = ACCENT if i == 1 else (222, 232, 223)
        c.chip((190, y, 530, y + 116), n, 34, fill=fill, fg=BG if i == 1 else FG, a=a)
        if i < 2:
            c.arrow((MID, y + 116), (MID, y + 172), BORDER,
                    ease(seg(t, .3 + i * .16, .5 + i * .16)), 4)


# 4 难受的是中间那格
def s4(c, t):
    _t(c, '难受的不是情境', t, '是中间那一格', tint=COG)
    k = ease(seg(t, .25, .62))
    for i, n in enumerate(('情境', '想法', '情绪')):
        y = 440 + i * 180
        mid = (i == 1)
        g = 1 + .14 * k if mid else 1 - .06 * k
        hw, hh = 170 * g, 58 * g
        c.chip((MID - hw, y + 58 - hh, MID + hw, y + 58 + hh), n, int(34 * g),
               fill=ACCENT if mid else mix((222, 232, 223), COG, k * .8),
               fg=BG if mid else mix(FG, MUTED, k), a=1, shadow=mid)
        if i < 2:
            c.arrow((MID, y + 116), (MID, y + 172), mix(BORDER, COG, k * .7), 1, 4)


# 5 例子：消息没回
def s5(c, t):
    _t(c, '举个例子', t, tint=COG)
    b = ease(seg(t, .2, .45))
    c.chip((150, 440, 470, 536), '在吗？', 32, fill=SEC, fg=BG, a=b, r=22)
    m = ease_io(seg(t, .45, .92))
    c.ring((MID, 760), 125, m, MUTED, width=14, a=min(1, m * 3))
    c.bignum((MID, 745), int(m * 47), 76, FG, min(1, m * 3))
    c.text((MID, 818), '分钟没回', 25, alpha(MUTED, min(1, m * 3)), anchor='mm', bold=False)


# 6 同一件事，想法不同情绪就不同
def s6(c, t):
    _t(c, '同一件事', t, tint=COG)
    c.chip((MID - 120, 378, MID + 120, 452), '没回消息', 26, fill=(224, 228, 222), a=1, shadow=False)
    k = ease(seg(t, .15, .45))
    for sign, think, val, col in ((-1, '他在生我气', ANX, ACCENT), (1, '他在忙', CALM, SEC)):
        x = MID + sign * 158
        c.arrow((MID + sign * 40, 452), (x, 512), BORDER, k, 3)
        c.chip((x - 142, 512, x + 142, 596), think, 26, fill=col, fg=BG, a=k)
        g = ease(seg(t, .5, .88))
        c.ring((x, 790), 105, (val / 100) * g, col, width=20, a=g)
        c.bignum((x, 790), int(val * g), 56, col, g)
        c.text((x, 920), '情绪强度', 22, alpha(MUTED, g), anchor='mm', bold=False)


# 7 区别在解释，而解释可检验
def s7(c, t):
    _t(c, '区别不在事实', t, tint=COG)
    a = ease(seg(t, .1, .3))
    c.chip((MID - 125, 390, MID + 125, 462), '同一个事实', 26, fill=(224, 228, 222), a=a, shadow=False)
    b = ease(seg(t, .26, .5))
    for sign, think, col in ((-1, '他在生我气', ACCENT), (1, '他在忙', SEC)):
        x = MID + sign * 158
        c.arrow((MID + sign * 40, 462), (x, 520), BORDER, b, 3)
        c.chip((x - 142, 520, x + 142, 600), think, 25, fill=col, fg=BG, a=b)
    d = ease(seg(t, .5, .72))
    c.text((MID, 672), '区别在这一层', 32, alpha(FG, d), anchor='mm')
    c.chip((130, 740, 590, 872), '解释可以检验', 40, fill=SEC, fg=BG, a=ease(seg(t, .66, .9)))


# 8 想法跑得太快，只感觉到情绪
def s8(c, t):
    _t(c, '它跑得太快', t, tint=COG)
    flash = max(0.0, 1 - seg(t, .2, .44))
    for i, n in enumerate(('情境', '想法')):
        c.chip((190, 430 + i * 150, 530, 536 + i * 150), n, 30,
               fill=(224, 230, 224), a=flash * ease(seg(t, .1, .2)), shadow=False)
    a = ease(seg(t, .46, .74))
    c.chip((160, 730, 560, 876), '情绪', 44, fill=ACCENT, fg=BG, a=a)
    c.text((MID, 940), '你只感觉到这一格', 26, alpha(MUTED, ease(seg(t, .7, .92))), anchor='mm', bold=False)


# 9 思维记录表五列
def s9(c, t):
    _t(c, '把它拽到纸上', t, '思维记录表', tint=COG)
    cols = ('情境', '自动思维', '情绪 0–100', '证据', '替代想法')
    x0, y0, cw, ch = 62, 400, 120, 480
    for i, n in enumerate(cols):
        a = ease(seg(t, .14 + i * .1, .36 + i * .1))
        x = x0 + i * cw
        hi = (i == 3)
        c.chip((x, y0, x + cw - 8, y0 + 70), n, 20 if len(n) > 4 else 23,
               fill=SEC if hi else (226, 233, 226), fg=BG if hi else FG, a=a, r=10)
        c.rect((x, y0 + 76, x + cw - 8, y0 + ch), fill=mix(COG, (255, 255, 255), a * .8), r=10)
        for r in range(5):
            g = ease(seg(t, .28 + i * .07 + r * .035, .52 + i * .07 + r * .035))
            yy = y0 + 118 + r * 68
            c.line([(x + 16, yy), (x + cw - 24, yy)], alpha(BORDER, g), 4)
    c.text((MID, 930), '五列', 26, alpha(MUTED, ease(seg(t, .78, .95))), anchor='mm', bold=False)


# 10 关键那列是找证据
def s10(c, t):
    _t(c, '关键那一列', t, tint=COG)
    a = ease(seg(t, .1, .3))
    c.text((MID, 390), '不是换个正面说法', 29, alpha(MUTED, a), anchor='mm', bold=False)
    k = ease(seg(t, .28, .48))
    if k > 0:
        c.line([(MID - 165, 390), (MID - 165 + 330 * k, 390)], ACCENT, 4)
    c.chip((170, 440, 550, 544), '是找证据', 42, fill=FG, fg=BG, a=ease(seg(t, .4, .64)))
    for j, (lab, col, sx) in enumerate((('支持', SEC, -1), ('反对', ACCENT, 1))):
        g = ease(seg(t, .56 + j * .1, .8 + j * .1))
        x = MID + sx * 152
        c.chip((x - 134, 596, x + 134, 668), lab, 28, fill=col, fg=BG, a=g, r=12)
        c.rect((x - 134, 684, x + 134, 918), fill=mix(COG, (255, 255, 255), g * .85), r=12)
        for r in range(3):
            gg = ease(seg(t, .64 + j * .08 + r * .05, .86 + j * .08 + r * .05))
            c.line([(x - 104, 736 + r * 70), (x + 104, 736 + r * 70)], alpha(col, gg * .55), 5)


# 11 常见的跑偏有名字
def s11(c, t):
    _t(c, '跑偏有名字', t, tint=COG)
    names = ('全有全无', '灾难化', '读心', '应该句式')
    for i, n in enumerate(names):
        r, cc = divmod(i, 2)
        a = ease(seg(t, .15 + i * .14, .4 + i * .14))
        x, y = 72 + cc * 300, 430 + i // 2 * 180
        c.chip((x, y, x + 276, y + 140), n, 32, fill=ACCENT, fg=BG, a=a)
    c.text((MID, 860), '认出来，就不太容易被它牵着走', 24,
           alpha(MUTED, ease(seg(t, .74, .95))), anchor='mm', bold=False)


# 12 一半是行为
def s12(c, t):
    _t(c, '它有一半是行为', t, '这一半常被忽略', tint=BEH)
    for i, (n, col, fg) in enumerate((('认知', (228, 224, 216), FG), ('行为', ACCENT, BG))):
        a = 1.0 if i == 0 else ease(seg(t, .3, .7))
        x = MID + (i * 2 - 1) * 152
        c.chip((x - 134, 450, x + 134, 790), n, 44, fill=col, fg=fg, a=a if i else 1)


# 13 回避的环
def s13(c, t):
    _t(c, '回避的环', t, tint=BEH)
    R, cx, cy = 215, MID, 690
    la = ease(seg(t, .3, .62))
    w = 4 + 4 * ease(seg(t, .62, .95))      # 环越转越粗 —— 正是"立刻舒服"把焦虑留下来
    for k in range(4):
        c.arc_arrow((cx, cy), R, -68 + k * 90, 8 + k * 90, mix(BORDER, MUTED, .55), la, int(w))
    pts = (('回避', cx, cy - R, FG), ('立刻舒服', cx + R, cy, ACCENT),
           ('下次更想回避', cx, cy + R, FG), ('焦虑没降', cx - R, cy, FG))
    for i, (n, x, y, col) in enumerate(pts):
        a = ease(seg(t, .12 + i * .13, .34 + i * .13))
        hw = 122 if len(n) > 4 else 96
        c.chip((x - hw, y - 40, x + hw, y + 40), n, 25,
               fill=ACCENT if col is ACCENT else (255, 255, 255),
               fg=BG if col is ACCENT else FG, a=a, r=14)


# 14 阶梯暴露
def s14(c, t):
    _t(c, '一级一级地靠近', t, '不是硬扛', tint=BEH)
    steps = (20, 35, 50, 65, 80)
    for i, v in enumerate(steps):
        a = ease(seg(t, .14 + i * .13, .38 + i * .13))
        x, y = 112 + i * 100, 880 - i * 92
        c.chip((x, y, x + 92, y + 70), '', 1, fill=mix(SEC, ACCENT, i / 4), a=a, r=10)
        c.text((x + 46, y - 26), str(v), 25, alpha(FG, a), anchor='mm')
    c.text((MID, 960), '每级的不适分数', 23, alpha(MUTED, ease(seg(t, .76, .95))), anchor='mm', bold=False)


# 15 顺序是反的
def s15(c, t):
    _t(c, '抑郁时顺序是反的', t, tint=BEH)
    k = ease(seg(t, .3, .7))
    for n, x, col in (('动力', MID - 150, (228, 224, 216)), ('行动', MID + 150, (228, 224, 216))):
        c.chip((x - 120, 500, x + 120, 620), n, 36, fill=col, a=1)
    y = 560
    if k < .5:
        c.arrow((MID - 22, y), (MID + 22, y), MUTED, 1 - k * 2, 5)
    else:
        c.arrow((MID + 22, y), (MID - 22, y), ACCENT, (k - .5) * 2, 6)
    c.text((MID, 724), '不是等有动力才做', 27, alpha(MUTED, ease(seg(t, .55, .78))), anchor='mm', bold=False)
    c.chip((120, 782, 600, 900), '做了，动力才回来', 36, fill=ACCENT, fg=BG,
           a=ease(seg(t, .68, .92)))


# 16 真实处境糟糕不是认知扭曲 —— 全片唯一"反对自己"的一镜
def s16(c, t):
    _t(c, '有一条得说清楚', t, tint=NEU)
    a = ease(seg(t, .12, .36))
    c.chip((48, 420, 348, 500), '可检验的想法', 24, fill=(226, 233, 226), a=a, r=12)
    c.chip((372, 420, 672, 500), '真实的处境', 24, fill=(243, 226, 216),
           a=ease(seg(t, .26, .5)), r=12)
    b = ease(seg(t, .42, .66))
    c.rect((48, 520, 348, 640), fill=mix(NEU, (255, 255, 255), b * .9), r=12)
    c.text((198, 558), '「他肯定', 24, alpha(MUTED, b), anchor='mm', bold=False)
    c.text((198, 600), '讨厌我」', 24, alpha(MUTED, b), anchor='mm', bold=False)
    d = ease(seg(t, .58, .82))
    c.chip((372, 520, 672, 640), '付不出房租', 28, fill=mix(NEU, (255, 255, 255), d * .9),
           fg=FG, a=d, shadow=False, r=12)
    c.line([(MID, 410), (MID, 650)], alpha(BORDER, a), 2)
    c.chip((100, 720, 620, 856), '后者不是你想错了', 36, fill=FG, fg=BG,
           a=ease(seg(t, .74, .95)))


# 17 它要练
def s17(c, t):
    _t(c, '它要练', t, '像练琴', tint=NEU)
    cols, rows = 6, 4
    for i in range(cols * rows):
        r, cc = divmod(i, cols)
        a = ease(seg(t, .14 + i * .025, .3 + i * .025))
        x, y = 108 + cc * 86, 420 + r * 86
        on = a > .55
        c.chip((x, y, x + 68, y + 68), '', 1,
               fill=SEC if on else (228, 232, 227), a=max(a, .3), r=12, shadow=on)
        if on:
            aa = (a - .55) / .45
            c.line([(x + 18, y + 36), (x + 29, y + 48), (x + 51, y + 21)], alpha(BG, aa), 5)
    c.chip((120, 800, 600, 920), '读懂，不等于会用', 34, fill=ACCENT, fg=BG,
           a=ease(seg(t, .74, .95)))


SCENES = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17]
