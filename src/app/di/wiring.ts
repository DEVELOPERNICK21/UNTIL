/**
 * Start-up wiring that hands the use cases to modules which must not import app/di.
 */

import { configureWidgetSync } from '../../features/widgets/data/WidgetSync';
import {
  configureRetentionNotifications,
  enableRetentionNotificationsWithPermission,
} from '../../features/engagement/services/retentionNotifications';
import { registerCheckInReminders } from '../../shared/platform/checkInReminders';
import {
  configureTaskDeadlineNotifications,
  queueTaskDeadlineSync,
} from '../../features/engagement/services/taskDeadlineNotifications';
import type { TaskDayCounts } from '../../features/engagement/domain/taskDeadlineCopy';
import { syncWidgetUseCase } from './widgets';
import { getCustomCountersUseCase } from './counters';
import { getCountdownsUseCase } from './countdowns';
import { getDailyTaskStatsUseCase, getStoredTasksForDayUseCase } from './tasks';
import { getAccessStateUseCase } from './premium';
import {
  countdownRepository,
  subscriptionRepository,
  taskRepository,
  timeRepository,
} from './repositories';

configureWidgetSync({
  syncWidgetUseCase,
  getCustomCountersUseCase,
  getCountdownsUseCase,
  getDailyTaskStatsUseCase,
  getAccessStateUseCase,
});

configureRetentionNotifications({
  getBirthDate: () => timeRepository.getUserProfile().birthDate,
  getTrialStartDate: () => subscriptionRepository.getTrialStartDate(),
});

registerCheckInReminders({
  enable: source => enableRetentionNotificationsWithPermission(source),
});

configureTaskDeadlineNotifications({
  getTaskCountsByDate: dateKeys => {
    const counts: Record<string, TaskDayCounts> = {};
    for (const dateKey of dateKeys) {
      const tasks = getStoredTasksForDayUseCase.execute(dateKey);
      counts[dateKey] = {
        total: tasks.length,
        pending: tasks.filter(task => !task.completed).length,
      };
    }
    return counts;
  },
  getCountdowns: () =>
    countdownRepository.getAll().map(({ id, title, date }) => ({
      id,
      title,
      date,
    })),
});
taskRepository.subscribe(queueTaskDeadlineSync);
countdownRepository.subscribe(queueTaskDeadlineSync);
