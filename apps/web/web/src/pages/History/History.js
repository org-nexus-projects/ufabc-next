import History from '@/services/History'
import ErrorMessage from '@/helpers/ErrorMessage'
import _ from 'lodash'
import CommentEditor from '@/components/Reviews/CommentEditor'

export default {
  name: 'History',

  data(){
    return {
      history: null,
      loading: false,
      conceptsColor: {
        'A': 'rgb(63, 207, 140)',
        'B': 'rgb(184, 233, 134)',
        'C': 'rgb(248, 183, 76)',
        'D': 'rgb(255, 160, 4)',
        'F': 'rgb(249, 84, 105)',
        'O': 'rgb(169, 169, 169)',

        // exceptions
        'I': 'rgb(25, 118, 210)',
        'E': 'rgb(25, 118, 210)',
        'null': 'rgb(0, 0, 0)',
      }
    }
  },

  created() {
    this.fetch()
  },

  computed: {
    historyBySeason() {
      if(this.history && this.history.disciplinas && this.history.disciplinas.length) {
        return _.groupBy(this.history.disciplinas, 'quad')
      }
    },

    historySeasons() {
      return _.keys(this.historyBySeason)
    },

    subjectsCount() {
      return _.get(this.history, 'disciplinas.length', 0)
    }
  },

  methods: {
    seasonLabel(season) {
      let seasonSplited = season.split(':')
      if(seasonSplited.length < 2) return ''
      return seasonSplited[1] + ' de ' + seasonSplited[0]
    },

    async fetch() {
      this.loading = true

      try {
        let res = await History.get()

        this.loading = false
        if(res.data){
          this.history = res.data

          this.history.disciplinas.map((h) => {
            h.quad = h.ano + ':' + h.periodo
            return h
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

    async comment() {
      let dialog = this.$dialog({
        width: '750px',
        top: '10vh',
      }, CommentEditor)

      try {
        let res = await dialog

      } catch(e) {} 
    }

  }
}