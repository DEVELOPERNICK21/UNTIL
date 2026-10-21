/**
 * Start-up wiring that hands the use cases to modules which must not import app/di.
 */

import { configureWidgetSync } from '../../features/widgets/data/WidgetSync';
import {
  configureRetentionNotifications,
  enableRetentionNotificationsWithPermission,
} from '../../features/engagement/services/retentionNotifications';
import { registerCheckInReminders } from '../../shared/platform/checkInReminders';
import { syncWidgetUseCase } from './widgets';
import { getCustomCountersUseCase } from './counters';
import { getCountdownsUseCase } from './countdowns';
import { getDailyTaskStatsUseCase } from './tasks';
import { getAccessStateUseCase } from './premium';
import { subscriptionRepository, timeRepository } from './repositories';

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
