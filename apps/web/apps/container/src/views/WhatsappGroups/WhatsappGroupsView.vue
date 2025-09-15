<template>
  <!-- todo: add animation -->
  <div class="whatsapp-groups-view">
    <section>
      <div class="hero-section">
        <h1>Encontre seus grupos do <br />Whatsapp</h1>
        <p>
          Acesse os grupos de WhatsApp das matérias que você está cursando e
          fique por dentro de tudo com a sua turma.
        </p>
      </div>
      <div v-if="!needToShowPaywall" class="search-section">
        <div>
          <div class="search-input-wrapper">
            <Transition name="slide-up" mode="out-in">
              <v-number-input
                v-if="selectedSearchType === 'ra'"
                v-model="searchRaQuery"
                placeholder="Digite seu RA (ex: 11202012345)"
                variant="outlined"
                size="large"
                :loading="isUserSyncLoading"
                :disabled="isUserLoggedIn && isUserSynced"
                prepend-inner-icon="mdi-magnify"
                clearable
                class="main-search"
                control-variant="hidden"
              >
              </v-number-input>

              <v-text-field
                v-else
                v-model="searchComponentQuery"
                placeholder="Digite o nome da disciplina (ex: Função de várias variáveis)"
                variant="outlined"
                size="large"
                :loading="isUserSyncLoading"
                prepend-inner-icon="mdi-magnify"
                clearable
                class="main-search"
                @input="getWhatsappGroupsByComponent"
              >
              </v-text-field>
            </Transition>
          </div>

          <div class="option-chips">
            <v-chip
              :color="selectedSearchType === 'ra' ? 'primary' : 'default'"
              :variant="selectedSearchType === 'ra' ? 'elevated' : 'tonal'"
              size="large"
              class="search-chip"
              @click="selectSearchType('ra')"
            >
              <v-icon start> mdi-account </v-icon>
              Buscar por RA
            </v-chip>

            <v-chip
              :color="
                selectedSearchType === 'component' ? 'primary' : 'default'
              "
              :variant="
                selectedSearchType === 'component' ? 'elevated' : 'tonal'
              "
              size="large"
              class="search-chip"
              @click="selectSearchType('component')"
            >
              <v-icon start> mdi-book </v-icon>
              Buscar por Disciplina
            </v-chip>
          </div>
        </div>
      </div>
    </section>

    <!-- Results Section -->
    <section>
      <div v-if="currentLoading" class="results-grid">
        <v-skeleton-loader
          v-for="(i, index) in Array.from({ length: 6 })"
          :key="index"
          color="secondary"
          type="card"
        ></v-skeleton-loader>
      </div>

      <div v-else-if="currentSuccess" class="results-success">
        <div v-if="!currentGroups?.length">
          <div class="empty-state">
            <div class="empty-visual">
              <v-icon size="64" color="grey-darken-1"> mdi-whatsapp </v-icon>
            </div>
            <h3>Nenhum grupo encontrado</h3>

            <div class="empty-suggestions">
              <p class="empty-description">
                Que tal buscar pelo nome da disciplina?
              </p>
            </div>
          </div>
        </div>

        <div v-else class="results-grid">
          <WhatsappGroupCard
            v-for="(component, index) in currentGroups"
            :key="index"
            :component="component"
            class="preview-card"
            @open-group="openWhatsappGroup"
          />
        </div>
      </div>

      <div v-else-if="needToShowPaywall" class="results-section">
        <div class="results-grid">
          <WhatsappGroupCard
            v-for="(component, index) in mockedWhatsappGroups"
            :key="index"
            :component="component"
            class="preview-card"
          />
        </div>

        <!-- Coming Soon Overlay -->
        <div class="coming-soon-overlay">
          <div class="coming-soon-content">
            <h2>Desbloqueie todo o potencial! 🚀</h2>
            <p>
              Sincronize seu histórico e tenha acesso aos grupos de Whatsapp das
              suas disciplinas específicas.
            </p>
            <div class="coming-soon-features">
              <div class="feature-item">
                <span>✅ Busca por disciplinas específicas</span>
              </div>
              <div class="feature-item">
                <span>✅ Grupos recomendados baseados no seu curso</span>
              </div>
              <div class="feature-item">
                <span>✅ Mantém o seu Next funcionando :&#41;</span>
              </div>
            </div>
            <div class="not-synced__actions">
              <button
                class="not-synced__button secondary"
                @click="openExtensionUrl"
              >
                <v-icon size="20"> mdi-link-variant </v-icon>
                Baixar extensão
              </button>
              <button class="not-synced__button" @click="openSyncHistory">
                <v-icon size="20"> mdi-sync </v-icon>
                Sincronizar agora!
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Users, Whatsapp } from '@ufabc-next/services';
import { useDebounceFn } from '@vueuse/core';
import { computed, onMounted, ref, toValue, watch } from 'vue';
import { useRoute } from 'vue-router';

import WhatsappGroupCard from '@/components/WhatsappGroupCard/WhatsappGroupCard.vue';
import { eventTracker } from '@/helpers/EventTracker';
import { WebEvent } from '@/helpers/WebEvent';
import { useAuthStore } from '@/stores/auth';
import { extensionURL, studentRecordURL } from '@/utils/consts';
import { mockedWhatsappGroups } from '@/utils/mockedWhatsappGroups';
import { normalizeText } from '@/utils/normalizeTextSearch';

type SearchType = 'ra' | 'component';

const route = useRoute();
const authStore = useAuthStore();
const userRa = computed(
  () => authStore.user?.ra || (route.query.ra ? Number(route.query.ra) : null),
);
const isUserLoggedIn = computed(() => authStore.isLoggedIn);

const {
  data: userInfo,
  isLoading: isUserSyncLoading,
} = useQuery({
  queryKey: ['users', 'info'],
  queryFn: Users.info,
  select: (response) => response.data,
  enabled: isUserLoggedIn,
});

const isUserSynced = computed(() => userInfo.value?.isSynced ?? true);
const needToShowPaywall = computed(
  () => isUserLoggedIn.value && !isUserSynced.value,
);

const searchRaQuery = ref<number | null>(null);
const isRaValid = computed(() => {
  return (
    searchRaQuery.value !== null && String(searchRaQuery.value).length >= 8
  );
});
const searchComponentQuery = ref('');
const shouldFetchGroupsByRa = ref(false);
const shouldFetchComponents = ref(false);
const selectedSearchType = ref<SearchType>('ra');

const debouncedRaSearch = useDebounceFn((raValue: number) => {
  if (raValue && String(raValue).length >= 8) {
    eventTracker.track(WebEvent.WHATSAPP_GROUP_SEARCH, {
      search_type: 'ra',
      search_query: raValue,
      user_logged_in: isUserLoggedIn.value,
      user_synced: isUserSynced.value,
    });

    shouldFetchGroupsByRa.value = true;
  } else {
    shouldFetchGroupsByRa.value = false;
  }
}, 500);

const selectSearchType = (type: SearchType) => {
  if (!isUserLoggedIn.value) {
    searchRaQuery.value = null;
  }

  searchComponentQuery.value = '';
  selectedSearchType.value = type;
  shouldFetchGroupsByRa.value = false;
  shouldFetchComponents.value = false;

  if (type === 'ra' && isRaValid.value && searchRaQuery.value) {
    debouncedRaSearch(searchRaQuery.value);
  }
};

const debouncedComponentSearch = useDebounceFn((query: string) => {
  if (query.trim().length >= 2) {
    shouldFetchComponents.value = true;
  } else {
    shouldFetchComponents.value = false;
  }
}, 300);

watch(searchRaQuery, (newRa) => {
  if (selectedSearchType.value === 'ra' && newRa !== null) {
    debouncedRaSearch(newRa);
  } else if (selectedSearchType.value === 'ra') {
    shouldFetchGroupsByRa.value = false;
  }
});

const getWhatsappGroupsByComponent = () => {
  if (selectedSearchType.value === 'component') {
    debouncedComponentSearch(searchComponentQuery.value);
  }
};

const {
  data: groupsByRa,
  isLoading: isGroupsByRaLoading,
  isSuccess: isGroupsByRaSuccess,
} = useQuery({
  queryKey: ['whatsappGroups', 'byRa', searchRaQuery],
  queryFn: () => Whatsapp.getComponentsByUser(searchRaQuery.value ?? 0),
  enabled: shouldFetchGroupsByRa,
});

const {
  data: allComponents,
  isLoading: isComponentsLoading,
  isSuccess: isComponentsSuccess,
} = useQuery({
  queryKey: ['whatsappGroups', 'components'],
  queryFn: () => Whatsapp.searchComponents(''),
  enabled: shouldFetchComponents,
});

const filteredComponents = computed(() => {
  if (!allComponents.value?.data || !searchComponentQuery.value?.trim()) {
    return [];
  }

  const normalizedQuery = normalizeText(searchComponentQuery.value);

  return allComponents.value.data.filter((component) => {
    const normalizedSubject = normalizeText(component.subject || '');
    const normalizedCodigo = normalizeText(component.codigo || '');
    const normalizedTeoria = normalizeText(component.teoria || '');
    const normalizedPratica = normalizeText(component.pratica || '');

    return (
      normalizedSubject.includes(normalizedQuery) ||
      normalizedCodigo.includes(normalizedQuery) ||
      normalizedTeoria.includes(normalizedQuery) ||
      normalizedPratica.includes(normalizedQuery)
    );
  });
});

const groupsFromRa = computed(() => groupsByRa.value?.data || []);
const groupsFromComponents = computed(() => filteredComponents.value || []);

const currentGroups = computed(() => {
  return selectedSearchType.value === 'ra'
    ? groupsFromRa.value
    : groupsFromComponents.value;
});

const currentLoading = computed(() => {
  return selectedSearchType.value === 'ra'
    ? isGroupsByRaLoading.value
    : isComponentsLoading.value;
});

const currentSuccess = computed(() => {
  return selectedSearchType.value === 'ra'
    ? isGroupsByRaSuccess.value && shouldFetchGroupsByRa.value
    : isComponentsSuccess.value && shouldFetchComponents.value;
});

const openExtensionUrl = () => {
  eventTracker.track(WebEvent.WHATSAPP_GROUP_OPEN_EXTENSION, {
    user_ra: userRa.value || null,
    user_logged_in: isUserLoggedIn.value,
    user_synced: isUserSynced.value,
    from_paywall: needToShowPaywall.value,
  });

  window.open(extensionURL, '_blank');
};

const openSyncHistory = () => {
  eventTracker.track(WebEvent.WHATSAPP_GROUP_OPEN_SYNC, {
    user_ra: userRa.value || null,
    user_logged_in: isUserLoggedIn.value,
    user_synced: isUserSynced.value,
    from_paywall: needToShowPaywall.value,
  });

  window.open(studentRecordURL, '_blank');
};

const openWhatsappGroup = (url: string) => {
  const component = currentGroups.value.find((group) => group.groupURL === url);

  eventTracker.track(WebEvent.WHATSAPP_GROUP_JOINED, {
    whatsapp_url: url,
    component: component,
    search_type: selectedSearchType.value,
    search_query:
      selectedSearchType.value === 'ra'
        ? searchRaQuery.value
        : searchComponentQuery.value,
    user_logged_in: isUserLoggedIn.value,
    user_synced: isUserSynced.value,
  });

  window.open(url, '_blank');
};

onMounted(() => {
  eventTracker.track(WebEvent.WHATSAPP_GROUP_VIEWED, {
    event_type: 'page_view',
    user_logged_in: isUserLoggedIn.value,
    user_synced: isUserSynced.value,
    needs_paywall: needToShowPaywall.value,
    user_ra: userRa.value || null,
  });

  if ((isUserLoggedIn.value && isUserSynced.value) || route.query.ra) {
    searchRaQuery.value = toValue(userRa);
    if (searchRaQuery.value !== null) {
      debouncedRaSearch(searchRaQuery.value);
    }
  }
});
</script>

<style scoped lang="css">
.whatsapp-groups-view {
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-section {
  padding: 40px 16px 24px 16px;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.hero-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2e7eed;
}

.hero-section p {
  font-size: 1.25rem;
  margin-bottom: 24px;
}

.not-synced__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.hero-section {
  text-align: center;
}

.search-section {
  padding: 0 16px;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 16px;
}

.main-search :deep(.v-field) {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-chips {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.search-chip {
  transition: all 0.2s ease;
}

.search-chip:hover:not(:disabled) {
  transform: translateY(-2px);
}

.results-section {
  position: relative;
  padding: 32px 16px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 400px;
}

.results-success {
  padding: 32px 16px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 400px;
}

.coming-soon-overlay {
  position: absolute;
  height: 100%;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.8) 30%,
    rgba(255, 255, 255, 0.95) 60%,
    rgba(255, 255, 255, 1) 100%
  );
  backdrop-filter: blur(2px);
  border-radius: 0 0 20px 20px;
  display: flex;
  align-items: end;
  justify-content: center;
  z-index: 10;
}

.coming-soon-content {
  text-align: center;
  color: #2e7eed;
  max-width: 500px;
  padding-bottom: 20px;
}

.coming-soon-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2e7eed;
  text-shadow: none;
}

.coming-soon-content p {
  font-size: 1.2rem;
  margin-bottom: 32px;
  line-height: 1.6;
  color: #2d2d2d;
  opacity: 1;
}

.coming-soon-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
  background: rgba(46, 126, 237, 0.15);
  padding: 12px 20px;
  border-radius: 12px;
  color: #2e7eed;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(46, 126, 237, 0.2);
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
}

.empty-suggestions {
  margin-top: 24px;
}

.empty-description {
  margin-bottom: 32px;
  font-size: 1.1rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.empty-visual {
  margin-bottom: 24px;
}

.empty-state h3 {
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.empty-state p {
  margin-bottom: 24px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
}

.preview-card {
  animation: fadeInUp 0.8s ease-out forwards;
}

.not-synced__button {
  background-color: rgb(var(--v-theme-primary));
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.not-synced__button.secondary {
  background-color: white;
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgb(var(--v-theme-primary));
}

.not-synced__button:hover {
  transform: translateY(-4px);
  transition: all 0.2s ease;
}

/* vue transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .coming-soon-content h2 {
    font-size: 2rem;
  }

  .coming-soon-content p {
    font-size: 1.1rem;
  }

  .feature-item {
    font-size: 1rem;
    padding: 10px 16px;
  }
}
</style>
