<template>
  <el-dialog
    :title="component && component.nome ? 'Disciplina: ' + component.nome : 'Cortes'"
    @close="closeDialog()"
    :visible="value.dialog"
    light
    width="720px"
    class="ufabc-element-dialog">
    <div v-loading="loading"
      element-loading="Carregando">
      <!-- Filters -->
      <div class="border mb-3 pa-2">
        <div class="ufabc-row ufabc-align-center">
          <div>
            Critérios
            <el-popover
              placement="top-start"
              width="340"
              trigger="hover"
              content="Os critérios são definidos com base nos critérios abaixo e seu peso, você pode alterar o peso arrastando o critérios para que fiquem na ordem desejada.">
              <v-icon small class="ufabc-cursor-pointer" slot="reference">info_outline</v-icon>
            </el-popover>
          </div>
          <!-- Fill space -->
          <div class="ufabc-flex"></div>
          <v-btn
            small
            color="primary right"
            flat
            @click="restore()">
            Restaurar ordem
          </v-btn>
        </div>

        <draggable v-model="sortHeaders" @update="resort($event)">
          <div v-for="h in sortHeaders"
            :key="h.value"
            class="ufabc-cursor-grabbing"
            style="display: inline-block !important;">
            <v-chip  close @input="removedFilter(h.value)">{{ h.text }}</v-chip>
          </div>
        </draggable>
        <div class="drag-info">
          * Arraste para alterar a ordem dos critérios
        </div>
      </div>
      <!-- subtitle -->
      <div class="border mb-2 pa-2">
          <div class="mb-2">Legenda</div>
        <div class="ufabc-row" style="justify-content: space-between;">
          <!-- You-->
          <div class="ufabc-row ufabc-align-center">
            <div class="aluno mr-1" style="width: 12px; height: 12px;">
            </div>
            <span>Você</span>
          </div>
          <!-- kicked-->
          <div class="ufabc-row ufabc-align-center">
            <div class="kicked mr-1" style="width: 12px; height: 12px;">
            </div>
            <span>Certeza de chute</span>
          </div>
          <!-- probably-kicked-->
          <div class="ufabc-row ufabc-align-center">
            <div class="probably-kicked mr-1" style="width: 12px; height: 12px;">
            </div>
            <span>Provavelmente será chutado</span>
          </div>
          <!-- not-kicked-->
          <div class="ufabc-row ufabc-align-center">
            <div class="not-kicked mr-1" style="width: 12px; height: 12px;">
            </div>
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
        :row-class-name="tableRowClassName"
        class="elevate-3 kicks-table">
        <el-table-column
          type="index"
          width="50">
        </el-table-column>
        <el-table-column
          v-for="(header, index) in sortHeaders"
          :prop="header.value"
          :key="index"
          :label="header.text">
        </el-table-column>
      </el-table>

      <div class="update-alert">
        <el-alert
          class="alert-update"
          :closable="false"
          title="Mantenha sempre seus dados atualizados para a previsão dos chutes ser mais precisa."
          type="info"
          show-icon>
          <a href='https://aluno.ufabc.edu.br/' target='_blank'>Clique aqui para atualizar</a>
        </el-alert>
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <div class="troubleshooting">
        <a href='https://bit.ly/extensao-problemas' target='_blank'>Está com problemas com a extensão? <br />Clique aqui</a>
      </div>
      <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
      <el-button @click="closeDialog()">Fechar</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import _ from 'lodash';
import draggable from 'vuedraggable';
import { NextAPI } from '../services/NextAPI';
import matriculaUtils from '../utils/Matricula';
import { convertDisciplina } from '../utils/convertUfabcDisciplina';
import { findSeasonKey, findIdeais } from '../utils/season';

const nextApi = NextAPI();

const props = defineProps({
  value: {
    default: {
      corte_id: null,
      dialog: false,
      disciplina: null,
    },
  },
});

const loading = ref(false);
const component = ref({});
const kicks = ref([]);
const sortHeaders = ref([]);

onMounted(() => {
  setupComponents();
});

const defaultSortHeaders = computed(() => {
  const isIdeal = findIdeais().includes(component.value.codigo);

  const base = [
    { text: 'Reserva', sortable: false, value: 'reserva' },
    { text: 'Turno', value: 'turno', sortable: false },
    { text: 'Ik', value: 'ik', sortable: false },
  ];

  const tenant = findSeasonKey();

  if (
    isIdeal &&
    (tenant !== '2020:3' || tenant !== '2021:1' || tenant !== '2021:2')
  ) {
    base.push({ text: 'CR', value: 'cr', sortable: false });
    base.push({ text: 'CP', value: 'cp', sortable: false });
  } else {
    base.push({ text: 'CP', value: 'cp', sortable: false });
    base.push({ text: 'CR', value: 'cr', sortable: false });
  }

  return base;
})

const transformed = computed(() => {
  if (!kicks.value || kicks.value.length === 0) {
    return [];
  }

  return kicks.value.map((kick) => {
    return Object.assign(kick, {
      reserva: kick.reserva ? 'Sim' : 'Não',
      ik: kick.ik && kick.ik.toFixed(3) || kick.ik,
    });
  });
});

const oldComponentObject = computed(() => convertDisciplina(component.value))
const totalRequests = computed(() => {
  return matriculas || [].reduce(
    (a, c) => (c.includes(this.disciplina.id.toString()) ? a + 1 : a),
    0
  );
})
const computeKicksForecast = computed(() => (kicks.value.length * component.value.vagas) / totalRequests)

watch(() => props.value.dialog, (v) => {
  if(v) {
    restore()
  }
})

watch(() => props.value.corte_id, (val) => {
  component.value = _.find(todasDisciplinas, { id: Number.parseInt(val) })
  sortHeaders.value = defaultSortHeaders.value
  setupComponents()
})


function setupComponents() {
  const componentId = props.value.corte_id || '';
  if (!componentId) {
    return;
  }
  const studentId = matriculaUtils.getStudentId();

  loading.value = true;

  nextApi
    .get(`/entities/components/${componentId}/kicks?studentId=${studentId}`)
    .then((res) => {
      kicks.value = res.data;
      resort();
      loading.value = false;
    })
    .catch((error) => {
      loading.value = false;
      if (error && error.name === 'Forbidden') {
        console.log('deu nao pai');
      }

      console.log(error);
    });
}

function resort() {
  const sortOrder = sortHeaders.value.map((value) => value);
  const sortRef = Array(sortOrder.length || 0).fill('desc');

  const turnoIndex = sortOrder.indexOf('turno');
  if (turnoIndex !== -1) {
    sortRef[turnoIndex] =
      oldComponentObject.turno === 'diurno' ? 'asc' : 'desc';
  }

  kicks.value = _.orderBy(kicks.value, sortOrder, sortRef);
}

function removedFilter(filter) {
  sortHeaders.value = sortHeaders.value.filter(header => header.value !== filter)
  resort()
}

function restore() {
  sortHeaders.value = defaultSortHeaders
}

function closeDialog() {
  props.value.dialog = false
}

function tableRowClassName({ row, rowIndex }) {
  if (row.aluno_id === matriculaUtils.getStudentId()) {
    return 'aluno-row';
  }
  if (rowIndex <= computeKicksForecast) {
    return 'not-kicked-row';
  }
  if (rowIndex >= component.value.vagas) {
    return 'kicked-row';
  }
  return 'probably-kicked-row';
}
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
