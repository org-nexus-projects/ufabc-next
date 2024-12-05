<script setup lang="ts">
import type { Student } from '@/scripts/sig/homepage';
import { getStudent, getTeacherReviews, type TeacherReview, type Grade } from '@/services/next';
import { type ChartProps, Chart } from 'highcharts-vue';
import { sortBy } from 'lodash-es';

type ChartOptions = ChartProps['options']

const props = defineProps<{
  isOpen: boolean
  teacherId: string | null
  name: string | null
}>()

const emit = defineEmits(['close'])
const teacherReviewData = ref<TeacherReview | null>(null)
const loading = ref(false);
const samplesCount = ref<number>(0);
const filterSelected = ref()
const studentCR = ref()
const chartOptions = ref<ChartOptions>({
  chart: {
    type: "pie",
    options3d: {
      enabled: true,
      alpha: 45
    },
    width: 380,
    height: 240
  },
  title: {
    text: ''
  },
  tooltip: {
    pointFormat: 'Porcentagem: <b>{point.percentage:.1f}%</b>'
  },
  plotOptions: {
    pie: {
      animation: {
        duration: 200,
      },
      depth: 20,
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        format: '{key}: <b>{point.percentage:.1f}%</b>',
        enabled: true
      },
      showInLegend: true
    }
  },
  series: []
})
const { state: sigStudent } = useStorage<Student>('local:student')
const conceitos = ref<Record<string, Grade>[]>([
  { conceito: 'A' },
  { conceito: 'B' },
  { conceito: 'C' },
  { conceito: 'D' },
  { conceito: 'F' },
])

const possibleComponents = computed(() => {
  if (!teacherReviewData) {
    return;
  }
  const components = teacherReviewData?.value?.specific
  const generalDefaults = {
    _id: {
      _id: 'all',
      name: 'Todas as matérias'
    }
  }
  const general = Object.assign(generalDefaults, teacherReviewData?.value?.general)
  components?.push(general)
  return components?.reverse()
})

const conceptDistribution = computed(() => {
  if (!filterSelected.value) {
    return []
  }

  let filter;
  if (filterSelected.value === 'all') {
    filter = teacherReviewData?.value?.general
  } else {
    filter = teacherReviewData?.value?.specific.find((specific) =>
      specific._id._id === filterSelected.value
    );
  }

  return sortBy(filter?.distribution, 'conceito')
})

const hasAttendanceList = computed(() => {
  if (teacherReviewData?.value?.general.distribution?.length) {
    return
  }

  const hasList = teacherReviewData?.value?.general.distribution.find(f => f.conceito === 'O')
  return hasList ? 'Provavelmente esse professor cobra presença 👎' : 'Provavelmente esse professor NÃO cobra presença 👍'
})

function closeDialog() {
  filterSelected.value = null
  teacherReviewData.value = null;
  samplesCount.value = 0
  emit('close')
}

function findConcept(grade: Grade) {
  const concept = conceptDistribution.value.find(t => t.conceito === grade)
  return concept ? concept.cr_medio.toFixed(2) : '-'
}

function findCount(grade: Grade) {
  const concept = conceptDistribution.value.find(t => t.conceito === grade)
  return concept ? concept.count : '-'
}

async function setupTeacherReviewStats() {
  if (!props.teacherId) {
    return;
  }

  await fetchStudent();
  loading.value = true

  try {
    const reviews = await getTeacherReviews(props.teacherId)
    teacherReviewData.value = reviews
    if (reviews.general.count) {
      filterSelected.value = possibleComponents?.value?.[0]._id._id;
      setTimeout(() => {
        updateFilter()
      }, 500);
    }
  } catch (err) {
    console.log(err)
    closeDialog()
  } finally {
    loading.value = false
  }
}

async function fetchStudent() {
  // call next student with coefficient
  if (!sigStudent.value) {
    return;
  }
  const student: { cursos: any[] } = await getStudent(sigStudent.value?.login, sigStudent.value?.ra)
  if (!student) {
    return
  }

  // TODO: fix this - currently we dont have CR in the backend
  studentCR.value = (student.cursos[0].cr ?? 0) || (student.cursos[1].cr ?? 0)
}

function updateFilter() {
  let filter;
  if (filterSelected.value === 'all') {
    filter = teacherReviewData?.value?.general;
  } else {
    filter = teacherReviewData?.value?.specific.find((specific) =>
      specific._id._id === filterSelected.value
    );
  }

  const gradesFiltered = filter?.distribution.map(grade => ({
    name: grade.conceito,
    y: grade.count,
    color: resolveColorForConcept(grade.conceito)
  }))

  samplesCount.value = filter?.count ?? 0

  chartOptions.value = {
    ...chartOptions.value,
    series: [
      {
        name: 'Conceito',
        data: gradesFiltered,
      },
    ],
    plotOptions: {
      pie: {
        colors: gradesFiltered?.map(grade => grade.color)
      }
    }
  }
}

watch(() => props.teacherId, async (newTeacherId) => {
  if (newTeacherId) {
    await setupTeacherReviewStats()
  }
}, { immediate: true })

watch(filterSelected, () => {
  if (teacherReviewData.value) {
    updateFilter()
  }
})
</script>

<template>
  <el-dialog :title="'Professor: ' + name" @close="closeDialog()" :visible="isOpen" width="460px" top="2vh"
    :model-value="isOpen" :align-center="true" class="element-dialog mt-4">
    <div style="min-height: 200px" v-loading="loading" element-loading="Carregando"
      v-if="loading || teacherReviewData?.specific?.length">
      <el-select class="ufabc-flex ufabc-row mb-2" placeholder="Selecione a matéria" @change="updateFilter()"
        v-model="filterSelected">
        <el-option v-for="option in possibleComponents" :key="option._id._id" :label="option._id.name"
          :value="option._id._id">
        </el-option>
      </el-select>

      <div class="text-center mt-4" v-if='samplesCount >= 0'>
        Total de amostras <b>{{samplesCount}}</b>
      </div>

      <Chart class="flex flex-row items-center justify-center" :options="chartOptions" />

      <div class="mt-2" style="text-align: center;">
        <b>* {{ hasAttendanceList }}</b>
      </div>

      <div class="w-12 h-16 rounded border-4 border-solid border-[#4a90e2]">
        <div class="flex flex-row text-sm text-[#f95469] flex-wrap w-[42px] mr-0.5 mb-1"
          v-for="(concept, index) in conceitos" :key="index">
          <div class="conceito" :class="concept.conceito">{{ concept.conceito }} </div>
          <div class="flex w-full text-xs justify-center h-5 items-center text-[rgba(0,0,0,0.35)] mt-0.5 bg-[#e6e6e6]">
            {{ findConcept(concept.conceito) }}
          </div>
        </div>
      </div>

    </div>
    <div class="ufabc-row ufabc-align-center ufabc-justify-middle" style="min-height: 100px" v-else>
      Nenhum dado encontrado
    </div>
    <span slot="footer" class="dialog-footer">
      <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
    </span>
  </el-dialog>
</template>


<style scoped lang="css">
.conceito {
  width: 42px;
  height: 42px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-family: Ubuntu;
  color: #fff;
}

.conceito.A {
  background: #3fcf8c;
}

.conceito.B {
  background: #b8e986;
}

.conceito.C {
  background: #f8b74c;
}

.conceito.D {
  background: #ffa004;
}

.conceito.F {
  background: #f95469;
}
</style>

<style lang="css">
.element-dialog .el-dialog__body {
  padding-top: 16px;
}
</style>
