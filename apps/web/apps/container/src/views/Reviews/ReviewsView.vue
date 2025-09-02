<template>
  <v-layout class="flex-column align-center">
    <SearchBar />
    <TeacherReview
      v-if="router.currentRoute.value.query.teacherId"
      :key="router.currentRoute.value.query.teacherId.toString()"
      :teacher-id="router.currentRoute.value.query.teacherId.toString()"
    />
    <SubjectReview
      v-else-if="router.currentRoute.value.query.subjectId"
      :key="router.currentRoute.value.query.subjectId.toString()"
      :subject-id="router.currentRoute.value.query.subjectId.toString()"
    />
    <div
      v-else
      class="w-100 d-flex flex-column align-center"
    >
      <WelcomeMessage />
      <PendingReviewEnrollmentList />
    </div>
  </v-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import { PendingReviewEnrollmentList } from '@/components/PendingReviewEnrollmentList';
import { SearchBar } from '@/components/SearchBar';
import { SubjectReview } from '@/components/SubjectReview';
import { TeacherReview } from '@/components/TeacherReview';
import { WelcomeMessage } from '@/components/WelcomeMessage';

const router = useRouter();
</script>
