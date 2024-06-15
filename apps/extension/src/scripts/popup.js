import $ from 'jquery';
import _ from 'lodash';

// chrome.storage.local.get(function (items) {
//   var users = [];
//   var exists = false;
//   if (items) {
//     for (var key in items) {
//       if (_.get(items[key], '[0].cp', null) != null) {
//         exists = true;
//         users.push(key);
//       };
//     }
//     if (exists) {
//       $( 'p' ).replaceWith( 'Cadastrado para:' + users);
//     }
//   }
// })

import Vue from 'vue';
import App from '../views/popup.vue';

var app = new Vue({
  el: '#app',
  data: {
    name: 'popup-ufabc-matricula-extension',
  },
  render: (h) => h(App),
});
