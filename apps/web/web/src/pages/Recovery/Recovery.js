// import Auth from '@/services/Auth'
import User from '@/services/User'
import ErrorMessage from '@/helpers/ErrorMessage'

export default {
  name: 'Recovery',

  data() {
    return {
      email: null,
      wasRecovered: 1,
      loading: false,
      emailSuffix: '@aluno.ufabc.edu.br',
    }
  },
  methods: {
    async next() {
      try {
        this.loading = true
        let res = await User.recovery(this.email)
        this.wasRecovered = 2
        this.loading = false
      } catch(err) {
        this.loading = false
        this.wasRecovered = 3
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        })
      }
    },
    openUFABCMail() {
      window.open('https://www.outlook.com/aluno.ufabc.edu.br', '_blank')
    },
  },
}