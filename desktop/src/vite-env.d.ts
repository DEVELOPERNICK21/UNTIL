/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_DESKTOP_CLIENT_ID?: string;
  readonly VITE_GOOGLE_DESKTOP_CLIENT_SECRET?: string;
  readonly VITE_APPLE_SIGN_IN_PAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
