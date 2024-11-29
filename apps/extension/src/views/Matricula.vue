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
import { ref, onMounted } from "vue";
import matriculaUtils from "../utils/Matricula";
import Utils from "../utils/extensionUtils";
import Mustache from "mustache";

const getURL = (path) => Utils.getChromeUrl(path);

const showWarning = ref(false);
const selected = ref(false);
const cursadas = ref(false);
const teachers = ref(false);

const shiftFilters = ref([
  {
    name: "Noturno",
    class: "notNoturno",
    val: true,
    comparator: "matutino",
  },
  {
    name: "Matutino",
    class: "notMatutino",
    val: true,
    comparator: "noturno",
  },
]);

const campusFilters = ref([
  {
    name: "São Bernardo",
    class: "notBernardo",
    val: true,
    comparator: "andr", //isso está correto
  },
  {
    name: "Santo André",
    class: "notAndre",
    val: true,
    comparator: "bernardo",
  },
]);

onMounted(async () => {
  try {
    const students = await Utils.storage.getItem("ufabc-extension-students");
    const currentUser = matriculaUtils.currentUser();

    let student = null;

    if (students && Array.isArray(students)) {
      student = students.find((student) => student.name === currentUser);
    }

    // biome-ignore lint/complexity/useOptionalChain: Babel does not support
    if (student && student.lastUpdate) {
      const diff = Date.now() - student.lastUpdate;
      const MAX_UPDATE_DIFF = 1000 * 60 * 60 * 24 * 7; // 7 days
      if (diff > MAX_UPDATE_DIFF) {
        showWarning.value = true;
      }
    }

    teachers.value = true;
    await changeTeachers();
  } catch (error) {
    console.error("Error during onMounted execution:", error);
  }
});

async function changeTeachers() {
  if (!teachers.value) {
    for (const $element of document.querySelectorAll(".isTeacherReview")) {
      $element.style.display = "none";
    }
    return;
  }

  // se ja tiver calculado nao refaz o trabalho
  const teacherReviews = document.querySelectorAll(".isTeacherReview");
  if (teacherReviews.length > 0) {
    for (const $element of document.querySelectorAll(".isTeacherReview")) {
      $element.style.display = "";
    }
    return;
  }

  let components = await Utils.storage.getItem("next-extension-components");

  if (components == null) {
    components = await matriculaUtils.getProfessors();
  }

  const componentsMap = new Map(
    components.map((component) => [
      component.disciplina_id.toString(),
      component,
    ])
  );

  const htmlPop = await Utils.fetchChromeUrl(
    "pages/matricula/fragments/professorPopover.html"
  );
  const corteHtml = await Utils.fetchChromeUrl("pages/matricula/corte.html");

  const mainTable = document.querySelectorAll("table tr");

  for (const row of mainTable) {
    const el = row.querySelector("td:nth-child(3)");
    const subjectEl = row.querySelector("td:nth-child(3) > span");
    const corteEl = row.querySelector("td:nth-child(5)");
    const componentId = row.getAttribute("value");

    const component = componentsMap.get(componentId);
    if (!component) {
      continue;
    }

    if (component.subject) {
      subjectEl.setAttribute("subjectId", component.subjectId);
    }
    const data = { disciplina: component };
    const rendered = Mustache.render(htmlPop.data, {
      disciplina: {
        teoria: {
          _id: component.teoriaId,
          name: component.teoria,
        },
        pratica: {
          _id: component.praticaId,
          name: component.pratica,
        },
      },
    });

    el.insertAdjacentHTML("beforeend", rendered);
    corteEl.insertAdjacentHTML("beforeend", corteHtml.data);
  }
}

function changeSelected() {
  const notSelected = document.querySelectorAll(".notSelecionada");
  if (!selected.value) {
    for (const $el of notSelected) {
      $el.style.display = "";
    }
    return;
  }

  const studentId = matriculaUtils.getStudentId();
  const enrollments = window.matriculas[studentId] || [];
  const tableRows = document.querySelectorAll("tr");

  for (const $row of tableRows) {
    const componentId = $row.getAttribute("value");
    if (componentId && !enrollments.includes(componentId.toString())) {
      $row.classList.add("notSelecionada");
      $row.style.display = "none";
    }
  }
}

async function changeCursadas() {
  const isCursadas = document.querySelectorAll(".isCursada");
  if (!cursadas.value) {
    for (const $el of isCursadas) {
      $el.style.display = "";
    }
    return;
  }

  const storageUser = `ufabc-extension-${matriculaUtils.currentUser()}`;
  const [cursadasData] = await Utils.storage.getItem(storageUser);
  if (cursadasData == null) {
    console.log("nao temos o que vc cursou, acesse o sigaa");
    return;
  }
  const allCursadas = cursadasData.cursadas
    .filter((c) => ["A", "B", "C", "D", "E"].includes(c.conceito))
    .map((c) => c.disciplina);

  const trData = document.querySelectorAll("table tr td:nth-child(3)");
  for (const $el of trData) {
    const [component] = $el.textContent.split("-");
    const name = component.substring(0, component.lastIndexOf(" "));
    if (allCursadas.includes(name)) {
      $el.parentElement.classList.add("isCursada");
      $el.parentElement.style.display = "none";
    }
  }
}

function applyFilter(params) {
  if (!params.val) {
    const tableData = document.querySelectorAll(
      "#tabeladisciplinas tr td:nth-child(3)"
    );
    for (const data of tableData) {
      const campus = data.textContent.toLocaleLowerCase();
      if (!campus.includes(params.comparator)) {
        el.parentElement.classList.add(params.class);
      }
    }
    return;
  }

  const allTr = document.querySelectorAll("#tabeladisciplinas tr");
  for (const tr of allTr) {
    tr.classList.remove(params.class);
  }
}
</script>

<style scoped>
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
