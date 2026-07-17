import { parseIncrementCounterUrl } from '../src/utils';

describe('Deep Link Validation - parseIncrementCounterUrl', () => {
  it('should successfully parse a valid deep link with a 10-character alphanumeric ID', () => {
    const url = 'until://increment-counter?id=abcde12345';
    expect(parseIncrementCounterUrl(url)).toBe('abcde12345');
  });

  it('should successfully parse and decode URL-encoded valid IDs', () => {
    // abcde12345 is URL-encoded as abcde12345
    const url = 'until://increment-counter?id=abcde12345';
    expect(parseIncrementCounterUrl(url)).toBe('abcde12345');
  });

  it('should successfully parse when other parameters are present', () => {
    const url1 = 'until://increment-counter?foo=bar&id=abcde12345';
    const url2 = 'until://increment-counter?id=abcde12345&baz=qux';
    const url3 = 'until://increment-counter?foo=bar&id=abcde12345&baz=qux';

    expect(parseIncrementCounterUrl(url1)).toBe('abcde12345');
    expect(parseIncrementCounterUrl(url2)).toBe('abcde12345');
    expect(parseIncrementCounterUrl(url3)).toBe('abcde12345');
  });

  it('should return null for invalid schemes or hosts', () => {
    expect(parseIncrementCounterUrl('https://increment-counter?id=abcde12345')).toBeNull();
    expect(parseIncrementCounterUrl('until://decrement-counter?id=abcde12345')).toBeNull();
    expect(parseIncrementCounterUrl('http://until://increment-counter?id=abcde12345')).toBeNull();
  });

  it('should return null if the id parameter is missing', () => {
    expect(parseIncrementCounterUrl('until://increment-counter')).toBeNull();
    expect(parseIncrementCounterUrl('until://increment-counter?foo=bar')).toBeNull();
  });

  it('should return null for IDs that do not meet the strict 10-character alphanumeric format', () => {
    // Too short
    expect(parseIncrementCounterUrl('until://increment-counter?id=abcde1234')).toBeNull();
    // Too long
    expect(parseIncrementCounterUrl('until://increment-counter?id=abcde123456')).toBeNull();
    // Special characters
    expect(parseIncrementCounterUrl('until://increment-counter?id=abcde1234!')).toBeNull();
    // Spaces or URL-encoded special characters/injection attempts
    expect(parseIncrementCounterUrl('until://increment-counter?id=abcde%201234')).toBeNull();
    expect(parseIncrementCounterUrl('until://increment-counter?id=../../etc/')).toBeNull();
  });

  it('should handle null, undefined, or empty/non-string inputs gracefully', () => {
    expect(parseIncrementCounterUrl(null)).toBeNull();
    expect(parseIncrementCounterUrl('')).toBeNull();
    expect(parseIncrementCounterUrl('   ')).toBeNull();
    // @ts-expect-error Testing runtime non-string input
    expect(parseIncrementCounterUrl(12345)).toBeNull();
  });
});
