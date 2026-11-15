<template>
  <div class="chartWrapper">
    <Chart :key="chartKey" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Concept } from '@next/services';
import { Chart } from 'highcharts-vue';
import { computed, PropType, ref, watch } from 'vue';
import { useTheme } from 'vuetify';

import { conceptsColor } from '@/utils/consts';

const theme = useTheme();
const chartKey = ref(0);

// Re-render chart when theme changes
watch(
  () => theme.global.current.value.dark,
  () => {
    chartKey.value += 1;
  }
);

type Grades = Record<string, number>;
const props = defineProps({
  grades: { required: true, type: Object as PropType<Grades> },
});

const grades = computed(() => {
  const data = Object.keys(props.grades).map((key) => ({
    name: key as Concept,
    y: props.grades[key],
  }));
  return data;
});

const chartOptions = computed(() => ({
  chart: {
    type: 'pie',
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      colors: grades.value.map((grade) => conceptsColor[grade.name]),
      cursor: 'pointer',
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
      },
      showInLegend: true,
    },
  },
  series: [
    {
      data: grades.value,
      name: 'Conceito',
    },
  ],
  title: {
    text: '',
  },
}));
</script>

<style scoped>
.chartWrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  text-align: left;
  line-height: normal;
}
</style>
