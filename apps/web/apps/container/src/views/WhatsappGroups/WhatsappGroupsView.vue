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
      <div class="search-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <!-- todo: maybe refactor to use different fields for RA and Component -->

            <Transition name="slide-up" mode="out-in">
              <v-number-input
                v-if="selectedSearchType === 'ra'"
                v-model="searchRaQuery"
                placeholder="Digite seu RA (ex: 11202012345)"
                variant="outlined"
                size="large"
                prepend-inner-icon="mdi-magnify"
                clearable
                :disabled="currentLoading || isUserLoggedIn"
                class="main-search"
                control-variant="hidden"
                @blur.prevent="getWhatsappGroupsByRa(searchRaQuery)"
              >
              </v-number-input>

              <v-text-field
                v-else
                v-model="searchComponentQuery"
                placeholder="Digite o nome da disciplina (ex: Função de várias variáveis)"
                variant="outlined"
                size="large"
                prepend-inner-icon="mdi-magnify"
                clearable
                :disabled="currentLoading"
                class="main-search"
                @input="handleComponentSearch"
              >
              </v-text-field>
            </Transition>
          </div>

          <!-- Search Options -->
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
                selectedSearchType === 'component' ? 'secondary' : 'default'
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

      <div v-else-if="currentSuccess" class="results-section">
        <!-- todo: handle this state -->
        <!-- todo: error state -->
        <div v-if="!currentGroups?.length">
          <div class="empty-state">
            <div class="empty-visual">
              <v-icon size="64" color="grey-darken-1">
                mdi-whatsapp
              </v-icon>
            </div>
            <h3>Nenhum grupo encontrado</h3>
            
            <!-- For logged users - suggest syncing history -->
            <div v-if="isUserLoggedIn" class="empty-suggestions">
              <p class="empty-description">
                Não encontramos grupos para o seu RA. Isso pode acontecer se seu histórico acadêmico não estiver sincronizado.
              </p>
              
              <div class="suggestion-cards">
                <div class="suggestion-card primary-suggestion">
                  <div class="suggestion-icon">
                    <v-icon color="primary" size="24">mdi-sync</v-icon>
                  </div>
                  <div class="suggestion-content">
                    <h4>Sincronize seu histórico</h4>
                    <p>Use a extensão do UFABC next para sincronizar suas matérias automaticamente</p>
                    <v-btn 
                      color="primary" 
                      variant="elevated" 
                      size="small"
                      prepend-icon="mdi-download"
                      @click="openExtensionUrl"
                    >
                      Baixar Extensão
                    </v-btn>
                  </div>
                </div>
                
                <div class="suggestion-card secondary-suggestion">
                  <div class="suggestion-icon">
                    <v-icon color="secondary" size="24">mdi-book-search</v-icon>
                  </div>
                  <div class="suggestion-content">
                    <h4>Busque por disciplina</h4>
                    <p>Procure grupos específicos pelo nome da matéria</p>
                    <v-btn 
                      color="secondary" 
                      variant="elevated" 
                      size="small"
                      prepend-icon="mdi-book"
                      @click="() => { selectSearchType('component'); shouldFetchComponents = true; }"
                    >
                      Buscar por Disciplina
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- For non-logged users - suggest trying by discipline -->
            <div v-else class="empty-suggestions">
              <p class="empty-description">
                Que tal procurar pelos grupos das disciplinas que você está cursando?
              </p>
              
              <div class="suggestion-cards">
                <div class="suggestion-card primary-suggestion">
                  <div class="suggestion-icon">
                    <v-icon color="secondary" size="24">mdi-book-search</v-icon>
                  </div>
                  <div class="suggestion-content">
                    <h4>Busque por disciplina</h4>
                    <p>Digite o nome da matéria para encontrar o grupo do WhatsApp</p>
                    <v-btn 
                      color="secondary" 
                      variant="flat"
                      size="small"
                      prepend-icon="mdi-book"
                      @click="() => { selectSearchType('component'); shouldFetchComponents = true; }"
                    >
                      Buscar por Disciplina
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="results-grid">
          <WhatsappGroupCard
            v-for="(component, index) in currentGroups"
            :key="index"
            :component="component"
            class="preview-card"
            :style="{ animationDelay: `${index * 150}ms` }"
            @open-group="openWhatsappGroup"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Whatsapp } from '@ufabc-next/services';
import { useDebounceFn } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';

import WhatsappGroupCard from '@/components/WhatsappGroupCard/WhatsappGroupCard.vue';
import { useAuthStore } from '@/stores/auth';
import { extensionURL, studentRecordURL } from '@/utils/consts';

// todo: add eventTracker
// todo: add logged-no-history state (paywall)
type UserState = 'not-logged' | 'logged-no-history' | 'logged-with-history';

type SearchType = 'ra' | 'component';

const authStore = useAuthStore();
const isUserLoggedIn = computed(() => authStore.isLoggedIn);
const userState = computed<UserState>(() => {
  if (!authStore.isLoggedIn) {
    return 'not-logged';
  }

  return 'logged-with-history';
});

const searchRaQuery = ref<number | null>(null);
const searchComponentQuery = ref('');
const selectedSearchType = ref<SearchType>('ra');
const shouldFetchGroupsByRa = ref(false);
const shouldFetchComponents = ref(false);

// Utility function to normalize text for search
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Debounced component search function
const debouncedComponentSearch = useDebounceFn((query: string) => {
  if (query.trim().length >= 2) {
    shouldFetchComponents.value = true;
  } else {
    shouldFetchComponents.value = false;
  }
}, 300);

const selectSearchType = (type: SearchType) => {
  if (!isUserLoggedIn.value) {
    searchRaQuery.value = null;
  }

  searchComponentQuery.value = '';
  selectedSearchType.value = type;
  shouldFetchGroupsByRa.value = false;
  shouldFetchComponents.value = false;
};

const handleComponentSearch = () => {
  if (selectedSearchType.value === 'component') {
    debouncedComponentSearch(searchComponentQuery.value);
  }
};

function getWhatsappGroupsByRa(ra: number | null) {
  if (!ra || String(ra).length < 8) {
    shouldFetchGroupsByRa.value = false;

    return;
  }
  shouldFetchGroupsByRa.value = true;
}

const {
  data: groupsByRa,
  isLoading: isGroupsByRaLoading,
  isSuccess: isGroupsByRaSuccess,
} = useQuery({
  queryKey: ['whatsappGroups', 'byRa', searchRaQuery],
  queryFn: () => Whatsapp.getComponentsByUser(Number(searchRaQuery.value)),
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
    
    return (
      normalizedSubject.includes(normalizedQuery) ||
      normalizedCodigo.includes(normalizedQuery)
    );
  });
});

const groupsFromRa = computed(() => groupsByRa.value?.data || []);
const groupsFromComponents = computed(() => filteredComponents.value || []);

const currentGroups = computed(() => {
  if (selectedSearchType.value === 'ra') {
    return groupsFromRa.value;
  }
  return groupsFromComponents.value;
});

const currentLoading = computed(() => {
  if (selectedSearchType.value === 'ra') {
    return isGroupsByRaLoading.value;
  }
  return isComponentsLoading.value;
});

const currentSuccess = computed(() => {
  if (selectedSearchType.value === 'ra') {
    return isGroupsByRaSuccess.value;
  }
  return isComponentsSuccess.value;
});


const openExtensionUrl = () => {
  window.open(extensionURL, '_blank');
};

const openSyncHistory = () => {
  window.open(studentRecordURL, '_blank');
};

const openWhatsappGroup = (url: string) => {
  window.open(url, '_blank');
};

onMounted(() => {
  if (authStore.user?.ra) {
    searchRaQuery.value = 22222222;
    getWhatsappGroupsByRa(22222222);
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

.not-synced__container {
  padding: 40px 16px;
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

.not-synced__upgrade-benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  margin-bottom: 36px;
}

.not-synced__upgrade-benefits h4 {
  color: rgb(var(--v-theme-primary));
  margin-bottom: 16px;
}

.not-synced__upgrade-benefits .benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: left;
}

.not-synced__icon {
  margin-bottom: 24px;
}

.hero-section {
  padding: 40px 16px 24px 16px;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.hero-section h1,
.not-synced__title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2e7eed;
}

.hero-section p,
.not-synced__subtitle {
  font-size: 1.25rem;
  margin-bottom: 24px;
}

.not-synced__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.hero-section {
  text-align: center;
}

.search-section {
  padding: 0 16px 32px;
  max-width: 800px;
  margin: 0 auto;
}

.search-input-wrapper {
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

.cta-section {
  padding: 32px 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.sync-cta .sync-card {
  border-radius: 20px;
  padding: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
}

@media (max-width: 768px) {
  .sync-cta .sync-card {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.sync-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.component-card {
  background: rgba(255, 255, 255, 0.2);
  padding: 12px 16px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.sync-content h3 {
  margin-bottom: 8px;
}

.sync-content p {
  margin-bottom: 24px;
  opacity: 0.9;
}

.sync-button {
  margin-bottom: 12px;
  background: white;
  color: rgb(var(--v-theme-primary));
}

.sync-button:hover {
  background: rgba(255, 255, 255, 0.9);
}

.skip-button {
  color: rgba(255, 255, 255, 0.8);
}

.results-section {
  position: relative;
  padding: 32px 16px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 400px;
}

.loading-state,
.empty-state,
.welcome-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-suggestions {
  margin-top: 24px;
}

.empty-description {
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 32px;
  font-size: 1.1rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.suggestion-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.suggestion-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  text-align: left;
}

.suggestion-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.primary-suggestion {
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.primary-suggestion:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.secondary-suggestion {
  border-color: rgba(var(--v-theme-secondary), 0.2);
}

.secondary-suggestion:hover {
  border-color: rgba(var(--v-theme-secondary), 0.4);
}

.suggestion-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.suggestion-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.primary-suggestion .suggestion-icon {
  background: rgba(var(--v-theme-primary), 0.1);
}

.secondary-suggestion .suggestion-icon {
  background: rgba(var(--v-theme-secondary), 0.1);
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.suggestion-content p {
  margin: 0 0 16px 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.95rem;
  line-height: 1.4;
}

.loading-animation,
.empty-visual,
.welcome-visual {
  margin-bottom: 24px;
}

.floating-icons {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 2rem;
}

.floating-icons .v-icon {
  animation: bounce 2s infinite;
}

.floating-icons .v-icon:nth-child(2) {
  animation-delay: 0.5s;
}

.floating-icons .v-icon:nth-child(3) {
  animation-delay: 1s;
}

.loading-state h3,
.empty-state h3,
.welcome-state h3 {
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.loading-state p,
.empty-state p,
.welcome-state p {
  color: rgb(var(--v-theme-on-surface-variant));
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

  .coming-soon-content p,
  .coming-soon-cta {
    font-size: 1.1rem;
  }

  .feature-item {
    font-size: 1rem;
    padding: 10px 16px;
  }

  .suggestion-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .suggestion-card {
    padding: 20px;
  }

  .suggestion-content h4 {
    font-size: 1rem;
  }

  .suggestion-content p {
    font-size: 0.9rem;
  }
}

.group-card-placeholder {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
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
</style>
