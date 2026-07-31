#!/usr/bin/env python3
"""Rasterize PocketBrain brand geometry to PNG (no external SVG libs)."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets" / "brand"
PLAY = ROOT / "assets" / "play"
ASSETS = ROOT / "assets"

TEAL = (15, 118, 110, 255)
TEAL_DARK = (17, 94, 89, 255)
MINT = (204, 251, 241, 255)
STROKE = (240, 253, 250, 255)
NODE = (94, 234, 212, 255)
WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 255)
LIGHT_BG = (248, 250, 252, 255)
DARK_BG = (11, 18, 32, 255)


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} {im.size}")


def draw_mark(size: int, *, fill=TEAL, stroke=STROKE, node=NODE, bg=None) -> Image.Image:
    im = Image.new("RGBA", (size, size), bg if bg is not None else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(size * 0.094)
    box = [pad, pad, size - pad, size - pad]
    radius = int(size * 0.188)
    # gradient-ish: two rounded rects
    d.rounded_rectangle(box, radius=radius, fill=fill)
    # pocket mouth
    mx0, my0 = int(size * 0.28), int(size * 0.31)
    mx1, my1 = int(size * 0.72), int(size * 0.40)
    mouth = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    md = ImageDraw.Draw(mouth)
    md.rounded_rectangle([mx0, my0, mx1, my1], radius=int(size * 0.04), fill=(*MINT[:3], 100))
    im = Image.alpha_composite(im, mouth)
    d = ImageDraw.Draw(im)
    # brain arcs
    w = max(2, size // 36)
    # upper lobe
    d.arc([int(size * 0.32), int(size * 0.40), int(size * 0.68), int(size * 0.62)], 200, 340, fill=stroke, width=w)
    # lower lobe
    d.arc([int(size * 0.30), int(size * 0.48), int(size * 0.70), int(size * 0.78)], 20, 160, fill=stroke, width=w)
    # connectors
    d.arc([int(size * 0.38), int(size * 0.52), int(size * 0.62), int(size * 0.62)], 200, 340, fill=stroke, width=w)
    d.arc([int(size * 0.36), int(size * 0.60), int(size * 0.64), int(size * 0.72)], 20, 160, fill=stroke, width=w)
    r = max(3, size // 56)
    for cx, cy in [
        (0.395, 0.523),
        (0.605, 0.523),
        (0.5, 0.61),
        (0.5, 0.46),
    ]:
        x, y = int(size * cx), int(size * cy)
        d.ellipse([x - r, y - r, x + r, y + r], fill=node)
    return im


def font(size: int):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    master = draw_mark(1024)
    save(master, ASSETS / "icon.png")
    save(master, BRAND / "logo-1024.png")
    save(master.resize((512, 512), Image.Resampling.LANCZOS), PLAY / "icon-512.png")
    save(master.resize((48, 48), Image.Resampling.LANCZOS), ASSETS / "favicon.png")
    save(master, BRAND / "logo-transparent-1024.png")

    light = Image.new("RGBA", (1024, 1024), LIGHT_BG)
    light.alpha_composite(master)
    save(light, BRAND / "logo-light-1024.png")

    dark_mark = draw_mark(1024, fill=(20, 184, 166, 255), node=(153, 246, 228, 255))
    dark = Image.new("RGBA", (1024, 1024), DARK_BG)
    dark.alpha_composite(dark_mark)
    save(dark, BRAND / "logo-dark-1024.png")

    mono = draw_mark(1024, fill=BLACK, stroke=WHITE, node=WHITE)
    save(mono, BRAND / "logo-monochrome-1024.png")
    save(mono.resize((432, 432), Image.Resampling.LANCZOS), ASSETS / "android-icon-monochrome.png")

    # Adaptive: FG padded, BG solid
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    inner = draw_mark(800)
    fg.alpha_composite(inner, ((1024 - 800) // 2, (1024 - 800) // 2))
    save(fg.resize((512, 512), Image.Resampling.LANCZOS), ASSETS / "android-icon-foreground.png")
    bg = Image.new("RGBA", (512, 512), TEAL)
    save(bg, ASSETS / "android-icon-background.png")

    # Notification white glyph
    notif_base = draw_mark(72, fill=WHITE, stroke=WHITE, node=WHITE)
    notif = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    notif.alpha_composite(notif_base, (12, 12))
    save(notif, ASSETS / "notification-icon.png")
    save(notif, BRAND / "notification-icon.png")

    # Splash
    splash = Image.new("RGBA", (1024, 1024), TEAL)
    s_mark = draw_mark(520, fill=TEAL_DARK)
    splash.alpha_composite(s_mark, ((1024 - 520) // 2, 200))
    sd = ImageDraw.Draw(splash)
    sd.text((512, 820), "PocketBrain", fill=STROKE, font=font(56), anchor="mm")
    save(splash, ASSETS / "splash-icon.png")
    save(splash, BRAND / "splash-1024.png")

    # Feature graphic 1024x500
    fgx = Image.new("RGBA", (1024, 500), TEAL)
    # gradient
    for y in range(500):
        t = y / 499
        c = (
            int(15 + (19 - 15) * t),
            int(118 + (78 - 118) * t),
            int(110 + (74 - 110) * t),
            255,
        )
        ImageDraw.Draw(fgx).line([(0, y), (1024, y)], fill=c)
    mark = draw_mark(280)
    fgx.alpha_composite(mark, (72, (500 - 280) // 2))
    fd = ImageDraw.Draw(fgx)
    fd.text((400, 200), "PocketBrain", fill=STROKE, font=font(64))
    fd.text((400, 280), "Offline AI on your device", fill=MINT, font=font(28))
    save(fgx.convert("RGB"), PLAY / "feature-graphic.png")

    print("Brand raster export complete (Pillow).")


if __name__ == "__main__":
    main()
