<template>
  <FeedbackAlert
    v-if="isErrorEnrollment"
    text="Erro ao buscar suas disciplinas cursadas"
  />
  <PaperCard v-if="filteredAndSeparatedEnrollments.length" class="mt-10 w-100">
    <p class="title">Seus professores para avaliar:</p>
    <v-container style="max-width: none" class="pa-3">
      <v-row>
        <v-col
          v-for="(enrollment, index) in filteredAndSeparatedEnrollments"
          :key="enrollment._id"
          cols="12"
          md="6"
          :class="`pa-0 py-2 ${index % 2 === 0 ? '' : 'pl-md-4'}`"
        >
          <PendingReviewEnrollment :enrollment="enrollment" />
        </v-col>
      </v-row>
    </v-container>
  </PaperCard>
</template>

<script setup lang="ts">
import { Enrollment, Enrollments } from '@next/services';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PaperCard } from '@/components/ui/PaperCard';

import { PendingReviewEnrollment } from '../PendingReviewEnrollment';

const { data: enrollments, isError: isErrorEnrollment } = useQuery({
  queryFn: Enrollments.list,
  queryKey: ['enrollments', 'list'],
  refetchOnWindowFocus: false,
});

function getLatestSeason(list: Enrollment[]) {
  let year = 0;
  for (const enrollment of list) {
    if (enrollment.year > year) {
      year = enrollment.year;
    }
  }

  let quad = 0;
  for (const enrollment of list) {
    if (year === enrollment.year && enrollment.quad > quad) {
      quad = enrollment.quad;
    }
  }

  return { quad, year };
}

function getPendingReviews(enrollment: Enrollment): Enrollment[] {
  if (!enrollment.teoria?.name && !enrollment.pratica?.name) {
    return [];
  }
  if (enrollment.teoria?.name === enrollment.pratica?.name) {
    const reviewed =
      enrollment.comments?.includes('teoria') ||
      enrollment.comments?.includes('pratica');
    return reviewed ? [] : [enrollment];
  }

  const pending: Enrollment[] = [];
  if (enrollment.teoria?.name && !enrollment.comments?.includes('teoria')) {
    pending.push({ ...enrollment, pratica: null });
  }
  if (enrollment.pratica?.name && !enrollment.comments?.includes('pratica')) {
    pending.push({ ...enrollment, teoria: null });
  }
  return pending;
}

const filteredAndSeparatedEnrollments = computed(() => {
  if (!enrollments.value) {
    return [] as Enrollment[];
  }

  const { year, quad } = getLatestSeason(enrollments.value);

  return enrollments.value
    .flatMap(getPendingReviews)
    .filter(
      (enrollment) => enrollment.year === year && enrollment.quad === quad
    );
});
</script>

<style scoped>
.title {
  font-weight: 700;
  font-size: 20px;
}
</style>
