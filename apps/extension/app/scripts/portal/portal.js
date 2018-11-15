import toastr from 'toastr'
import $ from 'jquery'
import Utils from '../helpers/utils'

if (isIndexPortalAluno()) {
  const anchor = document.createElement('div')
  anchor.setAttribute('id', 'app')
  document.body.append(anchor)
  Utils.injectScript('scripts/portal.js')

  Utils.injectStyle('styles/portal.css')
  toastr.info("Clique em <a href='https://aluno.ufabc.edu.br/fichas_individuais' style='color: #FFF !important;'>Ficha Individual</a> para atualizar suas informações!");
} 
else if (isFichasIndividuaisPath()) {
  Utils.injectStyle('styles/portal.css');
  toastr.info('A mágica começa agora...');
    
  clearAlunoStorage(getEmailAluno());

  iterateTabelaCursosAndSaveToLocalStorage();
}
else if(isFichaIndividualPath()) {
  Utils.injectStyle('styles/portal.css');

  console.log('opaaaa')
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

    tabelaCursos.each(function () {
      var linhaCurso = $(this).children();

      var fichaAlunoUrl = $(linhaCurso[1]).children('a').attr('href');
      
      getFichaAluno(fichaAlunoUrl, function(curso) {
        curso.curso = linhaCurso[0].innerText.replace("Novo", '');
      curso.turno = linhaCurso[3].innerText;

        saveToLocalStorage(aluno, curso);
      });
    });
}

function getFichaAluno(fichaAlunoUrl, cb) {
  var curso = {};


    var ficha_url = fichaAlunoUrl.replace('.json', '');


    $.get('https://aluno.ufabc.edu.br' + ficha_url, function(data) {
        var ficha_obj = $($.parseHTML(data));

        var info = ficha_obj.find('.coeficientes tbody tr td');

        var ra = /.*?(\d+).*/g.exec(ficha_obj.find("#page").children('p')[2].innerText)[1] || 'some ra';

        // send to make UFABC HELP using data from students
        $.get('https://aluno.ufabc.edu.br' + fichaAlunoUrl, function(data) {
            $.post('https://desolate-lake-30493.herokuapp.com/api/history', {ra : ra, data: data}, function (data) {
                console.log(data)
            })
        })

        curso.cp = toNumber(info[0]);
        curso.cr = toNumber(info[1]);
        curso.ca = toNumber(info[2]);
        curso.quads = ficha_obj.find(".ano_periodo").length;

        $.get( 'https://aluno.ufabc.edu.br' + fichaAlunoUrl, function(data) {
            curso.cursadas = data;
            cb(curso);
        });
    });   
}

function getEmailAluno() {
  return $('#top li')
    .last()
    .text()
    .replace(/\s*/,'')
    .split('|')[0]
    .replace(' ','');
}

function clearAlunoStorage(aluno) {
  var tmp_obj = {};
    tmp_obj[aluno] = [];
    chrome.storage.local.set(tmp_obj);
}

function toNumber(el) {
  return parseFloat(el.innerText.replace(',', '.'));
}

function saveToLocalStorage(aluno, curso) {
  chrome.storage.local.get(aluno, function (data) {
      data[aluno].push(curso);
      console.log(data);
    chrome.storage.local.set(data);
    toastr.info('Salvando disciplinas do curso do ' + curso.curso + ' para o usuário ' + aluno + '.');
  })
}