import toastr from 'toastr'
import $ from 'jquery'
import _ from 'lodash'
import Utils from '../helpers/utils'
import { NextAPI } from '../../services/NextAPI'
import Axios from 'axios'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"
const loading = require('./loading.svg')
const errorSVG = require('./error.svg')
const logoWhite = require('./logo-white.svg')

const nextApi = NextAPI();

const toast = new Toastify({
  text: `
    <div class='toast-loading-text' style='width: 250px'>
      <img src=${logoWhite} width="120" style="margin-bottom: 8px" />
      <p style="padding-bottom: 8px;">Atualizando suas informações...</p>\n\n
      <b>NÃO SAIA DESSA PÁGINA,</b>
      <p>apenas aguarde, no máx. 5 min 🙏</p>
    </div>`,
  duration: -1,
  close: false,
  gravity: "bottom",
  position: "right",
  className: "toast-loading",
  escapeMarkup: false,
  avatar: loading,
  style: {
    background: "linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));",
  },
});

if (isIndexPortalAluno()) {
  const anchor = document.createElement('div')
  anchor.setAttribute('id', 'app')
  document.body.append(anchor)
  Utils.injectScript('scripts/portal.js')

  Utils.injectStyle('styles/portal.css')
  toastr.info("Clique em <a href='https://aluno.ufabc.edu.br/fichas_individuais' style='color: #FFF !important;'>Ficha Individual</a> para atualizar suas informações!");
}  else if (isFichasIndividuaisPath()) {
  Utils.injectStyle('styles/portal.css');

  toast.showToast();

  iterateTabelaCursosAndSaveToLocalStorage();
} else if (isFichaIndividualPath()) {
  Utils.injectStyle('styles/portal.css');
};

function isIndexPortalAluno () {
  return document.location.href
    .indexOf('aluno.ufabc.edu.br/dados_pessoais') !== -1;
}

function isFichasIndividuaisPath () {
  return document.location.href
    .indexOf('aluno.ufabc.edu.br/fichas_individuais') !== -1;
}

function isFichaIndividualPath () {
  return document.location.href
    .indexOf('aluno.ufabc.edu.br/ficha_individual') !== -1;
}

function iterateTabelaCursosAndSaveToLocalStorage () {
  var tabelaCursos = $('tbody').children().slice(1);
  let count = 0

  tabelaCursos.each(async function () {
    var linhaCurso = $(this).children();

    var nomeDoCurso = $(linhaCurso[0]).children('a').text()
    var fichaAlunoUrl = $(linhaCurso[1]).children('a').attr('href');
    var anoDaGrade = $(linhaCurso[2]).text()

    const curso = await getFichaAluno(fichaAlunoUrl, nomeDoCurso, anoDaGrade)
    if(count == 0) toast.hideToast()
    count++

    if(!curso) return

    curso.curso = linhaCurso[0].innerText.replace("Novo", '');
    curso.turno = linhaCurso[3].innerText;

    await saveToLocalStorage(curso);

    await saveStudentsToLocalStorage(curso);
  })
}

async function getFichaAluno(fichaAlunoUrl, nomeDoCurso, anoDaGrade) {
  try {
    var curso = {};
    var ficha_url = fichaAlunoUrl.replace('.json', '');

    const ficha = await Axios.get('https://aluno.ufabc.edu.br' + ficha_url, {
      timeout: 60 * 1 * 1000 // 1 minute
    })
    const ficha_obj = $($.parseHTML(ficha.data))
    const info = ficha_obj.find('.coeficientes tbody tr td');

    const ra = /.*?(\d+).*/g.exec(ficha_obj.find("#page").children('p')[2].innerText)[1] || 'some ra';

    const storageRA = 'ufabc-extension-ra-' + getEmailAluno()
    await Utils.storage.setItem(storageRA, ra)

    const jsonFicha = await Axios.get('https://aluno.ufabc.edu.br' + fichaAlunoUrl, {
      timeout: 60 * 1 * 1000 // 1 minute
    })

    const disciplinasCategory = ficha_obj.find('.quantidades:last-child tbody tr td');

    // free
    const totalCreditsCoursedFree = toNumber(disciplinasCategory[2])
    const totalPercentageCoursedFree = toNumber(disciplinasCategory[3])
    const totalCreditsFree = Math.round((totalCreditsCoursedFree * 100) / totalPercentageCoursedFree)

    // mandatory
    const totalCreditsCoursedMandatory = toNumber(disciplinasCategory[7])
    const totalPercentageCoursedMandatory = toNumber(disciplinasCategory[8])
    const totalCreditsMandatory = Math.round((totalCreditsCoursedMandatory * 100) / totalPercentageCoursedMandatory)

    // limited
    const totalCreditsCoursedLimited = toNumber(disciplinasCategory[12])
    const totalPercentageCoursedLimited = toNumber(disciplinasCategory[13])
    const totalCreditsLimited = Math.round(((totalCreditsCoursedLimited * 100) / totalPercentageCoursedLimited))

    await nextApi.post('/histories', {
      ra: ra,
      disciplinas: jsonFicha.data,
      curso: nomeDoCurso,
      grade: anoDaGrade,

      // credits total
      mandatory_credits_number: totalCreditsMandatory,
      limited_credits_number: totalCreditsLimited,
      free_credits_number: totalCreditsFree,
      credits_total: (totalCreditsMandatory + totalCreditsLimited + totalCreditsFree)
    }, {
      timeout: 60 * 1 * 1000 // 1 minute
    })

    curso.ra = ra
    curso.cp = toNumber(info[0]);
    curso.cr = toNumber(info[1]);
    curso.ca = toNumber(info[2]);
    curso.quads = ficha_obj.find(".ano_periodo").length;

    curso.cursadas = jsonFicha.data;

    return curso
  } catch(err) {
    console.log(err)
    Toastify({
      text:
        `
        <div style="width: 228px; display: flex; align-items: end; margin-right: 12px;">
          <img style="margin-right: 16px;" width="32" height="32" src="${errorSVG}" />
            Não foi possível salvar seus dados, recarregue a página e aguarde.
        </div>`,
      duration: -1,
      close: true,
      gravity: "top",
      position: "right",
      className: "toast-error-container",
      style: {
        background: "#E74C3C;",
      },
    }).showToast();
  }
}


function getEmailAluno() {
  return $('#top li')
    .last()
    .text()
    .replace(/\s*/,'')
    .split('|')[0]
    .replace(' ','')
    .toLowerCase();
}

function toNumber(el) {
  return parseFloat(el.innerText.replace(',', '.'));
}

async function saveToLocalStorage(curso) {
  const storageUser = 'ufabc-extension-' + getEmailAluno()
  let user = await Utils.storage.getItem(storageUser)
  if(!user || _.isEmpty(user)) user = []

  user.push(curso)
  user = _.uniqBy(user, 'curso')

  await Utils.storage.setItem(storageUser, user)

  toastr.success(
   `Suas informações foram salvas! Disciplinas do curso do ${curso.curso}
      para o usuário ${getEmailAluno()}.
      `,
    { timeout: 100000 }
  );

}


async function saveStudentsToLocalStorage(curso) {
  const storageUser = 'ufabc-extension-' + getEmailAluno()
  const cursos = await Utils.storage.getItem(storageUser)
  const ra = (curso && curso.ra) || null

  let allSavedStudents = []
  const students = await Utils.storage.getItem('ufabc-extension-students')
  if(students && students.length) {
    allSavedStudents.push(...students)
  }

  allSavedStudents = allSavedStudents.filter(student => student.ra != ra)
  const student = {
    cursos: cursos,
    ra: ra,
    name: getEmailAluno(),
    lastUpdate: Date.now()
  }
  allSavedStudents.unshift(student)
  await Utils.storage.setItem('ufabc-extension-students', allSavedStudents)
}
