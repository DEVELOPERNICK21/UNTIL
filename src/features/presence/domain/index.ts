/**
 * Pure public API of the presence feature, for the domain and data layers of other
 * features. Nothing here may import React, native modules or app/di, so importing it never loads
 * screens or hooks. Add an export deliberately when another feature's domain needs it.
 */

export { presenceStreakDots } from './dayWidgetAppeal';
export type { IPresenceRepository } from './ports/IPresenceRepository';
export { localDateKey } from './presenceStreak';
export type { RecordPresenceUseCase } from './useCases/RecordPresenceUseCase';
