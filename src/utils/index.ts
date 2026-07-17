/**
 * Generic helpers ONLY - no time logic
 */

/**
 * Safely parses and validates a deep link URL for custom counter increments.
 * Enforces strict scheme and host validation: must start with "until://increment-counter"
 * and extracts the "id" query parameter, which must be a 10-character alphanumeric string.
 *
 * @param url The deep link URL to parse
 * @returns The validated and decoded counter ID, or null if the URL is invalid or insecure
 */
export function parseIncrementCounterUrl(url: string | null): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const normalized = url.trim();

  // Enforce secure custom scheme and host to prevent arbitrary URLs
  if (!normalized.startsWith('until://increment-counter')) {
    return null;
  }

  const queryIndex = normalized.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }

  const queryString = normalized.slice(queryIndex + 1);
  const params = queryString.split('&');
  let rawId: string | null = null;

  for (const param of params) {
    const [key, val] = param.split('=');
    if (key === 'id') {
      rawId = val;
      break;
    }
  }

  if (!rawId) {
    return null;
  }

  try {
    const decodedId = decodeURIComponent(rawId);
    // Strict alphanumeric format verification (10 characters)
    const idRegex = /^[a-zA-Z0-9]{10}$/;
    if (!idRegex.test(decodedId)) {
      return null;
    }
    return decodedId;
  } catch {
    return null;
  }
}
