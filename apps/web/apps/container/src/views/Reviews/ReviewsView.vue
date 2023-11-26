<template>
  <v-layout class="flex-column align-center">
    <SearchBar />
    <TeacherReview
      v-if="router.currentRoute.value.query.teacherId"
      :teacherId="router.currentRoute.value.query.teacherId.toString()"
      :key="router.currentRoute.value.query.teacherId.toString()"
    />
    <SubjectReview
      v-else-if="router.currentRoute.value.query.subjectId"
      :subjectId="router.currentRoute.value.query.subjectId.toString()"
      :key="router.currentRoute.value.query.subjectId.toString()"
    />
    <div v-else class="w-100 d-flex flex-column align-center">
      <WelcomeMessage />
      <PendingReviewEnrollmentList />
    </div>
  </v-layout>
</template>

<script setup lang="ts">
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { SearchBar } from '@/components/SearchBar';
import { SubjectReview } from '@/components/SubjectReview';
import { TeacherReview } from '@/components/TeacherReview';
import { PendingReviewEnrollmentList } from '@/components/PendingReviewEnrollmentList';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>
