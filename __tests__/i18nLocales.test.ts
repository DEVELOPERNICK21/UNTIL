/**
 * Locale files stay in step with English: same keys, the plural forms each language needs,
 * and the same {{placeholders}}. Adding a key to English without translating it fails here.
 */
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { PLURAL_CATEGORIES } from '../src/shared/i18n/plural';
import { resources } from '../src/shared/i18n/resources';

const PLURAL = /^(.*)_(zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

function placeholders(message: string): string[] {
  return [...message.matchAll(PLACEHOLDER)].map(match => match[1]).sort();
}

const english = resources.en;
const pluralBases = new Set(
  Object.keys(english)
    .map(key => PLURAL.exec(key)?.[1])
    .filter((base): base is string => !!base),
);
const plainKeys = Object.keys(english).filter(key => !PLURAL.test(key));

describe('locale files', () => {
  it('registers a message map for every supported language', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      expect(Object.keys(resources[code]).length).toBeGreaterThan(0);
    }
  });

  describe.each(SUPPORTED_LANGUAGES.map(language => language.code))(
    '%s',
    code => {
      const messages = resources[code];

      it('has every English key', () => {
        const missing = plainKeys.filter(key => !(key in messages));
        expect(missing).toEqual([]);
      });

      it('has the plural forms the language needs', () => {
        const missing: string[] = [];
        for (const base of pluralBases) {
          for (const category of PLURAL_CATEGORIES[code]) {
            if (!(`${base}_${category}` in messages)) {
              missing.push(`${base}_${category}`);
            }
          }
        }
        expect(missing).toEqual([]);
      });

      it('has no keys English does not', () => {
        const extra = Object.keys(messages).filter(key => {
          const base = PLURAL.exec(key)?.[1];
          return base ? !pluralBases.has(base) : !(key in english);
        });
        expect(extra).toEqual([]);
      });

      it('has no empty messages', () => {
        const empty = Object.entries(messages)
          .filter(([, message]) => message.trim() === '')
          .map(([key]) => key);
        expect(empty).toEqual([]);
      });

      it('uses the same placeholders as English', () => {
        const mismatched: string[] = [];
        for (const [key, message] of Object.entries(messages)) {
          const base = PLURAL.exec(key)?.[1];
          const reference = base ? english[`${base}_other`] : english[key];
          if (reference === undefined) continue;
          const wanted = placeholders(reference);
          const got = placeholders(message);
          // A plural form may drop {{count}} ("one day"), but never invent a placeholder.
          const ok = base
            ? got.every(name => wanted.includes(name))
            : got.join() === wanted.join();
          if (!ok) mismatched.push(`${key}: ${got.join()} vs ${wanted.join()}`);
        }
        expect(mismatched).toEqual([]);
      });

      it('keeps the [linked phrase] markers wherever English has them', () => {
        // parseLinkedText() reads "[...]" pairs; a translation keeps the same number of them.
        const pairs = (text: string) => text.match(/\[[^[\]]+\]/g)?.length ?? 0;
        const brackets = (text: string) => text.split('[').length;
        const broken = Object.keys(english)
          .filter(key => english[key].includes('['))
          .filter(
            key =>
              pairs(messages[key] ?? '') !== pairs(english[key]) ||
              brackets(messages[key] ?? '') !== brackets(english[key]),
          );
        expect(broken).toEqual([]);
      });
    },
  );
});
