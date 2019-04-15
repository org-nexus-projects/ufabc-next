import History from '@/services/History'
import ErrorMessage from '@/helpers/ErrorMessage'
import _ from 'lodash'

export default {
  name: 'Enrollments',

  data(){
    return {
      history: null,
      loading: false,
    }
  },

  created() {
    this.fetch()
  },

  methods: {
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

  }
}