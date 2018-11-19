<template>
  <el-dialog
    :title="'Professor: ' + professorName"
    @close="closeDialog()"
    :visible="value.dialog"
    width="32%"
    class="ufabc-element-dialog">
    <div v-if='loading || (help_data && help_data.specific && help_data.specific.length)' 
      style="min-height: 200px"
      v-loading="loading"
      element-loading="Carregando">
      <el-select
          class="ufabc-flex ufabc-row mb-2"
          placeholder="Selecione a matéria" 
          @change="updateFilter()"
          v-model="filterSelected" 
          v-if='help_data && help_data.specific && help_data.specific.length'>
        <el-option
          v-for="option in possibleDisciplinas"
          :key="option._id._id"
          :label="option._id.name"
          :value="option._id._id">
        </el-option>
      </el-select>

      <div class="samples" v-if='samplesCount >= 0'>
        Total de amostras <b>{{samplesCount}}</b>
      </div>

      <vue-highcharts
        class="ufabc-row ufabc-align-center ufabc-justify-middle"
          v-if='help_data && help_data.specific && help_data.specific.length'
          :options="options"
          :highcharts="Highcharts"
          ref="pieChart"
      ></vue-highcharts>

      <div class="mt-2" style="text-align: center;">
        <b>* {{ cobraPresenca }}</b>
      </div>

      <div class="ufabc-column ufabc-align-center mt-3 ufabc-flex-wrap">
        <div class="ufabc-row ufabc-align-center ufabc-justify-middle my-cr" v-if='student_cr'>
          Seu CR é <b class="ml-1">{{ crCropped(student_cr) }}</b>
        </div>
        <div class="conceitos" v-if='conceitosDistriubution && conceitosDistriubution.length && student_cr'>
          <div class="conceitos-title">
            Com este professor, seu conceito <b>provavelmente</b> será:
          </div>
          <div class="all-conceitos">
            <div class="conceito-target" :class="targetConceitoStudent">
              <div class="arrow">
                <div class="arrow-text">você</div>
              </div>
              <div class="square"></div>
            </div>
            <div class="conceitos-cr ufabc-row" 
                v-for='(conceito, index) in conceitos'
                :key="conceito">
              <div class="conceito" :class="conceito.conceito">{{ conceito.conceito}}</div> 
              <div class="cr">
                {{ conceitosDistriubution[index] ? crCropped(conceitosDistriubution[index]['cr_medio']) : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
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
  import Utils from '../helpers/utils'
  import MatriculaHelper from '../helpers/matricula'

  Highcharts3D(Highcharts);

  const data = {
    chart: {
      type: "pie",
      options3d: {
        enabled: true,
        alpha: 45
      },
      width: 380,
      height: 320
    },
    title: {
        text: ''
    },
    tooltip: {
        pointFormat: 'Porcentagem: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
      pie: {
        // innerSize: 100,
        depth: 45,
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          format: '{key}: <b>{point.percentage:.1f}%</b>',
          enabled: true
        },
        showInLegend: true
      }
    },
    series: []
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
        filterSelected: null,
        samplesCount: null,

        conceitos: [
          { conceito: 'A' },
          { conceito: 'B' },
          { conceito: 'C' },
          { conceito: 'D' },
          { conceito: 'F' },
        ],

        student_cr: null,
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
      },

      possibleDisciplinas(){ 
        let disciplinas = this.help_data.specific
        let generalDefaults = {
          _id: {
            _id: 'all',
            name: 'Todas as matérias'
          }
        }
        let general = Object.assign(generalDefaults, this.help_data.general)
        disciplinas.push(general)

        return disciplinas.reverse()
      },

      conceitosDistriubution() {
        if(!this.filterSelected) return []

        let filter
        if(this.filterSelected == 'all'){
          filter = this.help_data.general
        } else {
          filter = _.find(this.help_data.specific, { _id: { _id: this.filterSelected }})
        }

        return filter && filter.distribution && _.sortBy(filter.distribution, 'conceito')

      },

      cobraPresenca() {
        if(!_.get(this.help_data, 'general.distribution.length', 0)) return

        if(_.find(this.help_data.general.distribution, { conceito: 'O'})) {
          return 'Provavelmente esse professor cobra presença 👎'
        } else {
          return 'Provavelmente esse professor NÃO cobra presença 👍'
        }
      },

      targetConceitoStudent() {
        if(!this.student_cr || !this.conceitosDistriubution || !this.conceitosDistriubution.length) return

        let all_cr = []
        for(let conceito of this.conceitosDistriubution) {
          all_cr.push(conceito && conceito.cr_medio)
        }
        let closest = all_cr.sort( (a, b) => Math.abs(this.student_cr - a) - Math.abs(this.student_cr - b) )[0]
        let targetConceito = _.find(this.conceitosDistriubution, { cr_medio: closest })

        return targetConceito && targetConceito.conceito
      },
    },

    methods: {
      crCropped(cr){
        return cr.toFixed(2)
      },

      closeDialog(){
        this.value.dialog = false
        this.filterSelected = null
        this.help_data = null
      },

      fetch() {
        let professorId = _.get(this.value, 'professor.id', '')
        if(!professorId) return
        this.fetchStudent()

        console.log('professorId', professorId)

        professorId = '5bd05045639f40b3b0ffbbeb'
        this.loading = true

        Axios.get('https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1/help/teachers/' + professorId).then((res) => {
          this.help_data = res.data

          if(_.get(res.data, 'general.count', 0)) {
            this.filterSelected = this.possibleDisciplinas[0]._id._id
            setTimeout(() => {
              this.loading = false
              this.updateFilter()
            }, 500)
          }
        }).catch((e) => {
          this.loading = false

          // Show dialog with error
          console.log(e)
          this.closeDialog()
        })

      },

      fetchStudent() {
        console.log(MatriculaHelper.currentUser())
        chrome.runtime.sendMessage(Utils.EXTENSION_ID, {
          method: 'storage', 
          key: MatriculaHelper.currentUser()
        }, function(item) {
          if (item == null) return

          this.student_cr = item.cr
        })
      },

      updateFilter(){
        let pieChart = this.$refs.pieChart
        pieChart.delegateMethod('showLoading', 'Carregando...');

        setTimeout(() => {
          pieChart.removeSeries()

          let filter
          if(this.filterSelected == 'all'){
            filter = this.help_data.general
          } else {
            filter = _.find(this.help_data.specific, { _id: { _id: this.filterSelected }})
          }

          let conceitosFiltered = []
          let conceitos = filter.distribution
          for(let conceito of conceitos){
            conceitosFiltered.push([conceito.conceito, conceito.count])
          }
          this.samplesCount = filter.count

          // pieChart.mergeOption({
          //   subtitle: { text: 'Total de amostras: <b>' + filter.count + '<b/>'}
          // })
          pieChart.addSeries({  
              data: conceitosFiltered
            })
          pieChart.hideLoading();
        }, 500)
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

.samples {
  font-family: Ubuntu;
  text-align: center;
  margin-top: 18px;
}

.my-cr {
  height: 40px;
  border-radius: 4px;
  border: 2px solid #4a90e2;
  color: #4a90e2;
  font-size: 15px;
  font-family: Ubuntu;
  width: 300px;
}
.conceitos-cr {
  margin-bottom: 4px;
  font-size: 14px;
  color: #f95469;
  font-family: Ubuntu;
  flex-wrap: wrap;
  width: 42px;
  margin-right: 2px;
}
.conceitos {
  width: 300px;
  border: 2px solid #e6e6e6;
  border-radius: 4px;
  margin-top: 6px;
}

.all-conceitos {
  display: flex;
  margin-top: 52px;
  margin-left: 38px;
  margin-right: 38px;
  margin-bottom: 20px;
  position: relative;
}
.conceitos-title {
  text-align: center;
  margin-left: 20px;
  margin-right: 20px;
  margin-top: 10px;
  font-size: 14px;
  font-family: Ubuntu;
}

.conceito {
  width: 42px;
  height: 42px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-family: Ubuntu;
  color: #fff;
}

.cr {
  background: #e6e6e6;
  display: flex;
  width: 100%;
  font-size: 12px;
  font-family: Ubuntu;
  margin-top: 2px;
  justify-content: center;
  height: 20px;
  align-items: center;
  color: rgba(0, 0, 0, 0.35);
}

.conceito.A{
  background: #3fcf8c;
}
.conceito.B{
  background: #b8e986;
}
.conceito.C{
  background: #f8b74c;
}
.conceito.D{
  background: #ffa004;
}
.conceito.F{
  background: #f95469;
}

.arrow {
  color: #4a90e2;
  margin-top: -18px;
  margin-bottom: 17px;
}
.arrow-text {
  text-align: center;
}
.arrow:after {
  content: " ";
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 10px 10px 0 10px;
  border-color: #4a90e2 transparent transparent transparent;
  position: absolute;
  left: 12px;
}
.square {
  width: 46px;
  height: 68px;
  border: 4px solid #4a90e2;
  border-radius: 4px;
}
.conceito-target {
  position: absolute;
  height: 90px;
  bottom: 0px;
  left: -2px;
}

.conceito-target.B {
  left: 42px;
}
.conceito-target.C {
  left: 86px;
}
.conceito-target.D {
  left: 130px;
}
.conceito-target.F {
  left: 174px;
}
</style>