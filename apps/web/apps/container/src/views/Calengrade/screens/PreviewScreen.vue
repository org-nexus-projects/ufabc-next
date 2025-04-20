<template>
  <div v-if="step < 2" class="calengrade-preview-screen">
    <div>
      <h1 class="preview-screen__title">{{ generatingCalendarMessage }}</h1>
    </div>

    <div class="flex-fill d-flex align-center justify-center">
      <img src="../../../assets/calengrade/loading.svg" alt="Calendário acadêmico" class="calengrade-image" />
    </div>
  </div>
  <div v-else>
    <div>
      <h1 class="preview-screen__title">Seu Calengrade está pronto!</h1>
      <h2 class="preview-screen__title-subtitle">
        Abra o arquivo com seu aplicativo de calendário favorito e aproveite
        :)
      </h2>
    </div>
    <div class="flex-fill d-flex align-center justify-center">
      <img src="../../../assets/calengrade/calendar_done.svg" alt="Calendário" class="calengrade-image"
        style="margin: 32px 0;" />
    </div>
    <div>
      <button class="calengrade-button" @click="resetCalengrade">
        Fazer novo Calengrade
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { handleCalendar } from '../../../utils/calendar'
import { CalengradeInfo, CalengradeSteps } from '../types';

const props = defineProps<{
  calengrade: CalengradeInfo
}>()

const emit = defineEmits<{
  (e: 'nextStep', step: CalengradeSteps): boolean
  (e: 'resetCalengrade'): void
}>()

enum generatingCalendarMessages {
  GENERATING = 'Gerando o seu calengrade',
  DOWNLOADING = 'Fazendo download'
}

const step = ref(0)
const generatingCalendarMessage = ref(generatingCalendarMessages.GENERATING)
const calendar = ref<string>()

const downloadTimer = ref<NodeJS.Timeout>()
onMounted(() => {
  downloadTimer.value = setInterval(() => step.value++, 1000)
})

onUnmounted(() => {
  if (downloadTimer.value) {
    clearInterval(downloadTimer.value)
  }
})

const resetCalengrade = () => {
  emit('resetCalengrade')
}

watch(step, (newStep) => {
  const { classes, quarter } = props.calengrade

  if (!classes || !quarter) {
    emit('nextStep', CalengradeSteps.Summary)  // todo: create fallback screen (never reach here i hope)
    return
  }

  if (classes.length <= 0 || !quarter.startDate || !quarter.endDate) {
    emit('nextStep', CalengradeSteps.Summary)
    return
  }

  switch (newStep) {
    case 0: // Gerar
      const newCalendar =
        handleCalendar({
          classes,
          startDate: quarter.startDate,
          endDate: quarter.endDate
        })

      calendar.value = newCalendar
      break

    case 1: // Download
      generatingCalendarMessage.value = generatingCalendarMessages.DOWNLOADING
      try {
        const { quarter } = props.calengrade

        if (calendar.value && typeof calendar.value === 'string') {
          const blob = new Blob([calendar.value], { type: 'text/calendar' })
          const downloadURL = URL.createObjectURL(blob)
          const downloadLink = document.createElement('a')

          downloadLink.href = downloadURL
          downloadLink.download = `Meu Calengrade - ${quarter.title}.ics`
          downloadLink.click()

          URL.revokeObjectURL(downloadURL)
        } else {
          if (downloadTimer.value) clearInterval(downloadTimer.value)
          window.Toaster.error('Não foi possível baixar seu Calengrade!')
        }
      } catch (e) {
        window.Toaster.error('Não foi possível baixar seu Calengrade!')
        if (downloadTimer.value) clearInterval(downloadTimer.value)
        emit('nextStep', CalengradeSteps.Summary)
      }
      break

    default:
      if (downloadTimer.value) clearInterval(downloadTimer.value)
      break
  }
}, {
  immediate: true,
  deep: true
})
</script>


<style scoped>
.preview-screen__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.preview-screen__title-subtitle {
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 16px;
  text-align: center;
}

.calengrade-image {
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