import Vue from 'vue';
import Vuetify from 'vuetify'
import ElementUI from 'element-ui'
Vue.use(Vuetify)
Vue.use(ElementUI)

import App from './matricula/App.vue'

var app = new Vue({
  el: '#app',
  data:{
    name: 'ufabc-matricula-extension'
  },
  render: h => h(App)
})