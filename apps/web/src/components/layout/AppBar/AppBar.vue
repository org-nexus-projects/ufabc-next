<template>
  <v-app>
    <v-navigation-drawer
      v-if="authStore.user?.confirmed || layout === 'include-sidebar'"
      v-model="drawer"
      color="navigation"
      width="240"
    >
      <div class="d-flex flex-column" style="height: 100%">
        <div class="flex-grow-1 sidebar-navigation">
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
                <v-icon
                  v-if="isMdiIcon(item.icon)"
                  :icon="item.icon"
                  class="mr-3"
                />
                <i
                  v-else
                  :class="item.icon"
                  class="mr-3"
                  style="font-size: 18px"
                ></i>
                <p class="font-weight-medium text-caption">
                  {{ item.title }}
                </p>
              </v-layout>
            </v-list-item>
          </v-list>
        </div>

        <div class="flex-grow-0 flex-shrink-0">
          <section class="shirt-campaign" aria-label="Camiseta do Next">
            <div class="shirt-campaign__heading">
              <span>Camiseta do Next</span>
            </div>
            <p>Edição limitada · 30 peças numeradas</p>
            <a
              class="shirt-campaign__button"
              href="/camiseta"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Vista o Next! Conheça a camiseta (abre em nova aba)"
            >
              Vista o Next!
            </a>
          </section>

          <div v-if="!authStore.isLoggedIn">
            <v-divider />
            <div class="mb-4 pa-4 bg-blue-darken-3 border create-account-box">
              <div class="d-flex align-center gap-3">
                <v-icon class="pa-1" size="20">
                  mdi-account-circle-outline
                </v-icon>
                <strong>Acesse sua conta</strong>
              </div>
              <div class="mt-2 text-caption">
                Entre para acessar todas as funcionalidades do Next.
              </div>
              <v-btn
                variant="flat"
                size="small"
                block
                color="primary"
                class="mt-4 text-white text-caption pa-2"
                @click="handleLogin"
              >
                Entrar
              </v-btn>
              <v-btn
                variant="tonal"
                size="small"
                block
                class="mt-2 bg-blue-darken-2 text-white text-caption pa-2"
                style="border-color: #1e40af"
                @click="createAccount"
              >
                Criar Conta
              </v-btn>
            </div>
          </div>

          <div v-else-if="!authStore.user?.confirmed">
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
          v-if="!authStore.isLoggedIn"
          color="primary"
          variant="flat"
          size="small"
          class="mr-3 text-none"
          @click="handleLogin"
        >
          Entrar
        </v-btn>

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
import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';

import moonIcon from '@/assets/icons/moon.svg';
import sunIcon from '@/assets/icons/sun.svg';
import logoDark from '@/assets/logo.svg';
import logoLight from '@/assets/logo_white.svg';
import { applyChartsTheme } from '@/config/highcharts';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { eventTracker } from '@/helpers/EventTracker';
import { WebEvent } from '@/helpers/WebEvent';
import { useAuthStore } from '@/stores/auth';

import { useNavigationItems } from './useNavigationItems';

const router = useRouter();
const authStore = useAuthStore();
const theme = useTheme();

const getCurrentDate = () => dayjs();

const layout = computed(() => router.currentRoute.value.meta.layout ?? null);

const handleLogout = () => {
  authStore.logOut();
  window.location.href = '/';
};

const handleLogin = () => {
  eventTracker.track(WebEvent.LOGIN_CLICKED, {
    source: 'app_bar',
  });

  router.push('/login');
};

const createAccount = () => {
  eventTracker.track(WebEvent.CREATE_ACCOUNT_CLICKED, {
    source: 'app_bar_sidebar',
  });

  router.push('/signup');
};

function isMdiIcon(icon: string) {
  return icon.startsWith('mdi');
}

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
  const newTheme = isDarkMode.value ? 'light' : 'dark';
  theme.toggle();
  localStorage.setItem('darkMode', JSON.stringify(newTheme === 'dark'));
  updateHighchartsThemeClass(newTheme === 'dark');
};

const { externalNavigationItems, internalNavigationItems } =
  useNavigationItems();
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

.sidebar-navigation {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}

.shirt-campaign {
  padding: 16px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(55, 187, 163, 0.14) 35%,
    rgba(55, 187, 163, 0.65)
  );
  color: #fff;

  &__heading {
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);

    span {
      font-size: 13px;
      font-weight: 600;
    }
  }

  p {
    margin: 5px 0 12px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 11px;
    line-height: 1.5;
  }

  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 34px;
    padding: 7px 12px;
    border-radius: 999px;
    background: #fff;
    color: #173b64;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    text-decoration: none;

    &:hover {
      background: #edf8f5;
    }

    &:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }
  }
}
</style>
