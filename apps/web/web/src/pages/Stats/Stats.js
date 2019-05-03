import Stats from '@/services/Stats'
import Histories from '@/services/Histories'
import ErrorMessage from '@/helpers/ErrorMessage'
import PrettySeason from '@/helpers/PrettySeason'
import findSeasonKey from '@/helpers/FindSeason'
import _ from 'lodash'

export default {
  name: 'Stats',

  data(){
    return {
      loading: false,
      tab: '',

      disciplinas: null,
      page: 0,
      moreLoading: false,
      limit: 10,
      more: false,
      total: null,

      filterByPeriod: ['diurno', 'noturno'],
      orders: [{
        value: 'requisicoes',
        label: 'Requisições'
      }, {
        value: 'vagas',
        label: 'Vagas'
      },{
        value: 'deficit',
        label: 'Deficit'
      }, {
        value: 'ratio',
        label: 'Pessoas por vaga'
      }],
      orderby: 'deficit',
      season: findSeasonKey(),

      overview: null,
      usage: null,
      courses: null,
    }
  },

  watch: {
    tab(val) {
      this.fetch()
      this.total = null
      // clear internal sort of table when external button clicked
      this.$refs && this.$refs.disciplinas && this.$refs.disciplinas.clearSort();
    },

    orderby() {
      this.fetch()
    },

    filterByPeriod(newVal) {
      if(!newVal || newVal.length == 0) {
        this.filterByPeriod = ['diurno', 'noturno']
        return
      }
      this.fetch()
      this.fetchOverview()
    }
  },

  computed: {
    prettySeason() {
      return PrettySeason(this.season)
    },

    deficitLabel() {
      return this.overview.deficit > 0 ? 'vagas que faltaram' : 'vagas que sobraram'
    }
  },

  created() {
    this.fetchAll()
  },

  methods: {
    allSeasons() {
      let firstSeason = '2019:1'
      let finalSeason = findSeasonKey()

      let currentSeason = firstSeason
      let seasons = [{
        text: PrettySeason(currentSeason),
        value: currentSeason
      }]
      while(currentSeason != finalSeason) {
        let year = currentSeason.split(':')[0]
        let quad = currentSeason.split(':')[1]
        if(quad == 3) {
          quad = 1
          year++
        } else {
          quad++
        }
        currentSeason = year + ':' + quad
        seasons.push({
          text: PrettySeason(currentSeason),
          value: currentSeason
        })
      }

      return seasons
    },

    async changeTargetSeason() {
      let dialog = this.$dialog({
        title: 'Alterar quadrimestre',
        width: '750px',
        top: '10vh',
        inputType: 'select', 
        items: this.allSeasons(),
        inputPlaceholder: 'Escolha o quadrimestre',
        validationRules: 'required',
      })

      try {
        let res = await dialog
        if(res) {
          this.season = res
          this.fetchAll()
        }

      } catch(e) {} 
    },

    mapTurnoLabel(turno) {
      return {
        'noturno': 'Noturno',
        'diurno': 'Matutino'
      }[turno]
    },

    matriculaNameLabel(data) {
      if(this.tab == 'courses') {
        return this.mapCourseName(data._id)
      }
      if(!data || !data.disciplina) return
      if(this.tab == 'disciplines') {
        return data.disciplina
      }

      return data.disciplina + ' ' + data.turma + '-' + this.mapTurnoLabel(data.turno)
    },

    mapCourseName(courseId) {
      let course = _.find(this.courses, { curso_id: courseId })
      if(course){
        return course.name
      }
    },

    fetchAll() {
      this.fetch()
      this.fetchOverview()
      this.fetchUsage()
      this.fetchCourses()
    },

    async fetchCourses() {
      let body = {
        season: this.season
      }

      try {
        let res = await Histories.getCourses(body)

        if(res.data) {
          this.courses = res.data
        }
      } catch(err) {

      }
    },

    async fetchOverview() {
      let body = {
        season: this.season
      }
      if(this.filterByPeriod && this.filterByPeriod.length == 1){
        body.turno = this.filterByPeriod[0]
      }

      try {
        let res = await Stats.matricula('overview', body)
        if(res.data && res.data.data && res.data.data.length) {
          this.overview = res.data.data[0]
        }
      } catch(err) {

      }
    },

    async fetchUsage() {
      let body = {
        season: this.season
      }

      try {
        let res = await Stats.matriculaUsage(body)

        if(res.data) {
          this.usage = res.data
        }
      } catch(err) {

      }
    },

    async fetch(more) {
      if(more) {
        this.loading = false
        this.page = this.page + 1
        this.moreLoading = true
      } else {
        this.loading = true
        this.page = 0
        this.more = true
        this.moreLoading = true
      }

      let body = { 
        page: this.page, 
        [this.orderby]: 1,
        season: this.season,
      }
      if(this.filterByPeriod && this.filterByPeriod.length == 1){
        body.turno = this.filterByPeriod[0]
      }

      try {
        let res = await Stats.matricula(this.tab, body)

        this.loading = false
        this.moreLoading = false

        if (more && this.disciplinas) {
          // Append data
          this.disciplinas = this.disciplinas.concat(res.data.data)

        } else {
          // Replace data
          this.disciplinas = res.data.data
        }

        // Check data is less than limit
        if (res.data.data.length < this.limit) {
          this.more = false
        }
        this.total = res.data.total
      } catch(err) {
        this.loading = false
        this.moreLoading = false

        this.page = this.page - 1

        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

  }
}