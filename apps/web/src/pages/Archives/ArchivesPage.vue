<template>
  <div class="archives-page">
    <header class="mb-6">
      <h1 class="text-h5 font-weight-medium">Arquivos</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">
        Confira os arquivos coletados e o plano de ensino extraído de cada um.
      </p>
    </header>

    <v-card flat border class="rounded-lg overflow-hidden">
      <div class="layout">
        <aside class="pane-list d-flex flex-column">
          <div class="pa-4 pb-3">
            <ArchiveFilters
              v-model:search="searchText"
              v-model:source="source"
              v-model:status="status"
            />
          </div>
          <v-progress-linear
            :active="isFetching"
            indeterminate
            height="2"
            color="primary"
          />
          <ArchiveList
            :archives="archives"
            :is-loading="isFetching"
            :page="page"
            :page-size="PAGE_SIZE"
            :selected-id="selectedId"
            :total="total"
            @clear-filters="clearFilters"
            @select="selectArchive"
            @update:page="page = $event"
          />
        </aside>

        <section v-if="mdAndUp" class="pane-reader">
          <PlanReader :archive="selectedArchive" />
        </section>
      </div>
    </v-card>

    <FeedbackAlert
      v-if="isError"
      text="Não foi possível carregar os arquivos."
    />

    <v-dialog v-if="!mdAndUp" v-model="isReaderOpen" fullscreen>
      <v-card>
        <v-toolbar flat density="comfortable">
          <v-btn
            icon="mdi-arrow-left"
            aria-label="Voltar para a lista"
            @click="isReaderOpen = false"
          />
          <v-toolbar-title class="text-body-1">Plano de ensino</v-toolbar-title>
        </v-toolbar>
        <PlanReader :archive="selectedArchive" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { ArchiveSource, ArchiveStatus } from '@next/services';
import { Archives } from '@next/services';
import { useQuery } from '@tanstack/vue-query';
import debounce from 'lodash.debounce';
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import ArchiveFilters from '@/features/archives/components/ArchiveFilters.vue';
import ArchiveList from '@/features/archives/components/ArchiveList.vue';
import PlanReader from '@/features/archives/components/PlanReader.vue';

const PAGE_SIZE = 20;

const { mdAndUp } = useDisplay();

const page = ref(1);
const source = ref<ArchiveSource | null>(null);
const status = ref<ArchiveStatus | null>(null);
const selectedId = ref<string | null>(null);
const isReaderOpen = ref(false);
const searchText = ref('');
const searchTerm = ref('');

const applySearch = debounce((text: string) => {
  searchTerm.value = text.trim();
}, 300);

watch(searchText, (text) => {
  applySearch(text);
});

watch([source, status, searchTerm], () => {
  page.value = 1;
});

const { data, isFetching, isError } = useQuery({
  queryFn: () =>
    Archives.list({
      limit: PAGE_SIZE,
      page: page.value,
      q: searchTerm.value || undefined,
      source: source.value ?? undefined,
      status: status.value ?? undefined,
    }),
  queryKey: ['archives', page, searchTerm, source, status],
});

const archives = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);

const selectedArchive = computed(() => {
  for (const archive of archives.value) {
    if (archive._id === selectedId.value) {
      return archive;
    }
  }
  return null;
});

watch(
  archives,
  (loadedArchives) => {
    if (mdAndUp.value && !selectedArchive.value && loadedArchives.length > 0) {
      selectedId.value = loadedArchives[0]._id;
    }
  },
  { immediate: true }
);

function selectArchive(archiveId: string) {
  selectedId.value = archiveId;
  if (!mdAndUp.value) {
    isReaderOpen.value = true;
  }
}

function clearFilters() {
  searchText.value = '';
  searchTerm.value = '';
  source.value = null;
  status.value = null;
}
</script>

<style scoped lang="scss">
.layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr);
  height: calc(100vh - 220px);
  min-height: 520px;
}

.pane-list {
  min-height: 0;
}

@media (min-width: 960px) {
  .layout {
    grid-template-columns: 360px 1fr;
  }

  .pane-list {
    border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .pane-reader {
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
