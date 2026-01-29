<template>
  <!-- todo: add animation -->
  <div class="whatsapp-groups-view">
    <UserNotifications
      title="Tem novidade aí! 🎉"
      text="Agora você pode filtrar os grupos por cursos para facilitar sua busca."
      @click="newFeatureDialog = true"
    />
    <section>
      <div class="hero-section">
        <h1>Encontre seus grupos do <br />Whatsapp</h1>
        <p style="margin-bottom: 16px">
          Acesse os grupos de WhatsApp das matérias que você está cursando e
          fique por dentro de tudo com a sua turma.
        </p>
        <p style="font-size: 14px">
          Agora você pode filtrar os grupos por cursos para facilitar sua busca.
          <span class="link-style" @click="newFeatureDialog = true"
            >Saiba mais</span
          >
        </p>
      </div>
      <div class="search-section">
        <div>
          <div class="search-input-wrapper">
            <Transition name="slide-up" mode="out-in">
              <v-number-input
                v-if="selectedSearchType === 'ra'"
                v-model="searchRaQuery"
                placeholder="Digite seu RA (ex: 11202012345)"
                variant="outlined"
                :loading="currentLoading"
                :disabled="isUserLoggedIn"
                prepend-inner-icon="mdi-magnify"
                clearable
                class="main-search"
                control-variant="hidden"
              >
              </v-number-input>

              <div
                v-else-if="selectedSearchType === 'course'"
                class="course-search-row"
              >
                <v-select
                  v-model="searchCourseQuery"
                  :items="coursesList"
                  item-title="name"
                  item-value="id"
                  placeholder="Selecione um curso"
                  variant="outlined"
                  size="large"
                  :loading="currentLoading || isCoursesLoading"
                  prepend-inner-icon="mdi-school"
                  class="course-select"
                >
                </v-select>

                <v-text-field
                  v-model="searchCourseFilterQuery"
                  placeholder="Filtrar disciplinas (ex: Cálculo)"
                  variant="outlined"
                  size="large"
                  :disabled="!searchCourseQuery"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  class="course-filter"
                >
                </v-text-field>
              </div>

              <v-text-field
                v-else
                v-model="searchComponentQuery"
                placeholder="Digite o nome da disciplina (ex: Função de várias variáveis)"
                variant="outlined"
                size="large"
                :loading="currentLoading"
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
              :color="selectedSearchType === 'course' ? 'primary' : 'default'"
              :variant="selectedSearchType === 'course' ? 'elevated' : 'tonal'"
              size="large"
              class="search-chip"
              @click="selectSearchType('course')"
            >
              <v-icon start> mdi-school </v-icon>
              Buscar por Curso
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
    <section v-if="showOverlay" class="results-section overlay-active">
      <div class="results-grid">
        <WhatsappGroupCard
          v-for="(component, index) in mockGroups"
          :key="index"
          :component="component"
          class="preview-card"
        />
      </div>

      <div class="coming-soon-overlay">
        <div class="coming-soon-content">
          <h2>Quase lá! 🛠️</h2>
          <p>
            Estamos deixando tudo pronto para 2026.1. <br />
            Em poucos dias, você poderá acessar todos os grupos de WhatsApp das
            suas disciplinas.
            <br />
            <br />
            Enquanto isso, atualize seu histórico para garantir acesso aos
            grupos assim que estiverem disponíveis.
          </p>
          <div class="not-synced__actions">
            <button class="not-synced__button" @click="handleExtension">
              <v-icon size="20"> mdi-link-variant </v-icon>
              Baixar extensão
            </button>
            <button
              class="not-synced__button secondary"
              @click="handleSyncHistory"
            >
              <v-icon size="20"> mdi-sync </v-icon>
              Sincronizar histórico
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Normal results when overlay is not active -->
    <section v-else>
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
                Que tal buscar pelo nome da disciplina ou do seu curso?
              </p>
            </div>
          </div>
        </div>

        <div v-else>
          <div class="results-grid">
            <WhatsappGroupCard
              v-for="(component, index) in paginatedGroups"
              :key="index"
              :component="component"
              class="preview-card"
              @open-group="openWhatsappGroup"
            />
          </div>
          
          <div v-if="hasMoreResults" class="load-more-section">
            <v-btn
              color="primary"
              variant="outlined"
              size="large"
              @click="loadMoreResults"
            >
              <v-icon start>mdi-chevron-down</v-icon>
              Carregar mais ({{ currentGroups.length - paginatedGroups.length }} restantes)
            </v-btn>
          </div>
        </div>
      </div>
    </section>

    <v-dialog
      v-model="whatsappRestrictionDialog"
      width="auto"
      max-width="600"
      scrollable
      :fullscreen="$vuetify.display.xs"
    >
      <v-card class="restriction-dialog">
        <div class="dialog-header">
          <v-card-title class="dialog-title">
            <v-icon color="primary" size="28" class="me-3">
              mdi-shield-check
            </v-icon>
            Acesso Restrito aos Grupos
          </v-card-title>
          <v-card-actions class="dialog-close-btn">
            <v-btn
              variant="tonal"
              icon="mdi-window-close"
              aria-label="Fechar"
              @click="whatsappRestrictionDialog = false"
            />
          </v-card-actions>
        </div>

        <v-card-text class="dialog-content">
          <div class="main-message">
            <p>
              Por questões de segurança, limitamos o acesso aos grupos de
              WhatsApp
              <strong>apenas para usuários cadastrados</strong> na plataforma.
            </p>
          </div>

          <div class="info-section">
            <h4>🤖 O que aconteceu?</h4>
            <p>
              Alguns bots causaram transtornos em diversos grupos acadêmicos nas
              últimas semanas, prejudicando a experiência de todos.
            </p>
          </div>

          <div class="recommendation-section">
            <h4>💡 Nossa recomendação:</h4>
            <p>
              Recomendamos fortemente que você
              <span class="link-style" @click="createAccount"
                >crie uma conta</span
              >
              e utilize a plataforma ao longo da sua jornada acadêmica. Caso
              tenha algum problema na sincronização do histórico,
              <span class="link-style" @click="openSupport">
                entre em contato conosco </span
              >.
            </p>
          </div>

          <div class="recommendations-section">
            <h4>🛡️ Dicas de segurança:</h4>
            <ul class="safety-tips">
              <li>Não clique em links suspeitos ou de números desconhecidos</li>
              <li>Denuncie perfis duvidosos para o WhatsApp</li>
              <li>Nunca responda mensagens de golpistas</li>
            </ul>
          </div>

          <div class="community-message">
            <p>
              O UFABC Next é desenvolvido
              <strong>de alunos para alunos</strong> 🤝. <br />
              A faculdade não é fácil, precisamos nos ajudar. Juntos somos mais
              fortes.
            </p>
          </div>
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-btn
            class="confirm-btn bg-primary"
            variant="elevated"
            size="large"
            rounded
            @click="whatsappRestrictionDialog = false"
          >
            Entendi
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Whatsapp } from '@ufabc-next/services';
import { useDebounceFn } from '@vueuse/core';
import { computed, onMounted, ref, toValue, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import UserNotifications from '@/components/UserNotifications.vue';
import WhatsappGroupCard from '@/components/WhatsappGroupCard/WhatsappGroupCard.vue';
import { eventTracker } from '@/helpers/EventTracker';
import { WebEvent } from '@/helpers/WebEvent';
import { useAuthStore } from '@/stores/auth';
import { extensionURL, studentRecordURL } from '@/utils/consts';
import { normalizeText } from '@/utils/normalizeTextSearch';
import { SearchCourseItem } from '@ufabc-next/types';

type SearchType = 'ra' | 'component' | 'course';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const userRa = computed(
  () => authStore.user?.ra || (route.query.ra ? Number(route.query.ra) : null),
);
const isUserLoggedIn = computed(() => authStore.isLoggedIn);

const whatsappRestrictionDialog = ref(false);
const searchRaQuery = ref<number | null>(null);
const isRaValid = computed(() => {
  return (
    searchRaQuery.value !== null && String(searchRaQuery.value).length >= 8
  );
});
const searchComponentQuery = ref('');
const searchCourseQuery = ref<number | null>(null);
const searchCourseFilterQuery = ref('');
const shouldFetchGroupsByRa = ref(false);
const shouldFetchComponents = ref(false);
const shouldFetchGroupsByCourse = ref(false);
const selectedSearchType = ref<SearchType>('ra');

const resultsPage = ref(1);
const showOverlay = ref(false); // FLAG PARA MOSTRAR O OVERLAY

// helper para atualizar o nome dos professores do parser
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const mockGroups = ref([
  {
    season: '2026:1',
    groupURL: 'https://chat.whatsapp.com/example1',
    codigo: 'BCJ0205-15',
    campus: 'sa' as const,
    turma: 'B1',
    turno: 'noturno',
    subject: 'Fenômenos Térmicos',
    teoria: 'Eduardo De Moraes Gregores',
    pratica: 'Marcos De Abreu Avila',
  },
  {
    season: '2026:1',
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
    season: '2026:1',
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
    season: '2026:1',
    groupURL: 'https://chat.whatsapp.com/example4',
    codigo: 'BCS0001-15',
    campus: 'sbc' as const,
    turma: 'B3',
    turno: 'noturno',
    subject: 'Base Experimental das Ciências Naturais',
    teoria: 'Pedro Henrique Costa',
    pratica: 'Fernanda Rodrigues',
  },
]);

const debouncedRaSearch = useDebounceFn((raValue: number) => {
  if (raValue && String(raValue).length >= 8) {
    eventTracker.track(WebEvent.WHATSAPP_GROUP_SEARCH, {
      search_type: 'ra',
      search_query: raValue,
      user_logged_in: isUserLoggedIn.value,
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
  searchCourseQuery.value = null;
  searchCourseFilterQuery.value = '';
  selectedSearchType.value = type;
  shouldFetchGroupsByRa.value = false;
  shouldFetchComponents.value = false;
  shouldFetchGroupsByCourse.value = false;
  resultsPage.value = 1;

  if (type === 'ra' && isRaValid.value && searchRaQuery.value) {
    debouncedRaSearch(searchRaQuery.value);
  }
};

const loadMoreResults = () => {
  resultsPage.value += 1;
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
    resultsPage.value = 1;
  } else if (selectedSearchType.value === 'ra') {
    shouldFetchGroupsByRa.value = false;
  }
});

watch(searchComponentQuery, () => {
  if (selectedSearchType.value === 'component') {
    resultsPage.value = 1;
  }
});

watch(searchCourseQuery, (newCourseId) => {
  if (selectedSearchType.value === 'course' && newCourseId !== null) {
    eventTracker.track(WebEvent.WHATSAPP_GROUP_SEARCH, {
      search_type: 'course',
      search_query: newCourseId,
      user_logged_in: isUserLoggedIn.value,
    });
    searchCourseFilterQuery.value = '';
    resultsPage.value = 1;
    shouldFetchGroupsByCourse.value = true;
  } else if (selectedSearchType.value === 'course') {
    shouldFetchGroupsByCourse.value = false;
  }
});

watch(searchCourseFilterQuery, () => {
  if (selectedSearchType.value === 'course') {
    resultsPage.value = 1;
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
  enabled: computed(() => shouldFetchGroupsByRa.value),
});

const {
  data: allComponents,
  isLoading: isComponentsLoading,
  isSuccess: isComponentsSuccess,
} = useQuery({
  queryKey: ['whatsappGroups', 'components'],
  queryFn: () => Whatsapp.searchComponents(''),
  enabled: computed(() => shouldFetchComponents.value || shouldFetchGroupsByCourse.value),
  staleTime: 1000 * 60 * 5,
});


const {
  data: subjectComponents,
  isLoading: isSubjectComponentsLoading,
  isSuccess: isSubjectComponentsSuccess,
} = useQuery({
  queryKey: ['disciplinaComponents'],
  queryFn: () => Whatsapp.searchComponentsBySeason('2026:1'),
  gcTime: 1000 * 60 * 60 * 24,  // add cache de 24hrs
});


const {
  data: coursesData,
  isLoading: isCoursesLoading,
  isSuccess: isCoursesSuccess,
} = useQuery({
  queryKey: ['courses'],
  queryFn: () => Whatsapp.getCourses(),
  enabled: computed(() => selectedSearchType.value === 'course'),
  staleTime: 1000 * 60 * 60,
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

const coursesList = computed(() => {
  if (!coursesData.value) return [];
  return coursesData.value
    .filter((course: SearchCourseItem) => course.name && course.name.trim())
    .sort((a: SearchCourseItem, b: SearchCourseItem) => a.name.localeCompare(b.name));
});

const filteredComponentsByCourse = computed(() => {
  if (!allComponents.value?.data || !searchCourseQuery.value) {
    return [];
  }

  const selectedCourse = coursesList.value.find(
    (course: SearchCourseItem) => course.id === searchCourseQuery.value
  );

  if (!selectedCourse) {
    return [];
  }
  
 

  const filtered = allComponents.value.data.filter((component) => {
    return (
      selectedCourse.ufComponentCodes.includes(component.codigo) &&
      component.season === '2026:1'
    );
  });
  

  return filtered;
});

const filteredAndSearchedCourseComponents = computed(() => {
  const courseFiltered = filteredComponentsByCourse.value;
  
  // Enriquece os componentes com dados de professores do componentsByCode
  const enrichedComponents = courseFiltered.map((component, index) => {
    const teachersData = componentsByCode.value[component.codigo];
    const enriched = {
      ...component,
      teoria: teachersData?.teoria || component.teoria || '',
      pratica: teachersData?.pratica || component.pratica || '',
    };
    
    
    return enriched;
  });
  
  
  if (!searchCourseFilterQuery.value?.trim()) {
    return enrichedComponents;
  }
  
  const normalizedQuery = normalizeText(searchCourseFilterQuery.value);
  
  return enrichedComponents.filter((component) => {
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



const componentsByCode = computed(() => {
  if (!subjectComponents.value) {
    return {};
  }
  const grouped: Record<string, { teoria: string; pratica: string }> = {};
 
  subjectComponents.value.forEach((component, index) => {
    const teoriaRaw = component.teachers?.find((t: any) => t.role === 'professor')?.name || '';
    const praticaRaw = component.teachers?.find((t: any) => t.role === 'practice')?.name || '';
    
    const teoria = capitalizeName(teoriaRaw);
    const pratica = capitalizeName(praticaRaw);

    grouped[component.ufComponentCode] = {
      teoria,
      pratica,
    };
    
  
  });
  
  return grouped;
});

const groupsFromRa = computed(() => groupsByRa.value?.data || []);
const groupsFromComponents = computed(() => filteredComponents.value || []);
const groupsFromCourse = computed(() => {
  const result = filteredAndSearchedCourseComponents.value || [];
 
  return result;
});


const searchConfig = computed(() => ({
  ra: {
    groups: groupsFromRa.value,
    loading: isGroupsByRaLoading.value,
    success: isGroupsByRaSuccess.value && shouldFetchGroupsByRa.value,
    query: searchRaQuery.value,
  },
  component: {
    groups: groupsFromComponents.value,
    loading: isComponentsLoading.value,
    success: isComponentsSuccess.value && shouldFetchComponents.value,
    query: searchComponentQuery.value,
  },
  course: {
    groups: groupsFromCourse.value,
    loading: isComponentsLoading.value,
    success: isComponentsSuccess.value && shouldFetchGroupsByCourse.value,
    query: searchCourseQuery.value,
  },
}));

const currentGroups = computed(() => 
  searchConfig.value[selectedSearchType.value]?.groups || []
);

const paginatedGroups = computed(() => {
  const endIndex = resultsPage.value * 24;
  return currentGroups.value.slice(0, endIndex);
});

const hasMoreResults = computed(() => {
  return paginatedGroups.value.length < currentGroups.value.length;
});

const currentLoading = computed(() => 
  searchConfig.value[selectedSearchType.value]?.loading || false
);

const currentSuccess = computed(() => 
  searchConfig.value[selectedSearchType.value]?.success || false
);

const openWhatsappGroup = (url: string) => {
  const component = currentGroups.value.find((group) => group.groupURL === url);
  const searchQuery = searchConfig.value[selectedSearchType.value]?.query;

  eventTracker.track(WebEvent.WHATSAPP_GROUP_JOINED, {
    whatsapp_url: url,
    component: component,
    search_type: selectedSearchType.value,
    search_query: searchQuery,
    user_logged_in: isUserLoggedIn.value,
  });

  window.open(url, '_blank');
};

const handleExtension = () => {
  window.open(extensionURL, '_blank');
};

const handleSyncHistory = () => {
  window.open(studentRecordURL, '_blank');
};

const createAccount = () => {
  eventTracker.track(WebEvent.CREATE_ACCOUNT_CLICKED, {
    source: 'whatsapp_groups_dialog',
  });

  router.push('/signup');
};

const openSupport = () => {
  eventTracker.track(WebEvent.OPEN_SUPPORT, {
    user_ra: userRa.value || null,
    user_logged_in: isUserLoggedIn.value,
    source: 'whatsapp_groups_dialog',
  });
  window.open('https://www.instagram.com/ufabc_next/?hl=pt-br', '_blank');
};

onMounted(() => {
  eventTracker.track(WebEvent.WHATSAPP_GROUP_VIEWED, {
    event_type: 'page_view',
    user_logged_in: isUserLoggedIn.value,
    user_ra: userRa.value || null,
  });

  if (isUserLoggedIn.value || route.query.ra) {
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

.course-search-row {
  display: flex;
  gap: 16px;
  width: 100%;
}

.course-select {
  flex: 1.5;
  min-width: 0;
}

.course-select :deep(.v-field) {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-filter {
  flex: 1;
  min-width: 0;
}

.course-filter :deep(.v-field) {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .course-search-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .course-select,
  .course-filter {
    flex: 1;
  }
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

.results-section.overlay-active .preview-card {
  filter: blur(1px);
  pointer-events: none;
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

.link-style {
  text-decoration: none;
  color: #37bba3;
  cursor: pointer;
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

/* Dialog Styles - Inspired by DonateView */
.restriction-dialog {
  border-radius: 16px !important;
  padding: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 1;
  padding-bottom: 8px;
}

.dialog-title {
  font-weight: 500;
  font-size: 1.5rem;
  color: rgb(var(--v-theme-primary));
  padding: 0;
  font-family: 'Lato', 'Roboto';
  line-height: 1.2;
  flex: 1;
  margin-right: 16px;
}

.dialog-close-btn {
  padding: 0;
  min-height: auto;
  flex-shrink: 0;
}

.dialog-content {
  padding: 0 0 24px 0;
  line-height: 1.6;
}

.main-message {
  margin-bottom: 24px;
}

.main-message p {
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.info-section,
.recommendation-section,
.recommendations-section {
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.info-section h4,
.recommendation-section h4,
.recommendations-section h4 {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.info-section p,
.recommendation-section p,
span {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1rem;
}

.safety-tips {
  margin: 0;
  padding-left: 20px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1rem;
}

.safety-tips li {
  margin-bottom: 8px;
}

.community-message {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1) 0%,
    rgba(var(--v-theme-primary), 0.05) 100%
  );
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.community-message p {
  margin: 0;
  font-size: 1rem;
  color: rgb(var(--v-theme-primary));
  line-height: 1.5;
}

.dialog-actions {
  padding: 0;
  justify-content: center;
}

.confirm-btn {
  font-family: 'Roboto';
  color: white !important;
  width: 100%;
  height: 48px;
  font-size: 1.1rem;
  font-weight: 500;
}

@media (max-width: 600px) {
  .restriction-dialog {
    margin: 0;
    padding: 16px;
    border-radius: 0 !important;
    max-height: 100vh;
    height: 100vh;
  }

  .dialog-header {
    margin-bottom: 16px;
    padding: 0 0 12px 0;
    border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
  }

  .dialog-title {
    font-size: 1.2rem;
    line-height: 1.3;
    margin-right: 12px;
  }

  .dialog-content {
    padding: 0 0 20px 0;
  }

  .main-message {
    margin-bottom: 20px;
  }

  .main-message p {
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .info-section,
  .recommendation-section,
  .recommendations-section {
    padding: 14px;
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .info-section h4,
  .recommendation-section h4,
  .recommendations-section h4 {
    font-size: 1rem;
    margin-bottom: 10px;
  }

  .info-section p,
  .recommendation-section p {
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .safety-tips {
    font-size: 0.9rem;
    line-height: 1.4;
    padding-left: 16px;
  }

  .safety-tips li {
    margin-bottom: 6px;
  }

  .community-message {
    padding: 14px;
    border-radius: 8px;
  }

  .community-message p {
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .dialog-actions {
    padding: 16px 0 0 0;
    position: sticky;
    bottom: 0;
    background: rgb(var(--v-theme-surface));
    border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
  }

  .confirm-btn {
    height: 44px;
    font-size: 1rem;
  }
}

/* Adicionar scroll suave para o dialog */
.restriction-dialog {
  scroll-behavior: smooth;
}

.restriction-dialog::-webkit-scrollbar {
  width: 4px;
}

.restriction-dialog::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 2px;
}

.restriction-dialog::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 2px;
}

.restriction-dialog::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

.load-more-section {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  margin-top: 16px;
}
</style>
