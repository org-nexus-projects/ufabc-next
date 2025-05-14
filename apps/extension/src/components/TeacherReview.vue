<script setup lang="ts">
import { getStudent, getTeacherReviews, type TeacherReview, type Grade } from '@/services/next';
import { type ChartProps, Chart } from 'highcharts-vue';
import { sortBy } from 'lodash-es';
import { useStorage } from '@/composables/useStorage'
import { resolveColorForConcept } from '@/utils/grades-colors'
import { Student } from '@/services/ufabc-parser';

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
  if (!teacherReviewData.value) {
    return;
  }

  const components = [...(teacherReviewData.value.specific || [])]
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
  if (!teacherReviewData?.value?.general.distribution?.length) {
    return
  }
  const hasList = teacherReviewData?.value?.general.distribution.find(f => f.conceito === 'O')
  return hasList ? 'Provavelmente esse professor cobra presença 👎' : 'Provavelmente esse professor NÃO cobra presença 👍'
})

const targetStudentConcept = computed(() => {
  if (!studentCR.value || !conceptDistribution.value.length) {
    return
  }

  const allCRS = conceptDistribution.value.filter(({ conceito }) => conceito !== 'O' && conceito !== 'F').map(item => item.cr_medio)
  const closest = allCRS.reduce((prev, curr) =>
    Math.abs(curr - studentCR.value) < Math.abs(prev - studentCR.value) ? curr : prev
  );

  const target = conceptDistribution.value.find(c => c.cr_medio === closest);

  return target?.conceito ?? ''
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
async function setupTeacherReviewStats() {
  if (!props.teacherId) {
    return;
  }

  await fetchStudent();
  loading.value = true

  try {
    const reviews = await getTeacherReviews(props.teacherId)
    teacherReviewData.value = reviews

    // Only set initial filter if there are reviews
    if (reviews.general.count && possibleComponents?.value?.length > 0) {
      // Use nextTick to avoid immediate recursive updates
      nextTick(() => {
        filterSelected.value = possibleComponents?.value?.[0]?._id._id;
      })
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
  const student = await getStudent(sigStudent.value.login, sigStudent.value?.ra)
  if (!student) {
    return
  }

  // TODO: fix this - currently we don't have CR in the backend
  studentCR.value = student.graduations?.[1]?.cr || student.graduations?.[0]?.cr
}

function updateFilter() {
  if (!teacherReviewData.value) {
    return
  }

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
        data: sortBy(gradesFiltered, 'name'),
      },
    ],
  }
}

watch(() => props.teacherId, (newTeacherId) => {
  if (newTeacherId) {
    setupTeacherReviewStats()
  }
}, { immediate: true })

watch(filterSelected, (newFilter) => {
  if (teacherReviewData.value && newFilter !== null) {
    updateFilter()
  }
})
</script>

<template>
  <el-dialog :title="'Professor: ' + name" @close="closeDialog()" :visible="isOpen" width="460px" top="2vh"
    :model-value="isOpen" :align-center="true" class="element-dialog mt-4">
    <div v-if="loading ||
     (teacherReviewData?.specific?.length)"
      style="min-height: 200px"
      v-loading="loading" element-loading="Carregando">

      <el-select
      class="flex flex-row flex-auto mb-2"
          placeholder="Selecione a matéria"
          v-model="filterSelected"
          @change="updateFilter()"
          v-if="teacherReviewData?.specific.length"
        >
        <el-option
          v-for="option in possibleComponents"
          :key="option._id._id"
          :label="option._id.name"
          :value="option._id._id"
          />
      </el-select>

      <div class="text-center mt-4" v-if="samplesCount >= 0">
        Total de amostras <b>{{ samplesCount }}</b>
      </div>

      <Chart class="flex flex-row items-center justify-center"
        v-if="teacherReviewData?.specific?.length" :options="chartOptions"
        ></Chart>

      <div class="mt-2" style="text-align: center">
        <b>* {{ hasAttendanceList }}</b>
      </div>

      <div class="flex flex-col items-center flex-wrap justify-center mt-12">
        <div class="flex flex-row items-center justify-center h-10 rounded text-[#4a90e2] text-[15px] w-[300px] border-2 border-solid border-[#4a90e2]" v-if="studentCR">
          Seu CR é <b class="ml-4">{{ studentCR.toFixed(2) }}</b>
        </div>
        <div class="w-[300px] rounded mt-1.5 border-2 border-solid border-[#e6e6e6]" v-if="conceptDistribution.length && studentCR">
          <p class="text-center text-[14px] mt-2.5 mx-5">
            Com seu CR {{ studentCR.toFixed(2) }}, seu conceito com este
            professor <b>provavelmente</b> será:
          </p>
          <div class="flex relative mt-6 mb-5 mx-[38px]">
            <div class="conceito-target" :class="targetStudentConcept">

              <div class="text-center text-[11px]">Você</div>
              <div class="w-[46px] h-[68px] rounded border-4 border-solid border-[#4a90e2]"></div>
            </div>
            <div class="text-[14px] text-[#f95469] w-[42px] mr-0.5 mb-1 flex flex-row flex-wrap" v-for="(conceito, index) in conceitos" :key="index">
              <div class="conceito" :class="conceito.conceito">
                {{ conceito.conceito }}
              </div>
              <div class="flex w-full text-[12px] justify-center h-5 items-center text-[rgba(0,0,0,0.35)] mt-1 bg-[#e6e6e6]">
                {{ findConcept(conceito.conceito) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-row items-center justify-center" style="min-height: 100px" v-else>
      Nenhum dado encontrado
    </div>
    <template #footer>
      <span class="flex">
        <i class="text-[rgba(0,_0,_0,_0.6)] inline-flex text- sm flex-row mr-4">* Dados baseados nos alunos que utilizam a extensão</i>
      </span>
    </template>
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

.conceito-target {
  position: absolute;
  bottom: 0px;
  left: -2px;
}

.conceito-target.B {
  left: 42px;
}
.conceito-target.C {
  left: 86px;
}
.conceito-target.D {
  left: 130px;
}
.conceito-target.F {
  left: 174px;
}
</style>

<style lang="css">
.element-dialog .el-dialog__body {
  padding-top: 16px;
}
</style>
