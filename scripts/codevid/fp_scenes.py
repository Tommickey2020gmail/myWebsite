"""《99% 准确的检测，为什么还是错的》· 18 镜。

和前两条片子最大的不同：**一千个格子贯穿全片连续变形**，不是一镜一张图。
dots.draw() 的参数由本文件按镜给出，位置/颜色全部从 dots.py 的常量算。

🔴 纪律：
  · 屏上数字只用「旁白念过的」和「定义性的」——不放任何我在片子里给不出出处的统计
  · 安全区 y<1010（字幕 ~1080）
"""
from lib import *
import dots

BG2 = (248, 247, 243)
MID = W / 2


def _t(c, s, t, sub=None, y=250, size=44):
    a = ease(seg(t, 0, .16))
    c.text((MID, y - 26 + (1 - a) * 14), s, size, alpha(FG, a), anchor='mm')
    if sub:
        c.text((MID, y + 34), sub, 25, alpha(MUTED, ease(seg(t, .1, .3))), anchor='mm', bold=False)


# 1 先问你一个问题
def s1(c, t):
    c.tint(BG2)
    _t(c, '先问你一个问题', t, y=560, size=52)
    c.text((MID, 660), '心里答一个就行', 28, alpha(MUTED, ease(seg(t, .3, .6))), anchor='mm', bold=False)


# 2 一千人里一个得病
def s2(c, t):
    c.tint(BG2); _t(c, '有一种病', t, y=360)
    a = ease(seg(t, .25, .6))
    c.chip((110, 500, 610, 660), '1000 人里 1 个', 44, fill=(228, 232, 227), a=a)
    c.text((MID, 730), '发病率', 24, alpha(MUTED, ease(seg(t, .5, .75))), anchor='mm', bold=False)


# 3 准确率 99%
def s3(c, t):
    c.tint(BG2); _t(c, '有一种检测', t, y=360)
    a = ease(seg(t, .2, .55))
    c.ring((MID, 620), 130, .99 * a, SEC, width=26, a=a)
    c.bignum((MID, 620), f'{int(99 * a)}', 76, SEC, a, unit='%')
    c.text((MID, 800), '准确率', 26, alpha(MUTED, ease(seg(t, .5, .75))), anchor='mm', bold=False)


# 4 你阳性了，有多大可能真有病
def s4(c, t):
    c.tint(BG2); _t(c, '你去做了', t, y=330)
    a = ease(seg(t, .15, .4))
    c.chip((150, 430, 570, 540), '结果：阳性', 40, fill=ACCENT, fg=BG, a=a)
    b = ease(seg(t, .45, .75))
    c.text((MID, 640), '你有多大可能', 32, alpha(FG, b), anchor='mm')
    c.text((MID, 700), '真的得了这个病？', 32, alpha(FG, b), anchor='mm')
    g = ease(seg(t, .7, .95))
    c.bignum((MID, 850), '?', 110, alpha(ACCENT, g))


# 5 很多人答 99%
def s5(c, t):
    c.tint(BG2); _t(c, '很多人的第一反应', t, y=330)
    a = ease(seg(t, .25, .6))
    c.chip((160, 460, 560, 600), '99%', 72, fill=(228, 232, 227), a=a)
    c.text((MID, 700), '是这个', 26, alpha(MUTED, ease(seg(t, .5, .8))), anchor='mm', bold=False)


# 6 把一千人画出来 —— 格子开始铺
def s6(c, t):
    c.tint(BG2); _t(c, '我们把这一千个人画出来', t, y=330, size=38)
    dots.draw(c, 'grid', 'grid', 0, reveal=ease(seg(t, .22, .95)))


# 7 一个格子一个人
def s7(c, t):
    c.tint(BG2); _t(c, '一个格子，一个人', t, y=330)
    dots.draw(c, 'grid', 'grid', 0, 1)
    c.text((MID, 940), '一共 1000 个', 28, alpha(MUTED, ease(seg(t, .3, .6))), anchor='mm', bold=False)


# 8 其中一个真有病
def s8(c, t):
    c.tint(BG2); _t(c, '真的有病的', t, '就这一个', y=330)
    k = ease(seg(t, .25, .7))
    dots.draw(c, 'grid', 'grid', 0, 1, sick=k)
    c.text((MID, 940), '1', 44, alpha(ACCENT, ease(seg(t, .55, .85))), anchor='mm')


# 9 99% 的意思：没病的也有 1% 被误判
def s9(c, t):
    c.tint(BG2); _t(c, '99% 准确的意思是', t, y=300, size=38)
    dots.draw(c, 'grid', 'grid', 0, 1, sick=1)
    a = ease(seg(t, .3, .7))
    c.chip((70, 900, 650, 1000), '没病的人里，1% 也会被判成阳性', 27,
           fill=(240, 232, 222), a=a, r=14)


# 10 999 个健康人的 1% ≈ 10
def s10(c, t):
    c.tint(BG2); _t(c, '999 个健康人', t, y=300)
    k = ease(seg(t, .3, .75))
    dots.draw(c, 'grid', 'grid', 0, 1, sick=1, fp=k)
    c.text((MID, 940), f'1% ≈ {int(10 * k)} 个', 38, alpha(dots.AMBER, min(1, k * 2)), anchor='mm')


# 11 这十个结果也是阳性
def s11(c, t):
    c.tint(BG2); _t(c, '这十个人', t, '拿到的也是阳性', y=300)
    dots.draw(c, 'grid', 'grid', 0, 1, sick=1, fp=1)
    c.text((MID, 950), '假阳性', 30, alpha(dots.AMBER, ease(seg(t, .35, .7))), anchor='mm')


# 12 阳性一共几个 —— 其余淡出，只剩 11
def s12(c, t):
    c.tint(BG2); _t(c, '阳性一共几个', t, y=300)
    d = ease(seg(t, .15, .6))
    dots.draw(c, 'grid', 'row', ease(seg(t, .3, .85)), 1, sick=1, fp=1, dim=d)
    c.bignum((MID, 850), int(11 * ease(seg(t, .5, .9))), 90, FG, ease(seg(t, .5, .9)))


# 13 十一个里只有一个真有病
def s13(c, t):
    c.tint(BG2); _t(c, '这十一个里', t, '真有病的只有一个', y=300)
    dots.draw(c, 'row', 'stack', ease(seg(t, .2, .8)), 1, sick=1, fp=1, dim=1)
    a = ease(seg(t, .6, .9))
    c.text((MID - 150, 760), '1', 34, alpha(ACCENT, a), anchor='mm')
    c.text((MID + 170, 760), '10', 34, alpha(dots.AMBER, a), anchor='mm')


# 14 1 ÷ 11 ≈ 9%
def s14(c, t):
    c.tint(BG2); _t(c, '一除以十一', t, y=300)
    dots.draw(c, 'stack', 'stack', 0, 1, sick=1, fp=1, dim=1)
    a = ease(seg(t, .3, .7))
    c.chip((150, 790, 570, 930), '≈ 9%', 72, fill=ACCENT, fg=BG, a=a)


# 15 不是 99 是 9，差十一倍
def s15(c, t):
    c.tint(BG2); _t(c, '不是 99，是 9', t, y=300)
    g = ease(seg(t, .2, .65))
    base, mx = 880, 420
    for x, v, col, lab in ((MID - 120, 99, (222, 218, 210), '你以为的'),
                           (MID + 120, 9, ACCENT, '实际的')):
        h = mx * (v / 99) * g
        c.rect((x - 68, base - h, x + 68, base), fill=col, r=8)
        c.text((x, base - h - 30), f'{v}%', 34, col if col is ACCENT else MUTED, anchor='mm')
        c.text((x, base + 30), lab, 24, MUTED, anchor='mm', bold=False)
    c.text((MID, 960), '差了十一倍', 32, alpha(FG, ease(seg(t, .7, .95))), anchor='mm')


# 16 直觉错在哪
def s16(c, t):
    c.tint(BG2); _t(c, '直觉错在哪', t, y=290)
    a = ease(seg(t, .2, .5))
    c.chip((60, 410, 660, 520), '把「检测有多准」', 32, fill=(230, 228, 222), a=a)
    b = ease(seg(t, .4, .7))
    c.arrow((MID, 532), (MID, 584), BORDER, b, 4)
    c.chip((60, 596, 660, 706), '当成了「你有多可能有病」', 30, fill=(240, 228, 220), a=b)
    d = ease(seg(t, .66, .92))
    c.chip((60, 790, 660, 920), '漏掉了基数：健康的人太多', 30, fill=FG, fg=BG, a=d)


# 17 不只关于体检
def s17(c, t):
    c.tint(BG2); _t(c, '不只关于体检', t, y=280)
    for i, n in enumerate(('安检', '反诈模型', 'AI 作弊检测', '风控告警')):
        r, cc = divmod(i, 2)
        a = ease(seg(t, .15 + i * .12, .4 + i * .12))
        c.chip((66 + cc * 300, 400 + r * 150, 326 + cc * 300, 510 + r * 150), n, 30,
               fill=(232, 230, 224), a=a)
    e = ease(seg(t, .66, .92))
    c.chip((50, 740, 670, 880), '筛查罕见的事，大部分警报本来就是假的', 26, fill=ACCENT, fg=BG, a=e)


# 18 收尾：不是系统差，是算术
def s18(c, t):
    c.tint(BG2)
    a = ease(seg(t, .08, .35))
    c.text((MID, 420), '这不是系统做得差', 38, alpha(MUTED, a), anchor='mm', bold=False)
    c.text((MID, 500), '是算术', 56, alpha(FG, ease(seg(t, .22, .5))), anchor='mm')
    b = ease(seg(t, .5, .8))
    c.text((MID, 660), '下次看到阳性或者警报', 28, alpha(MUTED, b), anchor='mm', bold=False)
    c.chip((70, 730, 650, 880), '先问：这事本来有多常见', 34, fill=ACCENT, fg=BG,
           a=ease(seg(t, .62, .9)))


SCENES = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18]
