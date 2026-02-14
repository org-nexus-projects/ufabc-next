<template>
  <VueQueryDevtools v-if="isLocal" />
  <AppBar :key="authStore.user?.ra">
    <v-main>
      <v-container
        id="app-container"
        :style="`min-height: calc(100vh${
          confirmedUser || layout === 'include-sidebar' ? '- 64px' : ''
        }); min-height: calc(100svh- 64px})`"
      >
        <router-view />
      </v-container>
    </v-main>
  </AppBar>
</template>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { setTokenGetter } from '@ufabc-next/services';
import { ElMessage } from 'element-plus';
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { AppBar } from '@/layouts/AppBar';
import { useAuthStore } from '@/stores/auth';

import { eventTracker } from './helpers/EventTracker';

const isLocal = import.meta.env.VITE_APP_ENV === 'local';

const authStore = useAuthStore();
const router = useRouter();
const layout = computed(() => router.currentRoute.value.meta.layout ?? null);
const confirmedUser = computed(() => !!authStore.user?.confirmed);

onMounted(async () => {
  window.Toaster = ElMessage;

  if (authStore.isLoggedIn && authStore.user) {
    eventTracker.setUserProperties(authStore.user);
  }

  setTokenGetter(() => authStore.token);
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

.custom-warn {
  background: #fff8e6;
  border-left: 4px solid #f0a92d;
  padding: 14px 18px;
  border-radius: 6px;
  color: #5a4300;
  font-weight: 500;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
