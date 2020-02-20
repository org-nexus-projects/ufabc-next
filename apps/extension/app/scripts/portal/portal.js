import toastr from 'toastr'
import $ from 'jquery'
import _ from 'lodash'
import Utils from '../helpers/utils'
import Api from '../helpers/api'
import Axios from 'axios'
import MatriculaHelper from '../helpers/matricula'

if (isIndexPortalAluno()) {
  const anchor = document.createElement('div')
  anchor.setAttribute('id', 'app')
  document.body.append(anchor)
  Utils.injectScript('scripts/portal.js')

  Utils.injectStyle('styles/portal.css')
  toastr.info("Clique em <a href='https://aluno.ufabc.edu.br/fichas_individuais' style='color: #FFF !important;'>Ficha Individual</a> para atualizar suas informações!");
}  else if (isFichasIndividuaisPath()) {
  Utils.injectStyle('styles/portal.css');
  toastr.info('A mágica começa agora...');

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
  var aluno = getEmailAluno();

  var tabelaCursos = $('tbody').children().slice(1);

  tabelaCursos.each(async function () {
    var linhaCurso = $(this).children();
    
    var nomeDoCurso = $(linhaCurso[0]).children('a').text()
    var fichaAlunoUrl = $(linhaCurso[1]).children('a').attr('href');
    var anoDaGrade = $(linhaCurso[2]).text()
    
    const curso = await getFichaAluno(fichaAlunoUrl, nomeDoCurso, anoDaGrade)
    curso.curso = linhaCurso[0].innerText.replace("Novo", '');
    curso.turno = linhaCurso[3].innerText;

    await saveToLocalStorage(aluno, curso);
  })
}

async function getFichaAluno(fichaAlunoUrl, nomeDoCurso, anoDaGrade) {
  var curso = {};
  var ficha_url = fichaAlunoUrl.replace('.json', '');

  const ficha = await Axios.get('https://aluno.ufabc.edu.br' + ficha_url)
  const ficha_obj = $($.parseHTML(ficha.data))
  
  const info = ficha_obj.find('.coeficientes tbody tr td');
  const ra = /.*?(\d+).*/g.exec(ficha_obj.find("#page").children('p')[2].innerText)[1] || 'some ra';

  const storageRA = 'ufabc-extension-ra-' + getEmailAluno()
  await Utils.storage.setItem(storageRA, ra)

  const jsonFicha = await Axios.get('https://aluno.ufabc.edu.br' + fichaAlunoUrl)
  
  await Api.post('/histories', {
    ra: ra,
    disciplinas: jsonFicha.data,
    curso: nomeDoCurso,
    grade: anoDaGrade
  })

  curso.cp = toNumber(info[0]);
  curso.cr = toNumber(info[1]);
  curso.ca = toNumber(info[2]);
  curso.quads = ficha_obj.find(".ano_periodo").length;

  curso.cursadas = jsonFicha.data;

  return curso 
}

function getEmailAluno() {
  return $('#top li')
    .last()
    .text()
    .replace(/\s*/,'')
    .split('|')[0]
    .replace(' ','');
}

function toNumber(el) {
  return parseFloat(el.innerText.replace(',', '.'));
}

async function saveToLocalStorage(aluno, curso) {
  const storageUser = 'ufabc-extension-' + getEmailAluno()
  let user = await Utils.storage.getItem(storageUser)

  if(!user) user = []
  user.push(curso)
  user = _.uniqBy(user, 'curso')
  await Utils.storage.setItem(storageUser, user)
  toastr.info('Salvando disciplinas do curso do ' + curso.curso + ' para o usuário ' + aluno + '.')
}