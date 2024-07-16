<template>
  <v-app>
    <v-navigation-drawer v-if="user?.confirmed" v-model="drawer" color="navigation" width="240">
      <v-list>
        <div class="py-4 d-flex justify-center align-center">
          <img class="logo-white" src="@/assets/logo_white.svg" height="44" alt="logo do UFABC Next" />
        </div>
        <v-divider />
        <v-list-item v-for="item in internalNavigationItems" :to="item.route" :key="item.title">
          <v-layout class="d-flex">
            <v-icon :icon="item.icon" class="mr-3" />
            <p class="font-weight-medium text-caption">{{ item.title }}</p>
            <span v-if="item.releaseDate?.add(3, 'month').isAfter(dayjs())"
              class="featured-chip font-weight-black">Novo</span>
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
    </v-navigation-drawer>

    <v-app-bar v-if="user?.confirmed" app height="min-content" class="py-2 header">
      <v-app-bar-nav-icon app variant="text" color="primary" @click.stop="drawer = !drawer"
        class="d-lg-none"></v-app-bar-nav-icon>

      <v-spacer></v-spacer>

      <img class="logo-white" src="@/assets/logo.svg" height="32" alt="logo do UFABC Next" />

      <v-spacer></v-spacer>
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
    </v-app-bar>
    <div v-if="user?.confirmed" style="height: 64px"></div>
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
import { computed, ref } from 'vue';
import { useAuth } from '@/stores/useAuth';
import { useAliasInitials } from '@/utils/composables/aliasInitials';

const { logOut, user } = useAuth();
const handleLogout = () => {
  logOut.value();
};

const drawer = ref(true);
const userLogin = computed(
  () => user.value?.email?.replace('@aluno.ufabc.edu.br', ''),
);
const userInitials = useAliasInitials();

const internalNavigationItems = [
  {
    title: 'Reviews',
    icon: 'mdi-message-draw',
    route: '/reviews',
  },
  {
    title: 'Meu histórico',
    icon: 'mdi-history',
    route: '/history',
  },
  {
    title: 'Performance',
    icon: 'mdi-google-analytics',
    route: '/performance',
  },
  {
    title: 'Dados da Matrícula',
    icon: 'mdi-book-multiple',
    route: '/stats',
  },
  {
    title: 'Calengrade',
    icon: 'mdi-calendar',
    route: '/calengrade',
    releaseDate: dayjs('11/25/2023'),
  },

  {
    title: 'Auloes',
    icon: 'icon-auloes',
    route: '/partners/noc'
  },
  {
    title: 'Apoie o UFABC next',
    icon: 'mdi-bank',
    route: '/donate',
  },
  {
    title: 'Configurações',
    icon: 'mdi-cog',
    route: '/settings',
  },

];

const externalNavigationItems = [
  {
    title: 'Snapshot da Matrícula',
    icon: 'mdi-open-in-new',
    url: 'https://api.ufabcnext.com/snapshot',
  },
  {
    title: 'Grupos no WhatsApp',
    icon: 'mdi-whatsapp',
    url: 'https://rebrand.ly/ufabc-grupos-whatsapp',
  },
  {
    title: 'Use a Extensão',
    icon: 'mdi-download',
    url: 'https://chrome.google.com/webstore/detail/ufabc-next/gphjopenfpnlnffmhhhhdiecgdcopmhk',
  },
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
</style>
