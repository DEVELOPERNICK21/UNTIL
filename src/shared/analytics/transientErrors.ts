/**
 * Errors that only mean "the phone has no usable connection right now". They are not bugs, so they
 * are kept as a log line rather than reported to Crashlytics, where hundreds of them buried the
 * errors that are.
 */

const TRANSIENT_PATTERNS: readonly RegExp[] = [
  /network request failed/i,
  /network error/i,
  /failed to fetch/i,
  /timed? ?out/i,
  /\[firestore\/(unavailable|deadline-exceeded)\]/i,
  /auth\/network-request-failed/i,
];

export function isTransientNetworkError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return TRANSIENT_PATTERNS.some(pattern => pattern.test(message));
}
