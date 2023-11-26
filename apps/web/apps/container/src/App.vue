<template>
  <VueQueryDevtools v-if="isLocal" />
  <AppBar>
    <v-main style="background-color: #f5f5f5">
      <v-container
        id="app-container"
        :style="`min-height: calc(100vh${
          confirmedUser ? '- 64px' : ''
        }); min-height: calc(100svh${confirmedUser ? '- 64px' : ''})`"
      >
        <router-view />
      </v-container>
    </v-main>
  </AppBar>
</template>

<script setup lang="ts">
import { authStore } from 'stores';
import { computed, onMounted } from 'vue';
import create from 'vue-zustand';
import { ElMessage } from 'element-plus';
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';

const isLocal = process.env.VUE_APP_MF_ENV === 'local';

import { AppBar } from '@/layouts/AppBar';

const useAuth = create(authStore);
const { user } = useAuth();

const confirmedUser = computed(() => !!user.value?.confirmed);

onMounted(async () => {
  window.Toaster = ElMessage;
});
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Lato:100,300,400,500,700,900&display=swap');
@import url('https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&display=swap');
@import url('https://fonts.googleapis.com/css?family=Ubuntu:100,300,400,500,700,900&display=swap');

* {
  font-family: Lato, sans-serif;
}
html {
  font-family: Lato, sans-serif;
}
#app {
  font-family: Lato, sans-serif;
}

#app-container {
  max-width: 1200px;
  display: flex;
  flex-direction: column;
}

a {
  text-decoration: none;
  color: #37bba3;
}

p,
span {
  font-size: 14px;
}

.el-message {
  z-index: 9999999 !important;
}
</style>
