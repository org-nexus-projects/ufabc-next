<template>
  <FeedbackAlert
    v-if="isFetchingTeacherError"
    text="Erro ao carregar dados do(a) professor(a)"
  />
  <CenteredLoading
    v-if="isFetchingTeacher"
    class="mt-10"
  />
  <PaperCard
    v-else
    class="w-100"
  >
    <v-container style="max-width: none">
      <v-row
        v-if="Number(teacherData?.data.general.count) > 0"
        class="pa-0"
      >
        <v-col
          cols="12"
          md="5"
        >
          <p class="text-h4 font-weight-bold text-primary mb-2">
            {{ teacherData?.data.teacher.name }}
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
              :key="`chart-${selectedSubject}-${eadFilter}`"
              :grades="grades"
            />
          </div>
          <p class="text-body-2 text-center font-weight-bold mt-6">
            * Provavelmente esse professor
            {{
              demandsAttendance ? ' cobra presença👎' : ' NÃO cobra presença👍'
            }}
          </p>
        </v-col>
        <v-col
          cols="12"
          md="7"
        >
          <CommentsList
            :teacher-id="teacherId"
            :selected-subject="selectedSubject"
            @update:selected-subject="selectedSubject = $event"
            @update:ead-filter="eadFilter = $event"
          />
        </v-col>
      </v-row>
      <div
        v-else
        class="d-flex align-center flex-column"
      >
        <img
          src="@/assets/comment_not_found.gif"
          style="width: 100%; max-width: 275px"
          class="mb-5"
          alt="Nenhum comentário encontrado"
        >
        <p>Nenhum dado encontrado 😕</p>
        <p>
          Você já fez matéria com esse professor? Se sim, atualize seu histórico
        </p>
        <v-btn
          href="/history"
          color="primary"
          class="text-body-1 mt-5"
        >
          Atualizar
        </v-btn>
      </div>
    </v-container>
  </PaperCard>
</template>

<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query';
import { Reviews } from 'services';
import { TeacherReview, TeacherReviewSubject } from 'types';
import { transformConceptDataToObject } from 'utils';
import { computed, ref } from 'vue';
import { useDisplay } from 'vuetify';

import { CenteredLoading } from '@/components/CenteredLoading';
import { CommentsList } from '@/components/CommentsList';
import { ConceptsPieChart } from '@/components/ConceptsPieChart';
import { FeedbackAlert } from '@/components/FeedbackAlert';
import { PaperCard } from '@/components/PaperCard';

const props = defineProps({
  teacherId: { type: String, required: true },
});

const teacherId = computed(() => props.teacherId);

const { xs } = useDisplay();

const selectedSubject = ref<string>('Todas as matérias');
const eadFilter = ref(false);

const {
  data: teacherData,
  isFetching: isFetchingTeacher,
  isError: isFetchingTeacherError,
} = useQuery({
  refetchOnWindowFocus: false,
  queryKey: ['teacher', teacherId],
  queryFn: () => Reviews.getTeacher(teacherId.value),
  enabled: !!teacherId.value,
});

function calculateGradeCount(
  eadFilter: boolean,
  generalSubjects: TeacherReview['general'],
  isAllSubjects: boolean,
  specificSubject?: TeacherReviewSubject,
) {
  if (eadFilter) {
    const specificCount = specificSubject?.count ?? 0;
    const specificEadCount = specificSubject?.eadCount ?? 0;
    return isAllSubjects
      ? generalSubjects.count - generalSubjects.eadCount
      : specificCount - specificEadCount;
  } else {
    return isAllSubjects ? generalSubjects.count : specificSubject?.count;
  }
}

const chips = computed(() => {
  if (!teacherData.value?.data) {
    return [];
  }
  const { general, specific } = teacherData.value.data;
  const specificValid = specific.filter((subject) => subject._id);
  const specificValidSelected = specificValid.find(
    (subject) => subject._id.name === selectedSubject.value,
  );
  const toPlural = (value?: number) => (value == 1 ? '' : 's');
  const isAllSubjects = selectedSubject.value === 'Todas as matérias';

  const gradeCount = calculateGradeCount(
    eadFilter.value,
    general,
    isAllSubjects,
    specificValidSelected,
  );

  return [
    {
      value: specificValid.length,
      text: `disciplina${toPlural(specificValid.length)}`,
      icon: 'mdi-human-male-board',
    },
    {
      value: gradeCount,
      text: isAllSubjects
        ? `conceito${toPlural(general.count)}`
        : `conceito${toPlural(specificValidSelected?.count)}`,
      icon: 'mdi-format-annotation-plus',
    },
  ];
});

const grades = computed(() => {
  if (!teacherData.value?.data) return {};
  if (selectedSubject.value === 'Todas as matérias') {
    return transformConceptDataToObject(
      teacherData.value.data.general.distribution,
      eadFilter.value,
    );
  }
  const data = teacherData.value.data.specific
    .filter((subject) => subject._id)
    .find((subject) => subject._id.name === selectedSubject.value);
  return transformConceptDataToObject(
    data?.distribution || [],
    eadFilter.value,
  );
});

const demandsAttendance = computed(() => {
  if (!teacherData.value?.data) return false;
  return teacherData.value.data.general.distribution.some(
    (grade) => grade.conceito === 'O',
  );
});
</script>
