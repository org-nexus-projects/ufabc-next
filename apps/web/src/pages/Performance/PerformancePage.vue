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
        <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" md="3">
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
    <PaperCard class="mt-4 w-100">
      <Chart :key="`cr-history-${chartKey}`" :options="crHistoryOptions" />
    </PaperCard>
    <PaperCard class="mt-4 w-100">
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
    <PaperCard class="mt-4 w-100">
      <Chart
        :key="`cr-distribution-${chartKey}`"
        :options="crDistributionOptions"
      />
    </PaperCard>
  </v-layout>
</template>

<script setup lang="ts">
import { Performance } from '@next/services';
import type { CourseInformation } from '@next/services';
import { useQuery } from '@tanstack/vue-query';
import { Chart } from 'highcharts-vue';
import { computed, ref, watch } from 'vue';
import { useTheme } from 'vuetify';

import { CenteredLoading } from '@/components/ui/CenteredLoading';
import { PaperCard } from '@/components/ui/PaperCard';
import { PerformanceCard } from '@/components/ui/PerformanceCard';
import { formatSeason } from '@/utils/season';

const theme = useTheme();
const chartKey = ref(0);

// Re-render charts when theme changes
watch(
  () => theme.global.current.value.dark,
  () => {
    chartKey.value += 1;
  }
);

const areaGraphOptions = computed(() => ({
  accessibility: {
    enabled: true,
  },
  chart: {
    style: { fontFamily: 'Roboto, sans-serif' },
    type: 'area',
  },
  colors: [theme.global.current.value.colors?.primary],
  plotOptions: {
    area: {
      fillOpacity: 0.45,
      lineWidth: 2,
      marker: {
        radius: 4,
      },
    },
  },
  tooltip: {
    borderRadius: 10,
    padding: 12,
  },
}));

const { data: crHistoryData, isPending: isPendingCrHistory } = useQuery({
  queryFn: Performance.getCrHistory,
  queryKey: ['users', 'me', 'grades'],
});

const crHistorySeries = computed(() => {
  const arrCrHistory = crHistoryData.value?.map((quad) => {
    const roundedCr = Number(quad.cr_acumulado.toFixed(2));
    return [formatSeason(quad.season), roundedCr];
  });
  return arrCrHistory;
});

const crHistoryOptions = computed(() => ({
  ...areaGraphOptions.value,
  legend: {
    verticalAlign: 'top',
  },
  series: [
    {
      data: crHistorySeries.value,
      name: 'Seu CR',
    },
  ],
  title: {
    text: 'Seu CR ao longo do tempo',
  },
  xAxis: {
    crosshair: true,
    title: {
      text: 'Quadrimestre',
    },
    type: 'category',
  },
  yAxis: {
    max: 4,
    min: 0,
    tickInterval: 0.5,
    title: {
      text: 'CR',
    },
  },
}));

const currentCpCourse = ref<CourseInformation>();
const { data: cpHistoryData, isPending: isPendingCpHistory } = useQuery({
  queryFn: Performance.getHistoriesGraduations,
  queryKey: ['historiesGraduations'],
  select: (response) => {
    currentCpCourse.value = response.docs[0];
    return response.docs;
  },
});

const cpHistorySeries = computed(() => {
  if (!currentCpCourse.value) {
    return [];
  }

  const result = [];
  const courseData = currentCpCourse.value.coefficients;

  for (const [year, quads] of Object.entries(courseData)) {
    for (const [quadNumber, quad] of Object.entries(quads)) {
      result.push([formatSeason(`${year}:${quadNumber}`), quad.cp_acumulado]);
    }
  }
  return result;
});
const cpHistoryOptions = computed(() => ({
  ...areaGraphOptions.value,
  series: [
    {
      data: cpHistorySeries.value,
      name: 'Seu CP',
    },
  ],
  title: {
    text: 'Seu CP ao longo do tempo',
  },
  xAxis: {
    crosshair: true,
    title: {
      text: 'Quadrimestre',
    },
    type: 'category',
  },
  yAxis: {
    max: 1,
    min: 0,
    title: {
      text: 'CP',
    },
  },
}));

const { data: crDistributionData, isPending: isPendingCrDistributionData } =
  useQuery({
    queryFn: Performance.getCrDistribution,
    queryKey: ['stats', 'grades'],
  });

const crDistributionSeries = computed(() => {
  const arrCrDistribution = crDistributionData.value?.map((element) => [
    Number(element._id),
    element.total,
  ]);
  return arrCrDistribution;
});

const userCr = computed(() => crHistoryData.value?.at(-1)?.cr_acumulado);

const closeCrs = computed(
  () =>
    crDistributionSeries.value?.find(
      (element) => element[0].toFixed(1) === userCr.value?.toFixed(1)
    )?.[1] || ''
);

const crDistributionOptions = computed(() => ({
  ...areaGraphOptions.value,
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
            xAxis: 0,
            y: closeCrs.value,
            yAxis: 0,
          },
          text: 'Seu CR está aqui',
        },
      ],
    },
  ],
  series: [
    {
      data: crDistributionSeries.value,
      name: 'Quantidade de alunos',
    },
  ],
  title: {
    text: 'Distribuição de CR',
  },
  xAxis: {
    crosshair: true,
    tickInterval: 0.5,
    title: {
      text: 'CR',
    },
    type: 'category',
  },
  yAxis: {
    tickInterval: 50,
    title: {
      text: 'Quantidade de alunos',
    },
  },
}));

const userMaxCr = computed(() => {
  const crAcumulados = crHistoryData.value?.map((quad) => quad.cr_acumulado);
  if (crAcumulados) {
    return Math.max(...crAcumulados).toFixed(2);
  }
  return 'undefined';
});

function findLastMaxBy<T>(
  items: T[] | undefined,
  getValue: (item: T) => number
): T | undefined {
  let best: T | undefined;
  for (const item of items ?? []) {
    if (best === undefined || !(getValue(best) > getValue(item))) {
      best = item;
    }
  }
  return best;
}

const maxCreditsQuad = computed(() =>
  findLastMaxBy(crHistoryData.value, (quad) => quad.period_credits)
);

const bestQuad = computed(() =>
  findLastMaxBy(crHistoryData.value, (quad) => quad.cr_quad)
);

const cards = computed(() => [
  {
    color: 'ufabcnext-green',
    content: 'Seu maior CR até hoje',
    icon: 'mdi-chart-line-variant',
    title: userMaxCr.value,
  },
  {
    color: 'navigation',
    content: 'Possuem um CR muito próximo ao seu',
    icon: 'mdi-chart-bell-curve',
    title: closeCrs.value,
  },
  {
    color: 'primary',
    content: 'Seu melhor quadrimestre',
    icon: 'mdi-trophy-outline',
    subtitle: `/ ${bestQuad.value?.period_credits} créditos`,
    title: formatSeason(bestQuad.value?.season || ''),
    tooltip: 'Foi o quadrimestre em que você tirou suas melhores notas',
  },
  {
    color: 'ufabcnext-yellow',
    content: 'Quadrimestre com mais créditos',
    icon: 'mdi-fire',
    subtitle: `/ ${maxCreditsQuad.value?.period_credits} créditos`,
    title: formatSeason(maxCreditsQuad.value?.season || ''),
  },
]);
</script>

<style scoped>
.course-select {
  width: 100%;
}
</style>
