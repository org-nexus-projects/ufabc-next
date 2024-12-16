<template>
  <div class="flex flex-row justify-center m-3">
    <el-radio-group v-model="sortButton" size="default">
      <el-radio :value="0">Maior Aprovação</el-radio>
      <el-radio :value="3">Melhor média</el-radio>
      <el-radio :value="1">Maior Reprovação</el-radio>
    </el-radio-group>
  </div>

  <el-table ref="teachersList" @sort-change="onSortChange" :data="teachersSorted" class="w-full"
    empty-text="Nenhum resultado encontrado" border>
    <el-table-column fixed="left" prop="teacher.name" sortable label="Nome do professor" min-width="220" width="180px">
      <template #default="scope">
        <span v-if="scope.row.teacher && scope.row.teacher.name" class="break-words">
          {{ scope.row.teacher.name }}
        </span>
        <span v-else class="break-words">
          Professor desconhecido
        </span>
      </template>
    </el-table-column>

    <el-table-column label="Conceitos">
      <template #default="scope">
        <div class="grading">
          <el-tooltip v-for="concept in concepts" :key="concept.code" placement="top" :hide-after="0"
            :content="`${concept.code}: ${scope.row.concepts[concept.code]['percentage']?.toFixed(0)}% (${scope.row.concepts[concept.code]['count']} notas)`">
            <span class="grading-segment" :class="scope.row.count < unthrustableThreshold ? 'unthrustable' : ''" :style="{
              background: concept.color,
              width: `${scope.row.concepts[concept.code]?.percentage?.toFixed(0)}%`
            }">
            </span>
          </el-tooltip>

          <span v-if="scope.row.count < unthrustableThreshold" class="low-samples">Dados sem muitas amostras</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column sortable align="center" prop="count" label="Amostras" width="120">
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { orderBy } from 'lodash-es';
import type { Distribution, Grade } from '@/services/next';

type TeacherListProps = {
  teachers: Array<{
    _id: {
      _id?: 'all';
      name?: string;
      mainTeacher: string;
    }
    cr_medio: number;
    cr_professor: number
    count: number;
    amount: number
    numeric: number;
    numericWeight: number;
    weight: number;
    distribution: Distribution[]
    concepts?: { count: number; percentage: number }
    approval?: number
    reproof?: number
  }>
}

const { teachers = [] } = defineProps<TeacherListProps>()

const sortButton = ref(0)
const teachersList = useTemplateRef('teachersList')
const unthrustableThreshold = 10

const concepts = [
  { code: 'A', color: 'rgb(63, 207, 140)' },
  { code: 'B', color: 'rgb(184, 233, 134)' },
  { code: 'C', color: 'rgb(248, 183, 76)' },
  { code: 'D', color: 'rgb(255, 160, 4)' },
  { code: 'F', color: 'rgb(249, 84, 105)' },
  { code: 'O', color: 'rgb(169, 169, 169)' },
];

const findGradeCount = (distribution: Distribution[], concept: Grade) => {
  const conceptTarget = distribution.find(({ conceito }) => conceito === concept);
  return conceptTarget?.count ?? null;
};

const findGradeCountTotal = (distribution: Distribution[]) => {
  const summed = distribution.reduce((acc, item) => acc + item.count, 0)
  return summed;
}

const calculateGradePercentage = (distribution: Distribution[], concept: Grade) => {
  return (100 * findGradeCount(distribution, concept)) / findGradeCountTotal(distribution)
}

const onSortChange = () => {
  sortButton.value = 0;
};

watch(() => sortButton, (val) => {
  if (val !== null && teachersList.value) {
    teachersList.value?.clearSort();
  }
});

const teachersSorted = computed(() => {
  let order = [['teacher.name'], ['desc']];
  if (sortButton.value === 0) {
    order = [
      ['approval', 'reproof', 'count'],
      ['desc', 'desc'],
    ];
  } else if (sortButton.value === 1) {
    order = [
      ['reproof', 'approval'],
      ['desc', 'desc'],
    ];
  } else if (sortButton.value === 3) {
    order = [['cr_professor'], ['desc']];
  }

  return orderBy([...teachersPopulated.value], ...order);
});

const teachersPopulated = computed(() => {
  const teachersToPopulate = [...teachers || []]
  const possibleConcepts = ['A', 'B', 'C', 'D', 'F', 'O']
  const approvalConcepts = ['A', 'B', 'C', 'D']
  const reproofConcepts = ['F', 'O']

  return teachersToPopulate.map(teacher => {
    teacher.concepts = {
      count: 0,
      percentage: 0
    }

    // biome-ignore lint/complexity/noForEach: <explanation>
    possibleConcepts.forEach(c => {
      // @ts-ignore
      teacher.concepts[c] = {
        percentage: calculateGradePercentage(teacher.distribution, c as Grade),
        count: findGradeCount(teacher.distribution, c as Grade)
      }
    })

    teacher.approval = approvalConcepts.reduce((total, c) =>
      // @ts-ignore
      total + teacher.concepts[c].percentage, 0)

    teacher.reproof = reproofConcepts.reduce((total, c) =>
      // @ts-ignore
      total + teacher.concepts[c].percentage, 0)

    return teacher
  })
});
</script>

<style scoped lang="css">
.unthrustable {
  opacity: 0.4;
}

.grading-segment {
  height: 100%;
  flex: 1 1 auto;
  transition: opacity 0.2s ease-in-out, width 0.9s ease-in-out;
}

.grading {
  width: 100%;
  border-radius: 4px;
  height: 28px;
  overflow: hidden;
  position: relative;
  display: flex;
  min-width: 200px;
}

.grading:hover .grading-segment {
  opacity: 0.7;
}

.grading-segment:hover {
  opacity: 1 !important;
}

.low-samples {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.26);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.4);
}

.grading:hover .low-samples {
  display: none;
}
</style>
