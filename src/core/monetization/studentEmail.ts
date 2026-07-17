/**
 * Soft student-email eligibility (honor-system .edu / .ac domains).
 * Not a third-party SheerID check — gates the student SKU purchase CTA.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeStudentEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEligibleStudentEmail(email: string): boolean {
  const normalized = normalizeStudentEmail(email);
  if (!EMAIL_RE.test(normalized)) return false;

  const domain = normalized.split('@')[1] ?? '';
  if (!domain) return false;

  if (domain.endsWith('.edu')) return true;
  if (domain.includes('.edu.')) return true;
  if (domain.endsWith('.edu.in')) return true;
  if (/\.ac\.[a-z]{2,}$/i.test(domain)) return true;

  return false;
}
