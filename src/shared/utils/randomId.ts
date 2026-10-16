/** Short random id for locally created records (tasks, goals, countdowns, counters). */
export function randomId(): string {
  return Math.random().toString(36).slice(2, 12);
}
