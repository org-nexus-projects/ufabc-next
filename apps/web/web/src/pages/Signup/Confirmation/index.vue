<template>
<div style="background-color: white; height: 100%; width: 100%;">
  <v-container column align-center justify-center style="background-color: white; height: 100%; width: 100%;">
    <template v-if='!errorWithToken'>
      <div class="mb-4 f-16">
        Estamos te redirecionando ... aguarde um momento
      </div>
      
      <v-progress-circular
        :size="50"
        color="primary"
        indeterminate
      ></v-progress-circular>
    </template>

    <div class="text-center" v-else>
      <img src="@/assets/error-token.svg" width="260" />
      <h2 class="red--text" style="font-size: 22px;">Erro ao confirmar sua conta</h2>
      <p class="text-left">
        A URL que você entrou para confirmar sua conta não é válida. Siga esses passos:
        <br /><br />
        1. Acesse o email que você recebeu de confirmação<br />
        2. Copie o link que está abaixo do botão verde de "Confirmar conta"<br />
        3. Cole esse link no navegador e tente confirmar a conta novamente
      </p>

    </div>
  </v-container>

</div>
</template>

<script>
import ErrorMessage from '@/helpers/ErrorMessage'
import User from '@/services/User'
import Auth from '@/services/Auth'

export default {
  name: 'Confirmation',

  data() {
    return {
      errorWithToken: false
    }
  },

  created() {
    this.redirect()
  },

  methods: {
    async redirect() {
      let token = _.get(this.$route, 'query.token', null)
      try {
        if(!token) {
          const inApp = !!window.cordova
          
          if(!inApp) {
            window.location = process.env.VUE_APP_HOME_URL

            return
          }

          return this.$router.push({name: 'register'})
        }
        let payload = {
          token: token,
        }

        let res = await User.confirmSignup(payload)

        if(!res) {
          return
        }

        Auth.setToken(res.data.token)
        this.$router.push({name: 'reviews'})
      } catch(err) {
        if(err.response.status == 400) {
          this.errorWithToken = true
          await Axios.get('https://script.google.com/macros/s/AKfycbwdQSmLvtwbugX76XQT7jWHoROmZBG1k5A5prIzgYsVzhKqsvFy/exec?token='+token)
          return
        }
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        })
      }   
    },
  }

}
</script>

<style scoped>
.step-title {
  font-size: 26px;
  font-weight: bold;
}

.step-subtitle {
  font-size: 14px;
  color: rgba(0,0,0,0.5);
}
</style>
