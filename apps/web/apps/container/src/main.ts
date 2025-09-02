import 'vuetify/styles';
import 'element-plus/dist/index.css';
import '@mdi/font/css/materialdesignicons.css';

import { QueryClient } from '@tanstack/query-core';
import {
  QueryClient as QueryClientVue,
  VueQueryPlugin,
} from '@tanstack/vue-query';
import elementPlus, { ElMessage } from 'element-plus';
import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';
import annotationsInit from 'highcharts/modules/annotations';
import HighchartsVue from 'highcharts-vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import App from './App.vue';
import { eventTracker } from './helpers/EventTracker';
import client from './queryClient';
import router from './router';
import { theme } from './theme';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

accessibility(Highcharts);
annotationsInit(Highcharts);

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'theme',
    themes: {
      theme,
    },
  },
});

const queryClient = new QueryClientVue({
  queryCache: client.getQueryCache(),
  defaultOptions: client.getDefaultOptions(),
});

interface Device {
  cordova: string;
  model: string;
  platform: string;
  uuid: string;
  version: string;
}

declare global {
  interface Window {
    Toaster: typeof ElMessage;
    device: Device;
    queryClient: QueryClient;
  }
}

eventTracker.init();

createApp(App)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .use(elementPlus)
  .use(VueQueryPlugin, {
    queryClient,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .use(HighchartsVue as any)
  .mount('#app');
