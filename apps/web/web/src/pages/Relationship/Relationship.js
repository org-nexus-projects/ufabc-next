import User from '@/services/User'
import ErrorMessage from '@/helpers/ErrorMessage'

export default {
  name: 'Relationship',

  data() {
    return {
      loading: false,
    }
  },

  created() {
    this.fetch()
  },

  computed: {
   
  },

  methods: {
    async fetch(){
      try {
        this.loading = true
        let res = await User.relationships()

        this.loading = false
        console.log(res)
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    }

  }
}