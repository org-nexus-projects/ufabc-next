<template>
  <el-dialog
    :title="professorName"
    @close="closeDialog()"
    :visible="value.dialog"
    width="32%">
    {{ value }}
    <div v-if='loading || (help_data && help_data.specific && help_data.specific.length)' style="min-height: 200px" v-loading="loading" element-loading="Carregando">
      <vue-highcharts
          v-if='help_data && help_data.specific && help_data.specific.length'
          :options="options"
          :highcharts="Highcharts"
      ></vue-highcharts>
    </div>
    <div class="ufabc-row ufabc-align-center ufabc-justify-middle" style="min-height: 100px" v-else>
      Nenhum dado encontrado
    </div>
    <span slot="footer" class="dialog-footer">
      <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
      <el-button @click="closeDialog()">Fechar</el-button>
    </span>
  </el-dialog>
</template>
<script>
  import VueHighcharts from 'vue2-highcharts'
  import Highcharts3D from "highcharts/highcharts-3d";
  import Highcharts from "highcharts";

  import _ from 'lodash'
  import Axios from 'axios'

  Highcharts3D(Highcharts);

  const data = {
    chart: {
        type: "pie",
        options3d: {
          enabled: true,
          alpha: 45
        }
      },
      plotOptions: {
        pie: {
          // innerSize: 100,
          depth: 45
        }
      },
      series: [
        {
          name: "Delivered amount",
          data: [
            ["Bananas", 8],
            ["Kiwi", 3],
            ["Mixed nuts", 1],
            ["Oranges", 6],
            ["Apples", 8],
            ["Pears", 4],
            ["Clementines", 4],
            ["Reddish (bag)", 1],
            ["Grapes (bunch)", 1]
          ]
        }
      ]
  };

  export default {
    name: 'Help',
    props: ['value'],
    components: {
      VueHighcharts
    },

    data() {
      return {
        options: data,
        Highcharts,
        loading: false,

        help_data: null,
      } 
    },

    created() {
      this.fetch()
    },

    watch: {
      'value.notifier'(val) {
        if(val) this.$notify(val)
      },

      'value.professor'(val){
        this.fetch()
      },
    },

    computed: {
      professorName() {
        return _.get(this.value, 'professor.name', '')
      }
    },

    methods: {
      closeDialog(){
        this.value.dialog = false
        this.help_data = null
      },

      fetch() {
        console.log('fetch', this.value)
        let professorId = _.get(this.value, 'professor.id', '')
        if(!professorId) return

        this.loading = true

        Axios.get('https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1/help/teachers/' + professorId).then((res) => {
          this.loading = false
          this.help_data = res.data
        }).catch((e) => {
          this.loading = false

          // Show dialog with error
          console.log(e)
          this.closeDialog()
        })

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
</style>