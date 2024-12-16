<script setup lang="ts">
import Cortes from '@/components/Cortes.vue';
import Teachers from '@/components/Teachers.vue';
import { getComponents } from '@/services/next';
import { render } from 'vue';
import SubjectReview from '@/components/SubjectReview.vue';
import { useStorage } from '@/composables/useStorage'
import { getStudentCourseId, getStudentId } from '@/utils/ufabc-matricula-student'
import type { UFABCMatriculaStudent } from '.';
import type { Student } from '@/scripts/sig/homepage';


type Filter = {
  name: 'Santo André' | 'São Bernardo' | 'Noturno' | 'Matutino'
  val: boolean
  comparator: 'bernardo' | 'andr' | 'diurno' | 'noturno'
  class: 'notAndre' | 'notBernardo' | 'notNoturno' | 'notMatutino'
}

const matriculas = inject<typeof window.matriculas>('matriculas')
const matriculaStudent = inject<UFABCMatriculaStudent>('student')

const selected = ref(false)
const cursadas = ref(false)

const showWarning = ref(false);
const teachers = ref(false);

const { state: student } = useStorage<Student>('local:student');

const campusFilters = ref<Filter[]>([
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

const shiftFilters = ref<Filter[]>([
  {
    name: 'Noturno',
    class: 'notNoturno',
    val: true,
    comparator: 'diurno',
  },
  {
    name: 'Matutino',
    class: 'notMatutino',
    val: true,
    comparator: 'noturno',
  },
]);

const subjectReview = ref<{ isOpen: boolean; subjectId: string | null }>({
    isOpen: false,
    subjectId: null,
});

const kicksModal = ref<{ isOpen: boolean; corteId: string | null }>({
  isOpen: false,
  corteId: null
})

const teacherReview = ref<{ isOpen: boolean; teacherId: string | null; name: string | null }>({
  isOpen: false,
  name: null,
  teacherId: null
})

function openSubjectReview(subjectId: string) {
  subjectReview.value.isOpen = true;
  subjectReview.value.subjectId = subjectId;
}

function closeSubjectReview() {
  subjectReview.value.isOpen = false;
  subjectReview.value.subjectId = null;
}

function openTeacherReview(teacherId: string, name: string) {
  teacherReview.value.isOpen = true
  teacherReview.value.teacherId = teacherId
  teacherReview.value.name = name;
}

function closeTeacherReview() {
  teacherReview.value.isOpen = false;
  teacherReview.value.teacherId = null;
  teacherReview.value.name = null;
}

function openKicksModal(corteId: string) {
  kicksModal.value.isOpen = true;
  kicksModal.value.corteId = corteId;
}

function closeKicksModal() {
  kicksModal.value.isOpen = false;
  kicksModal.value.corteId = null;
}

// todo: utilizar o storage da extensão
function changeSelected() {
  const notSelected = document.querySelectorAll<HTMLTableCaptionElement>('.notSelecionada')
  if (!selected.value) {
    for (const $el of notSelected) {
      $el.style.display = ''
    }
    return;
  }

  if (!matriculaStudent) {
    console.log('show some message to the user')
    return
  }

  const enrollments = matriculas?.[matriculaStudent?.studentId] || []
  const tableRows = document.querySelectorAll('tr')

  for (const $row of tableRows) {
    const componentId = $row.getAttribute('value')
    if (componentId && !enrollments?.includes(componentId.toString())) {
      $row.classList.add('notSelecionada')
      $row.style.display = 'none'
    }
  }
}


function changeCursadas() {
  const isCursadas = document.querySelectorAll<HTMLSpanElement>('.isCursada');
    if (!cursadas.value) {
    for (const $el of isCursadas) {
      $el.style.display = ''
    }
    return;
  }

  if (!student.value) {
    console.warn('Não encontramos suas disciplinas cursadas, por favor acesse o sigaa')
    return
  }

  const passed = student.value?.graduations[0].components
    .filter((c) => c.grade !== null && ['A', 'B', 'C', 'D', 'E'].includes(c.grade))
    .map((c) => c.name);

    const trData = document.querySelectorAll<HTMLTableSectionElement>('table tr td:nth-child(3)')
      for (const $el of trData) {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const [component] = $el?.textContent?.split('-')!
    const name = component.substring(0, component.lastIndexOf(' '))
    if (passed?.includes(name)) {
      $el?.parentElement?.classList.add('isCursada');
      if ($el.parentElement) {
        $el.parentElement.style.display = 'none';
      }
    }
  }
}

function applyFilter(params: Filter) {
  if (!params.val) {
    const tableData = document.querySelectorAll<HTMLTableElement>('#tabeladisciplinas tr td:nth-child(3)')
    for (const data of tableData) {
      const subject = data.textContent?.toLocaleLowerCase()
      if (!subject) {
        return;
      }
      if (!subject?.includes(params.comparator.toLocaleLowerCase())) {
        if (data.parentElement) {
          data.parentElement.style.display = 'none';
        }
      }
    }

    return
  }


  const allTr = document.querySelectorAll<HTMLTableRowElement>('#tabeladisciplinas tr')
  for (const tr of allTr) {
    tr.style.display = ''
  }
}


function handleClick(event: MouseEvent) {
const target = event.target as HTMLElement;
  if (target.closest("#cortes")) {
    const corteElement = target.closest("#cortes");
    if (!corteElement) {
      return;
    }
    const corteId =
      corteElement.parentElement?.parentElement?.getAttribute("value");
    if (corteId) {
      openKicksModal(corteId);
    }
  } else if (target.matches("span.sa, span.sbc")) {
    const subjectId = target.getAttribute("subjectId");
    if (subjectId) {
      openSubjectReview(subjectId);
    }
  } else if(target.matches('.ReviewTeacher')) {
    const teacherId = target.getAttribute('data')
    const teacherName = target.getAttribute('teacherName')
    if (teacherId && teacherName) {
      openTeacherReview(teacherId, teacherName)
    }
  }
}

async function buildComponents() {
  if (!teachers.value) {
    for (const $element of document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')) {
      $element.style.display = 'none'
    }
    return
  }
 // se ja tiver calculado nao refaz o trabalho
 const teacherReviews = document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview');
  if (teacherReviews.length > 0) {
    for (const $element of document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')) {
      $element.style.display = ''
    }
    return;
  }
  const components = await getComponents()
  const componentsMap = new Map(
    components.map((component) => [
      component.disciplina_id.toString(),
      component,
    ]),
  );

  const mainTable = document.querySelectorAll('table tr');
  for (const row of mainTable) {
    const el = row.querySelector<HTMLTableColElement>('td:nth-child(3)');
    const subjectEl = row.querySelector<HTMLSpanElement>('td:nth-child(3) > span');
    const corteEl = row.querySelector('td:nth-child(5)');
    const componentId = row.getAttribute('value');
    if (!componentId) {
      continue;
    }
    const component = componentsMap.get(componentId);
    if (!component) {
      continue;
    }

    if (component.subject && subjectEl) {
      subjectEl.style.cursor = 'pointer'

      subjectEl.addEventListener('mouseenter', () => {
        subjectEl.style.textDecoration = 'underline';
      });

      subjectEl.addEventListener('mouseleave', () => {
        subjectEl.style.textDecoration = 'none';
      });

      subjectEl.setAttribute('subjectId', component.subjectId);
    }

    const teacherContainer = document.createElement('div')
    el?.appendChild(teacherContainer)

    render(h(Teachers, {
      teoria: component.teoria,
      teoriaId: component.teoriaId,
      pratica: component.pratica,
      praticaId: component.praticaId,
    }), teacherContainer)

    const cortesContainer = document.createElement('div');
    corteEl?.appendChild(cortesContainer);

    render(h(Cortes), cortesContainer)
  }
}

onMounted(async () => {
  document.body.addEventListener("click", handleClick);
  const studentId = getStudentId()
  const graduationId = getStudentCourseId()
  await storage.setItem(`sync:${student.value?.ra}`, {
    studentId,
    graduationId,
  })

  teachers.value = true;
  await buildComponents();
})

onUnmounted(() => {
  document.body.removeEventListener('click', handleClick)
})
</script>

<template>
  <div
    class="flex flex-row sticky top-0 bg-white min-h-14 pl-6 pt-1.5 z-10 pb-3 border-b border-black/[0.08] rounded-b-lg">
    <div class="mr-4 flex flex-row items-center">
      <img src="@/public/icon-38.png" class="w-8 h-8" />
    </div>

    <section class="mr-5">
      <h3 class="font-medium text-[14px] mb-0.5 text-black/90">Câmpus</h3>
      <el-checkbox v-for="(filter, index) in campusFilters" :key="index" @change="applyFilter(filter)"
        v-model="filter.val">
        {{ filter.name }}
      </el-checkbox>
    </section>

    <section class="mr-5">
      <h3 class="font-medium text-[14px] mb-0.5 text-black/90">Turno</h3>
      <el-checkbox v-for="(filter, index) in shiftFilters" :key="index" @change="applyFilter(filter)"
        v-model="filter.val">
        {{ filter.name }}
      </el-checkbox>
    </section>

    <section class="pr-5">
      <h3 class="font-medium text-[14px] mb-0.5 text-black/90">Filtros</h3>
      <el-switch class="mr-3" active-text="Disciplinas escolhidas" v-model="selected" @change="changeSelected()">
      </el-switch>

      <el-switch class="mr-3" active-text="Disciplinas cursadas" style="font-size: 13px;" v-model="cursadas"
        @change="changeCursadas()">
      </el-switch>


      <el-popover v-if="showWarning" placement="bottom" title="Atenção" width="450" trigger="hover">
        <div>
          Faz mais de uma semana que você não sincroniza seus dados.<br />
          Isso pode acabar afetando a ordem dos chutes. <br /><br />
          <a href="https://aluno.ufabc.edu.br/fichas_individuais" target="_blank" class="text-[#0000ee]">
            Atualizar dados agora
          </a>
        </div>
        <el-button v-if="showWarning" slot="reference" type="danger" icon="el-icon-warning" class="ml-3" circle>
        </el-button>
      </el-popover>
    </section>
  </div>

    <SubjectReview
      :is-open="subjectReview.isOpen"
      :subject-id="subjectReview.subjectId"
      @close="closeSubjectReview"
    />
    <KicksModal
      :is-open="kicksModal.isOpen"
      :corte-id="kicksModal.corteId"
      @close="closeKicksModal"
    />
   <TeacherReview
    :is-open="teacherReview.isOpen"
    :teacher-id="teacherReview.teacherId"
    :name="teacherReview.name"
    @close="closeTeacherReview"
   />
</template>

<style scoped lang="css"></style>
