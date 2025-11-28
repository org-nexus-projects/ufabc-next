<template>
  <CenteredLoading
    v-if="
      isPendingCrHistory || isPendingCpHistory || isPendingCrDistributionData
    "
    class="mt-10"
  />
  <v-layout v-else class="flex-column align-center justify-center">
    <v-container fluid class="pa-0">
      <v-row align="stretch">
        <v-col
          v-for="card in cards"
          :key="card.title"
          cols="12"
          sm="6"
          md="3"
        >
          <PerformanceCard
            :title="card.title"
            :sub-title="card.subtitle"
            :description="card.content"
            :color="card.color"
            :icon="card.icon"
            :tooltip="card?.tooltip"
          />
        </v-col>
      </v-row>
    </v-container>
    <PaperCard class="w-100 mt-4">
      <Chart :key="`cr-history-${chartKey}`" :options="crHistoryOptions" />
    </PaperCard>
    <PaperCard class="w-100 mt-4">
      <v-select
        v-model="currentCpCourse"
        :items="cpHistoryData"
        :item-title="(course: CourseInformation) => course.curso"
        :item-value="(course: CourseInformation) => course"
        variant="outlined"
        class="course-select"
      />
      <Chart :key="`cp-history-${chartKey}`" :options="cpHistoryOptions" />
    </PaperCard>
    <PaperCard class="w-100 mt-4">
      <Chart :key="`cr-distribution-${chartKey}`" :options="crDistributionOptions" />
    </PaperCard>
  </v-layout>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { type CourseInformation, Performance } from '@ufabc-next/services';
import { Chart } from 'highcharts-vue';
import { computed, ref, watch } from 'vue';
import { useTheme } from 'vuetify';

import { CenteredLoading } from '@/components/CenteredLoading';
import { PaperCard } from '@/components/PaperCard';
import { PerformanceCard } from '@/components/PerformanceCard';
import { formatSeason } from '@/utils/season';

const theme = useTheme();
const chartKey = ref(0);

//Re-render charts when theme changes
watch(  
  () => theme.global.current.value.dark,
  () => {
    chartKey.value++;
  },
);

const areaGraphOptions = computed(() => ({
  accessibility: {
    enabled: true,
  },
  chart: {
    type: 'area',
    style: { fontFamily: 'Roboto, sans-serif' },
  },
  plotOptions: {
    area: {
      fillOpacity: 0.45,
      lineWidth: 2,
      marker: {
        radius: 4,
      },
    },
  },
  colors: [theme.global.current.value.colors?.primary],
  tooltip: {
    borderRadius: 10,
    padding: 12,
  },
}));

const { data: crHistoryData, isPending: isPendingCrHistory } = useQuery({
  queryKey: ['users', 'me', 'grades'],
  queryFn: Performance.getCrHistory,
  select: (response) => response.data,
});

const crHistorySeries = computed(() => {
  const arrCrHistory = crHistoryData.value?.map((quad) => {
    const roundedCr = parseFloat(quad.cr_acumulado.toFixed(2));
    return [formatSeason(quad.season), roundedCr];
  });
  return arrCrHistory;
});

const crHistoryOptions = computed(() => ({
  ...areaGraphOptions.value,
  title: {
    text: 'Seu CR ao longo do tempo',
  },
  yAxis: {
    title: {
      text: 'CR',
    },
    tickInterval: 0.5,
    min: 0,
    max: 4,
  },
  xAxis: {
    title: {
      text: 'Quadrimestre',
    },
    crosshair: true,
    type: 'category',
  },
  series: [
    {
      name: 'Seu CR',
      data: crHistorySeries.value,
    },
  ],
  legend: {
    verticalAlign: 'top',
  },
}));

const currentCpCourse = ref<CourseInformation>();
const { data: cpHistoryData, isPending: isPendingCpHistory } = useQuery({
  queryKey: ['historiesGraduations'],
  queryFn: Performance.getHistoriesGraduations,
  select: (response) => {
    currentCpCourse.value = response.data.docs[0];
    return response.data.docs;
  },
});

const cpHistorySeries = computed(() => {
  if (!currentCpCourse.value) return [];

  const result = [];
  const courseData = currentCpCourse.value.coefficients;

  for (const year in courseData) {
    for (const quadNumber in courseData[year]) {
      const cpValue =
        courseData[year][Number(quadNumber) as 1 | 2 | 3].cp_acumulado;
      result.push([formatSeason(`${year}:${quadNumber}`), cpValue]);
    }
  }
  return result;
});
const cpHistoryOptions = computed(() => ({
  ...areaGraphOptions.value,
  title: {
    text: 'Seu CP ao longo do tempo',
  },
  yAxis: {
    title: {
      text: 'CP',
    },
    min: 0,
    max: 1,
  },
  xAxis: {
    title: {
      text: 'Quadrimestre',
    },
    crosshair: true,
    type: 'category',
  },
  series: [
    {
      name: 'Seu CP',
      data: cpHistorySeries.value,
    },
  ],
}));

const { data: crDistributionData, isPending: isPendingCrDistributionData } =
  useQuery({
    queryKey: ['stats', 'grades'],
    queryFn: Performance.getCrDistribution,
    select: (response) => response.data,
  });

const crDistributionSeries = computed(() => {
  const arrCrDistribution = crDistributionData.value?.map((element) => {
    return [Number(element._id), element.total];
  });
  return arrCrDistribution;
});

const userCr = computed(() => {
  return crHistoryData.value?.[crHistoryData.value.length - 1].cr_acumulado;
});

const closeCrs = computed(
  () =>
    crDistributionSeries.value?.find(
      (element) => element[0].toFixed(1) === userCr.value?.toFixed(1),
    )?.[1] || '',
);

const crDistributionOptions = computed(() => ({
  ...areaGraphOptions.value,
  title: {
    text: 'Distribuição de CR',
  },
  yAxis: {
    title: {
      text: 'Quantidade de alunos',
    },
    tickInterval: 50,
  },
  xAxis: {
    title: {
      text: 'CR',
    },
    crosshair: true,
    type: 'category',
    tickInterval: 0.5,
  },
  series: [
    {
      name: 'Quantidade de alunos',
      data: crDistributionSeries.value,
    },
  ],
  annotations: [
    {
      draggable: '',
      labelOptions: {
        crop: false,
      },
      labels: [
        {
          point: {
            x: userCr.value,
            y: closeCrs.value,
            xAxis: 0,
            yAxis: 0,
          },
          text: 'Seu CR está aqui',
        },
      ],
    },
  ],
}));

const userMaxCr = computed(() => {
  const crAcumulados = crHistoryData.value?.map((quad) => quad.cr_acumulado);
  if (crAcumulados) {
    return Math.max(...crAcumulados).toFixed(2);
  }
  return 'undefined';
});

const maxCreditsQuad = computed(() =>
  crHistoryData.value?.reduce((previousQuad, currentQuad) => {
    return previousQuad.period_credits > currentQuad.period_credits
      ? previousQuad
      : currentQuad;
  }),
);

const bestQuad = computed(() => {
  return crHistoryData.value?.reduce((previousQuad, currentQuad) => {
    return previousQuad.cr_quad > currentQuad.cr_quad
      ? previousQuad
      : currentQuad;
  });
});

const cards = computed(() => [
  {
    title: userMaxCr.value,
    content: 'Seu maior CR até hoje',
    color: 'ufabcnext-green',
    icon: 'mdi-chart-line-variant',
  },
  {
    title: closeCrs.value,
    content: 'Possuem um CR muito próximo ao seu',
    color: 'navigation',
    icon: 'mdi-chart-bell-curve',
  },
  {
    title: formatSeason(bestQuad.value?.season || ''),
    subtitle: `/ ${bestQuad.value?.period_credits} créditos`,
    content: 'Seu melhor quadrimestre',
    color: 'primary',
    icon: 'mdi-trophy-outline',
    tooltip: 'Foi o quadrimestre em que você tirou suas melhores notas',
  },
  {
    title: formatSeason(maxCreditsQuad.value?.season || ''),
    subtitle: `/ ${maxCreditsQuad.value?.period_credits} créditos`,
    content: 'Quadrimestre com mais créditos',
    color: 'ufabcnext-yellow',
    icon: 'mdi-fire',
  },
]);
</script>

<style scoped>
.course-select {
  width: 100%;
}
</style>
