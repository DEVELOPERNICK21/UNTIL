import { Linking, Platform } from 'react-native';
import type { IInAppReviewService } from '../domain/ports/IInAppReviewService';
import {
  APP_STORE_WRITE_REVIEW_URL,
  PLAY_STORE_LISTING_URL,
  PLAY_STORE_MARKET_URL,
} from '../../../config/storeUrls';

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
      try {
        await Linking.openURL(PLAY_STORE_MARKET_URL);
      } catch {
        await Linking.openURL(PLAY_STORE_LISTING_URL);
      }
      return;
    }
    // Only used when the in-app review box has nothing to show (iOS limits it to three a year),
    // so go straight to the review form instead of the top of the page.
    if (Platform.OS === 'ios' && APP_STORE_WRITE_REVIEW_URL) {
      await Linking.openURL(APP_STORE_WRITE_REVIEW_URL);
    }
  }
}
