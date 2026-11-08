import { MAX_ACTIVE_DEVICES } from '../src/features/account/domain/deviceLimit';
import {
  desktopSlotNote,
  deviceLimitBannerCopy,
  deviceRulesNote,
  formatAccountDeviceLabel,
  premiumDevicesBenefit,
  replaceDesktopBody,
} from '../src/features/account/domain/accountCopy';

describe('accountCopy', () => {
  it('says devices, not phones, in the sign-in benefit', () => {
    expect(premiumDevicesBenefit()).toBe(
      `Premium on up to ${MAX_ACTIVE_DEVICES} devices`,
    );
    expect(premiumDevicesBenefit()).not.toMatch(/phones/);
  });

  it('keeps the existing device-cap banner', () => {
    expect(deviceLimitBannerCopy()).toBe(
      `This account is already used on ${MAX_ACTIVE_DEVICES} devices. Remove one to unlock premium here.`,
    );
  });

  it('quotes the same cap everywhere it is mentioned', () => {
    expect(desktopSlotNote()).toContain(`${MAX_ACTIVE_DEVICES} devices`);
    expect(deviceRulesNote()).toMatch(/One Mac or Windows PC at a time/);
  });

  it('labels Mac and Windows instead of swallowing them as Android', () => {
    expect(
      formatAccountDeviceLabel({ id: 'aaaa1111', platform: 'macos', label: null }),
    ).toBe('Mac');
    expect(
      formatAccountDeviceLabel({ id: 'bbbb2222', platform: 'windows', label: null }),
    ).toBe('Windows');
    expect(
      formatAccountDeviceLabel({
        id: 'mac-1',
        platform: 'macos',
        label: 'Nick’s MacBook',
      }),
    ).toBe('Nick’s MacBook');
  });

  it('keeps phone fallbacks with the last 4 of the id', () => {
    expect(
      formatAccountDeviceLabel({ id: 'abcdxyz9', platform: 'ios', label: null }),
    ).toBe('iPhone · XYZ9');
    expect(
      formatAccountDeviceLabel({ id: 'abcd1234', platform: 'android', label: null }),
    ).toBe('Android phone · 1234');
  });

  it('builds the replace dialog body from label or platform', () => {
    expect(
      replaceDesktopBody({ label: 'Nick’s MacBook', platform: 'macos' }),
    ).toBe(
      'UNTIL is already signed in on Nick’s MacBook. Signing in here turns that one off.',
    );
    expect(replaceDesktopBody({ label: null, platform: 'macos' })).toBe(
      'UNTIL is already signed in on Mac. Signing in here turns that one off.',
    );
    expect(replaceDesktopBody({ label: '  ', platform: 'windows' })).toBe(
      'UNTIL is already signed in on Windows. Signing in here turns that one off.',
    );
    expect(replaceDesktopBody({ label: null, platform: 'ios' })).toBe(
      'UNTIL is already signed in on another computer. Signing in here turns that one off.',
    );
  });
});
