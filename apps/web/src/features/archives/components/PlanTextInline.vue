<template>
  <template v-for="(segment, index) in segments" :key="index">
    <a
      v-if="segment.href"
      :href="segment.href"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ segment.text }}
    </a>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { splitLinks } from '../utils/parsePlanText';

const props = defineProps<{ text: string }>();

const segments = computed(() => splitLinks(props.text));
</script>

<style scoped lang="scss">
a {
  color: rgb(var(--v-theme-primary));
  font-family: inherit;
  overflow-wrap: anywhere;
}
</style>
