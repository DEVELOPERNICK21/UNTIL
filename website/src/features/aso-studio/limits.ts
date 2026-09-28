export interface CharLimit {
  key: keyof import('./types').StoreCopy;
  label: string;
  limit: number;
  platform: 'ios' | 'android';
}

export const COPY_LIMITS: CharLimit[] = [
  { key: 'iosAppName', label: 'iOS name', limit: 30, platform: 'ios' },
  { key: 'iosSubtitle', label: 'iOS subtitle', limit: 30, platform: 'ios' },
  {
    key: 'iosPromotionalText',
    label: 'iOS promotional text',
    limit: 170,
    platform: 'ios',
  },
  { key: 'iosKeywords', label: 'iOS keywords', limit: 100, platform: 'ios' },
  {
    key: 'iosDescription',
    label: 'iOS description',
    limit: 4000,
    platform: 'ios',
  },
  { key: 'androidTitle', label: 'Android title', limit: 30, platform: 'android' },
  {
    key: 'androidShortDescription',
    label: 'Android short description',
    limit: 80,
    platform: 'android',
  },
  {
    key: 'androidFullDescription',
    label: 'Android full description',
    limit: 4000,
    platform: 'android',
  },
];

export function isCopyOverLimit(
  copy: import('./types').StoreCopy,
): boolean {
  return COPY_LIMITS.some((field) => copy[field.key].length > field.limit);
}
