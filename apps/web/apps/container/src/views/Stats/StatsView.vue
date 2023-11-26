<template>
  <CenteredLoading
    class="mt-10"
    v-if="isPendingUsage || isPendingDeficit || subjects.isLoading.value"
  />
  <div v-else>
    <PaperCard>
      <v-menu transition="slide-y-transition">
        <template v-slot:activator="{ props }">
          <div class="w-100 d-flex align-center justify-center">
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
    <v-row align="stretch" no-gutters class="w-100 mt-4">
      <v-col
        v-for="card in cards"
        :key="card.title"
        cols="12"
        sm="3"
        class="mb-2 mb-sm-0"
      >
        <PerformanceCard
          :title="card.title"
          :subTitle="card.subtitle"
          :description="card.content"
          :color="card.color"
          :icon="card.icon"
          :progressBarValue="card.progressBarValue"
          :progressBarMaxValue="card.progressBarMaxValue"
          :tooltip="card.tooltip"
        >
        </PerformanceCard>
      </v-col>
    </v-row>
    <PaperCard class="mt-4">
      <el-tabs v-model="tab">
        <el-tab-pane label="Turmas" name="classes"></el-tab-pane>
        <el-tab-pane label="Cursos" name="courses"></el-tab-pane>
        <el-tab-pane label="Disciplinas" name="subjects"></el-tab-pane>
      </el-tabs>

      <div
        class="d-flex justify-space-between flex-column flex-md-row align-md-center mb-4"
      >
        <p>{{ total }} resultados encontrados</p>
        <el-checkbox-group
          v-model="filterByPeriod"
          style="min-width: 200px"
          class="my-2 my-md-0"
        >
          <el-checkbox label="diurno">Matutino</el-checkbox>
          <el-checkbox label="noturno">Noturno</el-checkbox>
        </el-checkbox-group>
        <v-menu transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <div>
              <button v-bind="props" class="text-body-2 order-button mr-2">
                <span class="font-weight-bold text-black"> Ordenar por: </span>
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
              @click="changeOrderBy(item)"
              :key="item"
            >
              <v-list-item-title>{{
                orderByOptionsLabel[index]
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <el-table
        empty-text="Nenhum dado encontrado"
        ref="disciplinas"
        v-loading="isLoadingCurrentInfo"
        :data="disciplinas"
        style="width: 100%"
      >
        <el-table-column fixed="left" min-width="200" label="Nome">
          <template #default="scope">
            {{ matriculaNameLabel(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="vagas" label="Vagas" align="center" width="150">
        </el-table-column>
        <el-table-column
          prop="requisicoes"
          label="Requisições"
          align="center"
          width="150"
        >
        </el-table-column>
        <el-table-column
          prop="deficit"
          label="Deficit"
          align="center"
          width="150"
        >
        </el-table-column>
        <el-table-column
          prop="ratio"
          label="Pessoas por vaga"
          align="center"
          width="160"
        >
          <template #default="scope">
            {{ scope.row.ratio.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
      <el-button
        v-if="hasMoreItems"
        @click="fetchMoreItems()"
        class="w-100 mt-2"
      >
        Carregar mais <i class="el-icon-arrow-down el-icon-right"></i>
      </el-button>
    </PaperCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { StatsSubjects, type StatsParams } from 'services';
import type {
  StatsClass,
  StatsSubject,
  StatsCourse,
  PageableReturn,
} from 'types';
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { getElapsedSeasons, getSeason, prettifySeason } from 'utils';
import { PaperCard } from '@/components/PaperCard';
import { CenteredLoading } from '@/components/CenteredLoading';
import { PerformanceCard } from '@/components/PerformanceCard';

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

const filterByPeriod = ref<StatsParams['turno'][]>(['diurno', 'noturno']);

const changeOrderBy = (item: OrderBy) => {
  orderBy.value = item;
  pages.value[tab.value] = 0;
};

const pages = ref({
  subjects: 0,
  courses: 0,
  classes: 0,
});

const fallbackValue = (
  value: number | undefined | null,
  fallback: number = 0,
) => {
  return value ?? fallback;
};

const selectedSeason = ref(getSeason());

const changeSelectedSeason = (season: string) => {
  selectedSeason.value = season;
};

const elapsedSeasons = getElapsedSeasons({ endSeason: selectedSeason.value });

const params = computed<StatsParams>(() => ({
  page: pages.value[tab.value],
  season: selectedSeason.value,
  turno:
    filterByPeriod.value.length === 1 ? filterByPeriod.value[0] : undefined,
  deficit: orderBy.value === 'deficit' ? 1 : undefined,
  ratio: orderBy.value === 'ratio' ? 1 : undefined,
  vagas: orderBy.value === 'vagas' ? 1 : undefined,
  requisicoes: orderBy.value === 'requisicoes' ? 1 : undefined,
}));

const isSubjectsTab = computed(() => tab.value === 'subjects');
const isCoursesTab = computed(() => tab.value === 'courses');
const isClassesTab = computed(() => tab.value === 'classes');

const subjects = useInfiniteQuery({
  queryFn: () => StatsSubjects.getAllSubjects(params.value),
  queryKey: [
    'stats',
    'disciplinas',
    selectedSeason,
    pages.value.subjects,
    orderBy,
    filterByPeriod,
  ],
  getNextPageParam: (
    lastPage: { data: PageableReturn<StatsSubject> },
    allPages,
  ) => {
    if (lastPage.data.total >= allPages.length * 10) {
      return allPages.length;
    }
  },
  initialPageParam: 0,
  enabled: isSubjectsTab,
  select: ({ pages }) => pages.flatMap((page) => page.data),
});

const courses = useInfiniteQuery({
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
  getNextPageParam: (
    lastPage: { data: PageableReturn<StatsCourse> },
    allPages,
  ) => {
    if (lastPage.data.total >= allPages.length * 10) {
      return allPages.length;
    }
  },
  initialPageParam: 0,
  enabled: isCoursesTab,
  select: ({ pages }) => pages.flatMap((page) => page.data),
});

const classes = useInfiniteQuery({
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
  getNextPageParam: (
    lastPage: { data: PageableReturn<StatsClass> },
    allPages,
  ) => {
    if (lastPage.data.total >= allPages.length * 10) {
      return allPages.length;
    }
  },
  initialPageParam: 0,
  enabled: isClassesTab,
  select: ({ pages }) => pages.flatMap((page) => page.data),
});

const { data: coursesNames } = useQuery({
  queryFn: StatsSubjects.getAllCoursesNames,
  queryKey: ['histories', 'courses'],
  select: ({ data }) => data,
});

const queriesData = computed(() => ({
  subjects,
  courses,
  classes,
}));

const isLoadingCurrentInfo = computed(
  () => queriesData.value[tab.value]?.isFetching?.value,
);

const total = computed(
  () => queriesData.value[tab.value]?.data?.value?.[0].total,
);

const disciplinas = computed(
  () =>
    queriesData.value[tab.value]?.data?.value?.flatMap(
      (page) =>
        page.data as readonly (StatsSubject | StatsClass | StatsCourse)[],
    ),
);

const hasMoreItems = computed(
  () => queriesData.value[tab.value]?.hasNextPage?.value,
);

const fetchMoreItems = () => {
  pages.value[tab.value]++;
  queriesData.value[tab.value]?.fetchNextPage?.();
};

const mapCourseName = (courseId: number) => {
  const course = coursesNames.value?.find(
    (course) => course.curso_id === courseId,
  );
  return course?.name;
};

const mapTurnoLabel = (turno: NonNullable<StatsParams['turno']>) => {
  return {
    noturno: 'Noturno',
    diurno: 'Matutino',
  }[turno];
};

const matriculaNameLabel = (data: StatsClass | StatsSubject | StatsCourse) => {
  if (!data) return;
  if (tab.value == 'courses') {
    return mapCourseName((data as StatsCourse)._id);
  }
  if (tab.value == 'subjects') {
    return (data as StatsSubject).disciplina;
  }

  const info = data as StatsClass;

  return `${info.disciplina} ${info.turma}-${mapTurnoLabel(info.turno)}`;
};

const { data: deficit, isPending: isPendingDeficit } = useQuery({
  queryFn: () => StatsSubjects.getOverview({ season: selectedSeason.value }),
  queryKey: ['stats', 'disciplinas', 'overview'],
  select: ({ data }) => -data.data[0]?.deficit,
});

const { data: usage, isPending: isPendingUsage } = useQuery({
  queryFn: () => StatsSubjects.getUsage({ season: selectedSeason.value }),
  queryKey: ['stats', 'usage'],
  select: ({ data }) => data,
});

const currentAlunosPercentage = computed(() =>
  (
    (100 * fallbackValue(usage.value?.currentAlunos)) /
    fallbackValue(usage.value?.totalAlunos, 1)
  ).toFixed(),
);

const cards = computed(() => [
  {
    title: fallbackValue(usage.value?.currentAlunos),
    subtitle: '/' + usage.value?.totalAlunos,
    content: 'Alunos usando a extensão',
    color: 'ufabcnext-green',
    icon: 'mdi-account-group',
    progressBarValue: usage.value?.currentAlunos,
    progressBarMaxValue: usage.value?.totalAlunos,
    tooltip:
      currentAlunosPercentage.value + '% dos alunos estão usando a extensão',
  },
  {
    title: fallbackValue(usage.value?.subjects),
    content: 'Turmas',
    color: 'navigation',
    icon: 'mdi-book-open-variant',
  },
  {
    title: fallbackValue(usage.value?.teachers),
    content: 'Professores',
    color: 'primary',
    icon: 'mdi-human-male-board',
  },
  {
    title: fallbackValue(deficit.value),
    content: 'Vagas que sobraram',
    color: 'ufabcnext-red',
    icon: 'mdi-import',
  },
]);
</script>

<style scoped lang="scss">
.order-button:hover {
  color: rgb(var(--v-theme-ufabcnext-green));
}
</style>
