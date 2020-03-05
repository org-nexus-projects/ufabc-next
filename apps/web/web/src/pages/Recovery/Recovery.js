import Auth from '@/services/Auth'
import User from '@/services/User'
import ErrorMessage from '@/helpers/ErrorMessage'

export default {
  name: 'Recovery',

  data() {
    return {
      email: null,
      notDefaultEmail: false,
      wasRecovered: false,
      loading: false,
      emailSuffix: '@aluno.ufabc.edu.br',
    }
  },
  methods: {
    async next() {
      if(!this.notDefaultEmail) {
        this.email = this.email + this.emailSuffix
      }
      try {
        this.loading = true
        let res = await User.recovery({ email: this.email })
        this.wasRecovered = true
        this.loading = false
      } catch(err) {
        this.loading = false

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
