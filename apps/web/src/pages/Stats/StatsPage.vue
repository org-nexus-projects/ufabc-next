<template>
  <CenteredLoading
    v-if="isPendingUsage || isPendingDeficit || subjects.isLoading.value"
    class="mt-10"
  />
  <div v-else>
    <PaperCard>
      <v-menu transition="slide-y-transition">
        <template #activator="{ props }">
          <div class="d-flex align-center w-100 justify-center">
            <button v-bind="props" class="text-h6 text-sm-h4 font-weight-bold">
              {{ prettifySeason(selectedSeason) }}
              <v-icon size="x-small" class="text-ufabcnext-green">
                mdi-menu-down
              </v-icon>
            </button>
          </div>
        </template>
        <v-list>
          <v-list-item
            v-for="season in elapsedSeasons"
            :key="season"
            @click="changeSelectedSeason(season)"
          >
            <v-list-item-title>{{ prettifySeason(season) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </PaperCard>
    <v-container fluid class="pa-0 mt-4">
      <v-row align="stretch">
        <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" md="3">
          <PerformanceCard
            :title="card.title"
            :sub-title="card.subtitle"
            :description="card.content"
            :color="card.color"
            :icon="card.icon"
            :progress-bar-value="card.progressBarValue"
            :progress-bar-max-value="card.progressBarMaxValue"
            :tooltip="card.tooltip"
          />
        </v-col>
      </v-row>
    </v-container>
    <PaperCard class="mt-4">
      <v-tabs v-model="tab" color="primary" class="mb-4">
        <v-tab value="classes">Turmas</v-tab>
        <v-tab value="courses">Cursos</v-tab>
        <v-tab value="subjects">Disciplinas</v-tab>
      </v-tabs>

      <div
        class="d-flex justify-space-between flex-column flex-md-row align-md-center mb-4"
      >
        <p>{{ total }} resultados encontrados</p>
        <div class="d-flex my-md-0 my-2 gap-2" style="min-width: 200px">
          <v-checkbox
            v-model="periodCheckboxes"
            label="Matutino"
            value="diurno"
            hide-details
            density="compact"
          />
          <v-checkbox
            v-model="periodCheckboxes"
            label="Noturno"
            value="noturno"
            hide-details
            density="compact"
          />
        </div>
        <v-menu transition="slide-y-transition">
          <template #activator="{ props }">
            <div>
              <button v-bind="props" class="text-body-2 order-button mr-2">
                <span class="font-weight-bold"> Ordenar por: </span>
                {{
                  orderByOptionsLabel[
                    orderByOptions.findIndex((o) => o === orderBy)
                  ]
                }}
                <v-icon class="text-ufabcnext-green"> mdi-menu-down </v-icon>
              </button>
            </div>
          </template>
          <v-list>
            <v-list-item
              v-for="(item, index) in orderByOptions"
              :key="item"
              @click="changeOrderBy(item)"
            >
              <v-list-item-title>
                {{ orderByOptionsLabel[index] }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-progress-linear
        v-if="isLoadingCurrentInfo"
        indeterminate
        color="primary"
        class="mb-2"
      />
      <v-table class="stats-table">
        <thead>
          <tr>
            <th class="text-left" style="min-width: 200px">Nome</th>
            <th class="text-center" style="width: 150px">Vagas</th>
            <th class="text-center" style="width: 150px">Requisições</th>
            <th class="text-center" style="width: 150px">Deficit</th>
            <th class="text-center" style="width: 160px">Pessoas por vaga</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!disciplinas || disciplinas.length === 0">
            <td colspan="5" class="py-8 text-center">Nenhum dado encontrado</td>
          </tr>
          <tr v-for="(item, index) in disciplinas" :key="index">
            <td>{{ matriculaNameLabel(item) }}</td>
            <td class="text-center">{{ item.vagas }}</td>
            <td class="text-center">{{ item.requisicoes }}</td>
            <td class="text-center">{{ item.deficit }}</td>
            <td class="text-center">{{ item.ratio.toFixed(2) }}</td>
          </tr>
        </tbody>
      </v-table>
      <v-btn
        v-if="hasMoreItems"
        variant="outlined"
        color="primary"
        class="mt-4 w-100"
        @click="fetchMoreItems()"
      >
        Carregar mais
        <v-icon end>mdi-arrow-down</v-icon>
      </v-btn>
    </PaperCard>
  </div>
</template>

<script setup lang="ts">
import type {
  PageableReturn,
  StatsClass,
  StatsCourse,
  StatsParams,
  StatsSubject,
} from '@next/services';
import { StatsSubjects } from '@next/services';
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

import { CenteredLoading } from '@/components/ui/CenteredLoading';
import { PaperCard } from '@/components/ui/PaperCard';
import { PerformanceCard } from '@/components/ui/PerformanceCard';
import { getElapsedSeasons, getSeason, prettifySeason } from '@/utils/season';

type Tab = 'classes' | 'courses' | 'subjects';
type OrderBy = 'deficit' | 'ratio' | 'vagas' | 'requisicoes';

const orderByOptions: OrderBy[] = ['deficit', 'ratio', 'vagas', 'requisicoes'];
const orderByOptionsLabel = [
  'Deficit',
  'Pessoas por vaga',
  'Vagas',
  'Requisições',
];

const orderBy = ref<OrderBy>('deficit');

const tab = ref<Tab>('classes');

const periodCheckboxes = ref<string[]>(['diurno', 'noturno']);

const filterByPeriod = computed(
  () =>
    periodCheckboxes.value.filter((item) => item !== undefined) as Array<
      StatsParams['turno']
    >
);

const pages = ref({
  classes: 0,
  courses: 0,
  subjects: 0,
});

function changeOrderBy(item: OrderBy) {
  orderBy.value = item;
  pages.value[tab.value] = 0;
}

function fallbackValue(value: number | undefined | null, fallback = 0) {
  return value ?? fallback;
}

const selectedSeason = ref(getSeason());

function changeSelectedSeason(season: string) {
  selectedSeason.value = season;
}

const elapsedSeasons = getElapsedSeasons({ endSeason: selectedSeason.value });

const params = computed<StatsParams>(() => ({
  deficit: orderBy.value === 'deficit' ? 1 : undefined,
  page: pages.value[tab.value],
  ratio: orderBy.value === 'ratio' ? 1 : undefined,
  requisicoes: orderBy.value === 'requisicoes' ? 1 : undefined,
  season: selectedSeason.value,
  turno:
    filterByPeriod.value.length === 1 ? filterByPeriod.value[0] : undefined,
  vagas: orderBy.value === 'vagas' ? 1 : undefined,
}));

const isSubjectsTab = computed(() => tab.value === 'subjects');
const isCoursesTab = computed(() => tab.value === 'courses');
const isClassesTab = computed(() => tab.value === 'classes');

const subjects = useInfiniteQuery({
  enabled: isSubjectsTab,
  getNextPageParam: (lastPage: PageableReturn<StatsSubject>, allPages) => {
    if (lastPage.total >= allPages.length * 10) {
      return allPages.length;
    }
  },
  initialPageParam: 0,
  queryFn: () => StatsSubjects.getAllSubjects(params.value),
  queryKey: [
    'stats',
    'disciplinas',
    selectedSeason,
    pages.value.subjects,
    orderBy,
    filterByPeriod,
  ],
  select: (data) => data.pages,
});

const courses = useInfiniteQuery({
  enabled: isCoursesTab,
  getNextPageParam: (lastPage: PageableReturn<StatsCourse>, allPages) => {
    if (lastPage.total >= allPages.length * 10) {
      return allPages.length;
    }
  },
  initialPageParam: 0,
  queryFn: () => StatsSubjects.getAllCourses(params.value),
  queryKey: [
    'stats',
    'disciplinas',
    'courses',
    selectedSeason,
    pages.value.courses,
    orderBy,
    filterByPeriod,
  ],
  select: (data) => data.pages,
});

const classes = useInfiniteQuery({
  enabled: isClassesTab,
  getNextPageParam: (lastPage: PageableReturn<StatsClass>, allPages) => {
    if (lastPage.total >= allPages.length * 10) {
      return allPages.length;
    }
  },
  initialPageParam: 0,
  queryFn: () => StatsSubjects.getAllClasses(params.value),
  queryKey: [
    'stats',
    'disciplinas',
    'classes',
    selectedSeason,
    pages.value.classes,
    orderBy,
    filterByPeriod,
  ],
  select: (data) => data.pages,
});

const { data: coursesNames } = useQuery({
  queryFn: StatsSubjects.getAllCoursesNames,
  queryKey: ['histories', 'courses'],
});

const queriesData = computed(() => ({
  classes,
  courses,
  subjects,
}));

const isLoadingCurrentInfo = computed(
  () => queriesData.value[tab.value]?.isFetching?.value
);

const total = computed(
  () => queriesData.value[tab.value]?.data?.value?.[0].total
);

const disciplinas = computed(() =>
  queriesData.value[tab.value]?.data?.value?.flatMap(
    (page) =>
      page.data as ReadonlyArray<StatsSubject | StatsClass | StatsCourse>
  )
);

const hasMoreItems = computed(
  () => queriesData.value[tab.value]?.hasNextPage?.value
);

function fetchMoreItems() {
  pages.value[tab.value] += 1;
  queriesData.value[tab.value]?.fetchNextPage?.();
}

function mapCourseName(courseId: number) {
  const course = coursesNames.value?.find((item) => item.curso_id === courseId);
  return course?.name;
}

function mapTurnoLabel(turno: NonNullable<StatsParams['turno']>) {
  return {
    diurno: 'Matutino',
    noturno: 'Noturno',
  }[turno];
}

function matriculaNameLabel(data: StatsClass | StatsSubject | StatsCourse) {
  if (!data) {
    return;
  }
  if (tab.value === 'courses') {
    return mapCourseName((data as StatsCourse)._id);
  }
  if (tab.value === 'subjects') {
    return (data as StatsSubject).disciplina;
  }

  const info = data as StatsClass;

  return `${info.disciplina} ${info.turma}-${mapTurnoLabel(info.turno)}`;
}

const { data: deficit, isPending: isPendingDeficit } = useQuery({
  queryFn: () => StatsSubjects.getOverview({ season: selectedSeason.value }),
  queryKey: ['stats', 'disciplinas', 'overview'],
  select: (data) => -data.data[0]?.deficit,
});

const { data: usage, isPending: isPendingUsage } = useQuery({
  queryFn: () => StatsSubjects.getUsage({ season: selectedSeason.value }),
  queryKey: ['stats', 'usage'],
});

const currentAlunosPercentage = computed(() =>
  (
    (100 * fallbackValue(usage.value?.currentAlunos)) /
    fallbackValue(usage.value?.totalAlunos, 1)
  ).toFixed(0)
);

const cards = computed(() => [
  {
    color: 'ufabcnext-green',
    content: 'Alunos usando a extensão',
    icon: 'mdi-account-group',
    progressBarMaxValue: usage.value?.totalAlunos,
    progressBarValue: usage.value?.currentAlunos,
    subtitle: `/${usage.value?.totalAlunos}`,
    title: fallbackValue(usage.value?.currentAlunos),
    tooltip: `${currentAlunosPercentage.value}% dos alunos estão usando a extensão`,
  },
  {
    color: 'navigation',
    content: 'Turmas',
    icon: 'mdi-book-open-variant',
    title: fallbackValue(usage.value?.subjects),
  },
  {
    color: 'primary',
    content: 'Professores',
    icon: 'mdi-human-male-board',
    title: fallbackValue(usage.value?.teachers),
  },
  {
    color: 'ufabcnext-red',
    content: 'Vagas que sobraram',
    icon: 'mdi-import',
    title: fallbackValue(deficit.value),
  },
]);
</script>

<style scoped lang="scss">
.order-button:hover {
  color: rgb(var(--v-theme-ufabcnext-green));
}

.stats-table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.stats-table th,
.stats-table td {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.stats-table th {
  font-weight: 600;
}
</style>
