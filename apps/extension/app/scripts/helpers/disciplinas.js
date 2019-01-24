const _ = require('lodash')
const removeDiatrics = require('./removeDiacritics')

// This convert an disciplina from the .json from matriculas.ufabc
module.exports = function convertDisciplina(d) {
  const obj = _.defaults(_.clone(d))

  // specific for .json
  delete obj.campus
  delete obj.turno
  obj.obrigatorias = _.map(obj.obrigatoriedades, 'curso_id')

  let afterNoon = false

  // handler horarios based on pdf or json
  if(obj.horarios && _.isObject(obj.horarios)) {
    let startHours = _.get(obj.horarios, '[0].horas', [])
    let afterNoon = ['14:00', '15:00', '16:00', '17:00'].some(hour => startHours.includes(hour))
  } else if(obj.horarios && _.isString(obj.horarios)) {
    obj.horarios = removeLineBreaks(obj.horarios)

    const matched = obj.horarios.match(/\d{2}:\d{2}/g)
    
    // only match if is even
    if(matched.length % 2 == 0) {
      let hours = _.chunk(matched, 2)
      hours.forEach(m => {
        let [start, end] = m.map(h => parseInt(h.split(':')[0]))
        
        if(start >= 12 && start < 18) {
          afterNoon = true
        }
      })
    }
  }

  // trabalha nas disciplinas
  // if(!obj.nome) return obj

  let turnoIndex = null

  let breakRule = '-'

  var splitted = removeLineBreaks(obj.nome).split(breakRule)
  if(splitted.length == 1) {
    breakRule = ' '
    splitted = splitted[0].split(/\s+/)
  }

  splitted.map(function(item, i) {
    obj.campus = obj.campus || extractCampus(item)
    obj.turno = obj.turno || (afterNoon ? 'tarde' : extractTurno(item))

    if((obj.turno || obj.campus) && turnoIndex == null) turnoIndex = i
  })

  if(!obj.campus) {
    let secondPath = splitted.slice(turnoIndex + 1, splitted.length)
    obj.campus = extractCampus(secondPath.join(breakRule))
  }

  // cut until the index we found
  splitted = splitted.slice(0, turnoIndex)

  // separa a turma da disciplina
  var disciplina = _.compact(splitted.join('-').split(/\s+/))
  obj.turma = disciplina[disciplina.length -1]
  disciplina.pop()

  // fix disciplina
  obj.disciplina = disciplina.join(' ').trim()
  //obj.ideal_quad = app.helpers.season.findIdeais().includes(obj.codigo)

  obj.disciplina_id = obj.id
  obj.codigo = obj.codigo

  return obj  
}

function cleanTeacher(str){
  return _.startCase(_.camelCase(str))
    .replace(/-+.*?-+/g, '')
    .replace(/\(+.*?\)+/g, '')
}

function removeLineBreaks(str = '') {
  return str.replace(/\r?\n|\r/g, ' ')
}

function extractTurno(d){
  const min = d.toLowerCase()
  if(min.includes("diurno") || min.includes("matutino")) {
    return "diurno"
  }

  if(min.includes("noturno")) {
    return "noturno"
  }

  return null
}

function extractCampus(d) {
  const min = removeDiatrics(d.toLowerCase())
  if(/.*santo\s+andre.*/.test(min)) {
    return "santo andre"
  }

  if(/.*sao\s+bernardo.*/.test(min)) {
    return "sao bernardo"
  }

  return null
}