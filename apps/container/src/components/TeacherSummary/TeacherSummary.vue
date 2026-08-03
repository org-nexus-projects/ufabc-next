<template>
  <v-container v-if="summaryData" class="pa-0 mb-5 ai-summary-row">
    <v-row align="start" justify="start" class="ma-0">
      <v-col
        sm=""
        order="1"
        class="mr-3 justify-center pa-0 flex-grow-0 flex-shrink-1"
      >
        <div
          class="ai-avatar text-white d-flex align-center justify-center rounded-lg"
        >
          <v-icon icon="mdi-creation" size="28" class="ai-sparkle" />
        </div>
      </v-col>
      <v-col
        cols="12"
        sm=""
        order="3"
        order-sm="2"
        class="comment-text-container mr-2 pa-0"
      >
        <div class="d-flex align-center text-primary flex-wrap">
          <v-chip
            size="small"
            variant="flat"
            class="ai-badge font-weight-bold mr-2 mb-1"
          >
            <v-icon icon="mdi-creation" start size="14" />
            Gerado por IA
          </v-chip>
          <p class="text-subtitle-2 mb-1">Resumo dos comentários</p>
        </div>
        <p>{{ summaryData.summary }}</p>
        <div class="d-flex flex-wrap mt-2">
          <v-chip
            v-for="badge in badges"
            :key="badge.text"
            variant="outlined"
            size="small"
            :color="badge.color"
            class="mr-2 mb-2"
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
        Baseado em {{ summaryData.commentsCount }} comentário{{
          summaryData.commentsCount === 1 ? '' : 's'
        }}
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query';
import { Reviews } from '@next/services';
import { computed } from 'vue';

const props = defineProps({
  teacherId: { required: true, type: String },
});

const teacherId = computed(() => props.teacherId);

const { data: summaryData } = useQuery({
  enabled: !!teacherId.value,
  queryFn: () => Reviews.getTeacherSummary(teacherId.value),
  queryKey: ['teacher-summary', teacherId],
  refetchOnWindowFocus: false,
  retry: false,
});

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
.ai-summary-row {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 16px !important;
}

.ai-avatar {
  height: 54px;
  width: 54px;
  background: linear-gradient(135deg, #8e2de2, #4a00e0);
}

.ai-badge :deep(.v-chip__content) {
  color: #fff;
}

.ai-badge {
  background: linear-gradient(90deg, #8e2de2, #4a00e0, #8e2de2);
  background-size: 200% auto;
  animation: ai-shimmer 3s linear infinite;
}

.ai-sparkle {
  animation: ai-pulse 1.6s ease-in-out infinite;
}

@keyframes ai-shimmer {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes ai-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}
</style>
