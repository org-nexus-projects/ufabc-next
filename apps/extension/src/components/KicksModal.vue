<template>
  <el-dialog
      :title="component.name ? 'Disciplina: ' + component.name : 'Cortes'"
      @close="closeModal"
      :modelValue="isOpen"
      @update:modelValue="closeModal"
      light
      class="w-1/2"
    >
    <div v-loading="loading" element-loading="Carregando" >
      <div class="border border-solid border-[rgba(0,0,0,0.07)] ">
          <div class="flex flex-row items-center">
              Critérios
              <el-popover
                placement="top-start"
                width="340"
                trigger="hover"
                :content="criteriaContent">
                <template #reference>
                  <Info :size="16" class="ml-1 cursor-pointer"/>
                </template>
              </el-popover>
            <!-- Fill space -->
            <div class="flex-auto"></div>
            <el-button round text type="primary" @click="restore">
              Restaurar Ordem
            </el-button>
          </div>

          <draggable v-model="headers" @change="resort" item-key="value">
            <template #item="{ element }">
              <div class="cursor-move" style="display: inline-block !important;">
                <el-tag closable @close="removedFilter(element.value)">
                  {{ element.text }}
                </el-tag>
              </div>
            </template>
          </draggable>

          <span class="block text-sm mt-2">
            * Arraste para alterar a ordem dos critérios
          </span>
      </div>
      <!-- subtitle -->
       <div class="border border-solid border-[rgba(0,0,0,0.07)] mb-4 p-2">
          <span class="block mb-2">Legenda</span>
          <div class="flex flex-row justify-between">
            <!-- You-->
          <div class="flex flex-row items-center">
            <div class="bg-[#B7D3FF] mr-1" style="width: 12px; height: 12px;">
            </div>
            <span>Você</span>
          </div>
          <!-- kicked-->
          <div class="flex flex-row items-center">
            <div class="bg-[#f95469] mr-1" style="width: 12px; height: 12px;">
            </div>
            <span>Certeza de chute</span>
          </div>
          <!-- probably-kicked-->
          <div class="flex flex-row items-center">
            <div class="bg-[#f3a939] mr-1" style="width: 12px; height: 12px;">
            </div>
            <span>Provavelmente será chutado</span>
          </div>
          <!-- not-kicked-->
          <div class="flex flex-row items-center">
            <div class="bg-[#3fcf8c] mr-1" style="width: 12px; height: 12px;">
            </div>
            <span>Provavelmente não será chutado</span>
          </div>

          </div>
       </div>
    </div>
    <template #footer class="flex">
      <span class="text-left flex-auto">
        <a href="https://bit.ly/extensao-problemas" target="_blank">Está com problemas com a extensão? <br />Clique aqui</a>
      </span>
      <i class="text-[rgba(0,_0,_0,_0.6)] inline-flex text-sm flex-row mr-4">* Dados baseados nos alunos que utilizam a extensão</i>
      <el-button @click="closeModal">
        Fechar
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { UFABCMatriculaStudent } from '@/entrypoints/matricula.content';
import { getKicksInfo } from '@/services/next';
import { getUFComponents, type UFSeasonComponents } from '@/services/ufabc-parser';
import { findIdeais, findSeasonKey } from '@/utils/season';
import { orderBy } from 'lodash-es';
import { FetchError } from 'ofetch';
import { Info } from 'lucide-vue-next'
import draggable from 'vuedraggable'

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
const matriculaStudent = inject<UFABCMatriculaStudent>('student')
const matriculas = inject<typeof window.matriculas>('matriculas')
const component = ref({} as UFSeasonComponents)

const criteriaContent = "Os critérios são definidos com base nos critérios abaixo e seu peso, você pode alterar o peso arrastando o critérios para que fiquem na ordem desejada."

const defaultHeaders = computed(() => {
  const isIdeal = findIdeais().includes(component?.value?.UFComponentId?.toString() ?? '')
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
  if (!props.corteId || !matriculas) {
    return;
  }
  const requests = matriculas[Number(props.corteId)].reduce((a, c) => a + 1, 0);
  return kicks.value.length * component.value?.vacancies / requests
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
    if(error instanceof FetchError) {
      if (error.name === 'forbidden') {
        console.log('add dialog here', error)
      }
      console.log(error)
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

function restore() {
  headers.value = defaultHeaders.value;
  resort()
}

function closeModal() {
  emit('close');
}

function removedFilter(value: string) {
  headers.value = headers.value.filter(h => h.value !== value)
  resort()
}

function tableRowClassname({ row, rowIndex }: { row: Record<string, string>; rowIndex: number }) {
  if (row.studentId === matriculaStudent?.studentId.toString()) {
    // student-row
    return 'bg-[#B7D3FF]'
  }

  if (rowIndex <= kicksForecast.value) {
    // .probably-kicked-row
    return 'bg-[#3fcf8c]'
  }

  if (rowIndex >= component.value.vacancies) {
    // kicked row
    return 'bg-[#f95469]'
  }

  return 'bg-[#f3a939]'
}

watch(() => props.isOpen, async (newIsOpen) => {
  if (newIsOpen && props.corteId) {
    headers.value = defaultHeaders.value
    const ufabcComponents = await getUFComponents()
    const match = ufabcComponents.find(c => c.UFComponentId === Number.parseInt(props.corteId))
    // @ts-ignore
    component.value = match
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
