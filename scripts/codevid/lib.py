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
