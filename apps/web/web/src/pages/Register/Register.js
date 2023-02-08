import Auth from '@/services/Auth'
import User from '@/services/User'
import ErrorMessage from '@/helpers/ErrorMessage'

export default {
  data() {
    return {
     inApp: !!window.cordova
   }
  },  
  created() {
    if(Auth.isLoggedIn()) {
      this.$router.push('/reviews')
    }
  },
  computed: {
    isDev() {
      return process.env.NODE_ENV == "development"
    }
  },
  methods: {
    loginFacebook() {
      const env = process.env.NODE_ENV
      window.open(
        (`${process.env.VUE_APP_API_URL}/connect/facebook?inApp=${this.inApp}&env=${env}`).replace('/v1', ''),
        this.inApp ? '_system' : '_self'
      );
    },

    loginGoogle() {
      const env = process.env.NODE_ENV
      window.open(
        (`${process.env.VUE_APP_API_URL}/connect/google?inApp=${this.inApp}&env=${env}`).replace('/v1', ''),
        this.inApp ? '_system' : '_self'
      );
    },

    async loginDev() {
      try {
        Auth.token="DEVTOKEN"
        localStorage.setItem('token', "DEVTOKEN")
        let res = await User.info()
        if(res.data) Auth.user = res.data
        this.$router.push('/reviews')
      } catch(err) {
        Auth.user = null
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        })
      }
    },
  }
}