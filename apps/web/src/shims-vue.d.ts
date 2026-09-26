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
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
