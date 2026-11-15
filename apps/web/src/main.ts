import 'vuetify/styles';
import 'element-plus/dist/index.css';
import '@mdi/font/css/materialdesignicons.css';
import {
  QueryClient as QueryClientVue,
  VueQueryPlugin,
} from '@tanstack/vue-query';
import elementPlus from 'element-plus';
import Highcharts from 'highcharts';
import HighchartsVue from 'highcharts-vue';
import accessibility from 'highcharts/modules/accessibility';
import annotationsInit from 'highcharts/modules/annotations';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VFileUpload } from 'vuetify/labs/VFileUpload';

import App from './App.vue';
import { applyChartsTheme } from './config/highcharts';
import { darkTheme, lightTheme } from './config/theme';
import { eventTracker } from './helpers/EventTracker';
import client from './queryClient';
import router from './router';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

accessibility(Highcharts);
annotationsInit(Highcharts);

const savedTheme = localStorage.getItem('darkMode');
const defaultTheme = savedTheme === 'true' ? 'dark' : 'light';

// Set initial Highcharts theme class
document.body.classList.add(
  defaultTheme === 'dark' ? 'highcharts-dark' : 'highcharts-light'
);
applyChartsTheme();

const vuetify = createVuetify({
  components: {
    ...components,
    VFileUpload,
  },
  directives,
  theme: {
    defaultTheme,
    themes: {
      dark: darkTheme,
      light: lightTheme,
    },
  },
});

const queryClient = new QueryClientVue({
  defaultOptions: client.getDefaultOptions(),
  queryCache: client.getQueryCache(),
});

eventTracker.init();

createApp(App)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .use(elementPlus)
  .use(VueQueryPlugin, {
    queryClient,
  })
  // oxlint-disable-next-line typescript/no-explicit-any, typescript/no-unsafe-argument, typescript/no-unsafe-type-assertion -- highcharts-vue only ships Vue 2 typings
  .use(HighchartsVue as any)
  .mount('#app');
