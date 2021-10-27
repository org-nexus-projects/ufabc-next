import Auth from '@/services/Auth'

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
  }
}