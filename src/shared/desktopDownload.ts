import { Alert, Linking } from 'react-native';
import { DESKTOP_DOWNLOAD_URLS } from '../config/monetization';
import { logAnalyticsEvent } from './analytics/analytics';
import { t } from './i18n/translate';

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
  Alert.alert(t('system.desktop.title'), t('system.desktop.message'), [
    { text: t('system.desktop.mac'), onPress: () => openDesktopDownload('mac') },
    {
      text: t('system.desktop.windows'),
      onPress: () => openDesktopDownload('windows'),
    },
    { text: t('common.cancel'), style: 'cancel' },
  ]);
}
