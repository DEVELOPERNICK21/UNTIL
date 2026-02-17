/**
 * Platform-agnostic facade for native bridges
 */

import { NativeModules, Platform } from 'react-native';

// Placeholder - native module will be implemented in Phase 3
const LiveActivityModule =
  NativeModules.LiveActivity ?? NativeModules.UNTILLiveActivity;

export interface PlatformBridge {
  startActivity?(state: object): Promise<void>;
  updateActivity?(state: object): Promise<void>;
  endActivity?(): Promise<void>;
}

export const platformBridge: PlatformBridge = {
  ...(LiveActivityModule ?? {}),
};

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
