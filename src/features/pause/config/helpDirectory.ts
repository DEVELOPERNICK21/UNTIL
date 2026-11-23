/**
 * Where "talk to someone" goes: a directory of helplines that finds the right one for the country the
 * person is in (findahelpline.com, run by ThroughLine). We do not list phone numbers ourselves: they
 * differ by country, change, and a wrong one here would be worse than none.
 *
 * Check this address, and that the directory still serves the countries your users are in, before each
 * release.
 */
export const HELP_DIRECTORY_URL = 'https://findahelpline.com/';
