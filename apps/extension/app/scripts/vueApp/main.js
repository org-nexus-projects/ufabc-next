import Vue from 'vue'
import App from '../../component/App.vue'

const anchor = document.createElement('div')
anchor.setAttribute('class', 'opa')

new Vue({
  el: anchor,
  template: '<App></App>',
  components: { App },
});

document.body.append(anchor);