<template>
  <FeedbackAlert v-if="isErrorTeachers" text="Erro ao buscar professores" />
  <FeedbackAlert v-if="isErrorSubjects" text="Erro ao buscar disciplinas" />
  <div class="wrapper w-100 mb-5">
    <v-text-field
      v-model="query"
      variant="solo"
      placeholder="Digite o nome do professor ou disciplina"
      class="mb-1"
      hide-details
      :prepend-inner-icon="
        isFetchingTeachers || isFetchingSubjects
          ? 'mdi-loading mdi-spin'
          : 'mdi-magnify'
      "
      clearable
      @input="onChangeQuery"
      @click:clear="clear"
    />
    <v-list
      v-if="processedResults.length && router.currentRoute.value.query.q"
      class="results"
      elevation="1"
    >
      <v-list-item
        v-for="item in processedResults"
        :key="item.id"
        variant="plain"
        class="item"
        role="button"
        :name="item.name"
        @click="enterSearch(item.id, item.type, item.name)"
      >
        <v-icon
          v-if="item.type"
          :icon="item.type === 'teacher' ? 'mdi-account' : 'mdi-book'"
          class="mr-3"
        />
        {{ item.name }}
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query';
import { Reviews } from '@ufabc-next/services';
import type { SearchSubjectItem, SearchTeacherItem } from '@ufabc-next/types';
import debounce from 'lodash.debounce';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { FeedbackAlert } from '@/components/FeedbackAlert';

const router = useRouter();
const query = computed({
  get: () => router.currentRoute.value.query.q as string,
  set: () => {},
});

const clear = () => {
  router.replace({
    name: 'reviews',
  });
};

const enterSearch = (id: string, type: string, name: string) => {
  (document.activeElement as HTMLDivElement)?.blur();

  router.replace({
    name: 'reviews',
    query: {
      q: name,
      teacherId: type === 'teacher' ? id : undefined,
      subjectId: type === 'subject' ? id : undefined,
    },
  });
};

const debouncedQuery = ref('');
const enableQuery = computed(() => !!debouncedQuery.value);

const {
  isError: isErrorTeachers,
  isFetching: isFetchingTeachers,
  data: searchResultsTeachers,
} = useQuery({
  refetchOnWindowFocus: false,
  queryKey: ['reviews', 'search', debouncedQuery, 'teachers'],
  queryFn: () => Reviews.searchTeachers(debouncedQuery.value),
  enabled: enableQuery,
});

const {
  isError: isErrorSubjects,
  isFetching: isFetchingSubjects,
  data: searchResultsSubjects,
} = useQuery({
  refetchOnWindowFocus: false,
  queryKey: ['reviews', 'search', debouncedQuery, 'subjects'],
  queryFn: () => Reviews.searchSubjects(debouncedQuery.value),
  enabled: enableQuery,
});

const handleUpdateDebouncedQuery = debounce(() => {
  debouncedQuery.value = query.value;
}, 500);

const onChangeQuery = (e: InputEvent) => {
  router.replace({
    name: 'reviews',
    query: {
      q: (e.target as HTMLInputElement)?.value,
    },
  });
  handleUpdateDebouncedQuery();
};

onMounted(() => {
  debouncedQuery.value = query.value;
});

const mapSearchResults = (
  type: string,
  results?: (SearchTeacherItem | SearchSubjectItem)[],
) =>
  results?.map((result) => ({
    name: result.name,
    id: result._id,
    type: type,
  })) || [];

const processedResults = computed(() => [
  ...mapSearchResults('teacher', searchResultsTeachers.value?.data.data),
  ...mapSearchResults('subject', searchResultsSubjects.value?.data.data),
]);
</script>

<style scoped lang="scss">
.wrapper {
  position: relative;
  width: 100%;
}

.wrapper:focus-within .results {
  display: block;
}

.results {
  position: absolute;
  width: 100%;
  max-height: 320px;
  overflow-y: auto;
  border-radius: 4px;
  display: none;
  z-index: 9999;
}
</style>
