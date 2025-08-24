<template>
  <div
    class="whatsapp-group-card"
    @click="() => handleClick()"
  >
    <div class="whatsapp-group-card__header">
      <div class="header__icon-container">
        <v-icon color="white">
          mdi-book-open-page-variant
        </v-icon>
      </div>
      <div class="header__info">
        <h3 class="info__name">
          {{ props.subject }}
        </h3>
        <div style="display: flex; gap: 16px;">
          <p class="info__description">
            {{ props.codigo }}
          </p>
        </div>
      </div>
    </div>

    <div class="professor-info">
      <p class="professor-name">
        Prof. Teoria: {{ props.teoria }}
      </p>
      <p class="professor-name">
        Prof. Prática: {{ props.pratica }}
      </p>
      <p class="season">
        {{ props.season }}
      </p>
    </div>

    <div class="subject__data">
      <div
        v-if="props.campus"
        class="metric"
      >
        <v-icon>mdi-town-hall</v-icon>
        <span>{{ campusName }}</span>
      </div>
      <div
        v-if="props.turno && props.turma"
        class="metric"
      >
        <p class="info__description">
          {{ props.turno }} - {{ props.turma }}
        </p>
      </div>
    </div>

    <div class="activity-indicator">
      <v-btn
        color="black"
        prepend-icon="mdi-whatsapp"
        text="Entrar no Grupo"
        size="default"
        variant="text"
        width="100%"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';


type WhatsappGroupCardProps = {
  season: string;
  groupUrl: string;
  codigo: string;
  campus?: 'sa' | 'sbc';
  turma?: string;
  turno?: string;
  subject: string;
  teoria: string;
  pratica: string;
};

const props = defineProps<WhatsappGroupCardProps>()
const campusName = computed(() => {
  if (!props.campus) return null;
  return props.campus === 'sa' ? 'Santo André' : 'São Bernardo';
})

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const handleClick = () => {
  emit('click');
};
</script>

<style scoped>
.whatsapp-group-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 24px;
  cursor: pointer;
  transition: all 200ms ease;
}

.whatsapp-group-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #93c5fd;
  transform: translateY(-4px);
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
  color: black;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 200ms ease;
}

.whatsapp-group-card:hover .info__name {
  color: rgb(var(--v-theme-primary))
}

.info__description {
  font-size: 14px;
  color: #6b7280;
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
  color: #374151;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.season {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.subject__data {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #6b7280;
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

.activity-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.activity-text {
  font-size: 12px;
  color: #6b7280;
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
