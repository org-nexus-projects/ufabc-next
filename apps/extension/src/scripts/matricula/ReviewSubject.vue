<template>
  <el-dialog
    :title="'Disciplina: ' + subjectName"
    @close="closeDialog()"
    :visible="value.dialog"
    width="800px"
    top="2vh"
    class="ufabc-element-dialog mt-1">
    <div v-if='loading || (help_data && help_data.specific && help_data.specific.length)'
      style="min-height: 200px"
      v-loading="loading"
      element-loading="Carregando">
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
      <SubjectTeachersList
        v-if='help_data && help_data.specific && help_data.specific.length'
        :teachers="help_data.specific"
      />

    </div>
    <div class="ufabc-row ufabc-align-center ufabc-justify-middle" style="min-height: 100px" v-else>
      Nenhum dado encontrado
    </div>
    <span slot="footer" class="dialog-footer">
      <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
    </span>
  </el-dialog>
</template>
<script>
  import VueHighcharts from 'vue2-highcharts'
  import Highcharts3D from "highcharts/highcharts-3d"
  import Highcharts from "highcharts"

  import _ from 'lodash'
  import Api from '../helpers/api'
  import Utils from '../helpers/utils'
  import MatriculaHelper from '../helpers/matricula'
  import SubjectTeachersList from '../../components/SubjectTeachersList.vue'

  Highcharts3D(Highcharts);

  const data = {
    chart: {
      type: "pie",
      options3d: {
        enabled: true,
        alpha: 45
      },
      width: 380,
      height: 240
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
        animation: {
          duration: 200,
        },
        depth: 20,
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
    name: 'ReviewSubject',
    props: ['value'],
    components: {
      VueHighcharts,
      SubjectTeachersList
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

      'value.subject'(val){
        this.fetch()
      },
    },

    computed: {
      subjectName() {
        return _.get(this.help_data, 'subject.name', '')
      },

      possibleDisciplinas(){
        let disciplinas = [...this.help_data.specific]
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

    },

    methods: {
      resolveColorForConcept(concept) {
        return {
          'A': '#3fcf8c',
          'B': '#b8e986',
          'C': '#f8b74c',
          'D': '#ffa004',
          'F': '#f95469',
          'O': '#A9A9A9'
        }[concept] || '#A9A9A9'
      },

      closeDialog(){
        this.value.dialog = false
        this.filterSelected = null
        this.help_data = null
        this.samplesCount = 0
      },


      fetch() {
        let subjectId = _.get(this.value, 'subject.id', '')
        if(!subjectId) return
        this.loading = true

        Api.get('/help/subjects/' + subjectId).then((res) => {
          this.help_data = res
          this.loading = false

          this.filterSelected = this.possibleDisciplinas[0]._id._id
          if(_.get(res, 'general.count', 0)) {
            setTimeout(() => {
              this.updateFilter()
            }, 500)
          }
        }).catch((e) => {
          this.loading = false
          console.log(e)

          // Show dialog with error
          this.closeDialog()
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
            conceitosFiltered.push({
              name: conceito.conceito,
              y: conceito.count,
              color: this.resolveColorForConcept(conceito.conceito)
            })
          }
          this.samplesCount = filter.count

          pieChart.addSeries({
            data: _.sortBy(conceitosFiltered, 'name')
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
  margin-top: 24px;
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
  font-size: 11px;
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
/*  height: 90px;*/
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
