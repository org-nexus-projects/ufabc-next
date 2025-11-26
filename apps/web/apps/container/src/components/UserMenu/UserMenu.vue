<template>
  <v-menu v-model="isMenuOpen" location="top" :close-on-content-click="false">
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
                {{ 'RA: ' + userRA }}
              </div>
            </div>
          </div>
        </v-list-item>
        <v-divider />
        <v-list-item @click="handleSettingsClick">
          <div class="d-flex align-center py-2 rounded-lg bg-gray-200">
            <v-icon icon="mdi-cog" />
            <div class="text-body-2 pa-3">Configurações</div>
          </div>
        </v-list-item>
        <v-list-item @click="handleLogoutClick">
          <div class="d-flex align-center py-2">
            <v-icon icon="mdi-logout" color="red-darken-2" />
            <div class="text-body-2 pa-3 text-red-darken-2">Sair</div>
          </div>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { useAliasInitials } from '@/utils/composables/aliasInitials';
import { useCleanUsername } from '@/utils/composables/cleanUsername';

const emit = defineEmits<{
  logout: [];
}>();

const router = useRouter();
const authStore = useAuthStore();
const userInitials = useAliasInitials();
const userRA = authStore.user?.ra;
const userCleanUsername = useCleanUsername();

const isMenuOpen = ref(false);

const handleSettingsClick = () => {
  isMenuOpen.value = false;
  router.push('/settings');
};

const handleLogoutClick = () => {
  isMenuOpen.value = false;
  emit('logout');
};
</script>

