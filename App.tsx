import { initI18n } from './src/shared/i18n';
import { App } from './src/app/App';
import { startNotificationLanguageSync } from './src/app/notificationLanguageSync';

// Pick the saved or phone language before the first screen renders.
initI18n();
startNotificationLanguageSync();

export default () => <App />;
