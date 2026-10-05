"""代码生成视频的最小渲染层：PIL 画帧 → ffmpeg 合成。

为什么不用 SVG：cairosvg 的文本走 cairo toy API，字重/字体回退不可控；
PIL + truetype 直接指定字面，中文不会出方框。
抗锯齿靠 SS 倍超采样后 LANCZOS 降采样，比 PIL 自带的边缘干净得多。
"""
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, SS = 720, 1280, 24, 2

# 取自站点 global.css 的 @theme token，两版视频配色一致
BG     = (250, 248, 243)
FG     = (31, 26, 23)
ACCENT = (184, 92, 56)     # 赤陶
SEC    = (92, 138, 107)    # 鼠尾草绿
MUTED  = (107, 97, 87)
BORDER = (229, 223, 211)

_FB = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
_FR = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
_cache = {}


def font(size, bold=True):
    k = (size, bold)
    if k not in _cache:
        _cache[k] = ImageFont.truetype(_FB if bold else _FR, size * SS)
    return _cache[k]


# ---------- 时间 ----------
def seg(t, a, b):
    """把全局进度 t 映射到 [a,b] 窗口内的 0..1，窗口外夹到 0 或 1。"""
    if b <= a:
        return 1.0 if t >= b else 0.0
    return max(0.0, min(1.0, (t - a) / (b - a)))


def ease(x):          # cubic out，起步快收尾稳，适合入场
    return 1 - (1 - x) ** 3


def ease_io(x):       # 两头慢中间快，适合镜头移动
    return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2


def lerp(a, b, x):
    return a + (b - a) * x


def mix(c1, c2, x):
    return tuple(int(lerp(a, b, x)) for a, b in zip(c1, c2))


def alpha(c, a):
    """在奶白底上模拟透明度——直接跟背景混，省掉一层 RGBA 合成。"""
    return mix(BG, c, max(0.0, min(1.0, a)))


# ---------- 画 ----------
class Canvas:
    def __init__(self):
        self.img = Image.new('RGB', (W * SS, H * SS), BG)
        self.d = ImageDraw.Draw(self.img)

    def text(self, xy, s, size, color=FG, anchor='la', bold=True, spacing=None):
        self.d.multiline_text((xy[0] * SS, xy[1] * SS), s, font=font(size, bold),
                              fill=color, anchor=anchor if '\n' not in s else None,
                              align='center' if anchor[0] == 'm' else 'left',
                              spacing=(spacing if spacing is not None else size * 0.5) * SS)

    def tw(self, s, size, bold=True):
        """文本像素宽（逻辑坐标）。"""
        return self.d.textlength(s, font=font(size, bold)) / SS

    def rect(self, box, fill=None, outline=None, width=1, r=0):
        b = [v * SS for v in box]
        if r:
            self.d.rounded_rectangle(b, radius=r * SS, fill=fill, outline=outline, width=int(width * SS))
        else:
            self.d.rectangle(b, fill=fill, outline=outline, width=int(width * SS))

    def line(self, pts, color=FG, width=2):
        self.d.line([(x * SS, y * SS) for x, y in pts], fill=color, width=int(width * SS), joint='curve')

    def circle(self, c, r, fill=None, outline=None, width=2):
        x, y = c
        self.d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS],
                       fill=fill, outline=outline, width=int(width * SS))

    def out(self):
        return self.img.resize((W, H), Image.LANCZOS)


# ---------- 进阶图元（2026-10-05 加：原来只有文字和细线，太素）----------
import math as _math

# 分节底色：同一段落共用一种极淡的底，观众一眼看出"还在同一节"
TINT_COG = (244, 246, 243)   # 认知段：偏绿的灰白
TINT_BEH = (250, 244, 240)   # 行为段：偏赤陶的灰白
TINT_END = (246, 245, 242)   # 收尾段：中性


class Canvas2(Canvas):
    """在 Canvas 上加一层带质感的图元。老场景不受影响。"""

    def tint(self, color, top=0.0, bottom=1.0):
        """整屏（或一段高度）铺一层极淡底色，用来分节。"""
        self.rect((0, top * H, W, bottom * H), fill=color)

    def shadow_rect(self, box, r=12, depth=5, strength=0.10):
        """柔和投影：没有真高斯模糊就用几层递减的偏移矩形近似，便宜且够看。"""
        x0, y0, x1, y1 = box
        for k in range(depth, 0, -1):
            a = strength * (1 - (k - 1) / depth) ** 1.6
            self.rect((x0 - k * .4, y0 + k * 1.1, x1 + k * .4, y1 + k * 1.1),
                      fill=mix(BG, (90, 80, 70), a), r=r + k * .3)

    def chip(self, box, label, size=30, fill=None, fg=None, a=1.0, r=14, shadow=True, sub=None):
        """实心圆角块 + 文字。比空心描边框有层次得多 —— 这是提升质感最划算的一步。"""
        if a <= 0.01:
            return
        fill = fill if fill is not None else BORDER
        fg = fg if fg is not None else FG
        if shadow and a > .5:
            self.shadow_rect(box, r=r, strength=0.09 * a)
        self.rect(box, fill=mix(BG, fill, a), r=r)
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        if sub:
            self.text((cx, cy - size * .38), label, size, alpha(fg, a), anchor='mm')
            self.text((cx, cy + size * .62), sub, int(size * .62), alpha(fg, a * .72),
                      anchor='mm', bold=False)
        else:
            self.text((cx, cy), label, size, alpha(fg, a), anchor='mm')

    def ring(self, center, radius, frac, color, width=16, a=1.0, bg=None):
        """环形进度。给 72 / 15 这种比较用，比柱子更抓眼。"""
        cx, cy = center
        box = [(cx - radius) * SS, (cy - radius) * SS, (cx + radius) * SS, (cy + radius) * SS]
        self.d.ellipse(box, outline=alpha(bg or BORDER, a), width=int(width * SS))
        if frac > 0.001:
            self.d.arc(box, -90, -90 + 360 * min(1.0, frac),
                       fill=alpha(color, a), width=int(width * SS))

    def arrow(self, p0, p1, color, a=1.0, w=3, head=11):
        """直箭头，端点按方向收一点，不会戳进方框里。"""
        (x0, y0), (x1, y1) = p0, p1
        dx, dy = x1 - x0, y1 - y0
        ln = max(1e-6, _math.hypot(dx, dy))
        ux, uy = dx / ln, dy / ln
        self.line([(x0, y0), (x1 - ux * head * .6, y1 - uy * head * .6)], alpha(color, a), w)
        px, py = -uy, ux
        self.line([(x1 - ux * head + px * head * .62, y1 - uy * head + py * head * .62),
                   (x1, y1),
                   (x1 - ux * head - px * head * .62, y1 - uy * head - py * head * .62)],
                  alpha(color, a), w)

    def arc_arrow(self, center, radius, a0, a1, color, a=1.0, w=4):
        """弧形箭头：画环状因果链时比直线自然。角度单位是度，0 在右、顺时针。"""
        cx, cy = center
        box = [(cx - radius) * SS, (cy - radius) * SS, (cx + radius) * SS, (cy + radius) * SS]
        self.d.arc(box, a0, a1, fill=alpha(color, a), width=int(w * SS))
        th = _math.radians(a1)
        ex, ey = cx + radius * _math.cos(th), cy + radius * _math.sin(th)
        tx, ty = -_math.sin(th), _math.cos(th)          # 切线方向
        px, py = _math.cos(th), _math.sin(th)
        self.line([(ex - tx * 13 + px * 8, ey - ty * 13 + py * 8), (ex, ey),
                   (ex - tx * 13 - px * 8, ey - ty * 13 - py * 8)], alpha(color, a), w)

    def bignum(self, center, val, size, color, a=1.0, unit=None):
        """大号数字 + 可选单位。数字是全片最该被看见的东西，别用正文字号。"""
        cx, cy = center
        self.text((cx, cy), str(val), size, alpha(color, a), anchor='mm')
        if unit:
            w = self.tw(str(val), size)
            self.text((cx + w / 2 + 14, cy + size * .22), unit, int(size * .32),
                      alpha(color, a * .8), anchor='lm', bold=False)
