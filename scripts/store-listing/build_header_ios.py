#!/usr/bin/env python3
"""
Builds the App Store "Header and Search Results" creative assets (App Store Connect > Product Page
Information > Header and Search Results).

  python3 scripts/store-listing/build_header_ios.py [--guides]

Reads   docs/store-listing/captures-ios/02-home-widgets.png   (a real Home Screen capture with the widget)
Writes  docs/store-listing/header-search/
          universal.png          5244 x 2950  16:9  one image for both placements (Apple recommends it)
          universal-notext.png   same, with no words, so it works in every language
          header.png             3840 x 1646  21:9  product page header only
          search.png             3840 x 2560  3:2   search results only
        With --guides, also *-guides.png in docs/store-listing/previews/ with the art safe area drawn on.

Apple's spec (developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications):
no alpha channel; PNG or JPEG (universal: PNG only). Key art must stay inside the art safe area:
  universal 1402 x 962 at (1921, 660) | header 1646 x 661 at (1097, 493) | search 2168 x 1030 at (836, 765)
Apple's guidance: one clear idea; no prices, URLs, awards, other platforms or Apple recognitions; a short phrase
that enhances the picture; localize any text. So there is one headline ("Your life in weeks") and a text-free version.

Only Pillow is needed.
"""

import argparse
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CAPTURE = os.path.join(ROOT, 'docs', 'store-listing', 'captures-ios', '02-home-widgets.png')
OUT = os.path.join(ROOT, 'docs', 'store-listing', 'header-search')
GUIDES = os.path.join(ROOT, 'docs', 'store-listing', 'previews')
FONTS = os.path.join(ROOT, 'src', 'assets', 'fonts')

BG = (14, 14, 16)
ORANGE = (232, 124, 32)
WHITE = (255, 255, 255)
DIM = (52, 52, 58)

# (width, height, art safe area x, y, w, h, layout)
SPECS = {
    'universal': (5244, 2950, (1921, 660, 1402, 962), 'stack'),
    'header': (3840, 1646, (1097, 493, 1646, 661), 'row'),
    'search': (3840, 2560, (836, 765, 2168, 1030), 'row'),
}

# Where the large widget sits in the 1320 x 2868 Home Screen capture, and its corner radius
WIDGET_BOX = (96, 288, 1222, 1458)
WIDGET_RADIUS = 128

HEADLINE = 'Your *life* in weeks'
HEADLINE_ROW = 'Your *life*\nin weeks'  # the wide layouts have room for two lines, not for an orphan word


def font(size):
    return ImageFont.truetype(os.path.join(FONTS, 'Inter_18pt-Bold.ttf'), size)


def widget_image():
    cap = Image.open(CAPTURE).convert('RGB').crop(WIDGET_BOX)
    mask = Image.new('L', cap.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, cap.width - 1, cap.height - 1), WIDGET_RADIUS, fill=255)
    out = cap.convert('RGBA')
    out.putalpha(mask)
    return out


def life_grid(w, h, centre):
    """The Life screen's dots across the whole canvas: lived weeks in orange, the rest dim, faded near the focal art."""
    cols = 84
    pitch = w / cols
    rows = int(h / pitch) + 2
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    lived = int(cols * rows * 0.42)
    r = pitch * 0.27
    for i in range(cols * rows):
        cx = (i % cols + 0.5) * pitch
        cy = (i // cols + 0.5) * pitch
        colour = ORANGE + (235,) if i < lived else DIM + (255,)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=colour)
    # fade the dots out around the focal art so it reads cleanly
    fade = Image.radial_gradient('L').resize((w, h), Image.BICUBIC)
    fade = fade.point(lambda v: min(255, int(((v / 255) ** 2.1) * 255 * 1.25)))
    layer.putalpha(ImageChops.multiply(layer.getchannel('A'), fade))
    return layer


def glow(canvas, centre, radius, alpha=80):
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    cx, cy = centre
    ImageDraw.Draw(layer).ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=ORANGE + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.55))
    return Image.alpha_composite(canvas, layer)


def shadowed(canvas, img, xy, blur=60, offset=40, opacity=190):
    pad = blur * 3
    sh = Image.new('RGBA', (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + offset, pad + img.width, pad + offset + img.height), WIDGET_RADIUS,
                                         fill=(0, 0, 0, opacity))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(sh, (xy[0] - pad, xy[1] - pad))
    canvas.alpha_composite(img, xy)


def words(text):
    out, accent = [], False
    for token in text.split(' '):
        if token.startswith('*'):
            accent = True
        closes = accent and '*' in token[1:]
        out.append((token.replace('*', ''), ORANGE if accent else WHITE))
        if closes:
            accent = False
    return out


def headline_block(draw, text, size, max_width):
    """Lays the headline out in as few lines as fit. Returns (lines, line_height) where lines = [[(word, colour, width)]]."""
    f = font(size)
    space = draw.textlength(' ', font=f)
    lines = []
    for segment in text.split('\n'):  # an explicit \n is a hard line break
        line, width = [], 0
        for word, colour in words(segment):
            w = draw.textlength(word, font=f)
            if line and width + space + w > max_width:
                lines.append((line, width))
                line, width = [], 0
            width += (space if line else 0) + w
            line.append((word, colour, w))
        lines.append((line, width))
    return f, lines, round(size * 1.14)


def build(name, with_text):
    w, h, (sx, sy, sw, sh), layout = SPECS[name]
    canvas = Image.new('RGBA', (w, h), BG + (255,))
    centre = (sx + sw // 2, sy + sh // 2)
    canvas = Image.alpha_composite(canvas, life_grid(w, h, centre))
    canvas = glow(canvas, centre, int(min(sw, sh) * 0.75))
    draw = ImageDraw.Draw(canvas)

    widget = widget_image()
    ratio = widget.width / widget.height

    if not with_text:
        wh = sh
        wimg = widget.resize((round(wh * ratio), wh), Image.LANCZOS)
        shadowed(canvas, wimg, (sx + (sw - wimg.width) // 2, sy))
        return canvas.convert('RGB')

    if layout == 'stack':
        size = 118
        f, lines, lh = headline_block(draw, HEADLINE, size, sw)
        text_h = lh * len(lines)
        gap = 44
        wh = sh - text_h - gap
        wimg = widget.resize((round(wh * ratio), wh), Image.LANCZOS)
        y = sy
        for items, total in lines:
            x = sx + (sw - total) / 2
            for word, colour, ww in items:
                draw.text((x, y), word, font=f, fill=colour)
                x += ww + draw.textlength(' ', font=f)
            y += lh
        shadowed(canvas, wimg, (sx + (sw - wimg.width) // 2, y + gap - 10))
    else:
        wh = sh
        wimg = widget.resize((round(wh * ratio), wh), Image.LANCZOS)
        gap = 70
        text_w = sw - wimg.width - gap
        size = 190 if name == 'search' else 132
        f, lines, lh = headline_block(draw, HEADLINE_ROW, size, text_w)
        while max(t for _, t in lines) > text_w and size > 60:
            size -= 6
            f, lines, lh = headline_block(draw, HEADLINE_ROW, size, text_w)
        block_h = lh * len(lines)
        y = sy + (sh - block_h) / 2
        for items, total in lines:
            x = sx
            for word, colour, ww in items:
                draw.text((x, y), word, font=f, fill=colour)
                x += ww + draw.textlength(' ', font=f)
            y += lh
        shadowed(canvas, wimg, (sx + sw - wimg.width, sy))
    return canvas.convert('RGB')


def with_guides(img, name):
    _, _, (sx, sy, sw, sh), _ = SPECS[name]
    g = img.convert('RGBA')
    d = ImageDraw.Draw(g)
    d.rectangle((sx, sy, sx + sw, sy + sh), outline=(0, 255, 160, 255), width=8)
    return g.convert('RGB')


def save(img, path):
    assert img.mode == 'RGB', 'Apple rejects an alpha channel'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, 'PNG', optimize=True)
    print(f'  wrote {os.path.relpath(path, ROOT)}  {img.size[0]}x{img.size[1]}  {os.path.getsize(path) // 1024} KB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--guides', action='store_true', help='also write copies with the art safe area drawn on')
    args = ap.parse_args()
    if not os.path.exists(CAPTURE):
        print(f'Missing {CAPTURE}; see scripts/store-listing/README.md')
        return 1
    print('Header and search results assets')
    for name, with_text, fname in [('universal', True, 'universal.png'), ('universal', False, 'universal-notext.png'),
                                   ('header', True, 'header.png'), ('search', True, 'search.png')]:
        img = build(name, with_text)
        w, h = SPECS[name][0], SPECS[name][1]
        assert img.size == (w, h), (name, img.size)
        save(img, os.path.join(OUT, fname))
        if args.guides:
            save(with_guides(img, name).resize((w // 4, h // 4), Image.LANCZOS), os.path.join(GUIDES, fname.replace('.png', '-guides.png')))
    return 0


if __name__ == '__main__':
    sys.exit(main())
