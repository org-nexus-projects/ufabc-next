<template>
  <div class="calengrade-page">
    <div class="calengrade-page__container">
      <img
        src="../../assets/calengrade/calengrade-logo.svg"
        alt="logo do Calengrade"
        class="calengrade-logo"
      >

      <div class="calengrade-page__content">
        <WelcomeScreen
          v-if="currentStepName === CalengradeSteps.Welcome"
          @next-step="onNextStep"
        />

        <SummaryScreen
          v-else-if="currentStepName === CalengradeSteps.Summary"
          :selected-quarter="calengrade.quarter"
          @next-step="onNextStep"
          @update-classes="onUpdateClasses"
          @update-summary="onUpdateSummary"
        />

        <ChangeQuarterScreen
          v-else-if="currentStepName === CalengradeSteps.ChangeQuarter"
          :selected-quarter="calengrade.quarter"
          @change-quarter="onChangeQuarter"
          @next-step="onNextStep"
        />

        <PreviewScreen
          v-else-if="currentStepName === CalengradeSteps.Preview"
          :calengrade="calengrade"
          @next-step="onNextStep"
          @reset-calengrade="resetCalengrade"
        />
      </div>

      <h3 class="calengrade-page__footer-credits">
        O Calengrade foi desenvolvido em 2020 por
        <a href="https://link.cariri.tech/calengrade-linkedin">
          Marcelo Farias
        </a>, um ex aluno da UFABC.
      </h3>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue';

import { definedQuarters } from '@/utils/quarters';

import ChangeQuarterScreen from './screens/ChangeQuarterScreen.vue';
import PreviewScreen from './screens/PreviewScreen.vue';
import SummaryScreen from './screens/SummaryScreen.vue';
import WelcomeScreen from './screens/WelcomeScreen.vue';
import { CalengradeInfo, CalengradeSteps, Classes } from './types';

const currentStepName = ref<CalengradeSteps>(CalengradeSteps.Welcome);

const currentQuarter = ref(0);

function getQuarterFromCurrentDate() {
  const now = Date.now();
  for (let q = 1; q < definedQuarters.length; q++) {
    const quarterEndDate = new Date(
      `${definedQuarters[q].endDate}T00:00:00.000`,
    );
    if (now > quarterEndDate.getTime()) {
      return q - 1;
    } else {
      const quarterStartDate = new Date(
        `${definedQuarters[q].startDate}T00:00:00.000`,
      );
      if (now >= quarterStartDate.getTime()) {
        return q;
      }
    }
  }
  return 0;
}

onMounted(() => {
  const quarter = getQuarterFromCurrentDate();
  currentQuarter.value = quarter
});

const calengrade = reactive<CalengradeInfo>({
  quarter: definedQuarters[currentQuarter.value],
  classes: null,
  summary: '',
});

// todo: refactor this in future
watch(currentQuarter, (newVal: number) => {
  calengrade.quarter = definedQuarters[newVal];
});

const onChangeQuarter = (quarter: number) => {
  currentQuarter.value = quarter;
};

const onUpdateClasses = (value: Classes) => {
  calengrade.classes = value;
};

const onUpdateSummary = (value: string) => {
  calengrade.summary = value;
};

const onNextStep = (step: CalengradeSteps) => {
  currentStepName.value = step;
};

const resetCalengrade = () => {
  calengrade.classes = null;
  calengrade.summary = '';

  currentStepName.value = CalengradeSteps.Welcome;
};
</script>

<style scoped>
.calengrade-page {
  width: 100%;
}

.calengrade-page__container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  margin: auto;
  width: 100%;
  height: 100%;

  padding: 40px 20px;
  justify-content: space-between;

  background-color: white;
  border-radius: 16px;
}

.calengrade-logo {
  width: 100%;
  max-width: 150px;
  margin-bottom: 16px;
}

.calengrade-page__content {
  width: 100%;
  max-width: 800px;
}

.calengrade-page__footer-credits {
  font-size: 16px;
  font-weight: 400;
  text-align: center;
  margin-top: 24px;
}
</style>