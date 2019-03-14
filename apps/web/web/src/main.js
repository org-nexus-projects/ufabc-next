import Vue from 'vue'
import App from './App.vue'
import Vuetify from 'vuetify/lib'
import 'element-ui/lib/theme-chalk/index.css'
import 'vuetify/src/stylus/app.styl'
import '@mdi/font/css/materialdesignicons.css'
import router from '@/router'
import Colors from '@/styles/Colors.css'
import Text from '@/styles/Text.css'
import General from '@/styles/General.css'
import VuetifyCSS from '@/styles/Vuetify.css'
// import ElementCSS from '@/styles/Element.css'
import Auth from '@/services/Auth'
import Axios from 'axios'
import Environment from '@/environment'

Vue.use(Vuetify)

import VCharts from 'v-charts'
Vue.use(VCharts)

import VueTheMask from 'vue-the-mask'
Vue.use(VueTheMask)

import VeeValidate, {Validator} from 'vee-validate'
Vue.use(VeeValidate);

import VeeLocale_pt_BR from 'vee-validate/dist/locale/pt_BR'
Validator.localize('pt_BR', VeeLocale_pt_BR)

import Element from 'element-ui'
Vue.use(Element)

Vue.config.productionTip = false

Axios.interceptors.response.use(null, function (error) {
  const status = error.response && error.response.status
  if (status === 401) {
    Auth.logOut()
  }

  return Promise.reject(error);
})

Axios.interceptors.request.use(function (config) {
  let isBase = config.baseURL == Environment.API_URL
  if (isBase && config.url.startsWith('http')) {
    return config;
  }

  if (Auth.token) {
    // config.headers['Authorization'] = 'Bearer ' + Auth.token
  }

  return config;
})

Axios.defaults.baseURL = Environment.API_URL

window.Axios = Axios
window.Auth = Auth

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')