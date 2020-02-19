export default {
  data() {
    return {
     inApp: !!window.cordova
   }
  },  
  methods: {
    loginFacebook() {
      window.open(
        (`${process.env.VUE_APP_API_URL}/connect/facebook?inApp=${this.inApp}`).replace('/v1', ''),
        this.inApp ? '_system' : '_self'
      );
    },

    loginGoogle() {
      window.open(
        (`${process.env.VUE_APP_API_URL}/connect/google?inApp=${this.inApp}`).replace('/v1', ''),
        this.inApp ? '_system' : '_self'
      );
    },
  }
}