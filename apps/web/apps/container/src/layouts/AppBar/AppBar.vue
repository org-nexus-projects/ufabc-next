<template>
  <v-app>
    <v-navigation-drawer v-if="user?.confirmed || layout === 'include-sidebar'" v-model="drawer" color="navigation"
      width="240">
      <v-list>
        <div class="py-4 d-flex justify-center align-center">
          <img class="logo-white" src="@/assets/logo_white.svg" height="44" alt="logo do UFABC Next" />
        </div>
        <v-divider />
        <v-list-item v-for="item in internalNavigationItems" :key="item.title"
          :to="!item.locked ? item.route : undefined" :class="{ 'locked-item': item.locked }">
          <v-layout class="d-flex">
            <v-icon :icon="item.icon" class="mr-3" />
            <p class="font-weight-medium text-caption">{{ item.title }}</p>
            <span v-if="item.releaseDate?.add(3, 'month').isAfter(dayjs())"
              class="featured-chip font-weight-black">Novo</span>
            <v-icon v-if="item.locked" icon="mdi mdi-lock-outline" class="locked-icon" size="16" />
          </v-layout>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list>
        <v-list-item v-for="item in externalNavigationItems" :href="item.url" :target="item.url && '_blank'"
          :rel="item.url && 'noopener noreferrer'" :key="item.title">
          <v-layout>
            <v-icon :icon="item.icon" class="mr-3" />
            <p class="font-weight-medium text-caption">{{ item.title }}</p>
          </v-layout>
        </v-list-item>
      </v-list>
      <div v-if="!user?.confirmed">
        <v-divider />
        <div style="height: 64px"></div>
        <div class="mb-4 pa-3 rounded-md bg-blue-darken-3 border border-blue-darken-2 text-blue-50 text-subtitle-2">
          <div class="d-flex align-center gap-2">
            <v-icon class="bg-blue-darken-2 pa-1 rounded-circle " size="20">mdi-lock-outline</v-icon>
            <strong>Conta não confirmada</strong>
          </div>
          <div class="mt-2 text-caption">
            Crie sua conta no next para acessar todas as funcionalidades.
          </div>
          <v-btn variant="outlined" size="small" block class="mt-2 bg-blue-darken-2 text-white text-caption"
            style="border-color: #1e40af" @click="createAccount">
            Criar Conta
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <v-app-bar v-if="user?.confirmed || layout === 'include-sidebar'" app height="min-content" class="py-2 header">
      <v-app-bar-nav-icon app variant="text" color="primary" @click.stop="drawer = !drawer"
        class="d-lg-none"></v-app-bar-nav-icon>

      <v-spacer></v-spacer>

      <img class="logo-white" src="@/assets/logo.svg" height="32" alt="logo do UFABC Next" />

      <v-spacer></v-spacer>
      <div v-if="user?.confirmed">
        <v-btn color="primary" icon="mdi-dots-vertical" aria-label="Expandir menu de usuário">
          <v-icon></v-icon>
          <v-menu activator="parent">
            <v-list class="px-2">
              <v-list-item>
                <v-layout>
                  <v-avatar :size="38" color="primary">
                    {{ userInitials.toLocaleUpperCase() }}
                  </v-avatar>
                  <v-layout class="flex-column ml-4">
                    <p>{{ userLogin }}</p>
                    <p v-if="user?.ra" class="text-caption text-medium-emphasis">
                      RA: {{ user.ra }}
                    </p>
                  </v-layout>
                </v-layout>
              </v-list-item>
              <v-list-item>
                <v-btn @click="handleLogout" prepend-icon="mdi-exit-to-app" variant="text"
                  class="text-capitalize text-body-2">Sair</v-btn>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
      </div>
    </v-app-bar>
    <div v-if="user?.confirmed || layout === 'include-sidebar'" style="height: 64px"></div>
    <slot />
  </v-app>
</template>
<style scoped lang="scss">
.v-list-item {
  font-size: 14px;
}
</style>
<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, ref, onMounted } from 'vue';
import { useAuth } from '@/stores/useAuth';
import { useAliasInitials } from '@/utils/composables/aliasInitials';
import { api } from 'services';
import { useRouter } from 'vue-router'

const router = useRouter()

const layout = computed(
  () => router.currentRoute.value.meta.layout ?? null
)

const { logOut, user } = useAuth();
const handleLogout = () => {
  logOut.value();
};

const createAccount = () => {
  router.push('/')
}

const drawer = ref(false);
onMounted(() => {
  drawer.value = window.innerWidth >= 1024;
});

const userLogin = computed(
  () => user.value?.email?.replace('@aluno.ufabc.edu.br', ''),
);
const userInitials = useAliasInitials();

const internalNavigationItems = [
  {
    title: 'Reviews',
    icon: 'mdi-message-draw',
    route: '/reviews',
    locked: !user.value?.confirmed
  },
  {
    title: 'Meu histórico',
    icon: 'mdi-history',
    route: '/history',
    locked: !user.value?.confirmed
  },
  {
    title: 'Performance',
    icon: 'mdi-google-analytics',
    route: '/performance',
    locked: !user.value?.confirmed
  },
  {
    title: 'Dados da Matrícula',
    icon: 'mdi-book-multiple',
    route: '/stats',
    locked: !user.value?.confirmed
  },
  {
    title: 'Grupos no WhatsApp',
    icon: 'mdi-whatsapp',
    route: '/grupos-whatsapp',
    releaseDate: dayjs('06/01/2025'),
    locked: false
  },
  {
    title: 'Calengrade',
    icon: 'mdi-calendar',
    route: '/calengrade',
    releaseDate: dayjs('11/25/2023'),
    locked: false
  },
  {
    title: 'Apoie o UFABC next',
    icon: 'mdi-bank',
    route: '/donate',
    locked: false
  },
  {
    title: 'Configurações',
    icon: 'mdi-cog',
    route: '/settings',
    locked: !user.value?.confirmed
  },
];

const apiURL = api.defaults.baseURL ?? 'https://api.v2.ufabcnext.com'

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
  ...(user.value?.permissions?.includes('admin') ? [{
    title: 'Monitoramento de Jobs',
    icon: 'mdi-open-in-new',
    url: `${apiURL}/login/jobs-monitoring?userId=${user.value?._id}`
  }] : [])
];
</script>

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
  background-color: rgba(50, 94, 158, 255)
}

.locked-icon {
  margin-left: auto;
  border-radius: 50%;
  border: 12px solid rgb(45, 78, 128);
}
</style>
