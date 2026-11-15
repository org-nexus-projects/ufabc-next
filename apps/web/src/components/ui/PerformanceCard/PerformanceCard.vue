<template>
  <v-card
    class="performance-card pa-5 d-flex flex-column justify-space-between h-100 w-100 rounded-lg"
  >
    <v-icon class="mdi mb-1" :class="[props.icon, `text-${props.color}`]" />
    <span class="text-h5 font-weight-bold">
      {{ props.title }}
      <span class="text-body-1 font-weight-light">
        {{ props.subTitle }}
      </span>
    </span>

    <v-card-text
      class="text-subtitle-2 d-flex flex-column justify-end px-0 pt-1 pb-0"
    >
      <p>
        {{ description }}
        <v-btn
          v-if="tooltip"
          density="compact"
          icon="mdi-information-outline"
          variant="text"
          class="pa-0 h-auto w-auto"
        >
          <v-icon />
          <v-tooltip open-on-click activator="parent" location="top">
            {{ tooltip }}
          </v-tooltip>
        </v-btn>
      </p>
      <v-progress-linear
        :model-value="(100 * progressBarValue) / progressBarMaxValue"
        :model-total="100"
        height="6"
        :color="color"
        bg-color="pink-lighten-3"
        class="d-none d-sm-block mt-2 rounded-lg"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
type Props = {
  title: string | number;
  subTitle?: string;
  progressBarValue?: number;
  progressBarMaxValue?: number;
  description: string;
  icon: string;
  color: string;
  tooltip?: string;
};

const props = withDefaults(defineProps<Props>(), {
  progressBarMaxValue: 100,
  progressBarValue: 100,
});
</script>

<style lang="scss" scoped>
.v-progress-linear {
  height: 6px;
}
</style>
