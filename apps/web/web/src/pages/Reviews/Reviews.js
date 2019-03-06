import VueHighcharts from 'vue2-highcharts'
import Highcharts3D from "highcharts/highcharts-3d";
import Highcharts from "highcharts";

import _ from 'lodash'
import Review from '@/services/Review'
import Teacher from '@/services/Teacher'
import ErrorMessage from '@/helpers/ErrorMessage'

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
  name: 'Reviews',
  components: {
    VueHighcharts
  },

  data() {
    return {
      options: data,
      Highcharts,

      loading: false,

      // autocomplete
      reviewTarget: null,
      search: null,
      loadingSearch: false,
      teachers: [],
      subjects: [],

      teacher: null,
      subject: null,

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

      query: {
        teacherId: null,
        subjectId: null,
      }
    } 
  },

  created() {
    this.fetch()
  },

  watch: {
    // 'value.notifier'(val) {
    //   if(val) this.$notify(val)
    // },

    // 'value.professor'(val){
    //   this.fetch()
    // },
  },

  watch: {
    search(val) {
      this.loadingSearch = true
      this.searchDebounced(val)
    }
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

    conceitoDistribution() {
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
      if(!this.student_cr || !this.conceitoDistribution || !this.conceitoDistribution.length) return

      let all_cr = []
      for(let conceito of this.conceitoDistribution) {
        if(conceito.conceito != 'O' && conceito.conceito != 'E') {
          all_cr.push(conceito && conceito.cr_medio)
        }
      }
      let closest = all_cr.sort( (a, b) => Math.abs(this.student_cr - a) - Math.abs(this.student_cr - b) )[0]
      let targetConceito = _.find(this.conceitoDistribution, { cr_medio: closest })

      return targetConceito && targetConceito.conceito
    },

    entries() {
      return this.teachers
    }
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

    crCropped(cr){
      return cr.toFixed(2)
    },
    
    findConcept(concept) {
      let conceito = _.find(this.conceitoDistribution, { conceito: concept }, null)
      return conceito ? this.crCropped(conceito.cr_medio) : '-'
    },
    
    findCount(concept) {
      let conceito = _.find(this.conceitoDistribution, { conceito: concept }, null)
      return conceito ? conceito.count : '-'
    },  

    fetch() {
      // this.fetchStudent()

      let professorId = '5bf5fb65d741524f090c91bd'

      this.loading = true
      Review.getTeacherConcepts(professorId).then((res) => {
        this.help_data = res
        this.loading = false

        if(_.get(res, 'general.count', 0)) {
          this.filterSelected = this.possibleDisciplinas[0]._id._id
          setTimeout(() => {
            this.updateFilter()
          }, 500)
        }
      }).catch((e) => {
        this.loading = false
      })

    },

    searchDebounced: _.debounce(async function (newVal) {
      this.searchTeacher(newVal)
      // this.searchPatient(newVal)
    }, 500, {leading: false, trailing: true}),

    async searchTeacher(q) {
      try {
        let res = await Teacher.search(q)

        this.loadingSearch = false
        if(res.data && res.data.total){
          this.teachers = res.data.data
        }
      } catch(err) {
        this.loadingSearch = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    }, 

    fetchStudent() {
      let self = this

      // const storageUser = 'ufabc-extension-' + MatriculaHelper.currentUser()
      const storageUser = 'ufabc-extension-333'
      this.student_cr = 4.2222
      // Utils.storage.getItem(storageUser).then(item => {
      //   if (item == null) return
      //   self.student_cr = _.get(item, '[1].cr', 0) || _.get(item, '[0].cr', 0)
      // })
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

        // pieChart.mergeOption({
        //   subtitle: { text: 'Total de amostras: <b>' + filter.count + '<b/>'}
        // })

        pieChart.addSeries({  
          data: _.sortBy(conceitosFiltered, 'name')
        })
        pieChart.hideLoading();
      }, 500)
    }

  },

}
