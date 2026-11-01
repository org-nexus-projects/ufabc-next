<template>
  <div class="archive-list d-flex flex-column">
    <ul v-if="archives.length > 0" class="items">
      <li v-for="archive in archives" :key="archive._id">
        <button
          type="button"
          class="item"
          :class="{ selected: archive._id === selectedId }"
          :aria-current="archive._id === selectedId"
          @click="emit('select', archive._id)"
        >
          <span
            class="dot"
            :class="statusDotClass[archive.status]"
            role="img"
            :aria-label="statusLabels[archive.status]"
          />
          <span class="text">
            <span class="name text-body-2 font-weight-medium">
              {{
                archive.fileName
                  ? cleanFileName(archive.fileName)
                  : 'Sem nome de arquivo'
              }}
            </span>
            <span class="code text-caption text-medium-emphasis">
              {{
                archive.component
                  ? `${capitalizeName(archive.component.name)} (${archive.component.code})`
                  : 'Sem disciplina vinculada'
              }}
            </span>
          </span>
          <span class="source text-caption text-medium-emphasis">
            {{ sourceLabels[archive.source] }}
          </span>
        </button>
      </li>
    </ul>

    <div
      v-else-if="!isLoading"
      class="empty d-flex flex-column align-center text-center pa-8"
    >
      <p class="text-body-2 font-weight-medium">
        Nenhum arquivo com esses filtros
      </p>
      <v-btn
        variant="text"
        size="small"
        color="primary"
        class="text-none mt-2"
        @click="emit('clear-filters')"
      >
        Limpar filtros
      </v-btn>
    </div>

    <div class="pager d-flex align-center justify-space-between pa-3">
      <span class="text-body-2 text-medium-emphasis">{{ rangeLabel }}</span>
      <div class="d-flex ga-1">
        <v-btn
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          aria-label="Página anterior"
          :disabled="page <= 1"
          @click="emit('update:page', page - 1)"
        />
        <v-btn
          icon="mdi-chevron-right"
          size="small"
          variant="text"
          aria-label="Próxima página"
          :disabled="page >= pageCount"
          @click="emit('update:page', page + 1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentArchive } from '@next/services';
import { computed } from 'vue';

import { capitalizeName } from '@/utils/capitalizeName';

import { cleanFileName } from '../utils/archiveFormat';
import {
  sourceLabels,
  statusDotClass,
  statusLabels,
} from '../utils/archiveLabels';

const props = defineProps<{
  archives: ComponentArchive[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  selectedId: string | null;
  total: number;
}>();

const emit = defineEmits<{
  'clear-filters': [];
  select: [archiveId: string];
  'update:page': [page: number];
}>();

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize))
);

const rangeLabel = computed(() => {
  if (props.total === 0) {
    return '0 arquivos';
  }
  const first = (props.page - 1) * props.pageSize + 1;
  const last = Math.min(props.page * props.pageSize, props.total);
  return `${first}–${last} de ${props.total}`;
});
</script>

<style scoped lang="scss">
.archive-list {
  flex: 1 1 0;
  min-height: 0;
}

.items {
  flex: 1;
  list-style: none;
  margin: 0;
  overflow-y: auto;
  padding: 0;
}

.item {
  align-items: center;
  background: transparent;
  border-left: 3px solid transparent;
  color: inherit;
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 12px 16px 12px 13px;
  text-align: left;
  transition: background-color 120ms ease;
  width: 100%;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.04);
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
  }

  &.selected {
    background: rgba(var(--v-theme-primary), 0.08);
    border-left-color: rgb(var(--v-theme-primary));
  }
}

.dot {
  border-radius: 50%;
  flex: none;
  height: 8px;
  width: 8px;
}

.text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.name,
.code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code {
  font-variant-numeric: tabular-nums;
}

.pager {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
