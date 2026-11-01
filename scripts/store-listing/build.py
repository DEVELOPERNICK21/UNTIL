#!/usr/bin/env python3
"""
Builds the Play Store listing images from real captures of the app.

  python3 scripts/store-listing/build.py

Reads   docs/store-listing/captures/*.png   (raw Android screenshots, see README.md)
Writes  docs/store-listing/screenshots/01.png ... 08.png   (1080 x 1920)
        docs/store-listing/feature-graphic.png              (1024 x 500)

Only Pillow is needed. Headlines live in SHOTS below and in docs/PLAY_STORE_ASO.md; change both together.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CAPTURES = os.path.join(ROOT, 'docs', 'store-listing', 'captures')
OUT = os.path.join(ROOT, 'docs', 'store-listing')
FONTS = os.path.join(ROOT, 'src', 'assets', 'fonts')

# Same warm family as the screenshots already on the listing, so nothing looks new-and-old.
TOP = (229, 18, 31)
BOTTOM = (245, 138, 43)
WHITE = (255, 255, 255)

W, H = 1080, 1920


def font(weight, size):
    name = {'bold': 'Inter_18pt-Bold.ttf', 'medium': 'Inter_18pt-Medium.ttf'}[weight]
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def gradient(w, h, top=TOP, bottom=BOTTOM):
    mask = Image.linear_gradient('L').resize((w, h))
    return Image.composite(Image.new('RGB', (w, h), bottom), Image.new('RGB', (w, h), top), mask)


def glow(base, center, radius, color=(255, 190, 90), alpha=95):
    """A soft warm light behind the phone so the dark screen does not sit on a flat colour."""
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.45))
    return Image.alpha_composite(base.convert('RGBA'), layer).convert('RGB')


def rounded(img, radius):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0) + img.size, radius, fill=255)
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


def wrap(draw, text, fnt, max_width):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def phone(capture, width):
    """The capture in a thin dark bezel with a soft shadow. Returns an RGBA image."""
    ratio = capture.height / capture.width
    inner_w = width - 2 * 12
    screen = capture.convert('RGB').resize((inner_w, round(inner_w * ratio)), Image.LANCZOS)
    screen = rounded(screen, round(inner_w * 0.075))
    body_h = screen.height + 24
    body = Image.new('RGBA', (width, body_h), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, width, body_h), round(width * 0.09), fill=(14, 14, 16, 255))
    body.alpha_composite(screen, (12, 12))
    shadow = Image.new('RGBA', (width + 160, body_h + 160), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((80, 100, 80 + width, 100 + body_h), round(width * 0.09), fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(34))
    shadow.alpha_composite(body, (80, 80))
    return shadow, 80


def scrim(capture, height=190):
    """Darkens the status bar area of a launcher capture: the emulator wallpaper is white up there."""
    capture = capture.convert('RGB')
    layer = Image.new('RGBA', capture.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for y in range(height):
        d.line([(0, y), (capture.width, y)], fill=(8, 8, 10, round(215 * (1 - y / height) ** 1.4)))
    return Image.alpha_composite(capture.convert('RGBA'), layer).convert('RGB')


def screenshot(n, headline, sub, capture_name, phone_width=900, phone_top=440, shift_x=0, darken_top=False):
    path = os.path.join(CAPTURES, capture_name)
    if not os.path.exists(path):
        print(f'  skip {n:02d}: {capture_name} is missing')
        return None
    canvas = gradient(W, H)
    canvas = glow(canvas, (W // 2, phone_top + 700), 560)
    draw = ImageDraw.Draw(canvas)

    head_font, sub_font = font('bold', 92), font('medium', 40)
    y = 118
    for line in wrap(draw, headline, head_font, W - 150):
        w = draw.textlength(line, font=head_font)
        draw.text(((W - w) / 2, y), line, font=head_font, fill=WHITE)
        y += 106
    sub_w = draw.textlength(sub, font=sub_font)
    draw.text(((W - sub_w) / 2, y + 14), sub, font=sub_font, fill=(255, 255, 255, 235))

    shot = Image.open(path)
    if darken_top:
        shot = scrim(shot)
    img, pad = phone(shot, phone_width)
    canvas = canvas.convert('RGBA')
    canvas.alpha_composite(img, ((W - phone_width) // 2 - pad + shift_x, phone_top - pad))
    out = os.path.join(OUT, 'screenshots', f'{n:02d}.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    canvas.convert('RGB').save(out, optimize=True)
    print(f'  wrote screenshots/{n:02d}.png')
    return out


# (headline, line under it, capture file, extra layout)
SHOTS = [
    ('Time left, on your home screen', 'Day, month and your next deadlines', '01-home-widgets.png', {'darken_top': True}),
    ('See your life in weeks', 'One calm grid. Every week counts', '02-life.png', {}),
    ('Count down to what matters', 'Deadlines and a widget for the nearest', '03-deadlines.png', {}),
    ('Your day at a glance', 'How much of today is left, live', '04-home.png', {}),
    ('Tap to count anything', 'Water, pages, workouts. +1 from the widget', '05-counters.png', {}),
    ('Plan today, finish it', 'Tick them off. See how the day went', '06-tasks.png', {}),
    ('Show up every day', 'Streaks and badges. A missed day is forgiven', '07-badges.png', {}),
    ('Try Premium free for 5 days', 'Month, Life, more deadlines. Cancel any time', '08-premium.png', {}),
]


def feature_graphic():
    gw, gh = 1024, 500
    canvas = gradient(gw, gh)
    canvas = glow(canvas, (800, 250), 330)
    draw = ImageDraw.Draw(canvas)
    head, sub, chips = font('bold', 66), font('medium', 28), font('bold', 22)
    y = 92
    for line in ['How much', 'time is left?']:
        draw.text((64, y), line, font=head, fill=WHITE)
        y += 76
    draw.text((66, y + 14), 'Home screen widgets. Free to start.', font=sub, fill=(255, 255, 255, 235))
    x = 66
    for label in ['Day', 'Month', 'Year', 'Life']:
        tw = draw.textlength(label, font=chips)
        draw.rounded_rectangle((x, y + 78, x + tw + 36, y + 78 + 44), 22, fill=(14, 14, 16))
        draw.text((x + 18, y + 78 + 9), label, font=chips, fill=WHITE)
        x += tw + 36 + 12

    # Real widgets, cropped from the home-screen capture. Boxes are set in WIDGET_CROPS.
    src = os.path.join(CAPTURES, '01-home-widgets.png')
    canvas = canvas.convert('RGBA')
    if os.path.exists(src) and WIDGET_CROPS:
        cap = Image.open(src).convert('RGB')
        for box, at, scale in WIDGET_CROPS:
            tile = cap.crop(box)
            tile = tile.resize((round(tile.width * scale), round(tile.height * scale)), Image.LANCZOS)
            tile = rounded(tile, 34)
            shadow = Image.new('RGBA', (tile.width + 120, tile.height + 120), (0, 0, 0, 0))
            ImageDraw.Draw(shadow).rounded_rectangle((60, 72, 60 + tile.width, 72 + tile.height), 34, fill=(0, 0, 0, 120))
            shadow = shadow.filter(ImageFilter.GaussianBlur(22))
            canvas.alpha_composite(shadow, (at[0] - 60, at[1] - 60))
            canvas.alpha_composite(tile, at)
    out = os.path.join(OUT, 'feature-graphic.png')
    canvas.convert('RGB').save(out, optimize=True)
    print('  wrote feature-graphic.png')


# ((left, top, right, bottom) in the capture, (x, y) on the graphic, scale)
WIDGET_CROPS = [
    # Month widget (4x2)
    ((64, 912, 1283, 1589), (560, 30), 0.33),
    # Next deadlines widget (4x2)
    ((64, 1627, 1283, 2304), (566, 262), 0.33),
    # Day widget (2x2), over the right-hand corner where the month tile only has decoration
    ((64, 196, 648, 873), (842, 118), 0.28),
]


if __name__ == '__main__':
    os.makedirs(CAPTURES, exist_ok=True)
    print('Screenshots')
    for i, (headline, sub, cap, extra) in enumerate(SHOTS, start=1):
        screenshot(i, headline, sub, cap, **extra)
    print('Feature graphic')
    feature_graphic()
    sys.exit(0)
