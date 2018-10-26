<template>
  <div class="text-xs-center">
    <v-dialog
      v-model="value.dialog"
      light
      max-width="750px"
    >
      <v-card>
        <v-card-title
          class="headline grey lighten-2"
          primary-title
        >
          Cortes

          <v-btn
            color="primary rigth"
            flat
            @click="restore()"
          >
            Restaurar ordem
          </v-btn>

          <v-spacer></v-spacer>
          <v-btn bottom left icon
            flat
            @click="value.dialog = false">
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-title>

        <draggable v-model="headers" @update="resort($event)">
          <div v-for="h in headers" :key="h.value" style="display: inline-block !important;">
           <v-chip close @input="removedFilter(h.value)">{{ h.text }}</v-chip>
          </div>
        </draggable>

        <el-table
          :data="transformed">
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
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
  import $ from 'jquery'
  import draggable from 'vuedraggable'
  import _ from 'lodash'

  export default {
    name: 'Modal',
    props: ['value'],
    components: {
      draggable,
    },
    data() {
      return {
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
        desserts: [
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
              kicked: false } ]
      } 
    },
    computed: {
      transformed() {
        console.log(_.map(this.desserts, 'reserva'))
        return this.desserts.map(d => {
          return _.assign(_.clone(d), { reserva: d.reserva ? 'Sim' : 'Nao'})
        })
      }
    },
    methods: {
      resort(e) {
        const sortOrder = _.map(this.headers, 'value')
        const sortRef = Array(sortOrder.length || 0).fill('desc')
        this.desserts = _.orderBy(this.desserts, sortOrder, sortRef)
      },
      removedFilter(value) {
        this.headers = _.filter(this.headers, o => o.value != value)
        this.resort()
      },
      restore() {
        this.headers = this.defaultHeaders
        this.resort()
      }
    },
    watch: {
      'value.dialog'(v) {
        this.restore()
      }
    }
  }
</script>
<style></style>