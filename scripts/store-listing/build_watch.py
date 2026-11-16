#!/usr/bin/env python3
"""
Prepares the Apple Watch App Store screenshots from real watch Simulator captures.

  python3 scripts/store-listing/build_watch.py

Reads   docs/store-listing/captures-watch/*.png     raw captures from an Apple Watch Series 11 (46mm) simulator
Writes  docs/store-listing/screenshots-watch/416x496/NN.png

416 x 496 is the size App Store Connect accepts for the "Apple Watch Series 12" slot (it covers Series 12, 11 and 10).
Pick one size per model family and use it for every language. No alpha channel is allowed, so the RGBA the simulator
writes is flattened to RGB. Apple wants the real watch screen, so there is no frame or caption.
(developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

Only Pillow is needed. Files are used in name order: 01-today, 02-month, 03-year, 04-life.
"""

import os
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CAPTURES = os.path.join(ROOT, 'docs', 'store-listing', 'captures-watch')
OUT = os.path.join(ROOT, 'docs', 'store-listing', 'screenshots-watch', '416x496')
SIZE = (416, 496)


def main():
    files = sorted(f for f in os.listdir(CAPTURES) if f.lower().endswith('.png')) if os.path.isdir(CAPTURES) else []
    if not files:
        print(f'No captures in {CAPTURES}; see scripts/store-listing/README.md')
        return 1
    os.makedirs(OUT, exist_ok=True)
    print('Apple Watch screenshots (416 x 496)')
    for n, name in enumerate(files, start=1):
        img = Image.open(os.path.join(CAPTURES, name))
        if img.size != SIZE:
            print(f'  skip {name}: {img.size[0]}x{img.size[1]} is not {SIZE[0]}x{SIZE[1]} (use a 46mm Series 10/11 simulator)')
            continue
        rgb = img.convert('RGB')  # drops the alpha channel Apple rejects
        out = os.path.join(OUT, f'{n:02d}.png')
        rgb.save(out, optimize=True)
        print(f'  wrote screenshots-watch/416x496/{n:02d}.png  from {name}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
