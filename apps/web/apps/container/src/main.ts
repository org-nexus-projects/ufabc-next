import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import {
  VueQueryPlugin,
  QueryClient as QueryClientVue,
} from '@tanstack/vue-query';
import client from './queryClient';

import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';

import elementPlus, { ElMessage } from 'element-plus';
import 'element-plus/dist/index.css';

import '@mdi/font/css/materialdesignicons.css';

import HighchartsVue from 'highcharts-vue';
import Highcharts from 'highcharts';
import annotationsInit from 'highcharts/modules/annotations';
import accessibility from 'highcharts/modules/accessibility';
import { QueryClient } from '@tanstack/query-core';
import { theme } from './theme';

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

createApp(App)
  .use(router)
  .use(vuetify)
  .use(elementPlus)
  .use(VueQueryPlugin, {
    queryClient,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .use(HighchartsVue as any)
  .mount('#app');
