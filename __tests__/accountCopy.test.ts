import {
  DEVICE_LIMIT_BANNER_COPY,
  PREMIUM_DEVICES_BENEFIT,
  formatAccountDeviceLabel,
  replaceDesktopBody,
} from '../src/core/account/accountCopy';

describe('accountCopy', () => {
  it('says devices, not phones, in the sign-in benefit', () => {
    expect(PREMIUM_DEVICES_BENEFIT).toBe('Premium on up to 3 devices');
    expect(PREMIUM_DEVICES_BENEFIT).not.toMatch(/phones/);
  });

  it('keeps the existing device-cap banner', () => {
    expect(DEVICE_LIMIT_BANNER_COPY).toBe(
      'This account is already used on 3 devices. Remove one to unlock premium here.',
    );
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
