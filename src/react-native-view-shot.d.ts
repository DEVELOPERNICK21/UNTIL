declare module 'react-native-view-shot' {
  import * as React from 'react';

  export type CaptureFormat = 'png' | 'jpg' | 'webm' | 'raw';
  export type CaptureResult = 'tmpfile' | 'base64' | 'data-uri';

  export interface CaptureOptions {
    format?: CaptureFormat;
    quality?: number;
    result?: CaptureResult;
    fileName?: string;
  }

  export interface ViewShotProps {
    options?: CaptureOptions;
    children?: React.ReactNode;
  }

  export default class ViewShot extends React.Component<ViewShotProps> {
    capture(options?: CaptureOptions): Promise<string>;
  }
}

