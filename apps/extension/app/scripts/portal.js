import Vue from 'vue';
import Vuetify from 'vuetify'
 
Vue.use(Vuetify)

import App from './portal/App.vue';

var app = new Vue({
  el: '#app',
  data:{
    name: 'portal-matricula-extension'
  },
  render: h =>h(App)
})