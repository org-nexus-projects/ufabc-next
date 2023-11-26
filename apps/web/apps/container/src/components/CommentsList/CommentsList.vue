<template>
  <FeedbackAlert
    v-if="isTeacherDataError"
    text="Erro ao carregar o(a) professor(a)"
  />
  <FeedbackAlert
    v-if="isFetchingCommentsError"
    text="Erro ao carregar comentários"
  />
  <v-select
    variant="solo"
    density="comfortable"
    v-model="selectedSubject"
    :items="subjects"
    hide-details
    menu-icon="mdi-menu-down"
  >
  </v-select>
  <CenteredLoading class="pt-4" v-if="isLoading" />
  <div
    v-else-if="!isLoading && commentsData?.total !== 0"
    :style="`${!smAndDown && 'max-height:500px ; overflow-y:auto'}`"
    class="pr-md-4 py-4"
  >
    <SingleComment
      v-for="comment in commentsData?.data"
      :key="comment._id"
      :comment="comment"
      date=""
      class="mb-5"
    />
    <div
      v-if="commentsData?.total !== commentsData?.data.length"
      class="text-center px-4"
    >
      <v-btn
        class="w-100 text-body-2"
        @click="fetchMoreComments"
        :disabled="!hasMoreComments"
        :loading="isFetchingMoreComments"
      >
        Carregar mais
      </v-btn>
    </div>
  </div>
  <div v-else class="d-flex align-center flex-column mt-5">
    <img
      src="@/assets/comment_not_found.gif"
      style="width: 100%; max-width: 128px"
      class="mb-5"
      alt="Nenhum comentário encontrado"
    />
    Infelizmente, nenhum comentário foi encontrado 😕
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { Reviews, Comments } from 'services';
import { SingleComment } from '@/components/SingleComment';
import { CenteredLoading } from '@/components/CenteredLoading';
import { FeedbackAlert } from '@/components/FeedbackAlert';
const { smAndDown } = useDisplay();

const props = defineProps({
  teacherId: { type: String, required: true },
  selectedSubject: { type: String, required: true },
});

const teacherId = computed(() => props.teacherId);

const emit = defineEmits(['update:selectedSubject']);
const selectedSubject = computed({
  get: () => props.selectedSubject,
  set: (value: string) => {
    emit('update:selectedSubject', value);
  },
});

const page = ref<number>(0);

const {
  data: teacherData,
  isFetching: isFetchingTeacher,
  refetch: refetchTeacher,
  isError: isTeacherDataError,
} = useQuery({
  refetchOnWindowFocus: false,
  queryKey: ['teacher', teacherId.value],
  queryFn: () => Reviews.getTeacher(teacherId.value),
  enabled: !!teacherId.value,
});

const selectedSubjectId = computed(
  () =>
    teacherData.value?.data.specific
      .filter((subject) => subject._id)
      .find((subject) => subject._id.name === selectedSubject.value)?._id._id ||
    '',
);

const {
  data: commentsDataPageable,
  isFetching: isFetchingComments,
  fetchNextPage: fetchMoreComments,
  hasNextPage: hasMoreComments,
  isFetchingNextPage: isFetchingMoreComments,
  isError: isFetchingCommentsError,
} = useInfiniteQuery({
  queryKey: ['comments', teacherId, selectedSubjectId, page],
  queryFn: ({ pageParam }) =>
    Comments.get(teacherId.value, selectedSubjectId.value, pageParam),
  refetchOnWindowFocus: false,
  enabled: !!teacherId.value,
  getNextPageParam: (lastPage, allPages) => {
    if (lastPage.data.total >= allPages.length * 10) {
      return allPages.length;
    }
  },
  initialPageParam: 0,
});

const commentsData = computed(() => {
  if (!commentsDataPageable.value) return;
  return {
    data: commentsDataPageable.value.pages.map((page) => page.data.data).flat(),
    total: commentsDataPageable.value.pages[0].data.total,
  };
});

watch(
  () => teacherId.value,
  () => refetchTeacher(),
);

const subjects = computed(() => {
  if (!teacherData.value?.data) return [];
  return [
    'Todas as matérias',
    ...teacherData.value.data.specific
      .filter((subject) => subject._id)
      .map((subject) => subject._id.name)
      .sort(),
  ];
});

const isLoading = computed(
  () =>
    isFetchingTeacher.value ||
    (isFetchingComments.value && !isFetchingMoreComments.value),
);
</script>
