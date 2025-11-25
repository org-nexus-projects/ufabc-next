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

      <div v-if="authStore.user?.confirmed" style="user-select: none">
        <v-menu location="top" :close-on-content-click="false">
          <template #activator="{ props }">
            <div
              v-bind="props"
              class="pa-4 cursor-pointer hover:bg-blue-darken-2 transition-colors"
              style="border-top: 1px solid rgba(255, 255, 255, 0.12)"
            >
              <div class="d-flex align-center gap-3">
                <v-avatar color="primary" size="40">
                  <span class="text-body-1 font-weight-medium">
                    {{ userInitials }}
                  </span>
                </v-avatar>
                <div class="flex-grow-1 pa-3">
                  <div class="text-body-2 font-weight-medium">
                    {{ userCleanUsername }}
                  </div>
                </div>
              </div>
            </div>
          </template>
          <v-card min-width="200">
            <v-list>
              <v-list-item>
                <div class="d-flex align-center py-2">
                  <v-avatar color="primary" size="40" style="user-select: none">
                    <span class="text-body-1 font-weight-bold">
                      {{ userInitials }}
                    </span>
                  </v-avatar>
                  <div class="flex-grow-1 pa-3">
                    <div class="text-body-3 font-weight-black">
                      {{ userCleanUsername }}
                    </div>
                    <div class="text-body-2">
                      {{ "RA: " + userRA }}
                    </div>
                  </div>
                </div>
              </v-list-item>
              <v-divider />
              <v-list-item @click="router.push('/settings')">
                <div class="d-flex align-center py-2 rounded-lg bg-gray-200">
                  <v-icon icon="mdi-cog" />
                  <div class="text-body-2 pa-3">
                    Configurações
                  </div>
                </div>
              </v-list-item>
              <v-list-item @click="handleLogout">
                <div class="d-flex align-center py-2">
                  <v-icon icon="mdi-logout" color="red-darken-2" />
                  <div class="text-body-2 pa-3 text-red-darken-2">
                    Sair
                  </div>
                </div>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </div>
  </div>
    </v-navigation-drawer>

    <v-app-bar
      v-if="authStore.user?.confirmed || layout === 'include-sidebar'"
      app
      height="min-content"
      class="py-2 header"
    >
      <v-app-bar-nav-icon
        app
        variant="text"
        color="primary"
        class="d-lg-none"
        @click.stop="drawer = !drawer"
      />

      <v-spacer />

      <img
        class="logo-white"
        src="@/assets/logo.svg"
        height="32"
        alt="logo do UFABC Next"
      />

      <v-spacer />
      <div v-if="authStore.user?.confirmed">
        <v-btn
          color="primary"
          :icon="isDarkMode ? 'mdi-moon-waning-crescent' : 'mdi-weather-sunny'"
          aria-label="Toggle theme"
          @click="toggleTheme"
        />
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

import { eventTracker } from '@/helpers/EventTracker';
import { WebEvent } from '@/helpers/WebEvent';
import { useAuthStore } from '@/stores/auth';
import { useAliasInitials } from '@/utils/composables/aliasInitials';
import { useCleanUsername } from '@/utils/composables/cleanUsername';

const router = useRouter();
const authStore = useAuthStore();
const theme = useTheme();
const userInitials = useAliasInitials();
const userRA = authStore.user?.ra;
const userCleanUsername = useCleanUsername();

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
});

const isDarkMode = computed(() => theme.global.current.value.dark);

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark ? 'light' : 'dark';
  theme.global.name.value = newTheme;
  localStorage.setItem('darkMode', JSON.stringify(newTheme === 'dark'));
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
