// A module, so its helpers do not collide with other test files' globals under tsc.
export {};

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

jest.mock('../src/shared/persistence/mmkv', () => {
  const store = new Map<string, string>();
  return {
    getString: (key: string) => store.get(key),
    setString: (key: string, value: string) => {
      store.set(key, value);
    },
    __reset: () => store.clear(),
  };
});
jest.mock('../src/shared/platform/notificationPermission', () => ({
  requestNotificationPermission: jest.fn(async () => true),
}));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(async () => 'trial'),
    createTriggerNotification: jest.fn(async () => 'id'),
    getTriggerNotifications: jest.fn(async () => []),
    cancelNotification: jest.fn(async () => undefined),
  },
  TriggerType: { TIMESTAMP: 0 },
}));

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function load() {
  jest.resetModules();
  require('../src/shared/persistence/mmkv').__reset();
  const service = require('../src/features/premium/services/trialReminders');
  const notifee = require('@notifee/react-native').default;
  for (const fn of Object.values(notifee) as jest.Mock[]) fn.mockClear();
  // resetModules gave the service its own copy of the translator, so switch language on that one.
  const { setLanguage } = require('../src/shared/i18n/translate');
  return {
    service,
    notifee,
    setLanguage: setLanguage as (code: string) => void,
  };
}

describe('trial reminders and the language', () => {
  const start = Date.now() - 0.5 * MS_PER_DAY;

  it('schedules once, with ids and a translated title', async () => {
    const { service, notifee, setLanguage } = load();
    setLanguage('de');
    await service.scheduleTrialLocalNotifications(start);
    await service.scheduleTrialLocalNotifications(start);
    const calls = notifee.createTriggerNotification.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.length).toBeLessThanOrEqual(3);
    expect(calls[0][0].title).toBe('Kostenlose UNTIL-Vorschau');
    expect(calls[0][0].id).toMatch(/^trial-reminder-day-\d+$/);
    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'trial',
        name: 'Erinnerungen zur Vorschau',
      }),
    );
  });

  it('rewrite replaces pending reminders in the new language, and only if some were scheduled', async () => {
    const { service, notifee, setLanguage } = load();
    await service.scheduleTrialLocalNotifications(start, { rewrite: true });
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();

    await service.scheduleTrialLocalNotifications(start);
    const first = notifee.createTriggerNotification.mock.calls.length;
    notifee.createTriggerNotification.mockClear();
    notifee.getTriggerNotifications.mockResolvedValueOnce([
      { notification: { id: 'old-1', android: { channelId: 'trial' } } },
      { notification: { id: 'other', android: { channelId: 'retention' } } },
    ]);

    setLanguage('fr');
    await service.scheduleTrialLocalNotifications(start, { rewrite: true });
    expect(notifee.cancelNotification).toHaveBeenCalledTimes(1);
    expect(notifee.cancelNotification).toHaveBeenCalledWith('old-1');
    expect(notifee.createTriggerNotification.mock.calls.length).toBe(first);
    expect(notifee.createTriggerNotification.mock.calls[0][0].title).toBe(
      'Aperçu gratuit d’UNTIL',
    );
  });
});
