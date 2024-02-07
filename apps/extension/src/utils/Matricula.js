import Axios from "axios";
import { NextAPI } from "../services/NextAPI";
import toJSON from "./toJSON";
import _ from "lodash";
import $ from "jquery";
import Utils from "../scripts/helpers/utils";

const nextApi = NextAPI();

module.exports = new Matricula();

function Matricula() {
  const MATRICULAS_URL =
    {
      development: "http://localhost:8011/snapshot/assets/todasDisciplinas.js",
      staging:
        "https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot/assets/todasDisciplinas.js",
      production: "https://matricula.ufabc.edu.br/cache/matriculas.js",
    }[process.env.NODE_ENV] || "http://localhost:8011/v1";

  // check if we need to update our localStorage of professors
  // based when you did this last request
  async function updateProfessors(data) {
    let lastTime = data;
    let timeDiff = (Date.now() - lastTime) / (1000 * 60);

    await getProfessors();
    if (!lastTime || timeDiff > 0.2) {
      await getProfessors();
    }
  }

  // fetch professors url and save them into localStorage
  async function getProfessors() {
    try {
      let { data: professors } = await nextApi.get("/disciplinas");
      await Utils.storage.setItem("ufabc-extension-last", Date.now());
      await Utils.storage.setItem("ufabc-extension-disciplinas", professors);
      return professors;
    } catch (e) {
      console.log("❌ Erro ao atualizar disciplinas");
      console.error(e);
    }
  }

  // disciplinas que mudaram de nome (HARDCODED)
  var disciplinas_mudadas = {
    "Energia: Origens, Conversão e Uso": "Bases Conceituais da Energia",
    "Transformações nos Seres Vivos e Ambiente":
      "Biodiversidade: Interações entre organismos e ambiente",
    "Transformações Bioquímicas":
      "Bioquímica: estrutura, propriedade e funções de Biomoléculas",
    "Transformações Bioquímicas":
      "Bioquímica: Estrutura, Propriedade e Funções de Biomoléculas",
    "Origem da Vida e Diversidade dos Seres Vivos":
      "Evolução e Diversificação da Vida na Terra",
  };

  // fetch matriculas again
  async function getMatriculas() {
    const disciplinas = await Axios.get(MATRICULAS_URL);
    return toJSON(disciplinas.data) || {};
  }

  // get total number of matriculas that was made until now
  async function getTotalMatriculas() {
    return Object.keys(await getMatriculas()).length;
  }

  // get matriculas by aluno_id
  async function getMatriculasAluno(aluno_id) {
    const matriculas = await getMatriculas();
    return _.get(matriculas, aluno_id);
  }

  // get current logged student
  function getAlunoId() {
    let toReturn = null;

    $("script").each(function () {
      var inside = $(this).text();
      var test = "todasMatriculas";
      if (inside.indexOf(test) != -1) {
        var regex = /matriculas\[(.*)\]/;
        var match = regex.exec(inside);
        toReturn = parseInt(match[1]);
      }
    });

    return toReturn;
  }

  // find courseId for this season
  function findIdForCurso(name) {
    if (
      _.camelCase(name) == _.camelCase("Bacharelado em Ciências da Computação")
    ) {
      name = "Bacharelado em Ciência da Computação";
    }
    // normalize to camelCase
    name = _.camelCase(name);

    // check which row matches the name passed
    const course = $("#curso")
      .children()
      .filter(function (i, item) {
        return name == _.camelCase($(item).text());
      })[0];

    return $(course).val();
  }

  function currentUser() {
    return $("#usuario_top")
      .text()
      .replace(/\s*/, "")
      .split("|")[0]
      .trim()
      .toLowerCase();
  }

  // send aluno data
  async function sendAlunoData() {
    const storageUser = "ufabc-extension-" + currentUser();
    const storageRA = "ufabc-extension-ra-" + currentUser();
    const user = await Utils.storage.getItem(storageUser);
    const ra = await Utils.storage.getItem(storageRA);

    if (!user) return;

    // remove as disciplinas cursadas
    for (var i = 0; i < user.length; i++) {
      delete user[i].cursadas;
    }

    await nextApi.post("/students", {
      aluno_id: getAlunoId(),
      cursos: user.map(function (info) {
        info.curso_id = findIdForCurso(info.curso);
        return info;
      }),
      ra: ra,
      login: currentUser(),
    });
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
  };
}
