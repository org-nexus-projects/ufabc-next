<template>{{}}</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, PropType } from 'vue';

const props = defineProps({
  duration: {
    default: 5000,
    type: Number,
  },
  text: {
    default:
      'Não foi possível buscar as informações, tente novamente mais tarde',
    type: String,
  },
  type: {
    default: 'error',
    type: String as PropType<'error' | 'success' | 'warning' | 'info'>,
  },
});

onMounted(() => {
  ElMessage({
    duration: props.duration,
    message: props.text,
    showClose: true,
    type: props.type,
  });
});
</script>
<style lang="scss" scoped>
.alert {
  z-index: 1000;
  right: 15px;
  width: 350px;
  bottom: 15px;
}
</style>
