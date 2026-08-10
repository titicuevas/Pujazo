#!/usr/bin/env python3
"""Regenera iconos PWA y de la extensión Chrome a partir de la marca Pujazo."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BG = (10, 28, 20)  # #0a1c14
LIME = (159, 212, 0)  # #9fd400
CREAM = (238, 248, 184)  # #eef8b8
OUTER = (6, 20, 15)  # #06140f


def draw_mark(draw: ImageDraw.ImageDraw, size: int, pad: float = 0.14) -> None:
    margin = size * pad
    scale = (size - 2 * margin) / 32.0
    ox, oy = margin, margin

    def t(x: float, y: float) -> tuple[float, float]:
        return (ox + x * scale, oy + y * scale)

    draw.polygon([t(8.5, 8.2), t(12.2, 8.2), t(12.2, 24), t(8.5, 24)], fill=LIME)
    draw.polygon(
        [
            t(12.2, 8.2),
            t(15.6, 8.2),
            t(18.6, 9.0),
            t(20.65, 11.0),
            t(21.1, 13.05),
            t(20.65, 15.1),
            t(18.6, 17.0),
            t(15.6, 17.95),
            t(12.2, 17.95),
        ],
        fill=LIME,
    )
    draw.polygon(
        [
            t(12.2, 10.4),
            t(15.4, 10.4),
            t(16.9, 10.7),
            t(17.65, 11.7),
            t(17.65, 14.25),
            t(16.9, 15.25),
            t(15.4, 15.55),
            t(12.2, 15.55),
        ],
        fill=BG,
    )
    draw.polygon(
        [t(23.1, 9.8), t(19.7, 16.2), t(26.5, 16.2)],
        fill=CREAM,
    )
    draw.polygon(
        [t(22.05, 15.5), t(24.15, 15.5), t(24.15, 23.5), t(22.05, 23.5)],
        fill=CREAM,
    )


def make_any(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        (0, 0, size - 1, size - 1),
        radius=int(size * 0.22),
        fill=BG,
    )
    draw_mark(draw, size, pad=0.14)
    return img


def make_maskable(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), OUTER)
    draw = ImageDraw.Draw(img)
    draw_mark(draw, size, pad=0.22)
    return img


def make_extension(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    if size >= 48:
        draw.rounded_rectangle(
            (0, 0, size - 1, size - 1),
            radius=max(2, int(size * 0.2)),
            fill=BG,
        )
    draw_mark(draw, size, pad=0.08 if size <= 16 else 0.12)
    return img


def main() -> None:
    public = ROOT / "public" / "icons"
    ext = ROOT / "extension" / "icons"
    public.mkdir(parents=True, exist_ok=True)
    ext.mkdir(parents=True, exist_ok=True)

    make_any(192).save(public / "icon-192.png", optimize=True)
    make_any(512).save(public / "icon-512.png", optimize=True)
    make_maskable(512).save(public / "icon-512-maskable.png", optimize=True)
    for size, name in ((16, "icon16.png"), (48, "icon48.png"), (128, "icon128.png")):
        make_extension(size).save(ext / name, optimize=True)
    print("Iconos regenerados en public/icons y extension/icons")


if __name__ == "__main__":
    main()
