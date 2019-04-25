<template>
<div style="background-color: white; height: 100%; width: 100%;">
  <v-container column align-center justify-center style="background-color: white; height: 100%; width: 100%;">
    <div class="mb-4 f-16">
      Estamos te redirecionando ... aguarde um momento
    </div>
    
    <v-progress-circular
      :size="50"
      color="primary"
      indeterminate
    ></v-progress-circular>
  </v-container>
</div>
</template>

<script>
import ErrorMessage from '@/helpers/ErrorMessage'
import User from '@/services/User'
import Auth from '@/services/Auth'
import Environment from '@/environment'

export default {
  name: 'Confirmation',

  created() {
    this.redirect()
  },

  methods: {
    async redirect() {
      try {
        let token = _.get(this.$route, 'query.token', null)
        if(!token) {
          window.location = Environment.HOME_URL
          return
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
