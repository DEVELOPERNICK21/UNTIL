#!/usr/bin/env python3
"""
Previews how the App Store listing will look: the search result card and the product page header,
now and after the change. Built from the real copy and screenshots, so it stays in sync with them.

  python3 scripts/store-listing/preview_ios.py [--before DIR]

After   docs/store-listing/app-store/metadata/en-US/*.txt, docs/store-listing/screenshots-ios/01..03.png,
        the app icon from the iOS asset catalog.
Before  (optional) a folder with the live listing's icon.jpg and shot1.jpg ... shot3.jpg. Without it only the
        "New" column is drawn.
Writes  docs/store-listing/previews/search-result.png and docs/store-listing/previews/product-header.png

Only Pillow is needed. It is a mock-up: Inter stands in for Apple's font, so line breaks and truncation
are close to, not exactly, what iOS shows. Check the real thing in App Store Connect before you submit.
"""

import argparse
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
META = os.path.join(ROOT, 'docs', 'store-listing', 'app-store', 'metadata', 'en-US')
SHOTS = os.path.join(ROOT, 'docs', 'store-listing', 'screenshots-ios', '1320x2868')
OUT = os.path.join(ROOT, 'docs', 'store-listing', 'previews')
ICON = os.path.join(ROOT, 'ios', 'UNTIL', 'Images.xcassets', 'AppIcon.appiconset', 'AppIcon.png')
FONTS = os.path.join(ROOT, 'src', 'assets', 'fonts')

# iOS dark mode, roughly
BG = (0, 0, 0)
CARD = (28, 28, 30)
TEXT = (255, 255, 255)
MUTED = (152, 152, 157)
DIVIDER = (58, 58, 60)
BLUE = (10, 132, 255)
PILL = (44, 44, 48)
STAR = (152, 152, 157)

W = 1170  # one iPhone at 3x

# The live listing on 16 November 2026 (docs/APP_STORE_ASO.md)
BEFORE = {
    'name': 'UNTIL : Countdown & Time Left',
    'subtitle': 'UNTIL Track day, life progress',
    'promo': '',
    'description': 'UNTIL shows how much time you have left.\n\nTrack today, this month, this year, and your life. '
                   'Put the numbers on Home Screen widgets, Lock Screen, and Apple Watch so you see them without opening the app.',
    'ratings': '1 Rating',
    'score': '5.0',
}


def font(weight, size):
    name = {'bold': 'Inter_18pt-Bold.ttf', 'medium': 'Inter_18pt-Medium.ttf'}[weight]
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def read(name):
    with open(os.path.join(META, name), encoding='utf-8') as f:
        return f.read().strip()


def rounded(img, radius):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0) + img.size, radius, fill=255)
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


def fit(img, width):
    return img.convert('RGB').resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def ellipsize(draw, text, fnt, width):
    if draw.textlength(text, font=fnt) <= width:
        return text
    while text and draw.textlength(text + '…', font=fnt) > width:
        text = text[:-1]
    return text.rstrip() + '…'


def wrap(draw, text, fnt, width, max_lines):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = ellipsize(draw, lines[-1] + ' …', fnt, width)
    return lines


def star(draw, cx, cy, r, fill):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    draw.polygon(pts, fill=fill)


def stars(draw, x, y, size=17, n=5, gap=6):
    for i in range(n):
        star(draw, x + size + i * (size * 2 + gap), y + size, size, STAR)
    return x + n * (size * 2 + gap)


def get_button(draw, x, y, w, h, filled=False):
    draw.rounded_rectangle((x, y, x + w, y + h), h // 2, fill=BLUE if filled else PILL)
    f = font('bold', 44 if not filled else 50)
    label = 'GET' if not filled else 'Get'
    tw = draw.textlength(label, font=f)
    draw.text((x + (w - tw) / 2, y + (h - f.size) / 2 - 4), label, font=f, fill=TEXT if filled else BLUE)


def load_set(before_dir, kind):
    """(icon, [three screenshots]) for 'before' (from before_dir) or 'after' (from this repo)."""
    if kind == 'after':
        icon = Image.open(ICON)
        shots = [Image.open(os.path.join(SHOTS, f'{i:02d}.png')) for i in (1, 2, 3)]
    else:
        icon = Image.open(os.path.join(before_dir, 'icon.jpg'))
        shots = [Image.open(os.path.join(before_dir, f'shot{i}.jpg')) for i in (1, 2, 3)]
    return icon, shots


def search_card(data, icon, shots):
    """One search result: icon, name, subtitle, rating, Get, and the first three screenshots."""
    shot_w, gap, pad = 360, 24, 48
    shots = [fit(s, shot_w) for s in shots]
    shot_h = max(s.height for s in shots)
    h = 40 + 200 + 36 + shot_h + 48
    canvas = Image.new('RGB', (W, h), BG)
    d = ImageDraw.Draw(canvas)

    ic = rounded(icon.convert('RGB').resize((200, 200), Image.LANCZOS), 46)
    canvas.paste(ic, (pad, 40), ic)

    name_f, sub_f, meta_f = font('bold', 46), font('medium', 40), font('medium', 36)
    text_x = pad + 200 + 32
    btn_w, btn_h = 210, 92
    text_w = W - pad - btn_w - 28 - text_x
    d.text((text_x, 44), ellipsize(d, data['name'], name_f, text_w), font=name_f, fill=TEXT)
    d.text((text_x, 106), ellipsize(d, data['subtitle'], sub_f, text_w), font=sub_f, fill=MUTED)
    sx = stars(d, text_x, 168)
    d.text((sx + 8, 166), data['ratings'], font=meta_f, fill=MUTED)

    get_button(d, W - pad - btn_w, 40 + 40, btn_w, btn_h)
    d.text((W - pad - btn_w + 22, 40 + 40 + btn_h + 10), 'In-App Purchases', font=font('medium', 26), fill=MUTED)

    x = pad
    for s in shots:
        sh = rounded(s, 36)
        canvas.paste(sh, (x, 40 + 200 + 36), sh)
        x += shot_w + gap
    return canvas


def product_header(data, icon, shots):
    """The top of the product page: icon, name, subtitle, Get, the info strip, the first screenshots, the text."""
    pad = 48
    shot_w, gap = 430, 24
    shots = [fit(s, shot_w) for s in shots]
    shot_h = max(s.height for s in shots)

    probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    name_f, sub_f = font('bold', 64), font('medium', 46)
    text_x = pad + 330 + 40
    text_w = W - pad - text_x
    name_lines = wrap(probe, data['name'], name_f, text_w, 3)
    sub_lines = wrap(probe, data['subtitle'], sub_f, text_w, 2)

    body_f = font('medium', 40)
    promo = data['promo'] or data['description'].split('\n')[0]
    body_lines = wrap(probe, promo, body_f, W - 2 * pad, 4)
    h = 60 + 330 + 80 + 190 + 60 + shot_h + 60 + len(body_lines) * 58 + 100
    canvas = Image.new('RGB', (W, h), BG)
    d = ImageDraw.Draw(canvas)

    ic = rounded(icon.convert('RGB').resize((330, 330), Image.LANCZOS), 74)
    canvas.paste(ic, (pad, 60), ic)

    y = 60
    for line in name_lines:
        d.text((text_x, y), line, font=name_f, fill=TEXT)
        y += 76
    for line in sub_lines:
        d.text((text_x, y + 4), line, font=sub_f, fill=MUTED)
        y += 56
    get_button(d, text_x, 60 + 330 - 96, 230, 96, filled=True)
    d.text((text_x + 258, 60 + 330 - 86), '↑', font=font('bold', 56), fill=BLUE)
    d.text((text_x, 60 + 330 + 8), 'In-App Purchases', font=font('medium', 26), fill=MUTED)

    # info strip
    sy = 60 + 330 + 80
    d.line((pad, sy, W - pad, sy), fill=DIVIDER, width=2)
    cols = [('1 RATING' if '1 Rating' in data['ratings'] else 'RATINGS', data['score'], 'stars'),
            ('CATEGORY', 'Productivity', None),
            ('LANGUAGES', 'EN', '+ 10 MORE'),
            ('PRICE', 'Free', 'In-App Purchases')]
    cw = (W - 2 * pad) / len(cols)
    label_f, val_f, sub2_f = font('medium', 26), font('bold', 54), font('medium', 26)
    for i, (label, value, extra) in enumerate(cols):
        cx = pad + i * cw
        if i:
            d.line((cx, sy + 24, cx, sy + 170), fill=DIVIDER, width=2)
        lw = d.textlength(label, font=label_f)
        d.text((cx + (cw - lw) / 2, sy + 28), label, font=label_f, fill=MUTED)
        vf = val_f if d.textlength(value, font=val_f) < cw - 20 else font('bold', 36)
        vw = d.textlength(value, font=vf)
        d.text((cx + (cw - vw) / 2, sy + 70), value, font=vf, fill=TEXT)
        if extra == 'stars':
            sw = 5 * 26
            stars(d, cx + (cw - sw - 20) / 2, sy + 136, size=9, gap=4)
        elif extra:
            ew = d.textlength(extra, font=sub2_f)
            d.text((cx + (cw - ew) / 2, sy + 140), extra, font=sub2_f, fill=MUTED)
    d.line((pad, sy + 190, W - pad, sy + 190), fill=DIVIDER, width=2)

    # screenshots (the third is cut by the edge, as on the real page)
    shy = sy + 190 + 60
    x = pad
    for s in shots:
        sh = rounded(s, 40)
        canvas.paste(sh, (x, shy), sh)
        x += shot_w + gap

    ty = shy + shot_h + 60
    for line in body_lines:
        d.text((pad, ty), line, font=body_f, fill=TEXT)
        ty += 58
    d.text((W - pad - d.textlength('more', font=body_f), ty - 58), 'more', font=body_f, fill=BLUE)
    return canvas


def compose(columns, title, out_path):
    """Side by side, a label over each column."""
    gap, top = 70, 150
    f = font('bold', 52)
    h = max(c.height for _, c in columns) + top + 120
    w = len(columns) * W + (len(columns) - 1) * gap
    sheet = Image.new('RGB', (w, h), (18, 18, 20))
    d = ImageDraw.Draw(sheet)
    for i, (label, col) in enumerate(columns):
        x = i * (W + gap)
        d.text((x + 8, 60), label, font=f, fill=(255, 159, 10) if label.startswith('NEW') else MUTED)
        sheet.paste(col, (x, top))
    note = f'{title}. Preview only: Inter stands in for Apple\'s font, so truncation is approximate.'
    d.text((8, h - 70), note, font=font('medium', 30), fill=(120, 120, 126))
    os.makedirs(OUT, exist_ok=True)
    sheet.save(out_path, optimize=True)
    print(f'  wrote {os.path.relpath(out_path, ROOT)}  ({w}x{h})')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--before', help='folder with the live listing: icon.jpg, shot1.jpg ... shot3.jpg')
    args = ap.parse_args()

    after = {
        'name': read('name.txt'),
        'subtitle': read('subtitle.txt'),
        'promo': read('promotional_text.txt'),
        'description': read('description.txt'),
        'ratings': '1 Rating',
        'score': '5.0',
    }
    sets = [('NEW', after, 'after')]
    if args.before and os.path.exists(os.path.join(args.before, 'icon.jpg')):
        sets.insert(0, ('NOW (live)', BEFORE, 'before'))
    elif args.before:
        print(f'  {args.before} has no icon.jpg; drawing the New column only')

    print('Previews')
    search, header = [], []
    for label, data, kind in sets:
        icon, shots = load_set(args.before, kind)
        search.append((label, search_card(data, icon, shots)))
        header.append((label, product_header(data, icon, shots)))
    compose(search, 'App Store search result', os.path.join(OUT, 'search-result.png'))
    compose(header, 'App Store product page header', os.path.join(OUT, 'product-header.png'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
