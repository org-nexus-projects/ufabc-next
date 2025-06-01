<template>
  <el-dialog
    :title="component.name ? `Disciplina: ${component.name}` : 'Cortes'"
    :model-value="isOpen"
    @close="closeModal"
    @update:model-value="closeModal"
    light
    class="w-[720px]"
  >
    <div v-loading="loading" element-loading-text="Carregando">
      <!-- Filters -->
      <div class="border border-solid border-[rgba(0,0,0,0.07)] mb-4 p-2">
        <div class="flex flex-row items-center">
          Critérios
          <el-popover placement="top-start" width="340" trigger="hover" :content="criteriaContent">
            <template #reference>
              <Info :size="16" class="ml-1 cursor-pointer"/>
            </template>
          </el-popover>
          <div class="flex-auto"/>
          <el-button round text type="primary" @click="restore">
            Restaurar Ordem
          </el-button>
        </div>

        <draggable v-model="headers" @change="resort" item-key="value">
          <template #item="{ element }">
            <div class="cursor-move p-2" style="display: inline-block !important;">
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

      <!-- Legend -->
      <div class="border border-solid border-[rgba(0,0,0,0.07)] mb-4 p-2">
        <span class="block mb-2">Legenda</span>
        <div class="flex flex-row justify-between">
          <div class="flex flex-row items-center">
            <div class="bg-[#B7D3FF] mr-1 w-3 h-3"/>
            <span>Você</span>
          </div>
          <div class="flex flex-row items-center">
            <div class="bg-[#f95469] mr-1 w-3 h-3"/>
            <span>Certeza de chute</span>
          </div>
          <div class="flex flex-row items-center">
            <div class="bg-[#f3a939] mr-1 w-3 h-3"/>
            <span>Provavelmente será chutado</span>
          </div>
          <div class="flex flex-row items-center">
            <div class="bg-[#3fcf8c] mr-1 w-3 h-3"/>
            <span>Provavelmente não será chutado</span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <el-table
        :data="transformed"
        max-height="250"
        style="width: 100%"
        empty-text="Não há dados"
        :row-class-name="tableRowClassname"
        class="shadow-[0px_5px_26px_-4px_rgba(0,0,0,0.2)] kicks-table"
      >
        <el-table-column type="index" width="50"/>
        <el-table-column
          v-for="(header, index) in headers"
          :key="index"
          :prop="header.value"
          :label="header.text"
        />
      </el-table>

      <div class="flex h-[78px] w-full flex-wrap items-center justify-center mt-6 py-2 rounded-xl bg-[#f4f4f5]">
        <el-alert
          :closable="false"
          title="Mantenha sempre seus dados atualizados para a previsão dos chutes ser mais precisa."
          type="info"
          show-icon
        >
          <a href="https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf" target="_blank" class="underline decoration-sky-500">
            Clique aqui para atualizar
          </a>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <div class="flex">
        <span class="text-left flex-auto">
          <a href="https://bit.ly/extensao-problemas" target="_blank" class="underline decoration-red-500">
            Está com problemas com a extensão?<br>Clique aqui
          </a>
        </span>
        <i class="text-[rgba(0,_0,_0,_0.6)] inline-flex text-sm flex-row mr-4">
          * Dados baseados nos alunos que utilizam a extensão
        </i>
        <el-button @click="closeModal">Fechar</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { UFABCMatriculaStudent } from '@/entrypoints/matricula.content';
import { getKicksInfo, MatriculaStudent, UpdatedStudent } from '@/services/next';
import { getUFComponents, type UFSeasonComponents } from '@/services/ufabc-parser';
import { findIdeais, findSeasonKey } from '@/utils/season';
import { orderBy } from 'lodash-es';
import { Info } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { ElNotification } from 'element-plus';
import { useQuery } from '@tanstack/vue-query';

type Headers = {
  text: string;
  sortable: boolean;
  value: string;
}

type TableData = {
  row: {
    studentId: number;
    cr: number | '-'
    cp: number;
    ik: string;
    reserva: 'Sim' | 'Não'
    curso: string
    turno: 'Matutino' | 'Noturno'
  }
  rowIndex: number
}


const props = defineProps<{
  isOpen: boolean;
  corteId: string | null;
}>();
const emit = defineEmits(['close']);


const NOTIFICATION_MESSAGES = {
  forbidden: {
    type: 'warning',
    message: 'Não temos as disciplinas que você cursou, acesse o Sigaa'
  },
  serverError: {
    type: 'error',
    message: 'Estamos com problemas no servidor, por favor tente novamente mais tarde!'
  }
} as const;

const loading = ref(false)
const kicks = ref<{
    studentId: number;
    cr: number | '-'
    cp: number;
    ik: string;
    reserva: 'Sim' | 'Não'
    curso: string
    turno: 'Matutino' | 'Noturno'
  }[]>([])
const headers = ref<Headers[]>([])

const { state: matriculaStudent } = useStorage<MatriculaStudent>('local:fullStudent')
const matriculas = inject<typeof window.matriculas>('matriculas')

const component = ref({} as UFSeasonComponents)

const { data: ufabcComponents } = useQuery({
  queryKey: ['ufabcComponents'],
  queryFn: getUFComponents,
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  enabled: computed(() => props.isOpen)
});

const { data: kicksData, isError, error } = useQuery({
  queryKey: ['kicks', props.corteId, matriculaStudent?.value?.studentId],
  queryFn: () => getKicksInfo(props.corteId!, matriculaStudent?.value?.studentId),
  enabled: computed(() => Boolean(props.corteId && props.isOpen)),
});

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

const transformed = computed(() => {
  return kicks.value.map(d => ({
    ...d,
    reserva: d.reserva ? 'Sim' : 'Não',
    ik: Number(d.ik).toFixed(3)
  }))
})


const kicksForecast = computed(() => {
  if (!props.corteId || !matriculas || !matriculaStudent?.value?.studentId) {
    return;
  }
  const requests = Object.values(matriculas).reduce((count, current) =>
  current.includes(props.corteId?.toString()) ? count + 1 : count, 0);
  return kicks.value.length * component.value?.vacancies / requests
})

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

function tableRowClassname({ row, rowIndex }: TableData) {
  if (row.studentId === matriculaStudent?.value?.studentId) {
    return 'aluno-row'
  }

  if (kicksForecast.value && rowIndex <= kicksForecast.value) {
    return 'not-kicked-row'
  }

  if (rowIndex >= component.value?.vacancies) {
    return 'kicked-row'
  }

  return 'probably-kicked-row'
}

watch(() => props.isOpen, async (newIsOpen) => {
  if (newIsOpen && props.corteId) {
    headers.value = defaultHeaders.value;
    const match = ufabcComponents.value?.find(c =>
      c.UFComponentId === Number.parseInt(props.corteId!)
    );
    if (match) {
      component.value = match;
    }
  }
});

watch(kicksData, (newData) => {
  if (newData) {
    kicks.value = newData;
    resort();
  }
});

watch(() => isError.value, () => {
  if (isError.value) {
    if (error?.value?.message === 'Forbidden') {
      ElNotification(NOTIFICATION_MESSAGES.forbidden);
      return;
    }
    ElNotification(NOTIFICATION_MESSAGES.serverError);
  }
})
</script>

<style lang="css">
.el-table .aluno-row {
  color: #B7D3FF !important;
}

.el-table .kicked-row {
  color: #f95469 !important;
}

.el-table .probably-kicked-row {
  color: #f3a939 !important;
}

.el-table .not-kicked-row {
  color: #3fcf8c !important;
}

.kicks-table > el-table,
.kicks-table tr,
.kicks-table td,
.kicks-table th {
  @apply text-center border-[0px_0px_1px_0px] border-[#ebeef5] border-solid;
  /* border: none !important; */
}
</style>
