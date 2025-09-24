<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { onMounted } from 'vue';

const emit = defineEmits(['click']);

const props = defineProps({
  text: {
    type: String,
    default: 'O next está em manutenção, por favor, tente novamente mais tarde',
  },
  title: {
    type: String,
    default: 'UFABC Next informa',
  },
});

onMounted(() => {
  ElNotification({
    message: props.text,
    title: props.title,
    onClick: () => {
      emit('click');
    },
  });
});
</script>
