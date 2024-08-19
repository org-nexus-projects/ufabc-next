import Vue from 'vue';
import Vuetify from 'vuetify';
import ElementUI from 'element-ui';
Vue.use(Vuetify);
Vue.use(ElementUI);

import Matricula from './views/Matricula.vue';
import ReviewTeacher from './components/ReviewTeacher.vue';
import ReviewSubject from './components/ReviewSubject.vue';
import Modal from './components/Modal.vue';

// global const change modal data
const modalData = {
  corte_id: null,
  dialog: false,
  disciplina: null,
};

const teacherReviewData = {
  dialog: false,
  professor: null,
  // use this to notify
  notifier: null,
};

const reviewSubjectData = {
  dialog: false,
  subject: null,
  // use this to notify
  notifier: null,
};

new Vue({
  el: '#app',
  data: {
    name: 'ufabc-matricula-extension',
  },
  render: (h) => h(Matricula),
});

new Vue({
  template:
    '<v-app v-show="$data.dialog"><Modal :value="$data"></Modal></v-app>',
  el: '#modal',
  data() {
    return modalData;
  },
  components: { Modal },
});

new Vue({
  template:
    '<v-app v-show="$data.dialog"><ReviewTeacher :value="$data"></ReviewTeacher></v-app>',
  el: '#teacherReview',
  data() {
    return teacherReviewData;
  },
  components: { ReviewTeacher },
});

new Vue({
  template: `<v-app v-show="$data.dialog">
      <ReviewSubject :subjectInfo="$data"></ReviewSubject>
    </v-app>
    `,
  el: '#review-subject',
  data() {
    return reviewSubjectData;
  },
  components: { ReviewSubject },
});

// handler cortes
$('body').on('click', '.corte', async (e) => {
  const target = $(e.target);
  const corte_id = target.parent().parent().attr('value');
  modalData.corte_id = corte_id;
  modalData.dialog = true;
});

// handler teacherReview
$('body').on('click', '.ReviewTeacher', (e) => {
  const teacherId = $(e.target).attr('data');
  const teacherName = $(e.target).attr('teacherName');
  teacherReviewData.professor = {
    id: teacherId,
    name: teacherName,
  };

  teacherReviewData.dialog = true;
});

// handler subject click
$('body').on('click', 'span.sa, span.sbc', (e) => {
  const subjectId = $(e.target).attr('subjectId');
  reviewSubjectData.subject = {
    id: subjectId,
  };
  reviewSubjectData.dialog = true;
});
