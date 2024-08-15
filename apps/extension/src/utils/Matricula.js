import Axios from 'axios';
import { NextAPI } from '../services/NextAPI';
import toJSON from './toJSON';
import _ from 'lodash';
import $ from 'jquery';
import Utils from './extensionUtils';

const nextApi = NextAPI();

module.exports = new Matricula();

function Matricula() {
  const MATRICULAS_URL =
    {
      development: 'http://localhost:8011/snapshot/assets/todasDisciplinas.js',
      staging:
        'https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot/assets/todasDisciplinas.js',
      production: 'https://matricula.ufabc.edu.br/cache/matriculas.js',
    }[process.env.NODE_ENV] || 'http://localhost:8011/v1';

  // check if we need to update our localStorage of professors
  // based when you did this last request
  async function updateProfessors(data) {
    const lastTime = data;
    const timeDiff = (Date.now() - lastTime) / (1000 * 60);

    await getProfessors();
    if (!lastTime || timeDiff > 0.2) {
      await getProfessors();
    }
  }

  // fetch professors url and save them into localStorage
  async function getProfessors() {
    try {
      const { data: components } = await nextApi.get('/entities/disciplina');
      await Utils.storage.setItem('next-extension-last', Date.now());
      await Utils.storage.setItem('next-extension-components', components);
      return components;
    } catch (e) {
      console.log('❌ Erro ao atualizar disciplinas');
      console.error(e);
    }
  }

  // fetch matriculas again
  async function getEnrollments() {
    const disciplinas = await Axios.get(MATRICULAS_URL);
    return toJSON(disciplinas.data) || {};
  }

  // get total number of matriculas that was made until now
  async function getAllEnrollments() {
    const enrollments = await getEnrollments();
    return Object.keys(enrollments).length;
  }

  // get matriculas by StudentId
  async function getStudentEnrollments(studentId) {
    const enrollments = await getEnrollments();
    return _.get(enrollments, studentId);
  }

  // get current logged student
  function getStudentId() {
    const scripts = document.querySelectorAll('script');
    const searchString = 'todasMatriculas';
    let studentId = null;

    for (const script of scripts) {
      const content = script.textContent || script.innerHTML;
      if (content.includes(searchString)) {
        const regex = /matriculas\[(\d+)\]/;
        const match = scriptContent.match(regex);

        if (match && match[1]) {
          studentId = Number.parseInt(match[1], 10);
          return; // Interrompe o loop quando o ID é encontrado
        }
      }
    }

    return studentId;
  }

  // find courseId for this season
  function findIdForCurso(name) {
    if (
      _.camelCase(name) == _.camelCase('Bacharelado em Ciências da Computação')
    ) {
      name = 'Bacharelado em Ciência da Computação';
    }
    // normalize to camelCase
    name = _.camelCase(name);

    // check which row matches the name passed
    const course = $('#curso')
      .children()
      .filter((i, item) => name == _.camelCase($(item).text()))[0];

    return $(course).val();
  }

  function currentUser() {
    const userEl = document.querySelector('#usuario_top');
    const rawContent = userEl.textContent || userEl.innerHTML;
    const content = rawContent.replace(/\s*/, '');
    const [user] = content.split('|');
    return user.trim().toLocaleLowerCase();
  }

  // send aluno data
  async function sendAlunoData() {
    const sessionUserName = currentUser();
    const storageUser = `ufabc-extension-${sessionUserName}`;
    const storageRA = `ufabc-extension-ra-${sessionUserName}`;
    const user = await Utils.storage.getItem(storageUser);
    const ra = await Utils.storage.getItem(storageRA);

    if (!user) {
      return;
    }

    // remove as disciplinas cursadas
    for (let i = 0; i < user.length; i++) {
      user[i].cursadas = undefined;
    }

    await nextApi.post('/students', {
      aluno_id: getStudentId(),
      cursos: user.map((info) => {
        info.curso_id = findIdForCurso(info.curso);
        return info;
      }),
      ra,
      login: sessionUserName,
    });
  }

  return {
    updateProfessors,
    getProfessors,
    getAllEnrollments,
    getStudentEnrollments,
    getStudentId,
    findIdForCurso,
    currentUser,
    sendAlunoData,
  };
}
