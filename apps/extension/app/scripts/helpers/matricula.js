import Axios from 'axios'
import Api from './api'
import var2json from './parse/var2json'
import _ from 'lodash'
import $ from 'jquery'

module.exports = new Matricula()

function Matricula() {
  const MATRICULAS_URL = {
    'development' : 'http://localhost:8011/snapshot/assets/todasDisciplinas.js',
    'staging'     : 'https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot/assets/todasDisciplinas.js',
    'production'  : 'https://matricula.ufabc.edu.br/cache/matriculas.js'
  }[process.env.NODE_ENV] || 'http://localhost:8011/v1'

  // check if we need to update our localStorage of professors
  // based when you did this last request
  async function updateProfessors(items) {
    let lastTime = _.get(items, 'ufabc-extension-last', null)
    let timeDiff = (Date.now() - lastTime) / (1000 * 60)

    await getProfessors()
    if(!lastTime || timeDiff > 0.2) {
      await getProfessors()
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

  // fetch professors url and save them into localStorage
  async function getProfessors () {
    try {
      let professors = await Api.get('/disciplinas')
      chrome.storage.local.set({'ufabc-extension-last': Date.now() })
      chrome.storage.local.set({'ufabc-extension-disciplinas': professors })
    } catch(e) {
      console.log(e)
    }   
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
    if (name == 'Bacharelado em Ciências da Computação') {
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
  function sendAlunoData () {
    var aluno_id = getAlunoId()
    var current_user = currentUser()
    chrome.storage.local.get(current_user, async function (item) {
      if (item[current_user] != null) {
        item = item[current_user];
        // remove as disciplinas cursadas
        for (var i = 0; i < item.length; i++) {
          delete item[i].cursadas;
        }

        // find curso ID
        item = item.map(function(info){
          info.curso_id = findIdForCurso(info.curso);
          return info;
        })

        await Api.post('/students', {
          aluno_id: aluno_id,
          cursos: item
        })
      }       
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
  }
}