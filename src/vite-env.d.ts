/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_API_URL?: string;
  readonly VITE_WHATSAPP_API_TOKEN?: string;
  readonly VITE_WHATSAPP_INSTANCE?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
