<template>
  <div class="calengrade-welcome-screen">
    <section>
      <h1 class="calengrade-welcome-screen__title">
        Adicione sua grade de matérias da UFABC ao seu calendário
      </h1>
      <h2 class="calengrade-welcome-screen__subtitle">
        Gratuito e compatível com os principais aplicativos de celular e
        computador
      </h2>
    </section>

    <img
      src="../../../assets/calengrade/calendar.svg"
      alt="Calendário acadêmico"
      class="calendar-image"
    />

    <button
      class="calengrade-button"
      @click="nextStep(CalengradeSteps.Summary)"
    >
      Começar
    </button>
  </div>
</template>

<script setup lang="ts">
import { CalengradeSteps } from '../types';

const emit = defineEmits<{
  (e: 'nextStep', step: CalengradeSteps): boolean;
}>();

const nextStep = (step: CalengradeSteps) => {
  emit('nextStep', step);
};
</script>

<style scoped>
.calengrade-welcome-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  margin: auto;
  width: 100%;
  height: 100%;

  padding: 32px;
  justify-content: space-between;
}

.calengrade-welcome-screen__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.calengrade-welcome-screen__subtitle {
  font-size: 16px;
  font-weight: 400;
  text-align: center;
  margin-bottom: 16px;
}

.calendar-image {
  width: 100%;
  max-width: 400px;
  max-height: 300px;
  margin: 32px 0;
}

.calengrade-button {
  border: 0;
  border-radius: 5px;
  width: 100%;
  height: 42px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: bold;
  background: #2e7eed;
  color: #fff;
  cursor: pointer;
}

.calengrade-button:hover {
  background: #0c4594;
}
</style>
