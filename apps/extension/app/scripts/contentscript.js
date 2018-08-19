import $ from 'jquery'
// import axios from 'axios'

import toastr from 'toastr'
import Utils from './helpers/utils'
// import Auth from './helpers/auth'
// import GeneralStudy from './helpers/general'
// import Ferris from './helpers/ferris'

// import iframe from './helpers/iframe'
// import Youtube from './helpers/youtube'
// import Netflix from './helpers/netflix'
// import _ from 'lodash'

var testing = false;
var matricula_url;
var endpoint;

if (testing) {
    matricula_url = 'matricula.html';
    endpoint = 'https://desolate-lake-30493.herokuapp.com/';
} else {
    matricula_url = 'matricula.ufabc.edu.br/matricula';
    endpoint = 'http://localhost:3000/';
}

console.log(matricula_url)

var last_disciplina
var user = ""
// pega as disciplinas com os professores

chrome.storage.local.get('ufabc-extension-last', function(items) {
    // se nao tiver professores, tem que fazer a requisicao
    if (Object.keys(items).length == 0) {
        getProfessores();
    } else {
        // quanto tempo passou desde a ultima vez que fizemos a requisicao
        var timeDiff = Math.abs(new Date() - new Date(items['ufabc-extension-last']));
        var minutes = Math.floor(timeDiff / 1000 / 60);
        // se passou mais que 30 minutos refaz a requisicao
        if (minutes >= 30) {
            getProfessores();
        }
    };
});

// guarda os professores num localstorage
function getProfessores () {
   $.get(endpoint + 'disciplinas', function( data , textStatus, request) {
        chrome.storage.local.set({'ufabc-extension-last': request.getResponseHeader('Last-Modified')});
        chrome.storage.local.set({'ufabc-extension-disciplinas': data});
    }); 
}

// disciplinas que mudaram de nome (HARDCODED)
var disciplinas_mudadas = {
    "Energia: Origens, Conversão e Uso" : "Bases Conceituais da Energia",
    "Transformações nos Seres Vivos e Ambiente" : "Biodiversidade: Interações entre organismos e ambiente",
    "Transformações Bioquímicas" : "Bioquímica: estrutura, propriedade e funções de Biomoléculas",
    "Transformações Bioquímicas" : "Bioquímica: Estrutura, Propriedade e Funções de Biomoléculas",
    "Origem da Vida e Diversidade dos Seres Vivos" : "Evolução e Diversificação da Vida na Terra",
}

// quando carrega qualquer pagina fazemos isto
window.addEventListener('load', function() {
    var url = document.location.href;

   if(url.indexOf(matricula_url) != -1) {
        //inject styles
        Utils.injectStyle('styles/main.css');

        //inject face
        Utils.injectScript('scripts/helpers/face.js');


        //Utils.injectScript('scripts/vueApp/main.js');

        // injeta modal
        Utils.injectDiv('scripts/html/modal.html');

        // manda as informacoes para o servidor
        sendAlunoData();

        // append quantidade total de matriculas
        appendMatriculas();

        // adiciona botao de cortes
        adicionaCortes();

        //handler de cortes
        handlerCortes();

        console.log('here')
        toastr.info('Carregando extensao...');
        
        // add chrome box
        Utils.fetchChromeUrl('scripts/html/box.html', function (data) {
            $("#filtros").append(data);
            $("#filtros")
                .children(".col-md-6")
                .removeClass("col-md-6")
                .addClass("col-md-3");

            // handlers filtros iguais ufabc
            sameHandlers();
            // cria handler para matriculas selecionadas
            criaHandlerSelecionadas();
            criaHandlerHelp();
            criaHandlerRemoveCursadas()

            // carrega professores automaticamente
            $('#loadHelp').click();
        })
   }
});

function criaHandlerRemoveCursadas() {
     // cadastrar handler para click removeCursadas
    $( "#removeCursadas" ).click(function(e) {
        // se a checkbox for false, faz aparecer novamente as disciplinas
        if (!$(e.target).is(':checked')) {
            $(".isCursada").css('display', '');
            return;
        };
        // se ja tiver calculado nao refaz o trabalho
        if ($(".isCursada").length > 0) {
            $(".isCursada").css('display', 'none');
            return;
        }
        // ve qual user esta pedindo as disciplinas
        var current_user = $('#usuario_top').text().replace(/\s*/, '').split('|')[0].replace(' ', '');
        toastr.info('Pegando disciplinas de ' + current_user + '.');
        // pega as disciplinas ja cursadas
        chrome.storage.local.get(current_user, function (item) {
            if (item[current_user] == null) {
                toastr.info('Nao temos as disciplinas que voce cursou! <a href="https://aluno.ufabc.edu.br/" target="_blank" style="color: #FFF;"> Clique aqui</a> para carrega-las.' );
                return;
            }
            item = item[current_user]; 
            // guardar as disciplinas ja cursadas aqui
            var ja_cursadas = {};
            // se nao tiver nada precisa mandar ele cadastrar
            var todas_cursadas = item[0].cursadas;
            for (var i = 0; i < todas_cursadas.length; i++) {
                var codigo = todas_cursadas[i].codigo; // codigos mudam com o passar do tempo, nao rola
                var conceito = todas_cursadas[i].conceito;
                var disciplina = todas_cursadas[i].disciplina;
                if (conceito === 'A' || conceito === 'B' || conceito === 'C' || conceito === 'D' || conceito === 'E') {
                    ja_cursadas[disciplina] = true;
                    for (var key in disciplinas_mudadas) {
                        if (key === disciplina) {
                            ja_cursadas[disciplinas_mudadas[key]] = true;
                            delete disciplinas_mudadas[key];
                        }
                    }
                    
                }                
            }
            // pega a table principal de disciplinas
            $("table tr td:nth-child(3)").each(function () {
                var el = $(this);
                // tira apenas o nome da disciplina -> remove turma, turno e campus
                var disciplina = el.text().split("-")[0];
                disciplina = disciplina.substring(0, disciplina.lastIndexOf(" "));
                // verifica se ja foi cursada
                if (ja_cursadas[disciplina]) {
                    el.parent().addClass("isCursada");
                    el.parent().css('display', 'none');
                };
            });
        });
    });
}

function criaHandlerHelp(){
    // cadastra handler para loadHelp
    $( "#loadHelp" ).click(function(e) {
        // se a checkbox for false, faz aparecer novamente os professores
        if (!$(e.target).is(':checked')) {
            $(".isHelp").css('display', 'none');
            return;
        };
        // se ja tiver calculado nao refaz o trabalho
        if ($(".isHelp").length > 0) {
            $(".isHelp").css('display', '');
            return;
        }
        toastr.info('Carregando professores...');
        // opcao de mostrar os professores
        chrome.storage.local.get('ufabc-extension-disciplinas', function (item) {
            // implementar chart.js para ver o pie extraido do help
            var disciplinas = item["ufabc-extension-disciplinas"];
            // cria uma hash
            var hash_disciplinas = {}
            for (var i = 0; i < disciplinas.length; i++) {
                hash_disciplinas[disciplinas[i].disciplina + "@" + disciplinas[i].turma + "@" + disciplinas[i].turno +"@" + disciplinas[i].campus.replace(' do Campo', '').trim()] = disciplinas[i];
            };
            // pega a table principal de disciplinas
            $("table tr td:nth-child(3)").each(function () {
                var el = $(this);
                // transforma da mesma forma que hash foi feita
                try {
                    var disciplina = el.text().split("-")[0];
                    var turma = disciplina.substring(disciplina.lastIndexOf(" ")).replace(" ", "");
                    disciplina = disciplina.substring(0, disciplina.lastIndexOf(" "));
                    var turno = el.text().split("(");
                    var campus = turno[1].replace(")", "").split('|')[0].replace(/\s+$/, ''); 
                } catch (err) {
                    return;
                }

                if (turno[0].indexOf('atutino') != -1) {
                    turno = "diurno";
                } else if (turno[0].indexOf('oturno') != -1) {
                    turno = "noturno";
                }

                var search = disciplina + "@" + turma + "@" + turno + "@" + campus;;
                try {
                    //se tiver professor de teoria
                    var html = '';
                    if(hash_disciplinas[search]) {
                        html += "<div data='" + JSON.stringify(hash_disciplinas[search]) +  "'>";
                    }
                    var item = '';
                    if (hash_disciplinas[search].teoria) {
                        try {
                            item = hash_disciplinas[search].teoria_help;
                            html += '<div class="col-md-12 isHelp ufabc-extension-prof ufabc-well ufabc-transparent" style="margin-top: 6px;">Teoria: <a href="' + item.url +'" target="_blank">' + item.professor + '</a></div>';
                        } catch (err) {
                            item = hash_disciplinas[search];
                            html += '<div class="col-md-12 isHelp ufabc-extension-prof ufabc-well ufabc-transparent">Teoria: <a href="' + '#' +'" target="_blank">' + item.teoria + '</a></div>';
                        }
                    } 
                    if(hash_disciplinas[search].pratica) {
                        try {
                            item = hash_disciplinas[search].pratica_help;
                            html += '<div class="col-md-12 isHelp ufabc-extension-prof ufabc-well ufabc-transparent">Prática: <a href="' + item.url +'" target="_blank">' + item.professor + '</a></div>';
                        } catch (err) {
                            item = hash_disciplinas[search];
                            html += '<div class="col-md-12 isHelp ufabc-extension-prof ufabc-well ufabc-transparent">Teoria: <a href="' + '#' +'" target="_blank">' + item.pratica + '</a></div>';
                        }
                      }
                    html += "</div>";
                    el.append(html);

                    //el.append('<div class="col-md-12 isHelp ufabc-extension-font"><div class="col-md-6 ufabc-well ufabc-green"><strong>CR ALUNO: </strong><span>' + item.cr_aluno + '</span></div><div class="col-md-6 ufabc-well ufabc-orange">CR PROFESSOR: ' + item.cr_professor +'</div><div class="col-md-6 ufabc-well ufabc-red">REPROVAÇÕES: ' + item.reprovacoes + '</div><div style="cursor: pointer;" class="col-md-6 pie ufabc-well ufabc-blue" data=' + JSON.stringify(item.pie) + '>ESTATÍSTICAS</div></div>')
                } catch (err) {

                }
            });

            // tenta criar todos os hover
            $('.isHelp').children('a').each(function() {
                try {
                    var el = $(this);
                    var help_data = JSON.parse(el.parent().parent().attr('data'));
                    var type = el.parent().text().toLowerCase().indexOf('teoria');
                    var id = new Date().getTime() + parseInt(Math.random() * 8999 + 1000);;
                    var html, title;
                    if(type === -1) {
                        title = "PRÁTICA: " + el.text().toUpperCase();
                        html = pie.getHTML(help_data.pratica_help, id);
                    } else {
                        title = "TEORIA: " + el.text().toUpperCase();
                        html = pie.getHTML(help_data.teoria_help, id);
                    }

                    el.webuiPopover({
                        title: title,
                        content: html,
                        closeable:true,
                        trigger: 'hover',
                        placement: 'horizontal',
                        onShow: function($element) {
                            if(type === -1) {
                                pie.generate(help_data.pratica_help.pie, id);
                            } else {
                                pie.generate(help_data.teoria_help.pie, id);
                            }
                            
                        }
                    });

                    //generatePie(help_data.teoria_help, id);
                } catch (err) {
                    //console.log('errs');
                }
            });
        });
    });
}

function criaHandlerRefresh () {
    // cria handler para refresh matriculas
    $( "#refreshMatriculas" ).click(function(e) {
        updateMatriculasTotal();
    });
}

function criaHandlerSelecionadas() {
    $( "#apenasMatriculadas" ).click(function(e) {
        // se a checkbox for false, faz aparecer novamente os professores
        if (!$(e.target).is(':checked')) {
            $(".notSelecionada").css('display', '');
            return;
        };
        getAlunoId(function (aluno_id) {
            getMatriculasAluno(aluno_id, function (matriculas) {
                // constroi hash para iterar
                var hash = {};
                for (var i = 0; i < matriculas.length; i++) {
                    hash[matriculas[i]] = true;
                }
                // itera no tr e compara
                $('tr').each(function () {
                    // value da tr (id da disciplina)
                    var disciplina_id = $(this).attr('value');
                    if (!hash[disciplina_id] && disciplina_id != null) {
                        $(this).addClass("notSelecionada");
                        $(this).css('display', 'none');
                    } else if (hash[disciplina_id]) {
                        var el = $(':nth-child(5)', this);
                    }
                });
            })
        })
    })
};



function getAlunoId(cb) {
    $('script').each(function () {
        var inside = $(this).text();
        var test = "todasMatriculas";
        if (inside.indexOf(test) != -1) {
            var regex = /matriculas\[(.*)\]/;
            var match = regex.exec(inside);
            cb(parseInt(match[1]));
        }
    });
}

function getTotalMatriculas(cb) {
    // pega a quantidade total de matriculas
    $.get('https://matricula.ufabc.edu.br/cache/matriculas.js', function (data) {
        data = JSON.parse(data.replace('matriculas=', '').replace(';', ''));
        var tamanho = Object.keys(data).length;
        cb(tamanho);
    });
}

function getMatriculasAluno(aluno_id, cb) {
    $.get('https://matricula.ufabc.edu.br/cache/matriculas.js', function (data) {
        try {
            data = JSON.parse(data.replace('matriculas=', '').replace(';', ''));
            cb(data[aluno_id]);
        } catch (err) {
            // teria que tentar novamente
        }
        
    });
}

// append no documento a quantidade total de matriculas
function appendMatriculas() {
    getTotalMatriculas(function (quantidade) {
        var html = '<p class="bg-success">Foram efetuadas <span id="matriculasTotal">' + quantidade + '</span> matriculas até o momento. <img width="20px" id="refreshMatriculas" style="cursor: pointer;" src="' + chrome.extension.getURL('images/refresh_small.png') +'"/></p>';
        $('form').before(html);
         // cria handler para materias selecionadas
        criaHandlerRefresh();
    })
}

function updateMatriculasTotal() {
    getTotalMatriculas(function (quantidade) {
        $("#matriculasTotal").html(quantidade);
    })
}

function findIdForCurso(nome){
    if (nome == 'Bacharelado em Ciências da Computação') {
        nome = 'Bacharelado em Ciência da Computação'
    }
    return $($("#curso").children().filter(function(i, item) {
        return nome.toLowerCase() == $(item).text().toLowerCase();
    })[0]).val()
}

function sendAlunoData () {
    getAlunoId(function (aluno_id) {
        var current_user = $('#usuario_top').text().replace(/\s*/, '').split('|')[0].replace(' ', '');
        chrome.storage.local.get(current_user, function (item) {
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

                    $.post( endpoint + 'test', {data: item, aluno_id : aluno_id}, function( data ) {
                      $( ".result" ).html( data );
                    });
                }
                
            })
    })
}

function adicionaCortes() {
    $("#tabeladisciplinas tr td:nth-child(4)").each(function () {
        var el = $(this);
        el.append('<br><span href="#modalCortes" style="color: red; cursor: pointer;" id="openBtn" data-toggle="modal" class="corte ufabc-extension-prof" value="' + el.parent().attr('value') + '">Cortes</span>');
    });
}

function handlerCortes(){
    $('.corte').on('click', function (e) {
        getAlunoId(function (aluno_id) {
            $.post(endpoint + 'is_allowed', {aluno_id: aluno_id}, function( data ) {
                if(data == 'OK') {
                    var target = $(e.target);
                    var corte_id = target.attr('value');
                    var corpo = $('#tblGrid tbody');
                    corpo.parent().show();
                    var name = target.parent().parent().children()[2].innerText.split('|')[0];
                    $('.modal-title').text(name.split(")")[0] + ")");
                    var vagas = parseInt(target.parent().parent().children()[3].innerText);
                    var requisicoes = parseInt(target.parent().parent().children()[4].innerText);
                    corpo.html('');
                    $.post( endpoint + 'cortes', {disciplina_id: corte_id}, function( data ) {
                            var disc = $( "td[value='" + corte_id +"']" );
                            data.map(function (item, i) {
                                var classe = '';
                                // implementacao da previsao
                                // if(i + 1 == previsao) {
                                //     $('#previsao').html('');
                                //     var previsaoStr = "<h4>Previsao de Corte:"
                                //     previsaoStr += name.split('-')[1].split('(')[0].replace(" ", "") == item.turno ? "Turno " + item.turno : "";
                                //     previsaoStr += "</h4>"
                                //     $('#previsao').append(previsaoStr);
                                // }
                                if(requisicoes > vagas) { 
                                    var previsao = Math.floor(data.length * vagas / requisicoes);
                                    classe = (i + 1) > previsao ? 'info' : '';
                                }
                                classe = (i + 1) > vagas ? 'danger' : classe;
                                classe = (item.id == aluno_id) ? ' warning' : classe; 
                                var rank_h = '<td>' + (i + 1) + '</td>';
                                var reserva_h = '<td>' + (item.reserva ? 'Sim' : 'Não') + '</td>';
                                var turno_h = '<td>' + item.turno + '</td>';
                                var ik_h = '<td>' + item.ik.toFixed(3) + '</td>';
                                var cr_h = '<td>' + item.cr.toFixed(3) + '</td>';
                                var cp_h = '<td>' + item.cp.toFixed(3) + '</td>';
                                corpo.append('<tr class="' + classe + '">' + rank_h + reserva_h + turno_h + ik_h + cp_h + cr_h + '</tr>');
                            })
                    });
                } else {
                    var target = $(e.target);
                    var corte_id = target.attr('value');
                    var corpo = $('#tblGrid tbody');
                    corpo.parent().hide();
                    $('.modal-title').html('Nao temos as disciplinas que voce cursou! <a href="https://aluno.ufabc.edu.br/" target="_blank"> Clique aqui</a> para carrega-las.' );
                    return;
                }
            });
        })

    })
}

function sameHandlers() {
    $('#andre').click(function (e) {
        if (!$('#andre').is(':checked')) {
            $("#tabeladisciplinas tr").each(function(){
                $(this).removeClass("notAndre");
            })
            return;
        } else {
            $("#tabeladisciplinas tr td:nth-child(3)").each(function(){
                var campus = $(this).text().split("(")[1].split(")")[0].toLowerCase();
                if(campus.indexOf('bernardo') != -1) {
                    // tem que sumir
                    $(this).parent().addClass("notAndre");
                }
            });
        }
    });

    $('#bernardo').click(function (e) {
        if (!$('#bernardo').is(':checked')) {
            $("#tabeladisciplinas tr").each(function(){
                $(this).removeClass("notBernardo");
            })
            return;
        } else {
            $("#tabeladisciplinas tr td:nth-child(3)").each(function(){
                var campus = $(this).text().split("(")[1].split(")")[0].toLowerCase();
                if(campus.indexOf('andr') != -1) {
                    // tem que sumir
                    $(this).parent().addClass("notBernardo");
                }
            });
        }
    });

    $('#fmatutino').click(function (e) {
        if (!$('#fmatutino').is(':checked')) {
            $("#tabeladisciplinas tr").each(function(){
                $(this).removeClass("notMatutino");
            })
            return;
        } else {
            $("#tabeladisciplinas tr td:nth-child(3)").each(function(){
                var campus = $(this).text().toLowerCase();
                if(campus.indexOf('noturno') != -1) {
                    // tem que sumir
                    $(this).parent().addClass("notMatutino");
                }
            });
        }
    });

    $('#fnoturno').click(function (e) {
        if (!$('#fnoturno').is(':checked')) {
            $("#tabeladisciplinas tr").each(function(){
                $(this).removeClass("notNoturno");
            })
            return;
        } else {
            $("#tabeladisciplinas tr td:nth-child(3)").each(function(){
                var campus = $(this).text().toLowerCase();
                if(campus.indexOf('matutino') != -1) {
                    // tem que sumir
                    $(this).parent().addClass("notNoturno");
                }
            });
        }
    });

    $("#cutHigh").bind('keyup mouseup', function () {
        var limit = parseFloat($("#cutHigh").val());
        $('.isHelp').parent().each(function(){
            try {
                var prof = JSON.parse($(this).attr('data'));
                if (prof.teoria && !prof.pratica) {
                    if (parseFloat(prof.teoria_help.cr_aluno) < limit) {
                        $(this).parent().parent().addClass('notHigh');
                    } else {
                        $(this).parent().parent().removeClass('notHigh');
                    };
                } else if (prof.pratica && !prof.teoria) {
                    if (parseFloat(prof.pratica_help.cr_aluno) < limit) {
                        $(this).parent().parent().addClass('notHigh');
                    } else {
                        $(this).parent().parent().removeClass('notHigh');
                    };
                } else {
                    if (parseFloat(prof.teoria_help.cr_aluno) < limit && parseFloat(prof.pratica_help.cr_aluno) < limit) {
                        $(this).parent().parent().addClass('notHigh');
                    } else {
                        $(this).parent().parent().removeClass('notHigh');
                    };
                }
            } catch (err) {

            }
        })
    });
}