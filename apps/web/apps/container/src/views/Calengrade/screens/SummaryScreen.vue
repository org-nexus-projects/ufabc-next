<template>
  <div class="calengrade-summary">
    <div class="calengrade-summary__container">
      <h1 class="calengrade-summary__title">
        Cole aqui o seu resumo de disciplinas disponível no
      </h1>
      <h2 class="calengrade-summary__title-link">
        <a
          class="hint"
          rel="noopener noreferrer"
          target="_blank"
          href="https://matricula.ufabc.edu.br/matricula/resumo"
        >
          Portal de Matrículas
        </a>
      </h2>

      <h3 class="calengrade-summary__quad-label">
        <div>
          <strong>Quadrimestre:</strong> {{ props.selectedQuarter.title }}
          <button @click="goToStep(CalengradeSteps.ChangeQuarter)">
            (<u>alterar</u>)
          </button>
        </div>
      </h3>

      <textarea
        id="summary"
        ref="textareaRef"
        v-model="summaryText"
        placeholder="Exemplo: 
        BIR0603-15 - Ciência, Tecnologia e Sociedade A1-Noturno (Santo André) - TPI (3 - 0 - 4) - Campus Santo André
        Terça-feira das 21:00 às 23:00 - quinzenal (I)
        Quinta-feira das 19:00 às 21:00 - semanal
        NHT1057-15 - Genética II A-Noturno ..."
        style="min-height: 400px; margin: 24px 0 16px"
        @input="handleChange(summaryText)"
      />
      <p :class="message[1] || ''">
        {{ message[0] || '. . .' }}
      </p>
    </div>
    <button v-if="!summaryText" class="calengrade-button" @click="handlePaste">
      Colar
    </button>
    <button v-else class="calengrade-button" @click="handleClick">
      Gerar Calengrade!
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { handleSummary } from '../../../utils/summary';
import { CalengradeSteps, Classes, Quarter } from '../types';

const props = defineProps<{
  selectedQuarter: Quarter;
}>();

const emit = defineEmits<{
  (e: 'nextStep', step: CalengradeSteps): boolean;
  (e: 'updateClasses', value: Classes): boolean;
  (e: 'updateSummary', value: string): boolean;
}>();

const classes = ref<Classes | null>();
const summaryText = ref<string>('');

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const message = ref<[string, 'info' | 'error'] | []>([]);

const onUpdateClasses = (value: Classes) => {
  classes.value = value;
  emit('updateClasses', value);
};

const onUpdateSummary = (value: string) => {
  summaryText.value = value;
  emit('updateSummary', value);
};

const handleChange = (value: string) => {
  summaryText.value = value;

  if (value === '') {
    message.value = ['Cole seu resumo de disciplinas ;)', 'error'];
  } else if (value.length > 50) {
    const newClasses = handleSummary(value);
    const classesCount = newClasses.length;
    if (classesCount > 0) {
      message.value = [
        `${classesCount} ${
          classesCount === 1
            ? 'disciplina identificada'
            : 'disciplinas identificadas'
        }`,
        'info',
      ];
      classes.value = newClasses;
      onUpdateClasses(newClasses);
      onUpdateSummary(value);
    } else {
      message.value = ['Nenhuma disciplina identificada :(', 'error'];
      classes.value = [];

      onUpdateClasses([]);
    }
  } else {
    message.value = [];
  }
};

const handlePaste = async () => {
  try {
    textareaRef.value?.focus();
    const copied = await navigator.clipboard.readText();
    summaryText.value = copied;
    handleChange(copied);
  } catch (error) {
    textareaRef.value?.focus();
  }
};

const handleClick = () => {
  if (summaryText.value === '') {
    message.value = ['Cole seu resumo de disciplinas!!!', 'error'];
  } else if ((classes.value || []).length <= 0) {
    message.value = ['Nenhuma disciplina identificada :(', 'error'];
  } else {
    emit('nextStep', CalengradeSteps.Preview);
  }
};

const goToStep = (step: CalengradeSteps) => {
  emit('nextStep', step);
};
</script>

<style scoped>
.calengrade-summary__container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.calengrade-summary__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.calengrade-summary__title-link {
  font-size: 18px;
  font-weight: 400;
  margin-bottom: 16px;
  text-decoration: underline;
  color: black;
}

.hint {
  color: rgb(29, 29, 29);
}

.calengrade-summary__quad-label {
  font-size: 16px;
  font-weight: 400;
  text-align: center;
  margin-bottom: 8px;
}

textarea {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 16px;
  flex-grow: 1;
  margin-bottom: 16px;
}

textarea:focus {
  outline: none;
  border-color: #0000001f;
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
