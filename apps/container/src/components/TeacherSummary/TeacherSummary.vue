<template>
  <Transition name="ai-crossfade" mode="default">
    <v-container v-if="showSkeleton" key="skeleton" class="pa-0">
      <v-row align="start" justify="start" class="ma-0">
        <v-col
          sm=""
          order="1"
          class="mr-3 justify-center pa-0 flex-grow-0 flex-shrink-1"
        >
          <div
            class="ai-avatar d-flex align-center justify-center rounded-lg"
          >
            <v-icon icon="mdi-creation" size="28" color="white" />
          </div>
        </v-col>
        <v-col
          cols="12"
          sm=""
          order="3"
          order-sm="2"
          class="comment-text-container mr-2 pa-0"
        >
          <div class="d-flex align-center text-next-light-gray">
            <v-progress-circular
              indeterminate
              size="16"
              width="2"
              color="primary"
              class="mr-2"
            />
            <span class="text-subtitle-2">Resumindo comentários...</span>
          </div>
        </v-col>
        <v-col
          sm=""
          order="2"
          order-sm="3"
          class="pa-0 flex-grow-0 flex-shrink-1"
        />
      </v-row>
    </v-container>
    <v-container v-else-if="showCard" key="card" class="pa-0">
      <v-row align="start" justify="start" class="ma-0">
        <v-col
          sm=""
          order="1"
          class="mr-3 justify-center pa-0 flex-grow-0 flex-shrink-1"
        >
          <div
            class="ai-avatar d-flex align-center justify-center rounded-lg"
          >
            <img :src="aiSummaryAvatar" alt="" class="ai-avatar-img" />
          </div>
        </v-col>
        <v-col
          cols="12"
          sm=""
          order="3"
          order-sm="2"
          class="comment-text-container mr-2 pa-0"
        >
          <div class="d-flex align-center flex-wrap mb-1">
            <v-chip size="small" variant="flat" color="primary" class="ai-badge mr-1">
              <v-icon icon="mdi-creation" start size="14" />
              Gerado por IA
            </v-chip>
            <v-btn
              density="compact"
              icon="mdi-information-outline"
              variant="text"
              size="small"
              class="pa-0 h-auto w-auto"
              aria-label="Sobre este resumo"
            >
              <v-icon size="16" />
              <v-tooltip activator="parent" location="top" open-on-hover>
                O tamanduAI fez um resumo com IA para facilitar sua escolha de
                professores, baseado em {{ summaryData?.commentsCount }}
                experiência{{ summaryData?.commentsCount === 1 ? '' : 's' }}
                de alunos.
              </v-tooltip>
            </v-btn>
          </div>
          <p>{{ summaryData?.summary }}</p>
          <div class="d-flex flex-wrap mt-1">
            <v-chip
              v-for="badge in badges"
              :key="badge.text"
              variant="outlined"
              size="small"
              :color="badge.color"
              class="mr-1 mb-1"
            >
              <v-icon :icon="badge.icon" start size="16" />
              {{ badge.text }}
            </v-chip>
          </div>
        </v-col>
        <v-col
          sm=""
          order="2"
          order-sm="3"
          class="pa-0 justify-start text-subtitle-2 text-next-light-gray flex-grow-0 flex-shrink-1"
        >
          <div
            class="d-flex align-center justify-end comment-source-count"
          >
            <v-icon icon="mdi-comment-multiple-outline" size="16" class="mr-1" />
            <span class="text-subtitle-2">{{ summaryData?.commentsCount }}</span>
          </div>
          <span class="text-next-light-gray text-subtitle-2">Agora mesmo</span>
        </v-col>
      </v-row>
    </v-container>
  </Transition>
</template>

<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query';
import { Reviews } from '@next/services';
import { computed, onUnmounted, ref, watch } from 'vue';

import aiSummaryAvatar from '@/assets/ai-summary.png';

const props = defineProps({
  teacherId: { required: true, type: String },
});

const teacherId = computed(() => props.teacherId);

const {
  data: summaryData,
  isLoading,
  isError,
} = useQuery({
  enabled: !!teacherId.value,
  queryFn: () => Reviews.getTeacherSummary(teacherId.value),
  queryKey: ['teacher-summary', teacherId],
  refetchOnWindowFocus: false,
  retry: false,
});

const MIN_SKELETON_MS = 1600;
// Starts true so a cache hit (isLoading born false) skips the skeleton
// instead of hanging forever waiting for a watch that will never fire.
const skeletonElapsed = ref(true);
let timer: ReturnType<typeof setTimeout> | null = null;

watch(
  isLoading,
  (loading) => {
    if (loading) {
      skeletonElapsed.value = false;
      timer = setTimeout(() => {
        skeletonElapsed.value = true;
      }, MIN_SKELETON_MS);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});

const showSkeleton = computed(() => isLoading.value || !skeletonElapsed.value);
const showCard = computed(
  () => !showSkeleton.value && !!summaryData.value && !isError.value,
);

const badges = computed(() => {
  if (!summaryData.value) {
    return [];
  }
  const items: Array<{ color: string; icon: string; text: string }> = [];
  const { didacticQuality, takesAttendance, usesSigaa, usesMoodle } =
    summaryData.value;

  if (didacticQuality !== null && didacticQuality !== undefined) {
    const isGood = didacticQuality >= 3;
    items.push({
      color: isGood ? 'success' : 'warning',
      icon: 'mdi-school',
      text: isGood ? 'Boa didática' : 'Didática a desejar',
    });
  }
  if (takesAttendance !== null && takesAttendance !== undefined) {
    items.push({
      color: takesAttendance ? 'warning' : 'success',
      icon: 'mdi-account-check',
      text: takesAttendance ? 'Cobra presença' : 'Não cobra presença',
    });
  }
  if (usesSigaa) {
    items.push({ color: 'primary', icon: 'mdi-web', text: 'Usa Sigaa' });
  }
  if (usesMoodle) {
    items.push({ color: 'primary', icon: 'mdi-web', text: 'Usa Moodle' });
  }

  return items;
});
</script>

<style scoped>
.ai-avatar {
  height: 54px;
  width: 54px;
  background-color: rgb(var(--v-theme-primary));
  overflow: hidden;
}

.ai-avatar-img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.ai-badge {
  font-weight: normal;
}

.comment-source-count {
  height: 36px;
}

.ai-crossfade-enter-active,
.ai-crossfade-leave-active {
  transition: opacity 0.35s ease;
}

.ai-crossfade-enter-from,
.ai-crossfade-leave-to {
  opacity: 0;
}
</style>
