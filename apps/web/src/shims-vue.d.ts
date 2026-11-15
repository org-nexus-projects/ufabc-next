declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<object, object, any>;
  export default component;
}

declare module 'vuetify/styles' {
  const styles: undefined;
  export default styles;
}

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'local' | 'staging' | 'production';
  readonly VITE_APP_BASE_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_PARSER_API_BASE_URL: string;
  readonly VITE_MIXPANEL_TOKEN?: string;
  readonly VITE_AXIOM_DATASET?: string;
  readonly VITE_AXIOM_TOKEN?: string;
  readonly VITE_LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
