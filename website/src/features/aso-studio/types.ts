export type TemplateId = 'text-over-screen' | 'minimal-frame';

export type Ios69SizeId = '1290x2796' | '1320x2868' | '1260x2736';

export type PlatformTarget = 'ios-6.9' | 'android-phone';

export interface BrandColors {
  backgroundFrom: string;
  backgroundTo: string;
  headline: string;
  subtext: string;
  frame: string;
  bezel: string;
}

export interface TemplateOptions {
  showDeviceFrame: boolean;
  textPosition: 'top' | 'bottom';
  fontFamily: string;
  brandColors: BrandColors;
}

export interface Slide {
  id: string;
  /** Object URL for the uploaded screenshot */
  imageUrl: string;
  fileName: string;
  naturalWidth: number;
  naturalHeight: number;
  headline: string;
  subtext: string;
  aspectWarning: string | null;
}

export interface StoreCopy {
  iosAppName: string;
  iosSubtitle: string;
  iosPromotionalText: string;
  iosKeywords: string;
  iosDescription: string;
  androidTitle: string;
  androidShortDescription: string;
  androidFullDescription: string;
}

export interface StudioState {
  slides: Slide[];
  activeSlideId: string | null;
  templateId: TemplateId;
  ios69SizeId: Ios69SizeId;
  targets: PlatformTarget[];
  options: TemplateOptions;
  copy: StoreCopy;
  masterIconUrl: string | null;
  masterIconFileName: string | null;
}

export const DEFAULT_BRAND: BrandColors = {
  backgroundFrom: '#0e0e10',
  backgroundTo: '#1a1a1e',
  headline: '#ededed',
  subtext: '#9a9a9a',
  frame: '#1c1c1e',
  bezel: '#2a2a2a',
};

export const DEFAULT_OPTIONS: TemplateOptions = {
  showDeviceFrame: true,
  textPosition: 'top',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  brandColors: DEFAULT_BRAND,
};

export const DEFAULT_COPY: StoreCopy = {
  iosAppName: 'UNTIL',
  iosSubtitle: 'See your time left',
  iosPromotionalText: '',
  iosKeywords: '',
  iosDescription: '',
  androidTitle: 'Until: Days left',
  androidShortDescription: '',
  androidFullDescription: '',
};
