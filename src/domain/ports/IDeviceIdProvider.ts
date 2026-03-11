/**
 * IDeviceIdProvider - Port for stable device identifier
 * Used for one-device license binding.
 */

export interface IDeviceIdProvider {
  getDeviceId(): Promise<string>;
}
