function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

export function randomToken(): string {
  return base64Url(randomBytes(32));
}

/** PKCE S256 challenge for Google. */
export async function pkceChallenge(verifier: string): Promise<string> {
  return base64Url(await sha256(verifier));
}

/** Apple wants the nonce as a hex SHA-256; Firebase checks it against the raw one. */
export async function sha256Hex(text: string): Promise<string> {
  return Array.from(await sha256(text), b => b.toString(16).padStart(2, '0')).join('');
}
