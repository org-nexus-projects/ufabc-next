import Vue from 'vue';
import Vuetify from 'vuetify'
import ElementUI from 'element-ui'
Vue.use(Vuetify)
Vue.use(ElementUI)

import Matricula from './views/Matricula.vue'
import ReviewTeacher from './components/ReviewTeacher.vue'
import ReviewSubject from './components/ReviewSubject.vue'
import Modal from './components/Modal.vue'
import MatriculaHelper from './scripts/helpers/matricula'

// global const change modal data
const modalData = {
  corte_id: null,
  dialog: false,
  disciplina: null,
}

const teacherReviewData = {
  dialog: false,
  professor: null,
  // use this to notify
  notifier: null
}

const reviewSubjectData = {
  dialog: false,
  subject: null,
  // use this to notify
  notifier: null
}


var app = new Vue({
  el: '#app',
  data:{
    name: 'ufabc-matricula-extension'
  },
  render: h => h(Matricula)
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
  template: '<v-app v-show="$data.dialog"><ReviewTeacher :value="$data"></ReviewTeacher></v-app>',
  el: '#teacherReview',
  data() {
    return teacherReviewData
  },
  components: { ReviewTeacher }
})

new Vue({
  template: '<v-app v-show="$data.dialog"><ReviewSubject :value="$data"></ReviewSubject></v-app>',
  el: '#review-subject',
  data() {
    return reviewSubjectData
  },
  components: { ReviewSubject }
})


// handler cortes
$('body').on('click', '.corte', async function (e) {
  var aluno_id = MatriculaHelper.getAlunoId()
  var target = $(e.target);
  var corte_id = target.parent().parent().attr('value');
  modalData.corte_id = corte_id
  modalData.dialog = true
})

// handler teacherReview
$('body').on('click', '.ReviewTeacher', function (e) {
  const teacherId = $(e.target).attr('data')
  const teacherName = $(e.target).attr('teacherName')
  teacherReviewData.professor = {
    id: teacherId,
    name: teacherName,
  }

  teacherReviewData.dialog = true
})

// handler subject click
$('body').on('click', 'span.sa, span.sbc', function (e) {
  const subjectId = $(e.target).attr('subjectId')
  reviewSubjectData.subject = {
    id: subjectId,
  }
  reviewSubjectData.dialog = true
})
