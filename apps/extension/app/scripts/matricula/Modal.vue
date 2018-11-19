<template>
  <el-dialog
    title="Cortes"
    @close="closeDialog()"
    :visible="value.dialog"
    light
    width="32%"
    class="ufabc-element-dialog">
    <div v-loading="loading"
      element-loading="Carregando">
      <!-- Filters -->
      <div class="border mb-3 pa-2">
        <div class="ufabc-row ufabc-align-center">
          <div>
            Critérios
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
            <v-chip close @input="removedFilter(h.value)">{{ h.text }}</v-chip>
          </div>
        </draggable>
      </div>
      <!-- Table -->
      <el-table
        :data="transformed"
        max-height="250"
        style="width: 100%"
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
  import Axios from 'axios'
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

        defaultHeaders: [
          { text: 'Reserva', sortable: false, value: 'reserva' },
          { text: 'Turno', value: 'turno', sortable: false },
          { text: 'Ik', value: 'ik', sortable: false },
          { text: 'CP', value: 'cp', sortable: false },
          { text: 'CR', value: 'cr', sortable: false },
        ],

        headers: [
          { text: 'Reserva', sortable: false, value: 'reserva' },
          { text: 'Turno', value: 'turno', sortable: false },
          { text: 'Ik', value: 'ik', sortable: false },
          { text: 'CP', value: 'cp', sortable: false },
          { text: 'CR', value: 'cr', sortable: false },
        ],

        kicksData: [],

        mockedData: [
          { aluno_id: 10523,
            cr: 2.479,
            cp: 0.527,
            ik: 0.55,
            reserva: true,
            turno: 'Matutino',
            curso: 'Engenharia de Energia',
            kicked: true },
          { aluno_id: 1504,
            cr: 3.207,
            cp: 0.463,
            ik: 0,
            reserva: false,
            turno: 'Matutino',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false },
            { aluno_id: 1500,
            cr: 3.4,
            cp: 0.8,
            ik: 0,
            reserva: false,
            turno: 'Noturno',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false },{ aluno_id: 10523,
            cr: 2.479,
            cp: 0.527,
            ik: 0.55,
            reserva: true,
            turno: 'Matutino',
            curso: 'Engenharia de Energia',
            kicked: true },
          { aluno_id: 1504,
            cr: 3.207,
            cp: 0.463,
            ik: 0,
            reserva: false,
            turno: 'Matutino',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false },
            { aluno_id: 1500,
            cr: 3.4,
            cp: 0.8,
            ik: 0,
            reserva: false,
            turno: 'Noturno',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false },{ aluno_id: 10523,
            cr: 2.479,
            cp: 0.527,
            ik: 0.55,
            reserva: true,
            turno: 'Matutino',
            curso: 'Engenharia de Energia',
            kicked: true },
          { aluno_id: 1504,
            cr: 3.207,
            cp: 0.463,
            ik: 0,
            reserva: false,
            turno: 'Matutino',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false },
            { aluno_id: 1500,
            cr: 3.4,
            cp: 0.8,
            ik: 0,
            reserva: false,
            turno: 'Noturno',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false },{ aluno_id: 10523,
            cr: 2.479,
            cp: 0.527,
            ik: 0.55,
            reserva: true,
            turno: 'Matutino',
            curso: 'Engenharia de Energia',
            kicked: true },
          { aluno_id: 1504,
            cr: 3.207,
            cp: 0.463,
            ik: 0,
            reserva: false,
            turno: 'Matutino',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false },
            { aluno_id: 1500,
            cr: 3.4,
            cp: 0.8,
            ik: 0,
            reserva: false,
            turno: 'Noturno',
            curso: 'Bacharelado em Ciência e Tecnologia',
            kicked: false } ]
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
        console.log('watch value.corte_id')
        this.fetch()
      },
    },

    computed: {
      transformed() {
        // console.log(_.map(this.mockedData, 'reserva'))
        return this.mockedData.map(d => {
          return _.assign(_.clone(d), { reserva: d.reserva ? 'Sim' : 'Nao'})
        })
      }
    },

    methods: {
      fetch() {
        console.log("FETCH")
        let corteId = _.get(this.value, 'corte_id', '')
        if(!corteId) return
        var aluno_id = MatriculaHelper.getAlunoId()

        corteId = '2722'
        this.loading = true

        Axios.get(`https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1/disciplinas/${corteId}/kicks?${aluno_id}`).then((res) => {
          this.kicksData = res.data
          console.log('kicksData', this.kicksData)
          this.loading = false
        }).catch((e) => {
          this.loading = false
          // Show dialog with error
          console.log(e)
        })
      },

      resort(e) {
        const sortOrder = _.map(this.headers, 'value')
        const sortRef = Array(sortOrder.length || 0).fill('desc')
        this.mockedData = _.orderBy(this.mockedData, sortOrder, sortRef)
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
</style>