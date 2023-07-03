// import Auth from '@/services/Auth'
import User from '@/services/User'
import ErrorMessage from '@/helpers/ErrorMessage'

export default {
  name: 'Recovery',

  data() {
    return {
      email: '',
      validEmail: false,

      // wasRecovered === 1: enter email 
      // wasRecovered === 2: success 
      // wasRecovered === 3: recovery error
      wasRecovered: 1,

      loading: false,
      emailSuffix: '@aluno.ufabc.edu.br',
    }
  },
  computed: {
    disableBtn() {
      return !this.validEmail || this.email.length === 0 
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