import { Linking, Platform } from 'react-native';
import type { IInAppReviewService } from '../../domain/ports/IInAppReviewService';
import { IOS_APP_STORE_ID, PLAY_STORE_LISTING_URL } from '../../config/storeUrls';

type StoreReviewModule = {
  requestReview: () => void | Promise<void>;
};

function loadStoreReview(): StoreReviewModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-store-review') as
      | StoreReviewModule
      | { default: StoreReviewModule };
    const api = 'requestReview' in mod ? mod : (mod as { default: StoreReviewModule }).default;
    if (!api || typeof api.requestReview !== 'function') return null;
    return api;
  } catch {
    return null;
  }
}

export class StoreReviewAdapter implements IInAppReviewService {
  private readonly native = loadStoreReview();

  isAvailable(): boolean {
    return this.native != null;
  }

  async requestReview(): Promise<void> {
    if (!this.native) {
      throw new Error('StoreReview native module unavailable');
    }
    await Promise.resolve(this.native.requestReview());
  }

  async openStoreListing(): Promise<void> {
    if (Platform.OS === 'android') {
      await Linking.openURL(PLAY_STORE_LISTING_URL);
      return;
    }
    if (Platform.OS === 'ios' && IOS_APP_STORE_ID.trim()) {
      await Linking.openURL(
        `https://apps.apple.com/app/id${IOS_APP_STORE_ID.trim()}`
      );
    }
  }
}
