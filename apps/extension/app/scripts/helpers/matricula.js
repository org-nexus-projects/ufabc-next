import Axios from 'axios'
import Api from './api'
import var2json from './parse/var2json'
import _ from 'lodash'
import $ from 'jquery'
import Utils from './utils'

module.exports = new Matricula()

function Matricula() {
  const MATRICULAS_URL = {
    'development' : 'http://localhost:8011/snapshot/assets/todasDisciplinas.js',
    'staging'     : 'https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot/assets/todasDisciplinas.js',
    'production'  : 'https://matricula.ufabc.edu.br/cache/matriculas.js'
  }[process.env.NODE_ENV] || 'http://localhost:8011/v1'

  // check if we need to update our localStorage of professors
  // based when you did this last request
  async function updateProfessors(data) {
    let lastTime = data
    let timeDiff = (Date.now() - lastTime) / (1000 * 60)

    await getProfessors()
    if(!lastTime || timeDiff > 0.2) {
      await getProfessors()
    }
  }

  // fetch professors url and save them into localStorage
  async function getProfessors () {
    try {
      let professors = await Api.get('/disciplinas')
      await Utils.storage.setItem('ufabc-extension-last', Date.now())
      await Utils.storage.setItem('ufabc-extension-disciplinas', professors)
      return professors
    } catch(e) {
      console.log(e.status)
    }   
  }

  // disciplinas que mudaram de nome (HARDCODED)
  var disciplinas_mudadas = {
    "Energia: Origens, Conversão e Uso" : "Bases Conceituais da Energia",
    "Transformações nos Seres Vivos e Ambiente" : "Biodiversidade: Interações entre organismos e ambiente",
    "Transformações Bioquímicas" : "Bioquímica: estrutura, propriedade e funções de Biomoléculas",
    "Transformações Bioquímicas" : "Bioquímica: Estrutura, Propriedade e Funções de Biomoléculas",
    "Origem da Vida e Diversidade dos Seres Vivos" : "Evolução e Diversificação da Vida na Terra",
  }

  function findQuadFromDate(month) {
    if([0, 1, 2, 10, 11].includes(month)) return 3
    if([3, 4, 5].includes(month)) return 1
    if([6, 7, 8, 9].includes(month)) return 2
  }

  function findIdeais(date) {
    return {
      1 : 
      [
        'BCM0506-15', // COMUNICACAO E REDES
        'BCJ0203-15', // ELETROMAG
        'BIN0406-15', // IPE
        'BCN0405-15', // IEDO
        'BIR0004-15', // EPISTEMOLOGICAS
        'BHO0102-15', // DESENVOL. E SUSTE.
        'BHO0002-15', // PENSA. ECONOMICO
        'BHP0201-15', // TEMAS E PROBLEMAS
        'BHO0101-15', // ESTADO E RELA
        'BIR0603-15', // CTS
        'BHQ0003-15', // INTEPRE. BRASIL
        'BHQ0001-15', // IDENT.E CULTURA
      ],
      2 : [
        'BCM0504-15', // NI
        'BCN0404-15', // GA
        'BCN0402-15', // FUV
        'BCJ0204-15', // FEMEC
        'BCL0306-15', // BIODIVERSIDADE
        'BCK0103-15', // QUANTICA
        'BCL0308-15', // BIOQUIMICA
        'BIQ0602-15', // EDS
        'BHO1335-15', // FORMACAO SISTEMA INTERNACIONAL
        'BHO1101-15', // INTRODUCAO A ECONOMIA
        'BHO0001-15', // INTRODUCAO AS HUMANIDADES
        'BHP0202-15', // PENSAMENTO CRITICO
      ],
      3 : [
        'BCJ0205-15', // FETERM
        'BCM0505-15', // PI
        'BCN0407-15', // FVV
        'BCL0307-15', // TQ
        'BCK0104-15', // IAM
        'BIR0603-15', // CTS
        'BHP0001-15', // ETICA E JUSTICA
        'BHQ0301-15', // TERRITORIO E SOCIEDADE
        // ESTUDO ÉTNICOS RACIAIS
      ],
    }[findQuadFromDate(date || new Date().getMonth())]
  }

  // fetch matriculas again
  async function getMatriculas() {
    const disciplinas = await Axios.get(MATRICULAS_URL)
    return var2json(disciplinas.data) || {}
  }

  // get total number of matriculas that was made until now
  async function getTotalMatriculas() {
    return Object.keys(await getMatriculas()).length
  }

  // get matriculas by aluno_id
  async function getMatriculasAluno(aluno_id) {
    const matriculas = await getMatriculas()
    return _.get(matriculas, aluno_id) 
  }

  // get current logged student
  function getAlunoId() {
    let toReturn = null

    $('script').each(function () {
      var inside = $(this).text();
      var test = "todasMatriculas";
      if (inside.indexOf(test) != -1) {
        var regex = /matriculas\[(.*)\]/
        var match = regex.exec(inside)
        toReturn = (parseInt(match[1]))
      }
    })

    return toReturn
  }

  // find courseId for this season
  function findIdForCurso(name){
    if ( _.camelCase(name)  == _.camelCase('Bacharelado em Ciências da Computação')) {
      name = 'Bacharelado em Ciência da Computação'
    }
    // normalize to camelCase
    name = _.camelCase(name)

    // check which row matches the name passed
    const course = $("#curso").children().filter(function(i, item) {
        return name == _.camelCase($(item).text())
    })[0]

    return $(course).val()
  }

  function currentUser() {
    return $('#usuario_top').text().replace(/\s*/, '').split('|')[0].replace(' ', '')
  }

  // send aluno data
  async function sendAlunoData () {
    const storageUser = 'ufabc-extension-' + currentUser()
    const user = await Utils.storage.getItem(storageUser)

    if(!user) return

    // remove as disciplinas cursadas
    for (var i = 0; i < user.length; i++) {
      delete user[i].cursadas;
    }

    await Api.post('/students', {
      aluno_id: getAlunoId(),
      cursos: user.map(function(info){
        info.curso_id = findIdForCurso(info.curso);
        return info;
      })
    })
  }
 
  return {
    updateProfessors,
    getProfessors,
    getMatriculas,
    getTotalMatriculas,
    getMatriculasAluno,
    getAlunoId,
    findIdForCurso,
    currentUser,
    sendAlunoData,
    findIdeais,
  }
}