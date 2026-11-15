#!/usr/bin/env python3
"""
Checks the App Store listing copy against Apple's limits and house rules before you paste it.

  python3 scripts/store-listing/check_app_store_copy.py

Reads docs/store-listing/app-store/metadata/<locale>/{name,subtitle,keywords,promotional_text,description,release_notes}.txt
Exits 1 if anything is over a limit. Warnings (lines starting "warn") do not fail the run.

Limits (App Store Connect): name 30, subtitle 30, keywords 100, promotional text 170, description 4000, what's new 4000.
Counted in Unicode characters. App Store Connect shows the live count when you paste; trust that over this number
for Hindi, Marathi and Japanese, and keep a few characters spare there.
"""

import os
import re
import sys
import unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
META = os.path.join(ROOT, 'docs', 'store-listing', 'app-store', 'metadata')

LIMITS = {
    'name': 30,
    'subtitle': 30,
    'keywords': 100,
    'promotional_text': 170,
    'description': 4000,
    'release_notes': 4000,
}

# Words Apple rejects or ignores in name/subtitle (price, ranking claims, other platforms), compared in lower case.
BANNED_IN_TITLE = {'free', 'best', '#1', 'top', 'new', 'android', 'google', 'gratis', 'kostenlos', 'grátis'}
LEGAL_MARKERS = ('/terms', '/privacy')
# Claims the app does not make. Keep the listing honest (see docs/APP_STORE_LISTING.md "Claims we can back up").
FORBIDDEN_CLAIMS = re.compile(r'(#1|best-selling|award|\d+[,.]?\d*\s*(k|m)?\+?\s*(users|downloads|reviews|ratings))', re.I)


def read(locale, field):
    path = os.path.join(META, locale, f'{field}.txt')
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8') as f:
        return unicodedata.normalize('NFC', f.read().rstrip('\n'))


def words(text):
    return {w.lower() for w in re.findall(r'\w+', text, flags=re.UNICODE) if len(w) > 1}


def main():
    if not os.path.isdir(META):
        print(f'No metadata folder at {META}')
        return 1
    failures = 0
    locales = sorted(d for d in os.listdir(META) if os.path.isdir(os.path.join(META, d)))
    print(f'{"locale":8} {"name":>6} {"sub":>5} {"keys":>5} {"promo":>6} {"desc":>6}  result')
    for loc in locales:
        problems, warns = [], []
        values = {f: read(loc, f) for f in LIMITS}
        for field, limit in LIMITS.items():
            v = values[field]
            if v is None:
                problems.append(f'{field}.txt is missing')
            elif len(v) > limit:
                problems.append(f'{field} is {len(v)} (limit {limit})')
        name, sub, kw, desc = (values[k] or '' for k in ('name', 'subtitle', 'keywords', 'description'))

        if ', ' in kw or ' ' in kw:
            problems.append('keywords contain a space (use commas only, no spaces)')
        terms = [t for t in kw.split(',') if t]
        dupes = {t.lower() for t in terms if [x.lower() for x in terms].count(t.lower()) > 1}
        if dupes:
            problems.append(f'keywords repeat: {", ".join(sorted(dupes))}')
        overlap = words(name) | words(sub)
        reused = sorted(t for t in terms if t.lower() in overlap)
        if reused:
            problems.append(f'keywords repeat words from the name or subtitle (wasted space): {", ".join(reused)}')
        for t in words(name) | words(sub):
            if t in BANNED_IN_TITLE:
                problems.append(f'"{t}" in name/subtitle (Apple rejects price and ranking words there)')
        if sub and name and sub.strip().lower() == name.strip().lower():
            problems.append('subtitle repeats the name')
        for marker in LEGAL_MARKERS:
            if marker not in desc:
                problems.append(f'description has no link ending {marker} (Apple needs Terms and Privacy links for subscriptions)')
        for field in ('description', 'promotional_text'):
            m = FORBIDDEN_CLAIMS.search(values[field] or '')
            if m:
                problems.append(f'{field} makes a claim we cannot back up: "{m.group(0)}"')
        if len(name) >= 28 and not re.search(r'[A-Za-z]', name):
            warns.append('name is near the limit; check the live count in App Store Connect')
        if len(values['promotional_text'] or '') > 160:
            warns.append('promotional text is close to 170')

        result = 'ok' if not problems else 'FAIL'
        counts = (len(name), len(sub), len(kw), len(values['promotional_text'] or ''), len(desc))
        print(f'{loc:8} {counts[0]:>6} {counts[1]:>5} {counts[2]:>5} {counts[3]:>6} {counts[4]:>6}  {result}')
        for p in problems:
            print(f'    - {p}')
        for w in warns:
            print(f'    warn: {w}')
        failures += bool(problems)
    print(f'\n{len(locales)} locales, {failures} with problems')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
