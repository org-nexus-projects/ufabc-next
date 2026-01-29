<template>
  <ReviewDialog
    :enrollment="enrollment"
    :show-dialog="showDialog"
    :tags="tags"
    @update:show-dialog="showDialog = $event"
  />
  <v-container
    class="pa-3 bg-secondary rounded-lg"
    style="max-width: none"
    role="button"
    @click="showDialog = true"
  >
    <v-row class="ma-0">
      <v-col class="d-flex align-center text-primary pa-0 font-weight-bold">
        <p class="line-clamp">
          {{ enrollment.subject.name }}
        </p>
      </v-col>
    </v-row>
    <v-row class="ma-0 mt-1">
      <v-col
        class="pa-0 mr-3 d-flex align-center justify-center flex-grow-0 flex-shrink-1"
      >
        <div
          :style="conceptStyle"
          class="text-white d-flex align-center justify-center rounded-lg"
        >
          {{ enrollment.conceito }}
        </div>
      </v-col>
      <v-col class="pa-0 d-flex flex-column justify-center">
        <p v-if="enrollment.teoria" class="line-clamp">
          {{ enrollment.teoria?.name }}
        </p>
        <p v-if="!enrollment.teoria" class="line-clamp">
          {{ enrollment.pratica?.name }}
        </p>
        <div>
          <v-chip
            v-for="tag in tags"
            :key="tag"
            density="compact"
            class="px-2 mr-1 rounded-sm"
            style="font-size: 12px"
          >
            {{ tag }}
          </v-chip>
        </div>
      </v-col>
      <v-col cols="12" sm="auto" class="d-flex justify-end align-end pa-0">
        AVALIAR
        <v-icon class="ml-1"> mdi-plus-circle-outline </v-icon>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { Enrollment } from '@ufabc-next/types';
import { computed, PropType, ref } from 'vue';

import { ReviewDialog } from '@/components/ReviewDialog';
import { conceptsColor } from '@/utils/consts';
import { checkEAD, formatSeason } from '@/utils/season';

const showDialog = ref(false);

const conceptStyle = computed(() => ({
  backgroundColor: conceptsColor[props.enrollment.conceito],
  height: '54px',
  width: '54px',
  fontSize: '34px',
}));

const props = defineProps({
  enrollment: {
    type: Object as PropType<Enrollment>,
    required: true,
  },
});

const isEAD = computed(() =>
  checkEAD(props.enrollment.year, props.enrollment.quad),
);
const subjectType = computed(() =>
  props.enrollment.teoria
    ? props.enrollment.pratica
      ? 'teoria e prática'
      : 'teoria'
    : 'prática',
);
const tags = computed(() => {
  const tags = [
    subjectType.value,
    formatSeason(props.enrollment.year + ':' + props.enrollment.quad),
  ];
  isEAD.value && tags.push('EAD');
  return tags;
});
</script>
<style scoped>
.line-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}
</style>
