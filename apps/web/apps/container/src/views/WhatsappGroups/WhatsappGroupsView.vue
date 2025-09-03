<template>
  <div class="whatsapp-groups-view">
    <div v-if="userType === 'logged-no-history'" class="not-synced__container">
      <div class="not-synced__icon">
        <v-icon size="60" color="primary">mdi-sync</v-icon>
      </div>
      <h1 class="not-synced__title">Desbloqueie todo o potencial! 🚀</h1>
      <p class="not-synced__subtitle">
        Sincronize seu histórico e tenha acesso aos grupos de Whatsapp das suas
        disciplinas específicas.
      </p>
      <div class="not-synced__upgrade-benefits">
        <h4>O que você ganha sincronizando:</h4>
        <div class="benefit-item">
          <span>✅ Busca por disciplinas específicas</span>
        </div>
        <div class="benefit-item">
          <span>✅ Grupos recomendados baseados no seu curso</span>
        </div>
        <div class="benefit-item">
          <span>✅ Mantém o seu Next funcionando :&#41;</span>
        </div>
      </div>
      <div class="not-synced__actions">
        <button class="not-synced__button" @click="handleExtension">
          <v-icon size="20"> mdi-link-variant </v-icon>
          Baixar extensão
        </button>
        <span style="color: #808080">OU</span>
        <button class="not-synced__button" @click="handleSyncHistory">
          <v-icon size="20"> mdi-sync </v-icon>
          Sincronizar agora!
        </button>
      </div>
    </div>

    <div v-if="userType !== 'logged-no-history'">
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
            <v-text-field
              v-model="searchQuery"
              :placeholder="getSearchPlaceholder()"
              variant="outlined"
              size="large"
              prepend-inner-icon="mdi-magnify"
              clearable
              :disabled="true"
              class="main-search"
            >
              <template v-if="isSearchBlocked" #append-inner>
                <v-tooltip text="Sincronize para desbloquear">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" color="warning"> mdi-lock </v-icon>
                  </template>
                </v-tooltip>
              </template>
            </v-text-field>
          </div>

          <!-- Search Options -->
          <div class="search-options">
            <div class="option-chips">
              <v-chip
                :color="selectedSearchType === 'ra' ? 'primary' : 'default'"
                :variant="selectedSearchType === 'ra' ? 'elevated' : 'tonal'"
                size="large"
                class="search-chip"
              >
                <v-icon start> mdi-account </v-icon>
                Buscar por RA
              </v-chip>

              <v-chip
                :color="
                  selectedSearchType === 'subject' ? 'secondary' : 'default'
                "
                :variant="
                  selectedSearchType === 'subject' ? 'elevated' : 'tonal'
                "
                :disabled="!canSearchBySubject"
                size="large"
                class="search-chip"
              >
                <v-icon start> mdi-book </v-icon>
                Buscar por Disciplina
                <v-icon v-if="!canSearchBySubject" end size="16">
                  mdi-lock
                </v-icon>
              </v-chip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="userType !== 'logged-no-history'" class="results-section">
      <div class="results-grid">
        <WhatsappGroupCard
          v-for="(group, index) in mockGroups"
          :key="index"
          :season="group.season"
          :campus="group.campus"
          :codigo="group.codigo"
          :group-url="group.groupURL"
          :teoria="group.teoria"
          :pratica="group.pratica"
          :turno="group.turno"
          :subject="group.subject"
          :turma="group.turma"
          class="preview-card"
          :style="{ animationDelay: `${index * 150}ms` }"
        />
      </div>

      <!-- Coming Soon Overlay -->
      <div class="coming-soon-overlay">
        <div class="coming-soon-content">
          <h2>Em breve! 🚀</h2>
          <p>
            Estamos preparando algo incrível para você! Em poucos dias, você
            poderá acessar todos os grupos de WhatsApp das suas disciplinas de
            forma super fácil.
          </p>
          <div class="coming-soon-features">
            <div class="feature-item">
              <v-icon color="primary" size="20"> mdi-check-circle </v-icon>
              <span>Busca inteligente por disciplina</span>
            </div>
            <div class="feature-item">
              <v-icon color="primary" size="20"> mdi-check-circle </v-icon>
              <span>Grupos organizados por turma</span>
            </div>
            <div class="feature-item">
              <v-icon color="primary" size="20"> mdi-check-circle </v-icon>
              <span>Acesso direto pelo Next</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Whatsapp } from '@ufabc-next/services';
import { SearchComponentItem } from '@ufabc-next/types';
import { computed, onMounted, ref } from 'vue';

import WhatsappGroupCard from '@/components/WhatsappGroupCard/WhatsappGroupCard.vue';
import { eventTracker } from '@/helpers/EventTracker';
import { WebEvent } from '@/helpers/WebEvent';
import { useAuthStore } from '@/stores/auth';
import { extensionURL, studentRecordURL } from '@/utils/consts';

type UserType = 'not-logged' | 'logged-no-history' | 'logged-with-history';

const authStore = useAuthStore();

const searchQuery = ref('');
const selectedSearchType = ref('ra');
const groups = ref<SearchComponentItem[]>([]);
const isLoading = ref(false);
const isEmptyQuery = ref(false);

// Mock data for preview
const mockGroups = ref([
  {
    season: '2025:2',
    groupURL: 'https://chat.whatsapp.com/GBQropAUsuEGZGXhWYSHrL',
    codigo: 'BCJ0205-15',
    campus: 'sa' as const,
    turma: 'B1',
    turno: 'noturno',
    subject: 'Fenômenos Térmicos',
    teoria: 'Eduardo De Moraes Gregores',
    pratica: 'Marcos De Abreu Avila',
  },
  {
    season: '2025:2',
    groupURL: 'https://chat.whatsapp.com/example2',
    codigo: 'BCM0506-15',
    campus: 'sa' as const,
    turma: 'A2',
    turno: 'matutino',
    subject: 'Comunicação e Redes',
    teoria: 'Maria Silva Santos',
    pratica: 'João Pedro Oliveira',
  },
  {
    season: '2025:2',
    groupURL: 'https://chat.whatsapp.com/example3',
    codigo: 'BCN0404-15',
    campus: 'sa' as const,
    turma: 'C1',
    turno: 'matutino',
    subject: 'Geometria Analítica',
    teoria: 'Ana Carolina Lima',
    pratica: 'Roberto Carlos Souza',
  },
  {
    season: '2025:2',
    groupURL: 'https://chat.whatsapp.com/example4',
    codigo: 'BCS0001-15',
    campus: 'sbc' as const,
    turma: 'B3',
    turno: 'noturno',
    subject: 'Base Experimental das Ciências Naturais',
    teoria: 'Pedro Henrique Costa',
    pratica: 'Fernanda Rodrigues',
  },
  {
    season: '2025:2',
    groupURL: 'https://chat.whatsapp.com/example5',
    codigo: 'MCM0001-15',
    campus: 'sa' as const,
    turma: 'A1',
    turno: 'matutino',
    subject: 'Cálculo Diferencial e Integral I',
    teoria: 'Carlos Eduardo Mendes',
    pratica: 'Juliana Aparecida Silva',
  },
  {
    season: '2025:2',
    groupURL: 'https://chat.whatsapp.com/example6',
    codigo: 'BIR0004-15',
    campus: 'sa' as const,
    turma: 'D2',
    turno: 'noturno',
    subject: 'Probabilidade e Estatística',
    teoria: 'Amanda Cristina Alves',
    pratica: 'Ricardo Monteiro Peixoto',
  },
]);

// Computed properties
const userType = computed((): UserType => {
  if (!authStore.isLoggedIn) return 'not-logged';
  return 'logged-with-history';
});

const canSearchBySubject = computed(() => {
  return userType.value === 'logged-with-history';
});

const isSearchBlocked = computed(() => {
  return (
    userType.value === 'logged-no-history' &&
    selectedSearchType.value === 'subject'
  );
});

const getSearchPlaceholder = () =>
  selectedSearchType.value === 'ra'
    ? 'Digite seu RA (ex: 11202012345)'
    : 'Digite o nome da disciplina (ex: Algoritmos)';

// todo: refactor this
const selectSearchType = (type: string) => {
  if (type === 'subject' && !canSearchBySubject.value) return;
  selectedSearchType.value = type;
  searchQuery.value = '';
};

// todo: refactor the digit request approach
const handleSearch = async () => {
  if (!searchQuery.value?.trim() || isSearchBlocked.value) return;

  isLoading.value = true;
  isEmptyQuery.value = true;

  try {
    const result = await Whatsapp.getComponentsByUser();
    groups.value = result.data || [];
    console.log('Search results:', result);
  } catch (error) {
    //todo: notify error
    groups.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleExtension = () => {
  window.open(extensionURL, '_blank');
};

const handleSyncHistory = () => {
  window.open(studentRecordURL, '_blank');
};

const clearSearch = () => {
  searchQuery.value = '';
  groups.value = [];
  isEmptyQuery.value = false;
};

onMounted(async () => {
  if (authStore.user?.ra) {
    searchQuery.value = String(authStore.user.ra);
  }

  eventTracker.track(WebEvent.WHATSAPP_GROUP_ACCESS_PREVIEW);
});
</script>

<style scoped>
.whatsapp-groups-view {
  min-height: 100vh;
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

.subject-card {
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
  filter: blur(1px);
  pointer-events: none;
}

.coming-soon-overlay {
  position: absolute;
  top: 40%;
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
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.coming-soon-content {
  text-align: center;
  color: #2e7eed;
  max-width: 500px;
  padding: 40px 20px;
}

.coming-soon-icon {
  margin-bottom: 24px;
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

.coming-soon-cta {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2e7eed;
  text-shadow: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 0.7;
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
</style>
