<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { onMounted } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: 'O next está em manutenção, por favor, tente novamente mais tarde',
  },
});

onMounted(() => {
  ElNotification({
    message: props.text,
    title: 'Ufabc next informa',
  });
});
</script>
