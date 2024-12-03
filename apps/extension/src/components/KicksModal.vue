<template>
  <h1>Joabe</h1>
</template>

<script setup lang="ts">
import type { UFABCMatriculaStudent } from '@/entrypoints/matricula.content';
import { getKicksInfo, type Component } from '@/services/next';
import { findIdeais, findSeasonKey } from '@/utils/season';
import { orderBy } from 'lodash-es';

type Headers = {
  text: string;
  sortable: boolean;
  value: string;
}

const props = defineProps<{
  isOpen: boolean;
  corteId: string | null;
}>();
const emit = defineEmits(['close']);

const loading = ref(false)
const kicks = ref([])
const headers = ref<Headers[]>([])
const ufabcComponents = inject<Component[]>('components')
const matriculaStudent = inject<UFABCMatriculaStudent>('student')

const criteriaContent = "Os critérios são definidos com base nos critérios abaixo e seu peso, você pode alterar o peso arrastando o critérios para que fiquem na ordem desejada."

// @ts-ignore
const component: ComputedRef<Component> = computed(() => ufabcComponents?.find(c => c.disciplina_id === Number.parseInt(props.corteId)))

const defaultHeaders = computed(() => {
  const isIdeal = findIdeais().includes(component?.value?.disciplina_id.toString() ?? '')
  const base = [
    { text: 'Reserva', sortable: false, value: 'reserva' },
    { text: 'Turno', value: 'turno', sortable: false },
    { text: 'Ik', value: 'ik', sortable: false },
  ]

  const season = findSeasonKey()

  if (isIdeal && !['2020:3', '2021:1', '2021:2'].includes(season)) {
    base.push({ text: 'CR', value: 'cr', sortable: false })
    base.push({ text: 'CP', value: 'cp', sortable: false })
  } else {
    base.push({ text: 'CP', value: 'cp', sortable: false })
    base.push({ text: 'CR', value: 'cr', sortable: false })
  }

  return base
})

// const transformed = computed(() => {
//   return kicks.value.map(d => ({
//     ...d,
//     reserva: d.reserva ? 'Sim' : 'Não',
//     ik: d.ik.toFixed(3)
//   }))
// })

const kicksForecast = computed(() => {
  const requests = component.value.requisicoes;
  return kicks.value.length * component.value.vagas / requests
})

async function fetch() {
  if (!props.corteId) {
    return;
  }

  const studentId = matriculaStudent?.studentId.toString() ?? ''

  loading.value = true;

  try {
    const kicksInfo = await getKicksInfo(props.corteId, studentId);
    kicks.value = kicksInfo
    resort();
  } catch(error: any) {
    if(error?.name === 'Forbidden') {
      console.log('add dialog here', error)
    }
    console.log(error)
  } finally {
    loading.value = false
  }
}

function resort() {
  const sortOrder = headers.value.map(h => h.value)
  const sortRef = Array(sortOrder.length).fill('desc')

  const turnoIndex = sortOrder.indexOf('turno')
  if (turnoIndex !== -1) {
    sortRef[turnoIndex] = component.value?.turno === 'diurno' ? 'asc' : 'desc'
  }

  kicks.value = orderBy(kicks.value, sortOrder, sortRef)
}

function closeModal() {
  emit('close');
}

watch(() => props.isOpen, (newIsOpen) => {
  if (newIsOpen && props.corteId) {
    headers.value = defaultHeaders.value
    fetch()
  }
})

onMounted(async () => {
  await fetch()
});
</script>

<style scoped>
.information {
  color: rgba(0, 0, 0, 0.6);
  display: inline-flex;
  font-size: 11px;
  flex-direction: row;
  margin-right: 16px;
}
.drag-info {
  font-family: Ubuntu;
  font-size: 11px;
  margin-top: 8px;
}
.dialog-footer {
  display: flex;
}
.troubleshooting {
  text-align: left;
  flex: 1 1 auto;
}
.troubleshooting a {
  color: #ed5167!important;
  text-decoration: underline;
}
.update-alert {
  display: flex;
  background: #f4f4f5;
  height: 78px;
  width: 100%;
  margin-top: 24px;
  border-radius: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
  padding-bottom: 8px;
}
.update-alert a{
  color: #1976d2!important;
  text-decoration: underline;
}
.update-alert .el-alert__content{
  padding-left: 16px!important;
}
</style>
