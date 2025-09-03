<template>
  <div>
    <div>
      <h1 class="change-quarter__title">Selecione um quadrimestre</h1>
      <h2 class="change-quarter__title-subtitle">
        Datas disponíveis no
        <a
          class="hint"
          rel="noopener noreferrer"
          target="_blank"
          href="https://prograd.ufabc.edu.br/calendarios"
        >
          Calendário acadêmico
        </a>
      </h2>
      <div style="margin: 32px 0">
        <label for="quarter">Quadrimestre</label>
        <select
          id="quarter"
          :value="newQuarter"
          @change="
            (event) =>
              handleQuarterChange(
                Number((event.target as HTMLSelectElement).value),
              )
          "
        >
          <option v-for="(q, i) in definedQuarters" :key="i" :value="i">
            {{ q.title }}
          </option>
        </select>

        <label for="startDate">Início</label>
        <input
          id="startDate"
          inputmode="numeric"
          type="date"
          :value="startDate"
          :disabled="newQuarter !== 0"
        />

        <label for="endDate">Fim</label>
        <input
          id="endDate"
          inputmode="numeric"
          type="date"
          :value="endDate"
          :disabled="newQuarter !== 0"
        />
      </div>
    </div>

    <button class="calengrade-button" @click="goToSummaryScreen">Voltar</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { definedQuarters } from '../../../utils/quarters';
import { CalengradeSteps, Quarter } from '../types';

const props = defineProps<{
  selectedQuarter: Quarter;
}>();

const findSelectedQuarterIndex = () => {
  return definedQuarters.findIndex(
    (q) => props.selectedQuarter.title === q.title,
  );
};

const newQuarter = ref<number>(findSelectedQuarterIndex());

const emit = defineEmits<{
  (e: 'nextStep', step: CalengradeSteps): boolean;
  (e: 'changeQuarter', quarter: number): boolean;
}>();

const startDate = ref('');
const endDate = ref('');

onMounted(() => {
  startDate.value = definedQuarters[newQuarter.value].startDate;
  endDate.value = definedQuarters[newQuarter.value].endDate;
});

const handleQuarterChange = (value: number) => {
  if (value !== 0) {
    startDate.value = definedQuarters[value].startDate;
    endDate.value = definedQuarters[value].endDate;
  }
  newQuarter.value = value;
};

const goToSummaryScreen = () => {
  if (newQuarter.value !== findSelectedQuarterIndex()) {
    emit('changeQuarter', newQuarter.value);
  }
  emit('nextStep', CalengradeSteps.Summary);
};
</script>

<style scoped>
label {
  font-size: 14px;
  font-weight: bold;
  color: #444;
  line-height: 30px;
}

input[type='date']::-webkit-calendar-picker-indicator {
  display: none;
  -webkit-appearance: none;
}

input[type='date']::-webkit-inner-spin-button {
  display: none;
  -webkit-appearance: none;
}

input,
select {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid #ddd;
  background-color: #fff;
  border-radius: 5px;
  height: 45px;
  padding: 0 15px;
  font-size: 14px;
  cursor: pointer;
  color: #444;
  width: 100%;
  margin-bottom: 8px;
  outline: none;
}

input {
  background-color: #ddd;
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

.change-quarter__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.change-quarter__title-subtitle {
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 16px;
  text-align: center;
}
</style>
