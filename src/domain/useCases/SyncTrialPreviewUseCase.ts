/**
 * SyncTrialPreviewUseCase — bind local preview start to server (anti-reset).
 * Local MMKV is a cache; server start is canonical when sync succeeds.
 */

import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import type { IDeviceIdProvider } from '../ports/IDeviceIdProvider';
import type { ITrialPreviewService } from '../ports/ITrialPreviewService';

export class SyncTrialPreviewUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly trialPreviewService: ITrialPreviewService,
    private readonly onTrialUpdated?: () => void
  ) {}

  async execute(now: number = Date.now()): Promise<void> {
    if (this.subscriptionRepository.getIsPremium()) return;

    const localStart = this.subscriptionRepository.getTrialStartDate();
    if (localStart == null) {
      this.subscriptionRepository.setTrialStartDate(now);
    }

    const deviceId = await this.deviceIdProvider.getDeviceId();
    const result = await this.trialPreviewService.sync(deviceId);
    if (!result.ok) return;

    /** Earliest start wins — prevents storage-clear from restarting preview. */
    const current = this.subscriptionRepository.getTrialStartDate() ?? now;
    const canonicalStart = Math.min(current, result.trialStartMs);
    if (canonicalStart !== current) {
      this.subscriptionRepository.setTrialStartDate(canonicalStart);
      this.onTrialUpdated?.();
    }
  }
}
