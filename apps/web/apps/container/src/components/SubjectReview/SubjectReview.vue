<template>
  <CenteredLoading v-if="isFetchingSubject" class="mt-10" />
  <PaperCard v-else class="w-100">
    <v-container style="max-width: none">
      <v-row v-if="Number(subjectData?.data.general.count) > 0">
        <v-col cols="12" md="5">
          <p class="text-h4 font-weight-bold text-primary mb-2">
            {{ subjectData?.data.subject.name }}
          </p>
          <v-chip
            v-for="(chip, index) in chips"
            :key="chip.text"
            variant="outlined"
            color="primary"
            :class="`${index < chips.length && 'mr-2'} mb-2`"
          >
            <v-icon :icon="chip.icon" />
            {{ chip.value }}
            {{ chip.text }}
          </v-chip>
          <div
            class="d-flex align-center justify-center"
            :style="`${xs && 'margin: 0 -24px'}`"
          >
            <ConceptsPieChart
              :key="`chart-${subjectData?.data.subject.name}`"
              :grades="generalGrades"
            />
          </div>
        </v-col>
        <v-col cols="12" md="7" class="px-0 d-flex flex-column align-end">
          <v-menu transition="slide-y-transition">
            <template #activator="{ props }">
              <button v-bind="props" class="text-body-2 order-button mb-4 mr-2">
                <span class="font-weight-bold text-black"> Ordenar por: </span>
                {{ orders.find((o) => o.value === selectedOrder)?.title }}
                <v-icon class="text-ufabcnext-green"> mdi-menu-down </v-icon>
              </button>
            </template>
            <v-list>
              <v-list-item
                v-for="item in orders"
                :key="item.title"
                @click="selectedOrder = item.value"
              >
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-table
            hover
            density="comfortable"
            class="rounded-lg w-100 pr-sm-4"
            :style="`${!smAndDown && 'max-height:500px ; overflow-y:auto'}`"
          >
            <thead v-if="!xs" class="table-head bg-ufabcnext-green">
              <tr>
                <th
                  v-for="(item, index) in tableHead"
                  :key="item"
                  :class="`text-white text-caption text-uppercase text-center ${
                    !index && 'title-first-column'
                  }`"
                >
                  {{ item }}
                </th>
              </tr>
            </thead>
            <tbody v-if="!xs" class="table-body bg-secondary">
              <tr
                v-for="teacher in shortedSpecifics"
                :key="teacher._id.mainTeacher + 'row'"
              >
                <td class="first-column">
                  <router-link
                    v-if="teacher.teacher?.name"
                    class="link"
                    :to="`/review?q=${teacher.teacher.name}&teacherId=${teacher.teacher._id}`"
                  >
                    {{ teacher.teacher?.name }}
                  </router-link>
                  <p v-else class="text-next-light-grey">
                    Professor não encontrado
                  </p>
                </td>
                <td class="w-100 py-5">
                  <ConceptsHorizontalChart :grade-data="teacher" />
                </td>
                <td class="text-center">
                  {{ teacher.count }}
                </td>
              </tr>
            </tbody>
            <tbody v-else class="table-body bg-secondary">
              <tr
                v-for="teacher in shortedSpecifics"
                :key="teacher._id.mainTeacher + 'row'"
              >
                <td class="w-100 py-2">
                  <router-link
                    v-if="teacher.teacher?.name"
                    class="link"
                    :to="`/review?q=${teacher.teacher.name}&teacherId=${teacher.teacher._id}`"
                  >
                    {{ teacher.teacher?.name }}
                  </router-link>
                  <p v-else>Professor não encontrado</p>
                  <ConceptsHorizontalChart :grade-data="teacher" class="my-1" />
                  Amostras: {{ teacher.count }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>
      <div v-else class="d-flex align-center flex-column">
        <img
          src="@/assets/comment_not_found.gif"
          style="width: 100%; max-width: 275px"
          class="mb-5"
          alt="Nenhum comentário encontrado"
        />
        <p>Nenhum dado encontrado 😕</p>
        <p>
          Você já fez matéria com algum professor? Se sim, atualize seu
          histórico
        </p>
        <v-btn href="/history" color="primary" class="text-body-1 mt-5">
          Atualizar
        </v-btn>
      </div>
    </v-container>
  </PaperCard>
</template>

<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query';
import { Reviews } from '@ufabc-next/services';
import { Concept, SubjectSpecific } from '@ufabc-next/types';
import { ElMessage } from 'element-plus';
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { CenteredLoading } from '@/components/CenteredLoading';
import { ConceptsHorizontalChart } from '@/components/ConceptsHorizontalChart';
import { ConceptsPieChart } from '@/components/ConceptsPieChart';
import { PaperCard } from '@/components/PaperCard';
import { transformConceptDataToObject } from '@/utils/transformConceptDataToObject';

const props = defineProps({
  subjectId: { type: String, required: true },
});

const subjectId = computed(() => props.subjectId);

const { smAndDown, xs } = useDisplay();

const selectedOrder = ref('nada');

const {
  data: subjectData,
  isFetching: isFetchingSubject,
  isError: isFetchingSubjectError,
} = useQuery({
  refetchOnWindowFocus: false,
  queryKey: ['subject', subjectId.value],
  queryFn: () => Reviews.getSubject(subjectId.value),
  enabled: !!subjectId.value,
});

watch(
  () => isFetchingSubjectError.value,
  () => {
    isFetchingSubjectError.value &&
      ElMessage({
        message: 'Erro ao carregar dados da disciplina',
        type: 'error',
        showClose: true,
      });
  },
);

const chips = computed(() => {
  if (!subjectData.value?.data) {
    return [];
  }
  return [
    {
      value: subjectData.value?.data.general.count,
      text:
        subjectData.value?.data.general.count == 1 ? 'conceito' : 'conceitos',
      icon: 'mdi-message-text-outline',
    },
    {
      value: subjectData.value.data.specific.length,
      text:
        subjectData.value.data.specific.length == 1
          ? 'professor'
          : 'professores',
      icon: 'mdi-human-male-board',
    },
  ];
});

const generalGrades = computed(() => {
  if (!subjectData.value?.data) return {};
  return transformConceptDataToObject(
    subjectData.value.data.general.distribution,
  );
});

const tableHead = ['Nome do Professor', 'Conceitos', 'Amostras'];

const orders = [
  {
    title: 'Nome do Professor (A-Z)',
    value: 'teacherCres',
  },
  {
    title: 'Nome do Professor (Z-A)',
    value: 'teacherDecres',
  },
  {
    title: 'Amostras (Crescente)',
    value: 'samplesCres',
  },
  {
    title: 'Amostras (Decrescente)',
    value: 'samplesDecres',
  },
  {
    title: 'Maior Aprovação',
    value: 'mostApproved',
  },
  {
    title: 'Maior Reprovação',
    value: 'leastApproved',
  },
];

const approveRating = (subject: SubjectSpecific) => {
  const approvalConcepts: Concept[] = ['A', 'B', 'C', 'D'];
  const reproofConcepts: Concept[] = ['F', 'O'];

  return (
    subject.distribution.reduce((acc, grade) => {
      if (approvalConcepts.includes(grade.conceito)) {
        acc += grade.count;
      } else if (reproofConcepts.includes(grade.conceito)) {
        acc -= grade.count;
      }
      return acc;
    }, 0) / subject.count
  );
};

const shortedSpecifics = computed(() => {
  if (!subjectData.value?.data.specific) return [];
  const sorted: SubjectSpecific[] = JSON.parse(
    JSON.stringify(subjectData.value.data.specific),
  );

  if (selectedOrder.value === 'teacherCres') {
    sorted.sort((a, b) =>
      (a.teacher?.name ?? '') > (b.teacher?.name ?? '') ? 1 : -1,
    );
  } else if (selectedOrder.value === 'teacherDecres') {
    sorted.sort((a, b) =>
      (a.teacher?.name ?? '') > (b.teacher?.name ?? '') ? -1 : 1,
    );
  } else if (selectedOrder.value === 'samplesCres') {
    sorted.sort((a, b) => a.count - b.count);
  } else if (selectedOrder.value === 'samplesDecres') {
    sorted.sort((a, b) => b.count - a.count);
  } else if (selectedOrder.value === 'mostApproved') {
    sorted.sort((a, b) => approveRating(b) - approveRating(a));
  } else if (selectedOrder.value === 'leastApproved') {
    sorted.sort((a, b) => approveRating(a) - approveRating(b));
  }

  return sorted;
});
</script>

<style lang="scss" scoped>
.title-first-column {
  white-space: nowrap;
}

.link {
  text-decoration: underline;
}

td {
  outline: 1px solid white;
}

.order-button:hover {
  color: rgb(var(--v-theme-ufabcnext-green));
}
</style>
