<template>
  <div class="ufabc-row filters">
    <div class="mr-3 ufabc-row ufabc-align-center">
      <img
        :src="getURL('/images/icon-128.png')"
        style="width: 32px; height: 32px"
      />
    </div>
    <div class="mr-5">
      <div class="title-filter">Câmpus</div>
      <div>
        <el-checkbox
          v-for="(filter, index) in campusFilters"
          :key="index"
          @change="applyFilter(filter)"
          v-model="filter.val"
        >
          {{ filter.name }}
        </el-checkbox>
      </div>
    </div>
    <i class="mdi mdi-ear"></i>
    <div class="mr-5">
      <div class="title-filter">Turno</div>
      <div>
        <el-checkbox
          v-for="(filter, index) in shiftFilters"
          :key="index"
          @change="applyFilter(filter)"
          v-model="filter.val"
        >
          {{ filter.name }}
        </el-checkbox>
      </div>
    </div>

    <div class="pr-5">
      <div class="title-filter">Filtros</div>
      <div>
        <el-switch
          class="mr-3 ufabc-element-switch"
          active-text="Disciplinas escolhidas"
          v-model="selected"
          @change="changeSelected()"
        ></el-switch>

        <el-switch
          class="mr-3 ufabc-element-switch"
          active-text="Disciplinas cursadas"
          v-model="cursadas"
          @change="changeCursadas()"
        ></el-switch>

        <el-popover
          v-if="showWarning"
          placement="bottom"
          title="Atenção"
          width="450"
          trigger="hover"
        >
          <div class="warning-advice">
            Faz mais de uma semana que você não sincroniza seus dados.<br />
            Isso pode acabar afetando a ordem dos chutes. <br /><Br />
            <a
              href="https://aluno.ufabc.edu.br/fichas_individuais"
              target="_blank"
            >
              Atualizar dados agora
            </a>
          </div>
          <el-button
            v-if="showWarning"
            slot="reference"
            type="danger"
            icon="el-icon-warning"
            class="ml-3"
            circle
          ></el-button>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import $ from 'jquery';
import matriculaUtils from '../utils/Matricula';
import Utils from '../utils/extensionUtils';
import Mustache from 'mustache';


const getURL = (path) => Utils.getChromeUrl(path);

const showWarning = ref(false);
const selected = ref(false);
const cursadas = ref(false);
const teachers = ref(false);

const shiftFilters = ref([
  {
    name: 'Noturno',
    class: 'notNoturno',
    val: true,
    comparator: 'matutino',
  },
  {
    name: 'Matutino',
    class: 'notMatutino',
    val: true,
    comparator: 'noturno',
  },
]);

const campusFilters = ref([
  {
    name: 'São Bernardo',
    class: 'notBernardo',
    val: true,
    comparator: 'andr', //isso está correto
  },
  {
    name: 'Santo André',
    class: 'notAndre',
    val: true,
    comparator: 'bernardo',
  },
]);

onMounted(async () => {
  const students = await Utils.storage.getItem('ufabc-extension-students');
  const currentUser = matriculaUtils.currentUser();

  console.log(currentUser, 'joabe?');

  const student = students.find((student) => student.name === currentUser);
  console.log(students)
  if (student && student.lastUpdate) {
    const diff = Date.now() - student.lastUpdate;
    const MAX_UPDATE_DIFF = 1000 * 60 * 60 * 24 * 7; // 7 days
    if (diff > MAX_UPDATE_DIFF) {
      showWarning.value = true;
    }
  }

  const htmlPop = await Utils.fetchChromeUrl(
        'pages/matricula/fragments/professorPopover.html',
      );
  console.log(htmlPop)

  teachers.value = true;

  changeTeachers();
});

function changeTeachers() {
  if (!teachers.value) {
    $('.isTeacherReview').css('display', 'none');
    return;
  }

  // se ja tiver calculado nao refaz o trabalho
  if ($('.isTeacherReview').length > 0) {
    $('.isTeacherReview').css('display', '');
    return;
  }

  Utils.storage
    .getItem('ufabc-extension-disciplinas')
    .then(async (components) => {
      if (components == null) {
        components = await matriculaUtils.getProfessors();
      }

      const componentMap = new Map(
        components.map((component) => [
          component.disciplina_id.toString(),
          component,
        ]),
      );

      const htmlPop = await Utils.fetchChromeUrl(
        'pages/matricula/fragments/professorPopover.html',
      );
      const corteHtml = await Utils.fetchChromeUrl(
        'pages/matricula/corte.html',
      );

      const mainTable = document.querySelectorAll('table tr');

      for (const row of mainTable) {
        const el = row.querySelector('td:nth-child(3)');
        const subjectEl = row.querySelector('td:nth-child(3) > span');
        const corteEl = row.querySelector('td:nth-child(5)');
        const componentId = row.getAttribute('value');

        const component = componentMap.get(componentId);
        if (!component) {
          continue;
        }

        if (component.subject) {
          subjectEl.setAttribute('subjectId', component.subject);
        }

        el.insertAdjacentHTML(
          'beforeend',
          Mustache.render(htmlPop.data, component),
        );
        corteEl.insertAdjacentHTML('beforeend', corteHtml.data);
      }
    });
}

function changeSelected() {
  if (!selected.value) {
    $('.notSelecionada').css('display', '');
    return;
  }

  const studentId = matriculaUtils.getAlunoId();
  const matriculas = window.matriculas[studentId] || [];

  $('tr').each(function () {
    const componentId = $(this).attr('value');
    if (componentId && !matriculas.includes(componentId.toString())) {
      $(this).addClass('notSelecionada');
      $(this).css('display', 'none');
    }
  });
}

function changeCursadas() {
  if (!cursadas.value) {
    $('.isCursada').css('display', '');
    return;
  }

  const storageUser = `ufabc-extension-${matriculaUtils.currentUser()}`;
  Utils.storage.getItem(storageUser).then((cursadas) => {
    if (cursadas == null) {
      console.log('nao temos o que vc cursou, acesse o sigaa');
      return;
    }

    const allCursadas = cursadas[0].cursadas
      .filter((c) => ['A', 'B', 'C', 'D', 'E'].includes(c.conceito))
      .map((c) => c.disciplina);

    $('table tr td:nth-child(3)').each(function () {
      const el = $(this);
      // tira apenas o nome da disciplina -> remove turma, turno e campus
      let name = el.text().split('-')[0];
      name = name.substring(0, disciplina.lastIndexOf(' '));
      if (allCursadas.includes(name)) {
        el.parent().addClass('isCursada');
        el.parent().css('display', 'none');
      }
    });
  });
}

function applyFilter(params) {
  if (!params.val) {
    $('#tabeladisciplinas tr td:nth-child(3)').each(function () {
      const campus = $(this).text().toLowerCase();
      if (campus.indexOf(params.comparator) === -1) {
        $(this).parent().addClass(params.class);
      }
    });
    return;
  }

  $('#tabeladisciplinas tr').each(function () {
    $(this).removeClass(params.class);
  });
}
</script>

<style scoped lang="css">
* {
  font-family: Ubuntu;
}
.filters {
  position: sticky;
  top: 0px;
  background: #fff;
  min-height: 56px;
  padding-left: 24px;
  padding-top: 6px;
  z-index: 1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 12px;
}

.title-filter {
  font-size: 14px;
  margin-bottom: 2px;
  color: rgba(0, 0, 0, 0.9);
}
.warning-advice > a {
  color: rgb(0, 0, 238);
}
</style>
