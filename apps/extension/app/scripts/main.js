import Vue from 'vue';
import Vuetify from 'vuetify'
import ElementUI from 'element-ui'
Vue.use(Vuetify)
Vue.use(ElementUI)

import App from './matricula/App.vue'
import Help from './matricula/Help.vue'
import Modal from './matricula/Modal.vue'
import MatriculaHelper from './helpers/matricula'

// global const change modal data
const modalData = {
  corte_id: null,
  dialog: false,
  disciplina: null,
}

const helpData = {
  dialog: false,
  professor: null,
  // use this to notify
  notifier: null
}

var app = new Vue({
  el: '#app',
  data:{
    name: 'ufabc-matricula-extension'
  },
  render: h => h(App)
})

new Vue({ 
  template: '<v-app v-show="$data.dialog"><Modal :value="$data"></Modal></v-app>',
  el: '#modal',
  data() {
    return modalData
  },
  components: { Modal }
})

new Vue({ 
  template: '<v-app v-show="$data.dialog"><Help :value="$data"></Help></v-app>',
  el: '#help',
  data() {
    return helpData
  },
  components: { Help }
})

// handler cortes
$('body').on('click', '.corte', async function (e) {
  var aluno_id = MatriculaHelper.getAlunoId()
  var target = $(e.target);
  var corte_id = target.parent().parent().attr('value');
  modalData.corte_id = corte_id
  modalData.dialog = true
})

// handler help
$('body').on('click', '.Help', function (e) {
  const teacherId = $(e.target).attr('data')
  const teacherName = $(e.target).attr('teacherName')
  helpData.professor = {
    id: teacherId,
    name: teacherName,
  },
  helpData.dialog = true
})