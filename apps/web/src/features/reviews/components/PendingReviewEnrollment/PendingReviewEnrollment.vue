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
        class="pa-0 d-flex align-center mr-3 flex-shrink-1 flex-grow-0 justify-center"
      >
        <div
          :style="conceptStyle"
          class="d-flex align-center justify-center rounded-lg text-white"
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
            class="mr-1 rounded-sm px-2"
            style="font-size: 12px"
          >
            {{ tag }}
          </v-chip>
        </div>
      </v-col>
      <v-col cols="12" sm="auto" class="d-flex align-end pa-0 justify-end">
        AVALIAR
        <v-icon class="ml-1"> mdi-plus-circle-outline </v-icon>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { Enrollment } from '@next/services';
import { computed, PropType, ref } from 'vue';

import { conceptsColor } from '@/utils/consts';
import { checkEAD, formatSeason } from '@/utils/season';

import { ReviewDialog } from '../ReviewDialog';

const props = defineProps({
  enrollment: {
    required: true,
    type: Object as PropType<Enrollment>,
  },
});

const showDialog = ref(false);

const conceptStyle = computed(() => ({
  backgroundColor: conceptsColor[props.enrollment.conceito],
  fontSize: '34px',
  height: '54px',
  width: '54px',
}));

const isEAD = computed(() =>
  checkEAD(props.enrollment.year, props.enrollment.quad)
);
const subjectType = computed(() => {
  if (!props.enrollment.teoria) {
    return 'prática';
  }
  return props.enrollment.pratica ? 'teoria e prática' : 'teoria';
});
const tags = computed(() => {
  const result = [
    subjectType.value,
    formatSeason(`${props.enrollment.year}:${props.enrollment.quad}`),
  ];
  if (isEAD.value) {
    result.push('EAD');
  }
  return result;
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
