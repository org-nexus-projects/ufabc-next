import VueHighcharts from 'vue2-highcharts'
import Highcharts3D from "highcharts/highcharts-3d";
import Highcharts from "highcharts";

import _ from 'lodash'
import Vue from 'vue'
import Review from '@/services/Review'
import Teacher from '@/services/Teacher'
import Subjects from '@/services/Subjects'
import ErrorMessage from '@/helpers/ErrorMessage'
import Flatten from '@/helpers/Flatten'
import WelcomeReview from '@/components/Reviews/Welcome'
import NoReviewsFound from '@/components/Reviews/NoReviewsFound'
import TargetInfo from '@/components/Reviews/TargetInfo'
import SubjectTeachersList from '@/components/Reviews/SubjectTeachersList'
import ReviewComment from '@/components/Reviews/Comment'
import ReviewQuickComment from '@/components/Reviews/QuickComment'

Highcharts3D(Highcharts);

export default {
  name: 'Reviews',
  components: {
    VueHighcharts,
    WelcomeReview,
    NoReviewsFound,
    TargetInfo,
    SubjectTeachersList,
    ReviewComment,
    ReviewQuickComment
  },

  data() {
    return {
      Highcharts,

      loading: false,

      // autocomplete
      reviewTarget: null,
      search: null,
      loadingSearch: false,
      teachers: [],
      subjects: [],

      target: null,
      teachersOfSubject: null,

      // graph
      concepts: null,
      filterSelected: null,
      samplesCount: null,

      comments: [],

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
        q: ''
      }
    } 
  },

  created() {
    // Init with custom route params
    for (let k in this.$route.query) {
      if (k in this.query) {
        this.query[k] = this.$route.query[k]
      }
    }
  },

  watch: {
    query: {
      handler() {
        this.fetchDebounced()

        if (this.isQueryClear) {
          this.$router.replace({query: {}})
        } else {
          this.$router.replace({query: this.query})
        }

      },
      deep: true,
    },
    
    search(val) {
      this.query.q = val

      this.loadingSearch = true
      this.searchDebounced(val)
    }
  },

  computed: {
    targetToReview: {
      set(val) {
        if(_.isString(val)) return
        this.target = val

        if(!val){
          this.query.subjectId = null
          this.query.teacherId = null
        } else if(val.kind == 'teacher'){
          this.query.subjectId = null
          this.query.teacherId = val._id
        } else if(val.kind == 'subject') {
          this.query.teacherId = null
          this.query.subjectId = val._id
        } 
      },
      get() {
        return this.target
      }
    },

    isQueryClear() {
      return !Object.values(this.query).some(val => val)
    },

    possibleDisciplinas(){ 
      let disciplinas = [...this.concepts.specific]
      let generalDefaults = {
        _id: {
          _id: 'all',
          name: 'Todas as matérias'
        }
      }
      let general = Object.assign(generalDefaults, this.concepts.general)
      disciplinas.push(general)

      return disciplinas.reverse()
    },

    conceitoDistribution() {
      if(!this.filterSelected) return []

      let filter
      if(this.filterSelected == 'all'){
        filter = this.concepts.general
      } else {
        filter = _.find(this.concepts.specific, { _id: { _id: this.filterSelected }})
      }

      return filter && filter.distribution && _.sortBy(filter.distribution, 'conceito')
    },

    cobraPresenca() {
      if(!_.get(this.concepts, 'general.distribution.length', 0)) return

      if(_.find(this.concepts.general.distribution, { conceito: 'O'})) {
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
      return ([]).concat(this.teachers).concat(this.subjects)
    },

    totalComments() {
      return 51
    },

    options() {
      let maxWidth = 420
      let maxHeight = 280
      let onlyXs = this.$vuetify.breakpoint.xsOnly
      let screenWidth = this.$vuetify.breakpoint.width
      let width  =  onlyXs ? (screenWidth - 40) > maxWidth ? maxWidth : (screenWidth - 40) : maxWidth
      let height =  onlyXs ? (screenWidth - 140) > maxHeight ? maxHeight : (screenWidth - 140) : maxHeight
      
      return {
        chart: {
          type: "pie",
          options3d: {
            enabled: true,
            alpha: 45
          },
          width: width,
          height: height
        },
        title: {
            text: ''
        },
        tooltip: {
          pointFormat: 'Porcentagem: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
          pie: {
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
        series: [],
      }
    }
  },

  methods: {
    iconForTarget(kind) {
      return {
        teacher: 'mdi-account',
        subject: 'mdi-book-multiple'
      }[kind]
    },

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

    fetchDebounced: _.debounce(function () {
      this.fetch()
    }, 500, {leading: false, trailing: true}),

    fetch() {
      if(this.query.teacherId) {
        this.fetchTeacher()
      } else if(this.query.subjectId) {
        this.fetchSubject()
      }
    },

    async fetchTeacher() {
      if(!this.query.teacherId) return
      this.loading = true

      try {
        let res = await Review.getTeacherConcepts(this.query.teacherId)

        if(res.data){
          if(!this.targetToReview) this.targetToReview = Object.assign({ kind: 'teacher'}, res.data.teacher)

          this.concepts = res.data
          if(_.get(res.data, 'general.count', 0)) {
            this.filterSelected = this.possibleDisciplinas[0]._id._id
            setTimeout(() => {
              this.updateFilter()
              this.loading = false
            }, 500)

            this.getTeacherComments()
          } else {
            this.loading = false
          }
        } else {
          this.loading = false
        }
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    async fetchSubject() {
      if(!this.query.subjectId) return
      this.loading = true

      try {
        let res = await Review.getSubjectConcepts(this.query.subjectId)

        if(res.data){
          if(!this.targetToReview) this.targetToReview = Object.assign({ kind: 'subject'}, res.data.subject)

          this.teachersOfSubject = res.data.specific
          this.concepts = Object.assign({}, res.data)
          this.filterSelected = this.possibleDisciplinas[0]._id._id
          if(_.get(res.data, 'general.count', 0)) {
            setTimeout(() => {
              this.updateFilter()
              this.loading = false
            }, 500)
          } else {
            this.loading = false
          }
        } else {
          this.loading = false
        }
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    searchDebounced: _.debounce(async function (newVal) {
      this.searchTeacher(newVal)
      this.searchSubject(newVal)
    }, 500, {leading: false, trailing: true}),

    async searchTeacher(q) {
      try {
        let res = await Teacher.search(q)

        this.loadingSearch = false
        if(res.data && res.data.total){
          this.teachers = res.data.data.map(t => ({
            ...t,
            kind: 'teacher'
          }))
        } else {
          this.teachers = []
        }
      } catch(err) {
        this.loadingSearch = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    }, 

    async searchSubject(q) {
      try {
        let res = await Subjects.search(q)

        if(res.data && res.data.total){
          this.subjects = res.data.data.map(s => ({
            ...s,
            kind: 'subject'
          }))
        } else {
          this.subjects = []
        }
      } catch(err) {
        // this.$message({
        //   type: 'error',
        //   message: ErrorMessage(err),
        // }) 
      }
    }, 

    fetchStudent() {
      this.student_cr = 4.2222
      // Utils.storage.getItem(storageUser).then(item => {
      //   if (item == null) return
      //   self.student_cr = _.get(item, '[1].cr', 0) || _.get(item, '[0].cr', 0)
      // })
    },

    async getTeacherComments(){
      if(!this.query.teacherId) return
      this.loading = true

      try {
        let res = await Teacher.getComments(this.query.teacherId)

        this.loading = false
        if(res.data){
          this.comments = res.data.map(c => {
            c.showMore = false
            return c
          })
        }
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    updateFilter(){
      let pieChart = this.$refs.pieChart

      if(!pieChart) return
      pieChart.delegateMethod('showLoading', 'Carregando...');

      setTimeout(() => {
        pieChart.removeSeries()

        let filter
        if(this.filterSelected == 'all'){
          filter = this.concepts.general
        } else {
          filter = _.find(this.concepts.specific, { _id: { _id: this.filterSelected }})
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
    },

    updateComment(comment){
      if(!comment._id) return
      let commentIndex = _.findIndex(this.comments, { _id: comment._id })
      if(commentIndex < 0) return

      Vue.set(this.comments, commentIndex, comment)
    }

  },

}
