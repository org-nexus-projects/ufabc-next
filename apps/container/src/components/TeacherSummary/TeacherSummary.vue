<template>
  <FeedbackAlert
    v-if="isSummaryError"
    text="Erro ao carregar o resumo do(a) professor(a)"
  />
  <CenteredLoading v-if="isFetchingSummary" class="mt-4" />
  <PaperCard v-else-if="summaryData" class="w-100 mb-4">
    <div class="d-flex align-center flex-wrap mb-2">
      <p class="text-primary text-h4 font-weight-bold mb-0 mr-2">
        Resumo dos comentários
      </p>
      <v-chip size="small" variant="flat" class="ai-badge font-weight-bold">
        <v-icon icon="mdi-creation" start size="16" class="ai-sparkle" />
        Gerado por IA
      </v-chip>
    </div>
    <p class="text-body-1">{{ summaryData.summary }}</p>
    <div class="d-flex flex-wrap mt-3">
      <v-chip
        v-for="badge in badges"
        :key="badge.text"
        variant="outlined"
        :color="badge.color"
        class="mr-2 mb-2"
      >
        <v-icon :icon="badge.icon" start />
        {{ badge.text }}
      </v-chip>
    </div>
    <p class="text-caption text-medium-emphasis mt-2">
      Baseado em {{ summaryData.commentsCount }} comentário{{
        summaryData.commentsCount === 1 ? '' : 's'
      }}
    </p>
  </PaperCard>
</template>

<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query';
import { Reviews } from '@next/services';
import { computed } from 'vue';

import { CenteredLoading } from '@/components/CenteredLoading';
import { FeedbackAlert } from '@/components/FeedbackAlert';
import { PaperCard } from '@/components/PaperCard';

const props = defineProps({
  teacherId: { required: true, type: String },
});

const teacherId = computed(() => props.teacherId);

const {
  data: summaryData,
  isFetching: isFetchingSummary,
  error: summaryError,
} = useQuery({
  enabled: !!teacherId.value,
  queryFn: () => Reviews.getTeacherSummary(teacherId.value),
  queryKey: ['teacher-summary', teacherId],
  refetchOnWindowFocus: false,
  retry: false,
});

const isSummaryError = computed(() => {
  const status = (summaryError.value as { response?: { status?: number } })
    ?.response?.status;
  return !!summaryError.value && status !== 404;
});

const badges = computed(() => {
  if (!summaryData.value) {
    return [];
  }
  const items: Array<{ color: string; icon: string; text: string }> = [];
  const { didacticQuality, takesAttendance, usesSigaa, usesMoodle } =
    summaryData.value;

  if (didacticQuality !== null && didacticQuality !== undefined) {
    items.push({
      color: didacticQuality ? 'success' : 'warning',
      icon: 'mdi-school',
      text: didacticQuality ? 'Boa didática' : 'Didática a desejar',
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
