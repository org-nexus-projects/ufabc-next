import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

import Portal from './views/Portal.vue';

new Vue({
  el: '#app',
  data: {
    name: 'portal-matricula-extension',
  },
  render: (h) => h(Portal),
});
