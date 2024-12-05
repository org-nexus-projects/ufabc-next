<script setup lang="ts">
import type { Student } from '@/scripts/sig/homepage';
import { getStudent, getTeacherReviews, type Grade } from '@/services/next';
import { type ChartProps, Chart } from 'highcharts-vue';
import { sortBy } from 'lodash-es';

type ChartOptions = ChartProps['options']

const props = defineProps<{
  isOpen: boolean
  teacherId: string | null
  name: string | null
}>()

const emit = defineEmits(['close'])
const teacherReviewData = ref<any | null>(null)
const loading = ref(false);
const samplesCount = ref<number>(0);
const filterSelected = ref(null)
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
        // innerSize: 100,
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


const possibleComponents = computed(() => {
  if (!teacherReviewData) {
    return;
  }
  const components = teacherReviewData.value.specific
  const generalDefaults = {
    _id: {
      _id: 'all',
      name: 'Todas as matérias'
    }
  }
  const general = Object.assign(generalDefaults, teacherReviewData.value.general)
  components.push(general)
  return components.reverse()
})

const conceptDistribution = computed(() => {
  if(!filterSelected.value) {
    return []
  }

  let filter;
  if (filterSelected.value === 'all') {
    filter = teacherReviewData.general
  } else {
    filter = teacherReviewData.value.specific.find((specific) =>
      specific._id._id === filterSelected.value
    );
  }

  return sortBy(filter?.distribution, 'conceito')
})

const hasAttendanceList = computed(() => {
  if (teacherReviewData.value.general.distribution?.length) {
    return
  }

  const hasList = teacherReviewData.value.general.distribution.find(f => f.conceito === 'O')
  return hasList ? 'Provavelmente esse professor cobra presença 👎' : 'Provavelmente esse professor NÃO cobra presença 👍'
})

function closeDialog() {
  filterSelected.value = null
  teacherReviewData.value = null;
  samplesCount.value = 0
  emit('close')
}

function findConcept(grade: Grade) {
  const concept = conceptDistribution.value.find(t => t.concept === grade)
  return concept ? concept.cr_medio.toFixed(2) : '-'
}

function findCount(grade: Grade) {
  const concept = conceptDistribution.value.find(t => t.concept === grade)
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
    if (reviews.general.count || 0) {
      filterSelected.value = possibleComponents.value[0]._id._id;
      setTimeout(() => {
        updateFilter()
      }, 500);
    }
  } catch(err) {
    console.log(err)
    closeDialog()
  } finally {
    loading.value = false
  }
}

async function fetchStudent() {
  // call next student with coefficient
  const student: { cursos: any[] } = await getStudent(sigStudent.value?.login, sigStudent.value?.ra)
  if (!student) {
    return
  }

  studentCR.value = (student.cursos[0].cr ?? 0) || (student.cursos[1].cr ?? 0)
}

function updateFilter() {
  let filter;
  if (filterSelected.value === 'all') {
    filter = teacherReviewData.value.general;
  } else {
    filter = teacherReviewData.value.specific.find((specific) =>
      specific._id._id === filterSelected.value
    );
  }

  const gradesFiltered = filter?.distribution.map(grade => ({
    name: grade.conceito,
    y: grade.count,
    color: resolveColorForConcept(grade.conceito)
  }))

  samplesCount.value = filter.count

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
    Hi
  </el-dialog>
</template>

<style lang="css">
.element-dialog .el-dialog__body {
  padding-top: 16px;
}
</style>
