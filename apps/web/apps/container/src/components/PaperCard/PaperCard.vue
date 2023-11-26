<template>
  <v-card class="rounded-lg d-flex flex-column flex-fill">
    <v-card-text class="pa-sm-6 d-flex flex-column flex-fill">
      <p class="text-primary text-h4 font-weight-bold">{{ title }}</p>
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps({
  title: String,
});
</script>
