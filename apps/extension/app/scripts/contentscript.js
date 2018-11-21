// https://crx.dam.io/ext/gphjopenfpnlnffmhhhhdiecgdcopmhk.html
import $ from 'jquery'
import _ from 'lodash'

import toastr from 'toastr'
import Utils from './helpers/utils'
import Api from './helpers/api'
import Axios from 'axios'
import Mustache from 'mustache'
import MatriculaHelper from './helpers/matricula'
import Identifier from './helpers/parse/identifier'

import Vue from 'vue';
import Vuetify from 'vuetify'
import ElementUI from 'element-ui';
Vue.use(Vuetify)
Vue.use(ElementUI)
import Modal from './matricula/Modal.vue'
import Help from './matricula/Help.vue'

// CSS imports
import "element-ui/lib/theme-chalk/index.css"
// import "vuetify/dist/vuetify.min.css"

let matricula_url

if (process.env.NODE_ENV == 'production') {
  matricula_url = [
    'matricula.ufabc.edu.br/matricula',
  ]
} else {
   matricula_url = [
    'ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot',
    'ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot/backup.html',
    'locahost:8011/snapshot',
    'locahost:8011/snapshot/backup.html'
  ]
}

chrome.storage.local.get('ufabc-extension-last', MatriculaHelper.updateProfessors)

// global const change modal data
const modalData = {
  corte_id: 4040,
  dialog: false,
  disciplina: null,
}

const helpData = {
  dialog: false,
  professor: null,
  // use this to notify
  notifier: null
}

// quando carrega qualquer pagina fazemos isto
window.addEventListener('load', async function() {
  const currentUrl = document.location.href;

  require('./portal/portal')

  if(matricula_url.some(url => currentUrl.indexOf(url) != -1)) {
    // this is the main vue app
    // i.e, where all the filters live
    const anchor = document.createElement('div')
    anchor.setAttribute('id', 'app')
    $('#meio').prepend(anchor)

    //inject styles
    Utils.injectStyle('styles/main.css')

    //inject face
    Utils.injectScript('scripts/helpers/face.js')

    // manda as informacoes para o servidor
    MatriculaHelper.sendAlunoData()
    
    // load vue app modal
    const modal = document.createElement('div')
    modal.setAttribute('id', 'modal')
    modal.setAttribute('data-app', true);
    document.body.append(modal)
    new Vue({ 
      template: '<v-app v-show="$data.dialog"><Modal :value="$data"></Modal></v-app>',
      el: '#modal',
      data() {
        return modalData
      },
      components: { Modal }
    })

    // load vue app help
    const help = document.createElement('div')
    help.setAttribute('id', 'help')
    help.setAttribute('data-app', true);
    document.body.append(help)
    new Vue({ 
      template: '<v-app v-show="$data.dialog"><Help :value="$data"></Help></v-app>',
      el: '#help',
      data() {
        return helpData
      },
      components: { Help }
    })

    // inject Vue app
    Utils.injectScript('scripts/main.js')

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
  }
})