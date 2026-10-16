/**
 * Port: provide current app version and optional build number.
 * Implemented by infrastructure (native or package.json fallback).
 */

export interface IAppVersionProvider {
  getVersion(): string;
  getBuildNumber(): string | null;
}
