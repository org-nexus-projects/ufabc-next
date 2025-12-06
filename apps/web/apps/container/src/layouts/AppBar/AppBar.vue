<template>
  <v-app>
    <v-navigation-drawer
      v-if="authStore.user?.confirmed || layout === 'include-sidebar'"
      v-model="drawer"
      color="navigation"
      width="240"
    >
      <div class="d-flex flex-column" style="height: 100%">
        <div class="flex-grow-0">
          <v-list>
            <div class="py-4 d-flex justify-center align-center">
              <img
                class="logo-white"
                src="@/assets/logo_white.svg"
                height="44"
                alt="logo do UFABC Next"
              />
            </div>
            <v-divider />
            <v-list-item
              v-for="item in internalNavigationItems"
              :key="item.title"
              :to="!item.locked ? item.route : undefined"
              :class="{ 'locked-item': item.locked }"
            >
              <v-layout class="d-flex">
                <v-icon :icon="item.icon" class="mr-3" />
                <p class="font-weight-medium text-caption">
                  {{ item.title }}
                </p>
                <span
                  v-if="item.releaseDate?.add(3, 'month').isAfter(dayjs())"
                  class="featured-chip font-weight-black"
                  >Novo</span
                >
                <v-icon
                  v-if="item.locked"
                  icon="mdi mdi-lock-outline"
                  class="locked-icon"
                  size="16"
                />
              </v-layout>
            </v-list-item>
          </v-list>
          <v-divider />
          <v-list>
            <v-list-item
              v-for="item in externalNavigationItems"
              :key="item.title"
              :href="item.url"
              :target="item.url && '_blank'"
              :rel="item.url && 'noopener noreferrer'"
            >
              <v-layout>
                <v-icon :icon="item.icon" class="mr-3" />
                <p class="font-weight-medium text-caption">
                  {{ item.title }}
                </p>
              </v-layout>
            </v-list-item>
          </v-list>
        </div>

        <div class="flex-grow-1"></div>

        <div class="flex-grow-0">
          <div v-if="!authStore.user?.confirmed">
            <v-divider />
            <div class="mb-4 pa-4 bg-blue-darken-3 border create-account-box">
              <div class="d-flex align-center gap-3">
                <v-icon class="pa-1" size="20"> mdi-lock-outline </v-icon>
                <strong>Conta não confirmada</strong>
              </div>
              <div class="mt-2 text-caption">
                Crie sua conta no next para acessar todas as funcionalidades.
              </div>
              <v-btn
                variant="tonal"
                size="small"
                block
                class="mt-4 bg-blue-darken-2 text-white text-caption pa-2"
                style="border-color: #1e40af"
                @click="createAccount"
              >
                Criar Conta
              </v-btn>
            </div>
          </div>

          <UserMenu v-if="authStore.user?.confirmed" @logout="handleLogout" />
        </div>
      </div>
    </v-navigation-drawer>

    <v-app-bar
      v-if="authStore.user?.confirmed || layout === 'include-sidebar'"
      app
      height="min-content"
      class="header"
      color="appbar"
      style="height: 64px"
    >
      <div class="d-flex align-center w-100">
        <v-app-bar-nav-icon
          app
          variant="text"
          color="primary"
          class="d-lg-none"
          @click.stop="drawer = !drawer"
        />

        <div class="flex-grow-1 d-flex justify-center">
          <img
            class="logo-white"
            :src="isDarkMode ? logoLight : logoDark"
            height="32"
            alt="logo do UFABC Next"
          />
        </div>

        <v-btn
          color="primary"
          class="d-flex align-center justify-center"
          height="100%"
          aria-label="Toggle theme"
          flat
          style="min-height: 64px"
          @click="toggleTheme"
        >
          <v-img
            :src="isDarkMode ? moonIcon : sunIcon"
            height="24"
            width="24"
            alt="Toggle theme"
          />
        </v-btn>
      </div>
    </v-app-bar>
    <div
      v-if="authStore.user?.confirmed || layout === 'include-sidebar'"
      style="height: 64px"
    />
    <slot />
  </v-app>
</template>
<script setup lang="ts">
import { api } from '@ufabc-next/services';
import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';

import moonIcon from '@/assets/icons/moon.svg';
import sunIcon from '@/assets/icons/sun.svg';
import logoDark from '@/assets/logo.svg';
import logoLight from '@/assets/logo_white.svg';
import { UserMenu } from '@/components/UserMenu';
import { eventTracker } from '@/helpers/EventTracker';
import { WebEvent } from '@/helpers/WebEvent';
import { useAuthStore } from '@/stores/auth';
import { applyChartsTheme } from '@/theme';

const router = useRouter();
const authStore = useAuthStore();
const theme = useTheme();

const layout = computed(() => router.currentRoute.value.meta.layout ?? null);

const handleLogout = () => {
  authStore.logOut();
};

const createAccount = () => {
  eventTracker.track(WebEvent.CREATE_ACCOUNT_CLICKED, {
    source: 'app_bar_sidebar',
  });

  router.push('/signup');
};

const drawer = ref(false);
onMounted(() => {
  drawer.value = window.innerWidth >= 1024;
  updateHighchartsThemeClass(theme.global.current.value.dark);
});

const isDarkMode = computed(() => theme.global.current.value.dark);

const updateHighchartsThemeClass = (isDark: boolean) => {
  document.body.classList.remove('highcharts-light', 'highcharts-dark');
  document.body.classList.add(isDark ? 'highcharts-dark' : 'highcharts-light');
  applyChartsTheme();
};

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark ? 'light' : 'dark';
  theme.toggle();
  localStorage.setItem('darkMode', JSON.stringify(newTheme === 'dark'));
  updateHighchartsThemeClass(newTheme === 'dark');
};

const internalNavigationItems = [
  {
    title: 'Reviews',
    icon: 'mdi-message-draw',
    route: '/reviews',
    locked: !authStore.user?.confirmed,
  },
  {
    title: 'Meu histórico',
    icon: 'mdi-history',
    route: '/history',
    locked: !authStore.user?.confirmed,
  },
  {
    title: 'Performance',
    icon: 'mdi-google-analytics',
    route: '/performance',
    locked: !authStore.user?.confirmed,
  },
  {
    title: 'Dados da Matrícula',
    icon: 'mdi-book-multiple',
    route: '/stats',
    locked: !authStore.user?.confirmed,
  },
  {
    title: 'Grupos no WhatsApp',
    icon: 'mdi-whatsapp',
    route: '/grupos-whatsapp',
    releaseDate: dayjs('07/10/2025'),
    locked: false,
  },
  {
    title: 'Calengrade',
    icon: 'mdi-calendar',
    route: '/calengrade',
    releaseDate: dayjs('11/25/2023'),
    locked: false,
  },
  {
    title: 'Apoie o UFABC next',
    icon: 'mdi-bank',
    route: '/donate',
    locked: false,
  },
  {
    title: 'Ajuda',
    icon: 'mdi-help-circle',
    route: '/help',
    locked: false,
  },
];

const apiURL = api.defaults.baseURL ?? 'https://api.v2.ufabcnext.com';

const externalNavigationItems = [
  {
    title: 'Snapshot da Matrícula',
    icon: 'mdi-open-in-new',
    url: 'https://ufabc-matricula-snapshot.vercel.app',
  },
  {
    title: 'Use a Extensão',
    icon: 'mdi-download',
    url: 'https://chrome.google.com/webstore/detail/ufabc-next/gphjopenfpnlnffmhhhhdiecgdcopmhk',
  },
  ...(authStore.user?.permissions?.includes('admin')
    ? [
        {
          title: 'Monitoramento de Jobs',
          icon: 'mdi-open-in-new',
          url: `${apiURL}/login/jobs-monitoring?userId=${authStore.user?._id}`,
        },
      ]
    : []),
];
</script>
<style scoped lang="scss">
.v-list-item {
  font-size: 14px;
}
</style>

<style scoped lang="scss">
.header {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05) !important;
}

.featured-chip {
  background-color: #37bba3;
  border-radius: 4px;
  color: #fff;
  opacity: 1;
  margin-left: auto;
  font-weight: 400;
  display: inline-block;
  padding: 2px 4px;
  font-size: 12px;
}

.locked-item {
  opacity: 0.5;
  cursor: not-allowed;
  transition-duration: 0.2s;
}

.locked-item:hover {
  background-color: rgba(50, 94, 158, 255);
}

.locked-icon {
  margin-left: auto;
  border-radius: 50%;
  border: 12px solid rgb(45, 78, 128);
}

.create-account-box {
  border-radius: 16px;
  margin: 10px;
}
</style>
