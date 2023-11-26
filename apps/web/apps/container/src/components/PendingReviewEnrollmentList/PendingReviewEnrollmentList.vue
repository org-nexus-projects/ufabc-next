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
          cols="12"
          md="6"
          :class="`pa-0 py-2 ${index % 2 === 0 ? '' : 'pl-md-4'}`"
          :key="enrollment._id"
        >
          <PendingReviewEnrollment :enrollment="enrollment" />
        </v-col>
      </v-row>
    </v-container>
  </PaperCard>
</template>

<script setup lang="ts">
import { PaperCard } from '@/components/PaperCard';
import { Enrollments } from 'services';
import { useQuery } from '@tanstack/vue-query';
import { PendingReviewEnrollment } from '@/components/PendingReviewEnrollment';
import { FeedbackAlert } from '@/components/FeedbackAlert';
import { computed } from 'vue';
import { Enrollment } from 'types';

const { data: enrollments, isError: isErrorEnrollment } = useQuery({
  refetchOnWindowFocus: false,
  queryKey: ['enrollments', 'list'],
  queryFn: Enrollments.list,
  select: (response) => response.data,
});

const filteredAndSeparatedEnrollments = computed(() => {
  if (!enrollments.value) return [] as Enrollment[];

  const year = enrollments.value.reduce((acc, enrollment) => {
    if (enrollment.year > acc) {
      return enrollment.year;
    }
    return acc;
  }, 0);

  const quad = enrollments.value.reduce((acc, enrollment) => {
    if (year == enrollment.year && enrollment.quad > acc) {
      return enrollment.quad;
    }
    return acc;
  }, 0);

  return enrollments.value
    .reduce((acc, enrollment) => {
      if (!enrollment.teoria?.name && !enrollment.pratica?.name) {
        return acc;
      }
      if (enrollment.teoria?.name === enrollment.pratica?.name) {
        !(
          enrollment.comments?.includes('teoria') ||
          enrollment.comments?.includes('pratica')
        ) && acc.push(enrollment);
        return acc;
      }
      if (enrollment.teoria?.name) {
        !enrollment.comments?.includes('teoria') &&
          acc.push({ ...enrollment, pratica: null });
      }
      if (enrollment.pratica?.name) {
        !enrollment.comments?.includes('pratica') &&
          acc.push({ ...enrollment, teoria: null });
      }
      return acc;
    }, [] as Enrollment[])
    .filter(
      (enrollment) => enrollment.year === year && enrollment.quad === quad,
    );
});
</script>

<style scoped>
.title {
  font-weight: 700;
  font-size: 20px;
}
</style>
