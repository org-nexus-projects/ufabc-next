import $ from 'jquery'

chrome.storage.local.get(function (items) {
  var users = [];
  var exists = false;
  if (items) {
    for (var key in items) {
      if (items[key][0].cp != null) {
        exists = true;
        users.push(key);
      };
    }
    if (exists) {
      $( 'p' ).replaceWith( 'Cadastrado para:' + users);
    }
  }
})

import Vue from 'vue';
import App from '../component/App.vue';

var app=new Vue({
  el:'#app',
  data:{
    name:'vue-chrome-extension'
  },
  render: h =>h(App)
})