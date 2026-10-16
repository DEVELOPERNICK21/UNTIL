import { Alert, Linking } from 'react-native';
import { DESKTOP_DOWNLOAD_URLS } from '../config/monetization';
import { logAnalyticsEvent } from './analytics/analytics';

export type DesktopDownloadPlatform = 'mac' | 'windows' | 'page';

export function openDesktopDownload(platform: DesktopDownloadPlatform) {
  const url =
    platform === 'mac'
      ? DESKTOP_DOWNLOAD_URLS.mac
      : platform === 'windows'
        ? DESKTOP_DOWNLOAD_URLS.windows
        : DESKTOP_DOWNLOAD_URLS.page;
  void logAnalyticsEvent('desktop_download_opened', { platform });
  void Linking.openURL(url).catch(() => undefined);
}

/** Mac / Windows / Cancel. Opens the installer URL (finish download on that computer). */
export function promptDesktopDownload() {
  Alert.alert(
    'UNTIL on Mac & Windows',
    'Day % in your menu bar or tray. Same account as this phone. Opens the installer. Finish the download on that computer.',
    [
      { text: 'Mac', onPress: () => openDesktopDownload('mac') },
      { text: 'Windows', onPress: () => openDesktopDownload('windows') },
      { text: 'Cancel', style: 'cancel' },
    ],
  );
}
