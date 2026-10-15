/**
 * IPurchasesLink - What the account use cases need from the purchases side, declared here so the
 * account feature does not depend on premium. Premium's repository and use cases satisfy these
 * structurally (app/di passes them in).
 */

import type { PurchaseType } from '../../../../shared/types';

/** The premium state kept on this device, as far as account sign-in and sign-out care. */
export interface ILocalEntitlementStore {
  getIsPremium(): boolean;
  setIsPremium(value: boolean): void;
  getPurchaseType(): PurchaseType | null;
  getLicenseKey(): string | null;
}

/** Tie the store's customer record to the signed-in account. */
export interface IPurchasesIdentify {
  execute(uid: string): Promise<unknown>;
}

/** Drop the store's customer record when the account goes away. */
export interface IPurchasesReset {
  execute(): Promise<unknown>;
}
