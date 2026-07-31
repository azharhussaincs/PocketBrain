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
TEAL_MID = (20, 184, 166, 255)
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
    """Bold pocket + PB monogram — readable at 48dp launcher size."""
    im = Image.new("RGBA", (size, size), bg if bg is not None else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(size * 0.06)
    box = [pad, pad, size - pad, size - pad]
    radius = int(size * 0.24)
    d.rounded_rectangle(box, radius=radius, fill=fill)

    # Soft highlight
    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.ellipse(
        [int(size * 0.10), int(size * 0.06), int(size * 0.90), int(size * 0.40)],
        fill=(255, 255, 255, 40),
    )
    im = Image.alpha_composite(im, highlight)
    d = ImageDraw.Draw(im)

    # Pocket U — thicker, simpler
    pocket_w = max(4, size // 22)
    left = int(size * 0.28)
    right = int(size * 0.72)
    top = int(size * 0.34)
    bottom = int(size * 0.78)
    d.line([(left, top), (left, bottom - int(size * 0.10))], fill=stroke, width=pocket_w)
    d.line([(right, top), (right, bottom - int(size * 0.10))], fill=stroke, width=pocket_w)
    d.arc(
        [left, bottom - int(size * 0.26), right, bottom + int(size * 0.02)],
        0,
        180,
        fill=stroke,
        width=pocket_w,
    )
    # Flap
    d.arc(
        [left, int(size * 0.22), right, int(size * 0.48)],
        200,
        340,
        fill=stroke,
        width=pocket_w,
    )

    # Bold PB letters inside pocket (clear at tiny sizes)
    f = font(max(18, int(size * 0.28)))
    d.text((size // 2, int(size * 0.58)), "PB", fill=stroke, font=f, anchor="mm")

    # Accent nodes
    r = max(3, size // 48)
    for cx, cy in [(0.38, 0.46), (0.62, 0.46)]:
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
    master = draw_mark(1024, fill=TEAL_MID)
    # Blend toward brand teal by compositing darker base under mid fill already ok
    master = draw_mark(1024, fill=TEAL)
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

    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    inner = draw_mark(800)
    fg.alpha_composite(inner, ((1024 - 800) // 2, (1024 - 800) // 2))
    save(fg.resize((512, 512), Image.Resampling.LANCZOS), ASSETS / "android-icon-foreground.png")
    bg = Image.new("RGBA", (512, 512), TEAL)
    save(bg, ASSETS / "android-icon-background.png")

    notif_base = draw_mark(72, fill=WHITE, stroke=WHITE, node=WHITE)
    notif = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    notif.alpha_composite(notif_base, (12, 12))
    save(notif, ASSETS / "notification-icon.png")
    save(notif, BRAND / "notification-icon.png")

    splash = Image.new("RGBA", (1024, 1024), TEAL)
    s_mark = draw_mark(520, fill=TEAL_DARK)
    splash.alpha_composite(s_mark, ((1024 - 520) // 2, 180))
    sd = ImageDraw.Draw(splash)
    sd.text((512, 820), "PocketBrain", fill=STROKE, font=font(56), anchor="mm")
    save(splash, ASSETS / "splash-icon.png")
    save(splash, BRAND / "splash-1024.png")

    fgx = Image.new("RGBA", (1024, 500), TEAL)
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
    fd.text((400, 190), "PocketBrain", fill=STROKE, font=font(64))
    fd.text((400, 270), "Private AI on your phone", fill=MINT, font=font(28))
    save(fgx.convert("RGB"), PLAY / "feature-graphic.png")

    print("Brand raster export complete (Pillow).")


if __name__ == "__main__":
    main()
