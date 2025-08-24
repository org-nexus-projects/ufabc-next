<template>
  <VueQueryDevtools v-if="isLocal" />
  <AppBar :key="user?.ra">
    <v-main style="background-color: #f5f5f5">
      <v-container
        id="app-container"
        :style="`min-height: calc(100vh${(confirmedUser || layout === 'include-sidebar') ? '- 64px' : ''
        }); min-height: calc(100svh${(confirmedUser || layout === 'include-sidebar') ? '- 64px' : ''})`"
      >
        <router-view />
      </v-container>
    </v-main>
  </AppBar>
</template>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { ElMessage } from 'element-plus';
import { authStore } from 'stores';
import { computed, onMounted } from 'vue';
import create from 'vue-zustand';

const isLocal = import.meta.env.VITE_APP_ENV === 'local';

import { useRouter } from 'vue-router';

import { AppBar } from '@/layouts/AppBar';

import { eventTracker } from './helpers/EventTracker';

const useAuth = create(authStore);
const { user, isLoggedIn } = useAuth();

const router = useRouter()

const layout = computed(
  () => router.currentRoute.value.meta.layout ?? null
)

const confirmedUser = computed(() => !!user.value?.confirmed);

onMounted(async () => {
  window.Toaster = ElMessage;

  if (isLoggedIn.value() && user.value) {
    eventTracker.setUserProperties(user.value);
  }
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
