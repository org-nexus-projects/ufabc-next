<template>
  <div class="whatsapp-group-card">
    <div class="whatsapp-group-card__header">
      <div class="header__icon-container">
        <v-icon color="white"> mdi-book-open-page-variant </v-icon>
      </div>
      <div class="header__info">
        <h3 class="info__name">
          {{ component.subject }}
        </h3>
        <div style="display: flex; gap: 16px">
          <p class="info__description">
            {{ component.codigo }}
          </p>
        </div>
      </div>
    </div>

    <div class="professor-info">
      <p class="professor-name">Prof. Teoria: {{ component.teoria }}</p>
      <p class="professor-name">Prof. Prática: {{ component.pratica }}</p>
      <p class="season">
        {{ component.season }}
      </p>
    </div>

    <div class="component__data">
      <div v-if="component.campus" class="metric">
        <v-icon>mdi-town-hall</v-icon>
        <span>{{ campusName }}</span>
      </div>
      <div v-if="component.turno && component.turma" class="metric">
        <p class="info__description">
          {{ component.turno }} - {{ component.turma }}
        </p>
      </div>
    </div>

    <div class="activity-indicator">
      <v-btn
        v-if="isGroupAvailable"
        prepend-icon="mdi-whatsapp"
        text="Entrar no Grupo"
        size="default"
        variant="text"
        width="100%"
        @click="handleClick"
      />
      <div v-else class="unavailable-group">
        <v-icon size="20">mdi-whatsapp</v-icon>
        <span class="unavailable-text">Grupo não disponível</span>
        <v-tooltip activator="parent" location="top">
          <span>Este grupo ainda não foi criado ou não está disponível no momento</span>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchComponentItem } from '@ufabc-next/types';
import { computed } from 'vue';

type WhatsappGroupCardProps = {
  component: SearchComponentItem;
};

const props = defineProps<WhatsappGroupCardProps>();

const campusName = computed(() => {
  if (!props.component.campus) return null;
  return props.component.campus === 'sa' ? 'Santo André' : 'São Bernardo';
});

const isGroupAvailable = computed(() => {
  return props.component.groupURL !== null 
  && props.component.groupURL !== ''
  && props.component.groupURL !== undefined;

});

const emit = defineEmits<{
  (e: 'openGroup', value: string): void;
}>();

const handleClick = () => {
  if (!isGroupAvailable.value) {
    return;
  }
  emit('openGroup', props.component.groupURL);
};
</script>

<style scoped>
.whatsapp-group-card {
  background: rgba(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(var(--v-theme-surface), 0.5);
  padding: 20px;
  cursor: pointer;
  transition: all 200ms ease;
}

.whatsapp-group-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #93c5fd;
  transform: translateY(-4px);
}

.whatsapp-group-card:has(.unavailable-group) {
  cursor: not-allowed;
  opacity: 0.7;
}

.whatsapp-group-card:has(.unavailable-group):hover {
  transform: none;
  border-color: rgba(var(--v-theme-surface), 0.5);
}

.whatsapp-group-card__header {
  display: flex;
  align-items: flex-start;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.header__icon-container {
  width: 48px;
  height: 48px;
  background: rgb(var(--v-theme-primary));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.book-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.header__info {
  flex: 1;
  min-width: 0;
}

.info__name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 200ms ease;
}

.whatsapp-group-card:hover .info__name {
  color: rgb(var(--v-theme-primary));
}

.info__description {
  font-size: 14px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.professor-info {
  margin-bottom: 16px;
}

.professor-name {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.season {
  font-size: 12px;
  margin: 0;
}

.component__data {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 4px;
}

.users-icon,
.clock-icon {
  width: 16px;
  height: 16px;
}

.activity-indicator {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.unavailable-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 6px;
  background-color: rgba(var(--v-theme-background), 0.5);
  border: 1px solid rgba(var(--v-theme-background), 0.5);
}

.unavailable-text {
  font-size: 14px;
  font-weight: 500;
}

.activity-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.activity-text {
  font-size: 12px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
