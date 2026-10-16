/**
 * Pure check for premium bought on this device: a store purchase (Play type
 * recorded in MMKV) or an activated web license.
 *
 * Cloud entitlement never counts as proof. It is mirrored down only while the
 * account still allows premium on this device, so sign-out and account changes
 * must be able to drop it again.
 */

export interface LocalPurchaseProofInput {
  purchaseType: string | null;
  licenseKey: string | null;
}

export function hasLocalPurchaseProof(input: LocalPurchaseProofInput): boolean {
  if (input.purchaseType != null) return true;
  return (input.licenseKey ?? '').trim().length > 0;
}
