"""CBT 介绍片 · 17 镜，逐句对应旁白。

🔴 纪律：
  · 一镜只装一两句旁白
  · 只画旁白真说过的东西；屏上数字只用「旁白念过的」和「定义性的」两类
    —— **不放任何临床疗效统计**，那种数字片子里给不出出处，写上去观众就当事实
  · 安全区：内容不过 y=1010（字幕 ~1080、角标 ~1210）
"""
from lib import *

# 第 6 镜的两条支线共用这组数：旁白说"情绪就不同"，柱长不可能画得一样 —— 同一组数的两种输出
ANX, CALM = 72, 15
CY, MID = 290, W / 2


def _t(c, s, t, sub=None):
    a = ease(seg(t, 0, .16))
    c.text((MID, CY - 30 + (1 - a) * 16), s, 44, alpha(FG, a), anchor='mm')
    if sub:
        c.text((MID, CY + 36), sub, 25, alpha(MUTED, ease(seg(t, .1, .28))), anchor='mm', bold=False)


def _box(c, box, lab, col=FG, a=1.0, size=30, fill=None):
    c.rect(box, fill=fill, outline=alpha(col, a), width=3, r=12)
    c.text(((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), lab, size, alpha(col, a), anchor='mm')


def _arrow(c, x, y0, y1, col, a=1.0, w=3):
    c.line([(x, y0), (x, y1)], alpha(col, a), w)
    c.line([(x - 9, y1 - 11), (x, y1), (x + 9, y1 - 11)], alpha(col, a), w)


# 1 以为 CBT 就是"想开点"
def s1(c, t):
    _t(c, '认知行为疗法', t)
    a = ease(seg(t, .2, .45))
    c.text((MID, 600), '「想开点」', 56, alpha(MUTED, a), anchor='mm')
    c.text((MID, 690), '「多往好处想」', 44, alpha(MUTED, ease(seg(t, .35, .6))), anchor='mm')
    k = ease(seg(t, .66, .92))
    for y, hw in ((600, 150), (690, 165)):
        if k > 0:
            c.line([(MID - hw, y), (MID - hw + 2 * hw * k, y)], ACCENT, 5)


# 2 不是更积极，是更准确
def s2(c, t):
    _t(c, '它要的不是', t)
    a = ease(seg(t, .12, .35))
    c.text((MID, 540), '更积极', 60, alpha(MUTED, a), anchor='mm')
    k = ease(seg(t, .36, .58))
    if k > 0:
        c.line([(MID - 100, 540), (MID - 100 + 200 * k, 540)], ACCENT, 5)
    b = ease(seg(t, .55, .8))
    c.text((MID, 650), '而是', 26, alpha(MUTED, b), anchor='mm', bold=False)
    c.text((MID, 750), '更准确', 68, alpha(ACCENT, ease(seg(t, .62, .88))), anchor='mm')


# 3 三个格子
def s3(c, t):
    _t(c, '模型只有三个格子', t)
    for i, n in enumerate(('情境', '想法', '情绪')):
        y = 470 + i * 160
        a = ease(seg(t, .18 + i * .16, .4 + i * .16))
        _box(c, (210, y, 510, y + 96), n, FG, a)
        if i < 2:
            _arrow(c, MID, y + 96, y + 156, BORDER, ease(seg(t, .3 + i * .16, .5 + i * .16)))


# 4 难受的是中间那格
def s4(c, t):
    _t(c, '难受的不是情境', t, '是中间那一格')
    k = ease(seg(t, .25, .62))
    for i, n in enumerate(('情境', '想法', '情绪')):
        y = 470 + i * 160
        mid = (i == 1)
        col = ACCENT if mid else mix(FG, BORDER, k)
        grow = 1 + .12 * k if mid else 1
        hw, hh = 150 * grow, 48 * grow
        _box(c, (MID - hw, y + 48 - hh, MID + hw, y + 48 + hh), n, col, 1, int(30 * grow))
        if i < 2:
            _arrow(c, MID, y + 96, y + 156, mix(BORDER, BG, k * .5))


# 5 例子：消息没回
def s5(c, t):
    _t(c, '举个例子', t)
    a = ease(seg(t, .15, .4))
    c.rect((150, 470, 570, 560), outline=alpha(BORDER, a), width=2, r=12)
    c.text((MID, 515), '情境', 24, alpha(MUTED, a), anchor='mm', bold=False)
    b = ease(seg(t, .35, .6))
    c.rect((190, 600, 450, 672), fill=alpha(SEC, .85 * b), r=16)
    c.text((320, 636), '在吗？', 28, alpha(BG, b), anchor='mm')
    m = ease_io(seg(t, .55, .95))
    c.text((MID, 790), f'{int(m * 47)} 分钟', 52, alpha(FG, min(1, m * 3)), anchor='mm')
    c.text((MID, 860), '没回', 26, alpha(MUTED, ease(seg(t, .7, .9))), anchor='mm', bold=False)


# 6 同一件事，想法不同情绪就不同
def s6(c, t):
    _t(c, '同一件事', t)
    c.rect((MID - 110, 400, MID + 110, 462), outline=BORDER, width=2, r=10)
    c.text((MID, 431), '没回消息', 26, MUTED, anchor='mm', bold=False)
    k = ease(seg(t, .15, .45))
    for sign, think, val, col in ((-1, '他在生我气', ANX, ACCENT), (1, '他在忙', CALM, SEC)):
        x = MID + sign * 155 * k
        c.line([(MID, 462), (x, 520)], alpha(BORDER, k), 3)
        c.rect((x - 128, 520, x + 128, 596), outline=alpha(col, k), width=3, r=12)
        c.text((x, 558), think, 26, alpha(col, k), anchor='mm')
        g = ease(seg(t, .5, .85))
        h = 230 * (val / 100) * g
        c.rect((x - 46, 880 - h, x + 46, 880), fill=alpha(col, g), r=6)
        c.text((x, 880 - h - 28), str(val), 32, alpha(col, g), anchor='mm')
        c.text((x, 920), '情绪强度', 21, alpha(MUTED, g), anchor='mm', bold=False)


# 7 区别在解释，而解释可检验
def s7(c, t):
    _t(c, '区别不在事实', t)
    a = ease(seg(t, .1, .3))
    c.rect((MID - 115, 400, MID + 115, 462), outline=alpha(BORDER, a), width=2, r=10)
    c.text((MID, 431), '同一个事实', 25, alpha(MUTED, a), anchor='mm', bold=False)
    b = ease(seg(t, .26, .5))
    for sign, think, col in ((-1, '他在生我气', ACCENT), (1, '他在忙', SEC)):
        x = MID + sign * 155
        c.line([(MID, 462), (x, 530)], alpha(BORDER, b), 3)
        c.rect((x - 128, 530, x + 128, 606), outline=alpha(col, b), width=3, r=12)
        c.text((x, 568), think, 25, alpha(col, b), anchor='mm')
    d = ease(seg(t, .5, .72))
    c.text((MID, 690), '区别在这一层', 34, alpha(FG, d), anchor='mm')
    e = ease(seg(t, .68, .92))
    c.rect((150, 790, 570, 886), outline=alpha(SEC, e), width=4, r=14)
    c.text((MID, 838), '解释可以检验', 36, alpha(SEC, e), anchor='mm')


# 8 想法跑得太快，只感觉到情绪
def s8(c, t):
    _t(c, '它跑得太快', t)
    # 前两格一闪而过，只有情绪留亮 —— 这就是"你只感觉到情绪"
    flash = max(0.0, 1 - seg(t, .2, .42) * 1.0)
    for i, n in enumerate(('情境', '想法')):
        y = 450 + i * 150
        _box(c, (210, y, 510, y + 92), n, MUTED, flash * ease(seg(t, .12, .22)))
    a = ease(seg(t, .45, .72))
    _box(c, (210, 750, 510, 846), '情绪', ACCENT, a, 34)
    c.text((MID, 920), '你只感觉到这一格', 26, alpha(MUTED, ease(seg(t, .7, .92))), anchor='mm', bold=False)


# 9 思维记录表五列
def s9(c, t):
    _t(c, '把它拽到纸上', t, '思维记录表')
    cols = ('情境', '自动思维', '情绪 0–100', '证据', '替代想法')
    x0, y0, cw, ch = 70, 440, 116, 420
    for i, n in enumerate(cols):
        a = ease(seg(t, .15 + i * .11, .38 + i * .11))
        x = x0 + i * cw
        c.rect((x, y0, x + cw - 6, y0 + ch), outline=alpha(BORDER, a), width=2, r=8)
        c.rect((x, y0, x + cw - 6, y0 + 62), fill=alpha(BORDER, a * .55), r=8)
        s = 20 if len(n) > 4 else 23
        c.text((x + (cw - 6) / 2, y0 + 31), n, s, alpha(FG, a), anchor='mm')
        # 占位行：表示"要填的东西"，不写具体内容（写了就得保证内容站得住）
        for r in range(5):
            g = ease(seg(t, .3 + i * .08 + r * .04, .55 + i * .08 + r * .04))
            yy = y0 + 100 + r * 62
            c.line([(x + 14, yy), (x + cw - 20, yy)], alpha(BORDER, g * .9), 3)
    c.text((MID, 905), '五列', 26, alpha(MUTED, ease(seg(t, .78, .95))), anchor='mm', bold=False)


# 10 关键那列是找证据
def s10(c, t):
    _t(c, '关键那一列', t)
    a = ease(seg(t, .12, .32))
    c.text((MID, 420), '不是换个正面说法', 30, alpha(MUTED, a), anchor='mm', bold=False)
    k = ease(seg(t, .3, .5))
    if k > 0:
        c.line([(MID - 170, 420), (MID - 170 + 340 * k, 420)], ACCENT, 3)
    b = ease(seg(t, .42, .66))
    c.text((MID, 510), '是找证据', 44, alpha(ACCENT, b), anchor='mm')
    for j, (lab, col, sx) in enumerate((('支持', SEC, -1), ('反对', ACCENT, 1))):
        g = ease(seg(t, .58 + j * .1, .82 + j * .1))
        x = MID + sx * 150
        c.rect((x - 128, 590, x + 128, 900), outline=alpha(col, g), width=3, r=12)
        c.text((x, 630), lab, 28, alpha(col, g), anchor='mm')
        for r in range(3):
            gg = ease(seg(t, .66 + j * .08 + r * .05, .86 + j * .08 + r * .05))
            c.line([(x - 96, 700 + r * 56), (x + 96, 700 + r * 56)], alpha(col, gg * .7), 4)


# 11 常见的跑偏有名字
def s11(c, t):
    _t(c, '跑偏有名字', t)
    names = ('全有全无', '灾难化', '读心', '应该句式')
    for i, n in enumerate(names):
        r, cc = divmod(i, 2)
        a = ease(seg(t, .15 + i * .14, .4 + i * .14))
        x, y = 90 + cc * 290, 470 + r * 160
        c.rect((x, y, x + 260, y + 118), outline=alpha(ACCENT, a), width=3, r=12)
        c.text((x + 130, y + 59), n, 30, alpha(FG, a), anchor='mm')
    c.text((MID, 840), '认出来，就不太容易被它牵着走', 24,
           alpha(MUTED, ease(seg(t, .74, .95))), anchor='mm', bold=False)


# 12 一半是行为
def s12(c, t):
    _t(c, '它有一半是行为', t, '这一半常被忽略')
    for i, (n, col) in enumerate((('认知', BORDER), ('行为', ACCENT))):
        a = 1.0 if i == 0 else ease(seg(t, .3, .7))
        x = MID + (i * 2 - 1) * 150
        c.rect((x - 130, 480, x + 130, 760), fill=alpha(col, a if i else .55), r=14)
        c.text((x, 620), n, 40, alpha(BG if (i and a > .5) else FG, 1), anchor='mm')


# 13 回避的环
def s13(c, t):
    _t(c, '回避的环', t)
    pts = [('回避', MID, 440), ('立刻舒服', MID + 170, 640), ('下次更想回避', MID, 840), ('焦虑没降', MID - 170, 640)]
    # 🔴 先画线再画框：框是 BG 填充的，能把线盖住。
    #    反过来画线会压在文字上（实测「回避」「立刻舒服」都被划了一道）。
    w = 3 + 4 * ease(seg(t, .6, .95))          # 环越转越粗 —— 正是"立刻舒服"把焦虑留下来
    la = ease(seg(t, .3, .6))
    for i in range(4):
        x0, y0 = pts[i][1], pts[i][2]
        x1, y1 = pts[(i + 1) % 4][1], pts[(i + 1) % 4][2]
        c.line([(x0, y0), (x1, y1)], alpha(BORDER, la), int(w))
        # 中点放个方向箭头：是个环，转向有意义
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        dx, dy = x1 - x0, y1 - y0
        ln = max(1e-6, (dx * dx + dy * dy) ** .5)
        ux, uy = dx / ln, dy / ln
        px, py = -uy, ux
        c.line([(mx - ux * 9 + px * 8, my - uy * 9 + py * 8), (mx + ux * 9, my + uy * 9),
                (mx - ux * 9 - px * 8, my - uy * 9 - py * 8)], alpha(MUTED, la), int(w))
    for i, (n, x, y) in enumerate(pts):
        a = ease(seg(t, .12 + i * .13, .34 + i * .13))
        col = ACCENT if i == 1 else FG
        c.rect((x - 110, y - 36, x + 110, y + 36), fill=BG, outline=alpha(col, a), width=3, r=12)
        c.text((x, y), n, 25, alpha(col, a), anchor='mm')


# 14 阶梯暴露
def s14(c, t):
    _t(c, '一级一级地靠近', t, '不是硬扛')
    steps = (20, 35, 50, 65, 80)
    for i, v in enumerate(steps):
        a = ease(seg(t, .14 + i * .13, .36 + i * .13))
        x, y = 130 + i * 92, 870 - i * 82
        c.rect((x, y, x + 86, y + 54), fill=alpha(SEC, a), r=6)
        c.text((x + 43, y - 24), str(v), 24, alpha(FG, a), anchor='mm')
    c.text((MID, 940), '每级的不适分数', 23, alpha(MUTED, ease(seg(t, .75, .95))), anchor='mm', bold=False)


# 15 顺序是反的
def s15(c, t):
    _t(c, '抑郁时顺序是反的', t)
    k = ease(seg(t, .3, .7))
    # 两组框固定，箭头调头
    for i, (n, x) in enumerate((('动力', MID - 140), ('行动', MID + 140))):
        c.rect((x - 108, 560, x + 108, 660), outline=FG, width=3, r=12)
        c.text((x, 610), n, 34, FG, anchor='mm')
    y = 610
    if k < .5:
        a = 1 - k * 2
        c.line([(MID - 30, y), (MID + 30, y)], alpha(MUTED, a), 4)
        c.line([(MID + 20, y - 10), (MID + 30, y), (MID + 20, y + 10)], alpha(MUTED, a), 4)
    else:
        a = (k - .5) * 2
        c.line([(MID + 30, y), (MID - 30, y)], alpha(ACCENT, a), 5)
        c.line([(MID - 20, y - 10), (MID - 30, y), (MID - 20, y + 10)], alpha(ACCENT, a), 5)
    c.text((MID, 790), '不是等有动力才做', 27, alpha(MUTED, ease(seg(t, .55, .78))), anchor='mm', bold=False)
    c.text((MID, 846), '是做了，动力才回来', 29, alpha(ACCENT, ease(seg(t, .7, .92))), anchor='mm')


# 16 真实处境糟糕不是认知扭曲 —— 全片唯一"反对自己"的一镜
def s16(c, t):
    _t(c, '有一条得说清楚', t)
    a = ease(seg(t, .15, .4))
    c.line([(MID, 420), (MID, 820)], alpha(BORDER, a), 2)
    c.text((MID - 155, 480), '可检验的想法', 25, alpha(SEC, a), anchor='mm', bold=False)
    c.text((MID + 155, 480), '真实的处境', 25, alpha(ACCENT, ease(seg(t, .3, .55))), anchor='mm', bold=False)
    b = ease(seg(t, .45, .72))
    c.text((MID - 155, 600), '「他肯定讨厌我」', 22, alpha(MUTED, b), anchor='mm', bold=False)
    d = ease(seg(t, .6, .85))
    c.text((MID + 155, 600), '付不出房租', 24, alpha(FG, d), anchor='mm')
    c.text((MID, 900), '后者不是你想错了', 30, alpha(FG, ease(seg(t, .76, .96))), anchor='mm')


# 17 它要练
def s17(c, t):
    _t(c, '它要练', t, '像练琴')
    cols, rows = 6, 4
    for i in range(cols * rows):
        r, cc = divmod(i, cols)
        a = ease(seg(t, .15 + i * .026, .3 + i * .026))
        x, y = 115 + cc * 82, 470 + r * 82
        c.rect((x, y, x + 62, y + 62), outline=alpha(BORDER, max(a, .25)), width=2, r=8)
        if a > .5:
            # 🔴 别用插值去"画"对勾：两段线的端点各自缩放会接不上，中途渲成竖杠。
            #    固定形状的三点折线 + 纯淡入，稳。
            aa = (a - .5) / .5
            c.line([(x + 15, y + 33), (x + 26, y + 45), (x + 48, y + 18)], alpha(SEC, aa), 5)
    c.text((MID, 880), '读懂，不等于会用', 30, alpha(FG, ease(seg(t, .74, .95))), anchor='mm')


SCENES = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17]
