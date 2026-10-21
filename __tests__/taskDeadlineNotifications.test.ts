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
  hasNotificationPermission: jest.fn(async () => true),
  requestNotificationPermission: jest.fn(async () => true),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(async () => 'task_deadline'),
    createTriggerNotification: jest.fn(async () => 'id'),
    displayNotification: jest.fn(async () => 'id'),
    cancelNotification: jest.fn(async () => undefined),
  },
  TriggerType: { TIMESTAMP: 0 },
  AndroidImportance: { DEFAULT: 3 },
}));

const NOW = new Date(2026, 9, 1, 14, 0, 0);

type Counts = { total: number; pending: number };
type Countdown = { id: string; title: string; date: string };

function load(counts: Counts = { total: 3, pending: 3 }) {
  jest.resetModules();
  require('../src/shared/persistence/mmkv').__reset();
  const service = require('../src/features/engagement/services/taskDeadlineNotifications');
  const notifee = require('@notifee/react-native').default;
  const permission = require('../src/shared/platform/notificationPermission');
  permission.hasNotificationPermission.mockReset();
  permission.hasNotificationPermission.mockResolvedValue(true);
  permission.requestNotificationPermission.mockReset();
  permission.requestNotificationPermission.mockResolvedValue(true);
  notifee.createChannel.mockReset();
  notifee.createChannel.mockResolvedValue('task_deadline');
  notifee.createTriggerNotification.mockReset();
  notifee.createTriggerNotification.mockResolvedValue('id');
  notifee.displayNotification.mockReset();
  notifee.displayNotification.mockResolvedValue('id');
  notifee.cancelNotification.mockReset();
  notifee.cancelNotification.mockResolvedValue(undefined);
  const state = { counts, countdowns: [] as Countdown[] };
  service.configureTaskDeadlineNotifications({
    getTaskCountsByDate: (keys: string[]) =>
      Object.fromEntries(keys.map(key => [key, state.counts])),
    getCountdowns: () => state.countdowns,
  });
  return { service, notifee, permission, state };
}

async function enableThenClear(
  service: {
    setTaskDeadlineNotificationsEnabled: (enabled: boolean) => Promise<void>;
  },
  notifee: {
    createChannel: { mockClear: () => void };
    createTriggerNotification: { mockClear: () => void };
    displayNotification: { mockClear: () => void };
    cancelNotification: { mockClear: () => void };
  }
) {
  await service.setTaskDeadlineNotificationsEnabled(true);
  notifee.createChannel.mockClear();
  notifee.createTriggerNotification.mockClear();
  notifee.displayNotification.mockClear();
  notifee.cancelNotification.mockClear();
}

async function waitUntil(predicate: () => boolean): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 1000) {
      throw new Error('timed out waiting');
    }
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

describe('syncTaskDeadlineNotifications', () => {
  it('schedules an 11 PM reminder for each day with pending tasks', async () => {
    const { service, notifee } = load();
    await enableThenClear(service, notifee);

    await service.syncTaskDeadlineNotifications(NOW);

    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(7);
    const [notification, trigger] =
      notifee.createTriggerNotification.mock.calls[0];
    expect(notification.id).toBe('taskdl-tasks-2026-10-01');
    expect(notification.body).toBe('3 tasks still open.');
    expect(trigger.timestamp).toBe(new Date(2026, 9, 1, 23, 0, 0).getTime());
  });

  it('cancels the previous batch before scheduling again', async () => {
    const { service, notifee } = load();
    await enableThenClear(service, notifee);

    await service.syncTaskDeadlineNotifications(NOW);
    notifee.cancelNotification.mockClear();

    await service.syncTaskDeadlineNotifications(NOW);
    expect(notifee.cancelNotification).toHaveBeenCalledTimes(7);
    expect(notifee.cancelNotification).toHaveBeenCalledWith(
      'taskdl-tasks-2026-10-01'
    );
  });

  it('schedules nothing when notification permission is missing', async () => {
    const { service, notifee, permission } = load();
    permission.hasNotificationPermission.mockResolvedValue(false);

    await service.setTaskDeadlineNotificationsEnabled(true);
    await service.syncTaskDeadlineNotifications(NOW);

    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('is off by default', () => {
    const { service } = load();
    expect(service.getTaskDeadlineNotificationsEnabled()).toBe(false);
  });

  it('cancels everything and stays quiet when disabled', async () => {
    const { service, notifee } = load();
    await enableThenClear(service, notifee);
    await service.syncTaskDeadlineNotifications(NOW);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(7);
    notifee.cancelNotification.mockClear();

    await service.setTaskDeadlineNotificationsEnabled(false);
    expect(notifee.cancelNotification).toHaveBeenCalledTimes(7);

    notifee.createTriggerNotification.mockClear();
    await service.syncTaskDeadlineNotifications(NOW);
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('asks for permission, including on iOS, when the toggle is turned on', async () => {
    const { service, permission } = load();
    await service.setTaskDeadlineNotificationsEnabled(false);

    await service.setTaskDeadlineNotificationsEnabled(true);

    expect(permission.requestNotificationPermission).toHaveBeenCalledWith(
      'settings_task_deadline',
      { allowIos: true }
    );
  });

  it('does not leave scheduled notifications if disabled during an in-flight sync', async () => {
    const { service, notifee } = load();
    await enableThenClear(service, notifee);

    let resolveChannel: (value: string) => void = () => {};
    const hangingChannel = new Promise<string>(resolve => {
      resolveChannel = resolve;
    });
    notifee.createChannel.mockImplementation(() => hangingChannel);

    const syncPromise = service.syncTaskDeadlineNotifications(NOW);
    await waitUntil(() => notifee.createChannel.mock.calls.length > 0);

    const disablePromise = service.setTaskDeadlineNotificationsEnabled(false);
    resolveChannel('task_deadline');
    await Promise.all([syncPromise, disablePromise]);

    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('schedules morning and evening reminders for a countdown due today', async () => {
    const morningNow = new Date(2026, 9, 1, 7, 0, 0);
    const { service, notifee, state } = load({ total: 0, pending: 0 });
    state.countdowns = [{ id: 'trip', title: 'Trip', date: '2026-10-01' }];
    await enableThenClear(service, notifee);

    await service.syncTaskDeadlineNotifications(morningNow);

    const ids = notifee.createTriggerNotification.mock.calls.map(
      (call: [{ id: string }]) => call[0].id
    );
    expect(ids).toEqual(
      expect.arrayContaining([
        'taskdl-dl-am-trip-2026-10-01',
        'taskdl-dl-pm-trip-2026-10-01',
      ])
    );
  });
});

describe('handleTaskDeadlineDataChanged', () => {
  it('shows one completion notification when the last pending task is done', async () => {
    const { service, notifee, state } = load({ total: 2, pending: 2 });
    await enableThenClear(service, notifee);
    await service.refreshTaskDeadlineNotifications(NOW);

    state.counts = { total: 2, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
    const arg = notifee.displayNotification.mock.calls[0][0];
    expect(arg.title).toBe('All done');
    expect(arg.body).toBe('2 of 2 tasks finished today.');
  });

  it('does not send the 11 PM reminder for a day that is fully done', async () => {
    const { service, notifee, state } = load({ total: 2, pending: 2 });
    await enableThenClear(service, notifee);
    await service.refreshTaskDeadlineNotifications(NOW);
    notifee.createTriggerNotification.mockClear();

    state.counts = { total: 2, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('notifies at most once per day', async () => {
    const { service, notifee, state } = load({ total: 2, pending: 2 });
    await enableThenClear(service, notifee);
    await service.refreshTaskDeadlineNotifications(NOW);

    state.counts = { total: 2, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    state.counts = { total: 3, pending: 1 };
    await service.handleTaskDeadlineDataChanged(NOW);
    state.counts = { total: 3, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
  });

  it('stays quiet when tasks are removed instead of completed', async () => {
    const { service, notifee, state } = load({ total: 1, pending: 1 });
    await enableThenClear(service, notifee);
    await service.refreshTaskDeadlineNotifications(NOW);

    state.counts = { total: 0, pending: 0 };
    await service.handleTaskDeadlineDataChanged(NOW);

    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it('does not fire on app open when everything is already done', async () => {
    const { service, notifee } = load({ total: 2, pending: 0 });
    await enableThenClear(service, notifee);

    await service.refreshTaskDeadlineNotifications(NOW);

    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });
});
