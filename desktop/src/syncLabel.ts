/** How the panel says when it last heard from your account: "Synced just now", "Synced 5 min ago". */
export function syncLabel(syncedAt: number | null, nowMs: number): string {
  if (syncedAt == null) return 'Not synced yet';
  const seconds = Math.max(0, Math.floor((nowMs - syncedAt) / 1000));
  if (seconds < 10) return 'Synced just now';
  if (seconds < 60) return `Synced ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Synced ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  return `Synced ${Math.floor(hours / 24)}d ago`;
}
