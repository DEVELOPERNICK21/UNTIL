import { syncLabel } from '../desktop/src/syncLabel';
import { EMPTY_LOCAL_STATE } from '../desktop/src/localState';

const NOW = 1_000_000_000_000;

describe('syncLabel', () => {
  it('says so when it has never synced', () => {
    expect(syncLabel(null, NOW)).toBe('Not synced yet');
  });

  it('says just now for the last few seconds, then counts up', () => {
    expect(syncLabel(NOW - 3_000, NOW)).toBe('Synced just now');
    expect(syncLabel(NOW - 42_000, NOW)).toBe('Synced 42s ago');
    expect(syncLabel(NOW - 5 * 60_000, NOW)).toBe('Synced 5 min ago');
    expect(syncLabel(NOW - 3 * 3_600_000, NOW)).toBe('Synced 3h ago');
    expect(syncLabel(NOW - 2 * 86_400_000, NOW)).toBe('Synced 2d ago');
  });

  it('never reads a clock that is slightly ahead as the future', () => {
    expect(syncLabel(NOW + 5_000, NOW)).toBe('Synced just now');
  });

  it('never uses a dash', () => {
    [null, NOW, NOW - 90_000, NOW - 7_200_000].forEach(at =>
      expect(syncLabel(at, NOW)).not.toMatch(/[—–]/),
    );
  });
});

describe('local state', () => {
  it('starts with no sync time', () => {
    expect(EMPTY_LOCAL_STATE.syncedAt).toBeNull();
  });
});
