"""跨镜连续变形的一千个格子。

这是这条片子的核心：**同一组数据贯穿全片，连续重排**，而不是一镜画一张新图。
观众全程盯着同一堆东西在变形、筛选、聚合，所以它读起来是一个连续的论证，
不是一叠幻灯片。

🔴 为什么这事只有代码做得了：每一帧的每一个格子，位置和颜色都是从
   同一组常量（N / SICK / FP）算出来的。旁白说"十一个"，画面上就是十一个 ——
   不可能对不上，因为是同一个事实的两种输出。
"""
from lib import *

N = 1000                 # 一千个人
SICK = 487               # 真正有病的那一个（固定编号，可复现）
# 999 个健康人里 1% ≈ 10 个被误判。编号固定挑散开的，不要扎堆。
FP = [38, 164, 251, 342, 419, 556, 673, 745, 861, 938]
FPSET = set(FP)
POS = [SICK] + FP        # 全部阳性 = 11 个

GREY = (214, 219, 212)
AMBER = (214, 144, 60)

COLS, ROWS, CELL = 40, 25, 15
GX, GY = (W - COLS * CELL) / 2, 470


def _grid(i):
    r, c = divmod(i, COLS)
    return GX + c * CELL + CELL / 2, GY + r * CELL + CELL / 2, CELL * .38


def _row(i):
    """只有 11 个阳性留下，排成一行：红的在最左，十个橙的跟在后面。"""
    if i not in FPSET and i != SICK:
        return _grid(i)[0], _grid(i)[1], 0.0
    k = 0 if i == SICK else FP.index(i) + 1
    return 110 + k * 50, 620, 19.0


def _stack(i):
    """十一个聚成两堆：1 个红 / 10 个橙，为后面那个 1÷11 做铺垫。"""
    if i not in FPSET and i != SICK:
        return _grid(i)[0], _grid(i)[1], 0.0
    if i == SICK:
        return MIDX - 150, 640, 26.0
    k = FP.index(i)
    return MIDX + 90 + (k % 5) * 54, 600 + (k // 5) * 60, 22.0


MIDX = W / 2
LAYOUTS = {'grid': _grid, 'row': _row, 'stack': _stack}


def draw(c, la, lb, k, reveal=1.0, sick=0.0, fp=0.0, dim=0.0):
    """画这一帧的一千个格子。

    la/lb  起止布局名；k 插值进度 0..1（已缓动）
    reveal 逐个出现的进度：0 全无、1 全出（按编号波浪式铺开）
    sick   把那一个真病人染红的进度（旁白先说他，所以单独控制）
    fp     把十个误判者染橙的进度（旁白后说，晚一拍）
    dim    非阳性格子的淡出进度，1 时只剩那 11 个
    """
    fa, fb = LAYOUTS[la], LAYOUTS[lb]
    for i in range(N):
        ax, ay, ar = fa(i)
        bx, by, br = fb(i)
        x, y, r = lerp(ax, bx, k), lerp(ay, by, k), lerp(ar, br, k)
        if r < .4:
            continue
        # 波浪式出现：编号越大越晚，每个自己用 12% 的时长淡入
        a = 1.0 if reveal >= 1 else max(0.0, min(1.0, (reveal * 1.12 - i / N) / .12))
        if a <= .02:
            continue
        if i == SICK:
            col = mix(GREY, ACCENT, sick)
            r *= 1 + .45 * sick          # 稍微放大，不然一千个格子里找不着
            # 旁白说"就这一个"，观众得真能找到它 —— 加一圈光晕指出来。
            # 只在格子还在网格里时画（排成队列后不需要了）
            if sick > .35 and k < .5:
                hr = r + 10 + 5 * (1 - sick)
                c.circle((x, y), hr, outline=alpha(ACCENT, (sick - .35) / .65 * .85), width=3)
        elif i in FPSET:
            col = mix(GREY, AMBER, fp)
            r *= 1 + .3 * fp
        else:
            col = GREY
            a *= (1 - dim)
            if a <= .02:
                continue
        c.rect((x - r, y - r, x + r, y + r), fill=alpha(col, a), r=max(2, r * .3))
