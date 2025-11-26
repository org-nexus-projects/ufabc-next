<\template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { onMounted } from 'vue';
import { useTheme } from 'vuetify';

const emit = defineEmits(['click']);
const theme = useTheme();

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
    customClass: theme.global.current.value.dark ? 'notification-dark' : 'notification-light',
  });
});
</script>

<style lang="scss">
/*just override what you need*/
@forward 'element-plus/theme-chalk/src/dark/var.scss' with (
  $bg-color: (
    'page': #0a0a0a,
    '': #626aef,
    'overlay': #1d1e1f,
  )
);

.notification-dark.el-notification {
  background: #1e1e1e !important;
  border-color: #2d2d2d !important;
  color: #ffffff !important;
  cursor: pointer !important;
  
  .el-notification__title {
    color: #ffffff !important;
  }
  
  .el-notification__content {
    color: rgba(255, 255, 255, 0.87) !important;
  }
}

.notification-light.el-notification {
  background: #ffffff !important;
  border-color: #e0e0e0 !important;
  color: #000000 !important;
  cursor: pointer !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }
  
  .el-notification__title {
    color: #000000 !important;
  }
  
  .el-notification__content {
    color: rgba(0, 0, 0, 0.87) !important;
  }
}
</style>