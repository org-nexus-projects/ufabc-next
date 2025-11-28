<template>
  <div class="chartWrapper">
    <Chart :key="chartKey" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Concept } from '@ufabc-next/types';
import { Chart } from 'highcharts-vue';
import { computed, PropType, ref, watch } from 'vue';
import { useTheme } from 'vuetify';

import { conceptsColor } from '@/utils/consts';

const theme = useTheme();
const chartKey = ref(0);

//Re-render chart when theme changes
watch(
  () => theme.global.current.value.dark,
  () => {
    chartKey.value++;
  },
);

type Grades = Record<string, number>;
const props = defineProps({
  grades: { type: Object as PropType<Grades>, required: true },
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
  series: [
    {
      name: 'Conceito',
      data: grades.value,
    },
  ],
  title: {
    text: '',
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
      },
      colors: grades.value.map((grade) => conceptsColor[grade.name]),
      showInLegend: true,
    },
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
