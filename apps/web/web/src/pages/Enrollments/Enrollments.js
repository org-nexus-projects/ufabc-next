import Stats from '@/services/Stats'
import ErrorMessage from '@/helpers/ErrorMessage'
import courses from './courses'
import _ from 'lodash'

export default {
  name: 'Enrollments',

  data(){
    return {
      loading: false,
      tab: '',

      disciplinas: null,
      page: 0,
      moreLoading: false,
      limit: 10,
      more: false,
      total: null
    }
  },

  watch: {
    tab(val) {
      this.fetch()
      this.total = null
      // clear internal sort of table when external button clicked
      this.$refs && this.$refs.disciplinas && this.$refs.disciplinas.clearSort();
    }
  },

  created() {
    this.fetch()
  },

  methods: {
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
      let course = _.find(courses, { _id: courseId })
      if(course){
        return course.name
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

      try {
        let res = await Stats.matricula(this.tab, { page: this.page })

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