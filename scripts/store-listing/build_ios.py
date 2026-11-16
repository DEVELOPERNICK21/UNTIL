#!/usr/bin/env python3
"""
Builds the App Store screenshots from real iOS Simulator captures.

  python3 scripts/store-listing/build_ios.py

Reads   docs/store-listing/captures-ios/*.png   (raw iPhone 17 Pro Max screenshots, 1320 x 2868, see README.md)
Writes  docs/store-listing/screenshots-ios/01.png ... 04.png   (1320 x 2868, Apple's 6.9-inch size)

Only Pillow is needed. Headlines live in SHOTS below and in docs/APP_STORE_LISTING.md; change both together.
Why separate from build.py: the Play captures show Android's status bar and launcher, and Apple rejects
screenshots that show other platforms (App Review Guideline 2.3.10).
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CAPTURES = os.path.join(ROOT, 'docs', 'store-listing', 'captures-ios')
OUT = os.path.join(ROOT, 'docs', 'store-listing', 'screenshots-ios')
FONTS = os.path.join(ROOT, 'src', 'assets', 'fonts')

# The app's own look (src/shared/theme): near-black ground and the orange used for percentages and widgets.
BG = (14, 14, 16)
ORANGE = (232, 124, 32)
WHITE = (255, 255, 255)
MUTED = (178, 178, 184)

W, H = 1320, 2868


def font(weight, size):
    name = {'bold': 'Inter_18pt-Bold.ttf', 'medium': 'Inter_18pt-Medium.ttf'}[weight]
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def glow(base, center, radius, color=ORANGE, alpha=70):
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    cx, cy = center
    ImageDraw.Draw(layer).ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.5))
    return Image.alpha_composite(base.convert('RGBA'), layer).convert('RGB')


def rounded(img, radius):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0) + img.size, radius, fill=255)
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


def words_with_color(text):
    """'Your *life* in weeks' -> [('Your', white), ('life', orange), ('in', white), ('weeks', white)].
    Punctuation after the closing star is kept: '*year*,' -> 'year,' in orange."""
    out, accent = [], False
    for token in text.split(' '):
        if token.startswith('*'):
            accent = True
        closes = accent and '*' in token[1:]
        out.append((token.replace('*', ''), ORANGE if accent else WHITE))
        if closes:
            accent = False
    return out


def draw_headline(draw, text, fnt, top, max_width, line_height):
    """Centered, wrapped, with *accent* words in orange. Returns the y after the last line."""
    lines, line, width = [], [], 0
    space = draw.textlength(' ', font=fnt)
    for word, color in words_with_color(text):
        w = draw.textlength(word, font=fnt)
        if line and width + space + w > max_width:
            lines.append((line, width))
            line, width = [], 0
        width += (space if line else 0) + w
        line.append((word, color, w))
    lines.append((line, width))
    y = top
    for items, total in lines:
        x = (W - total) / 2
        for word, color, w in items:
            draw.text((x, y), word, font=fnt, fill=color)
            x += w + space
        y += line_height
    return y


def phone(capture, width):
    """The capture in a thin dark bezel with a soft shadow. Returns (RGBA image, padding around the body)."""
    pad, bezel = 90, 14
    inner_w = width - 2 * bezel
    screen = capture.convert('RGB').resize((inner_w, round(inner_w * capture.height / capture.width)), Image.LANCZOS)
    screen = rounded(screen, round(inner_w * 0.128))
    body_h = screen.height + 2 * bezel
    body = Image.new('RGBA', (width, body_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, width - 1, body_h - 1), round(width * 0.14), fill=(30, 30, 34, 255))
    d.rounded_rectangle((2, 2, width - 3, body_h - 3), round(width * 0.14) - 2, fill=(8, 8, 10, 255))
    body.alpha_composite(screen, (bezel, bezel))
    canvas = Image.new('RGBA', (width + 2 * pad, body_h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).rounded_rectangle((pad, pad + 40, pad + width, pad + 40 + body_h), round(width * 0.14), fill=(0, 0, 0, 170))
    canvas = canvas.filter(ImageFilter.GaussianBlur(40))
    canvas.alpha_composite(body, (pad, pad))
    return canvas, pad


def screenshot(n, headline, sub, capture_name, phone_width=1120, phone_top=640):
    path = os.path.join(CAPTURES, capture_name)
    if not os.path.exists(path):
        print(f'  skip {n:02d}: {capture_name} is missing')
        return None
    canvas = Image.new('RGB', (W, H), BG)
    canvas = glow(canvas, (W // 2, phone_top + 900), 760)
    canvas = glow(canvas, (W - 120, 120), 420, alpha=45)
    draw = ImageDraw.Draw(canvas)

    head_font, sub_font = font('bold', 128), font('medium', 54)
    y = draw_headline(draw, headline, head_font, 150, W - 170, 142)
    sub_w = draw.textlength(sub, font=sub_font)
    draw.text(((W - sub_w) / 2, y + 18), sub, font=sub_font, fill=MUTED)

    shot = Image.open(path)
    img, pad = phone(shot, phone_width)
    canvas = canvas.convert('RGBA')
    canvas.alpha_composite(img, ((W - phone_width) // 2 - pad, phone_top - pad))
    out = os.path.join(OUT, f'{n:02d}.png')
    os.makedirs(OUT, exist_ok=True)
    canvas.convert('RGB').save(out, optimize=True)
    print(f'  wrote screenshots-ios/{n:02d}.png')
    return out


# (headline with *accent* word, line under it, capture file, layout overrides)
# Add Lock Screen, Apple Watch and Premium slides when their captures exist (see README.md).
SHOTS = [
    ('Your *life* in weeks', 'One calm grid. Every week counts', '01-life.png', {}),
    ('Time left, on your *Home Screen*', 'Day, month, year and life, live', '02-home-widgets.png', {}),
    ('Day, year and *life*', 'How much is left, at a glance', '03-home.png', {}),
    ('*Show up* daily', 'Streaks and badges that forgive a miss', '04-badges.png', {}),
]


if __name__ == '__main__':
    print('App Store screenshots (1320 x 2868)')
    for i, (headline, sub, cap, extra) in enumerate(SHOTS, start=1):
        screenshot(i, headline, sub, cap, **extra)
    sys.exit(0)
