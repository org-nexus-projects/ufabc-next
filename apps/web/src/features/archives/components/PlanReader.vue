<template>
  <article class="plan-reader">
    <div
      v-if="!archive"
      class="d-flex flex-column align-center justify-center text-center pa-12 h-100"
    >
      <v-icon size="36" class="text-medium-emphasis mb-3">
        mdi-text-box-search-outline
      </v-icon>
      <p class="text-body-1 font-weight-medium">Escolha um arquivo</p>
      <p class="text-body-2 text-medium-emphasis">
        O plano de ensino extraído aparece aqui para conferência.
      </p>
    </div>

    <div v-else :key="archive._id" class="content">
      <header class="mb-6">
        <h2 class="title">
          {{
            archive.component
              ? capitalizeName(archive.component.name)
              : 'Sem disciplina vinculada'
          }}
        </h2>

        <dl v-if="archive.component" class="facts mt-4">
          <div>
            <dt>Código</dt>
            <dd>{{ archive.component.code }}</dd>
          </div>
          <div>
            <dt>Turma</dt>
            <dd>{{ archive.component.group }}</dd>
          </div>
          <div>
            <dt>Turno</dt>
            <dd>{{ shiftLabels[archive.component.shift] }}</dd>
          </div>
          <div>
            <dt>Temporada</dt>
            <dd>{{ formatSeason(archive.component.season) }}</dd>
          </div>
        </dl>
      </header>

      <section class="file-bar d-flex align-center flex-wrap ga-3 mb-8">
        <v-icon class="text-medium-emphasis">mdi-file-pdf-box</v-icon>
        <div class="file-info">
          <p class="file-name text-body-2 font-weight-medium">
            {{
              archive.fileName
                ? cleanFileName(archive.fileName)
                : 'Arquivo sem nome'
            }}
          </p>
          <p class="text-caption text-medium-emphasis d-flex align-center">
            <span
              class="dot mr-2"
              :class="statusDotClass[archive.status]"
              aria-hidden="true"
            />
            {{ statusLabels[archive.status] }} via
            {{ sourceLabels[archive.source] }}
          </p>
        </div>
        <v-btn
          color="primary"
          variant="tonal"
          class="text-none open-button"
          prepend-icon="mdi-open-in-new"
          :disabled="archive.status !== 'stored'"
          :loading="isOpening"
          @click="openFile"
        >
          Abrir arquivo
        </v-btn>
      </section>

      <CenteredLoading v-if="archive.component && isPlanLoading" />

      <p v-else-if="!archive.component" class="notice">
        Este arquivo ainda não foi vinculado a uma disciplina, então não há
        plano para mostrar.
      </p>
      <p v-else-if="archive.status === 'failed'" class="notice">
        O processamento deste arquivo falhou. O plano mostrado abaixo, se
        houver, vem de uma coleta anterior.
      </p>

      <template v-if="plan">
        <section
          v-for="section in sections"
          :key="section.title"
          class="reading mb-6"
        >
          <h3>{{ section.title }}</h3>
          <PlanText :text="section.text" />
        </section>

        <section v-if="plan.schedule.length > 0" class="mb-6">
          <h3 class="reading-heading">Cronograma</h3>
          <ol class="schedule">
            <li v-for="(entry, index) in plan.schedule" :key="index">
              <span class="date">{{ formatScheduleDate(entry.date) }}</span>
              <span class="lesson">{{ entry.lesson }}</span>
            </li>
          </ol>
        </section>

        <section v-if="plan.timetable.length > 0" class="reading">
          <h3>Horários</h3>
          <p v-for="slot in plan.timetable" :key="slot">{{ slot }}</p>
        </section>
      </template>

      <p v-else-if="archive.component && !isPlanLoading" class="notice">
        O plano de ensino desta disciplina ainda não foi extraído.
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ComponentArchive } from '@next/services';
import { Archives } from '@next/services';
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';

import { CenteredLoading } from '@/components/ui/CenteredLoading';
import { capitalizeName } from '@/utils/capitalizeName';
import { formatSeason } from '@/utils/season';

import { cleanFileName, formatScheduleDate } from '../utils/archiveFormat';
import {
  shiftLabels,
  sourceLabels,
  statusDotClass,
  statusLabels,
} from '../utils/archiveLabels';
import PlanText from './PlanText.vue';

const props = defineProps<{
  archive: ComponentArchive | null;
}>();

const componentId = computed(() => props.archive?.component?._id ?? null);

const { data: plan, isLoading: isPlanLoading } = useQuery({
  enabled: computed(() => componentId.value !== null),
  queryFn: () => Archives.getPlan(componentId.value ?? ''),
  queryKey: ['archives', 'plan', componentId],
  retry: false,
});

const planSections = [
  { key: 'syllabus', title: 'Ementa' },
  { key: 'objectives', title: 'Objetivos' },
  { key: 'methodology', title: 'Metodologia' },
  { key: 'assessment', title: 'Avaliação' },
] as const;

const sections = computed(() => {
  const planning = plan.value?.planning;
  const visibleSections: Array<{ text: string; title: string }> = [];
  if (!planning) {
    return visibleSections;
  }
  for (const section of planSections) {
    visibleSections.push({
      text: planning[section.key],
      title: section.title,
    });
  }
  return visibleSections;
});

const isOpening = ref(false);

async function openFile() {
  if (!props.archive) {
    return;
  }
  isOpening.value = true;
  try {
    const download = await Archives.getDownload(props.archive._id);
    window.open(download.url, '_blank', 'noopener');
  } finally {
    isOpening.value = false;
  }
}
</script>

<style scoped lang="scss">
$reading-font: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;

.plan-reader {
  min-height: 100%;
}

.content {
  animation: reveal 180ms ease-out;
  margin: 0 auto;
  max-width: 680px;
  padding: 32px;
}

@keyframes reveal {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .content {
    animation: none;
  }
}

.title {
  font-family: $reading-font;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

.facts {
  display: grid;
  gap: 16px 32px;
  grid-template-columns: repeat(auto-fit, minmax(96px, max-content));
  margin: 0;

  dt {
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    font-size: 12px;
  }

  dd {
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    margin: 2px 0 0;
  }
}

.file-bar {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 12px 12px 12px 16px;
}

.file-info {
  flex: 1 1 200px;
  min-width: 0;
}

.open-button {
  letter-spacing: normal;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dot {
  border-radius: 50%;
  display: inline-block;
  flex: none;
  height: 8px;
  width: 8px;
}

.notice {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;
  padding: 12px 16px;
}

.reading {
  h3 {
    font-family: $reading-font;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  p {
    font-family: $reading-font;
    font-size: 17px;
    line-height: 1.7;
    max-width: 62ch;
    white-space: pre-line;
  }
}

.reading-heading {
  font-family: $reading-font;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.schedule {
  border-left: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  list-style: none;
  margin: 0;
  padding: 0 0 0 20px;

  li {
    display: flex;
    gap: 16px;
    padding: 6px 0;
  }

  .date {
    color: rgb(var(--v-theme-primary));
    flex: none;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    min-width: 48px;
  }

  .lesson {
    font-family: $reading-font;
    font-size: 16px;
    line-height: 1.5;
  }
}
</style>
