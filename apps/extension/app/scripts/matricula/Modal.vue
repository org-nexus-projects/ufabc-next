<template>
  <el-dialog
    :title="disciplina && disciplina.nome ? 'Disciplina: ' + disciplina.nome : 'Cortes'"
    @close="closeDialog()"
    :visible="value.dialog"
    light
    width="520px"
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
            color="primary rigth"
            flat
            @click="restore()">
            Restaurar ordem
          </v-btn>
        </div>

        <draggable v-model="headers" @update="resort($event)">
          <div v-for="h in headers" 
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
      <!-- Table -->
      <el-table
        :data="transformed"
        max-height="250"
        style="width: 100%"
        empty-text="Não há dados"
        class="elevate-3 kicks-table">
        <el-table-column
          type="index"
          width="50">
        </el-table-column>
        <el-table-column
          v-for="(header, index) in headers"
          :prop="header.value"
          :key="index"
          :label="header.text">
        </el-table-column>
      </el-table>
    </div>
    <span slot="footer" class="dialog-footer">
      <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
      <el-button @click="closeDialog()">Fechar</el-button>
    </span>
  </el-dialog>
</template>
<script>
  import $ from 'jquery'
  import _ from 'lodash'
  import draggable from 'vuedraggable'
  import Api from '../helpers/api'
  import MatriculaHelper from '../helpers/matricula'

  export default {
    name: 'Modal',
    props: ['value'],
    components: {
      draggable,
    },
    data() {
      return {
        loading: false,
        disciplina: {},

        headers: [],

        kicksData: [],
      }
    },

    created() {
      this.fetch()
    },

    watch: {
      'value.dialog'(v) {
        this.restore()
      },

      'value.corte_id'(val){
        this.disciplina = _.find(todasDisciplinas, { id: parseInt(val) })
        this.headers = this.defaultHeaders
        this.fetch()
      },
    },

    computed: {
      transformed() {
        return this.kicksData.map(d => {
          return _.assign(_.clone(d), { reserva: d.reserva ? 'Sim' : 'Nao'})
        })
      },

      defaultHeaders() {
        let isIdeal = MatriculaHelper.findIdeais().includes(this.disciplina.codigo)
        
        const base = [
          { text: 'Reserva', sortable: false, value: 'reserva' },
          { text: 'Turno', value: 'turno', sortable: false },
          { text: 'Ik', value: 'ik', sortable: false },
        ]

        if(isIdeal) {
          base.push({ text: 'CR', value: 'cr', sortable: false })
          base.push({ text: 'CP', value: 'cp', sortable: false })
        } else {
          base.push({ text: 'CP', value: 'cp', sortable: false })
          base.push({ text: 'CR', value: 'cr', sortable: false })
        }

        return base
      }
    },

    methods: {
      fetch() {
        let corteId = _.get(this.value, 'corte_id', '')
        if(!corteId) return
        var aluno_id = MatriculaHelper.getAlunoId()

        this.loading = true

        Api.get(`/disciplinas/${corteId}/kicks?aluno_id=${aluno_id}`).then((res) => {
          this.kicksData = res
          this.resort()
          this.loading = false
        }).catch((e) => {
          this.loading = false

          if(e && e.name == 'Forbidden') {
            // Show dialog with error
            this.$notify({
              message: 'Não temos as diciplinas que você cursou, acesse o Portal do Aluno'
            })
          }
        })
      },

      resort(e) {
        const sortOrder = _.map(this.headers, 'value')
        const sortRef = Array(sortOrder.length || 0).fill('desc')
        this.kicksData = _.orderBy(this.kicksData, sortOrder, sortRef)
      },

      removedFilter(value) {
        this.headers = _.filter(this.headers, o => o.value != value)
        this.resort()
      },

      restore() {
        this.headers = this.defaultHeaders
        // this.help_data = nullltHeaders
        this.resort()
      },

      closeDialog(){
        this.value.dialog = false
      },

      tableRowClassName({row, rowIndex}) {
        if (row.aluno_id == MatriculaHelper.getAlunoId()) {
          return 'aluno-row'
        } else if (row.kicked) {
          return 'kicked-row'
        } else {
          return 'not-kicked-row'
        }
      }
    },
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
</style>