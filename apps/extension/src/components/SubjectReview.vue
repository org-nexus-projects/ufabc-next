<script setup lang="ts">
import { getSubjectReviews, type SubjectReview } from '@/services/next';
import { Chart , type ChartProps } from 'highcharts-vue';

type ChartOptions = ChartProps['options']

const props = defineProps<{
  isOpen: boolean
  subjectId: string | null
}>()

const emit = defineEmits(['close'])
const subjectDistributionData = ref<SubjectReview | null>(null)
const loading = ref(false);
const samplesCount = ref<number>(0);
const filterSelected = ref(null)
const chartOptions = ref<ChartOptions>({
  chart: {
    type: "pie",
    plotBackgroundColor: undefined,
    plotBorderWidth: undefined,
    plotShadow: false,
    width: 380,
    height: 240
  },
  title: {
    text: ''
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
      },
      showInLegend: true,
      animation: {
        duration: 200,
      },
    }
  },
});

const subject = computed(() => subjectDistributionData.value?.subject.name ?? '')

const possibleComponents = computed(() => {
  const components = subjectDistributionData?.value?.specific;
  const generalDefaults = {
    _id: {
      _id: 'all',
      name: 'Todas as matérias',
    },
  };
  const general = Object.assign(generalDefaults, subjectDistributionData?.value?.general);
  // @ts-ignore Nullable case
  components?.push(general);

  return components?.reverse();
});

function closeDialog() {
  filterSelected.value = null
  subjectDistributionData.value = null;
  samplesCount.value = 0
  emit('close')
}

async function setupSubjectStats() {
  const subjectId = props.subjectId;

  if (!subjectId) {
    return;
  }

  loading.value = true;

  try {
    const reviews = await getSubjectReviews(subjectId)
    subjectDistributionData.value = reviews;
    loading.value = false;

    if (!possibleComponents.value) {
      return;
    }

    filterSelected.value = possibleComponents.value[0]._id._id;
    if (reviews.general.count || 0) {
      setTimeout(() => {
        updateFilter()
      }, 500);
    }
  } catch(error) {
    console.log('dialog error', error);
    closeDialog();
  } finally {
    loading.value = false;
  }
}

function updateFilter() {
  if (!subjectDistributionData.value) {
    return
  }

  let filter;
  if (filterSelected.value === 'all') {
    filter = subjectDistributionData.value.general;
  } else {
    filter = subjectDistributionData.value.specific.find((specific) =>
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

watch(() => props.subjectId, async (newSubjectId) => {
  if (newSubjectId) {
    await setupSubjectStats()
  }
}, { immediate: true })

watch(filterSelected, () => {
  if (subjectDistributionData.value) {
    updateFilter()
  }
})
</script>

<template>
  <el-dialog
  :title="'Disciplina: ' + subject"
  @close="closeDialog()"
  :visible="isOpen"
  width="800px"
  top="2vh"
  :model-value="isOpen"
  :align-center="true"
  class="element-dialog mt-4">
  <div v-if='loading || subjectDistributionData?.specific?.length'
    style="min-height: 200px"
    v-loading="loading"
    element-loading="Carregando">
    <div class="text-center mt-4" v-if='samplesCount >= 0'>
      Total de amostras <b>{{samplesCount}}</b>
    </div>

    <Chart
      class="flex flex-row items-center justify-center"
        v-if='subjectDistributionData?.specific?.length'
        :options="chartOptions"
        ref="pieChart"
    ></Chart>

  </div>
  <div v-else class="flex flex-row items-center justify-center" style="min-height: 100px">
    Nenhum dado encontrado
  </div>
  <template #footer>
    <span class="flex">
      <i class="text-[rgba(0,_0,_0,_0.6)] inline-flex text-sm flex-row mr-4">* Dados baseados nos alunos que utilizam a extensão</i>
    </span>
  </template>

</el-dialog>
</template>

<style lang="css">
.element-dialog .el-dialog__body {
  padding-top: 16px;
}
</style>
