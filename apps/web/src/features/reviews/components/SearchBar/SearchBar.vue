<template>
  <FeedbackAlert v-if="isErrorTeachers" text="Erro ao buscar professores" />
  <FeedbackAlert v-if="isErrorSubjects" text="Erro ao buscar disciplinas" />
  <div class="wrapper mb-5 w-100">
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
        {{ capitalizeName(item.name) }}
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts" setup>
import type { SearchSubjectItem, SearchTeacherItem } from '@next/services';
import { Reviews } from '@next/services';
import { useQuery } from '@tanstack/vue-query';
import debounce from 'lodash.debounce';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { capitalizeName } from '@/utils/capitalizeName';

const router = useRouter();
const query = computed({
  get: () => router.currentRoute.value.query.q as string,
  // oxlint-disable-next-line no-empty-function -- the route query is the source of truth
  set: () => {},
});

function clear() {
  router.replace({
    name: 'reviews',
  });
}

function enterSearch(id: string, type: string, name: string) {
  (document.activeElement as HTMLDivElement)?.blur();

  router.replace({
    name: 'reviews',
    query: {
      q: name,
      subjectId: type === 'subject' ? id : undefined,
      teacherId: type === 'teacher' ? id : undefined,
    },
  });
}

const debouncedQuery = ref('');
const enableQuery = computed(() => !!debouncedQuery.value);

const {
  isError: isErrorTeachers,
  isFetching: isFetchingTeachers,
  data: searchResultsTeachers,
} = useQuery({
  enabled: enableQuery,
  queryFn: () => Reviews.searchTeachers(debouncedQuery.value),
  queryKey: ['reviews', 'search', debouncedQuery, 'teachers'],
  refetchOnWindowFocus: false,
});

const {
  isError: isErrorSubjects,
  isFetching: isFetchingSubjects,
  data: searchResultsSubjects,
} = useQuery({
  enabled: enableQuery,
  queryFn: () => Reviews.searchSubjects(debouncedQuery.value),
  queryKey: ['reviews', 'search', debouncedQuery, 'subjects'],
  refetchOnWindowFocus: false,
});

const handleUpdateDebouncedQuery = debounce(() => {
  debouncedQuery.value = query.value;
}, 500);

function onChangeQuery(e: InputEvent) {
  router.replace({
    name: 'reviews',
    query: {
      q: (e.target as HTMLInputElement)?.value,
    },
  });
  handleUpdateDebouncedQuery();
}

onMounted(() => {
  debouncedQuery.value = query.value;
});

function mapSearchResults(
  type: string,
  results?: Array<SearchTeacherItem | SearchSubjectItem>
) {
  return (
    results?.map((result) => ({
      id: result._id,
      name: result.name || '',
      type,
    })) || []
  );
}

const processedResults = computed(() => [
  ...mapSearchResults('teacher', searchResultsTeachers.value?.data),
  ...mapSearchResults('subject', searchResultsSubjects.value?.data),
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
