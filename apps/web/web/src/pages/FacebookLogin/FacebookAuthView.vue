<script>
import ErrorMessage from '@/helpers/ErrorMessage';
import User from '@/services/User';
import Auth from '@/services/Auth';
import environment from '@/environment'
import axios from 'axios';

export default {
  name: 'SignupForm',
  inject: ['$validator'],
  data() {
    return {
      loading: false,
      currentStep: 0,
      studentData: {
        email: '',
        ra: '',
      },
      validForm: false,
      emailSuffix: '@aluno.ufabc.edu.br',

      loadingResend: false,
      resent: false,

      LOGIN_PROBLEMS_FORM:
        'https://docs.google.com/forms/d/e/1FAIpQLSclCQczaO-BSzDaDx33SCZSm1lqqKgjw8x7u-eIfrfwkLCSrw/viewform',
    };
  },

  created() {
    // E ISSO AQUI?
    // ==============================
    if (Auth.token || _.get(this.$route, 'query.token', '')) {
      this.login();
    } else {
      this.redirectIfIsFilled();
    }
  },

  computed: {
    disableBtn() {
      return !this.validForm || this.studentData.email.length === 0 || this.studentData.ra.length === 0;
    },
  },

  methods: {
    async next() {
      this.loading = true;

      let payload = {
        email: this.studentData.email,
        ra: this.studentData.ra,
      };
    
      await User.facebookAuth(payload).then(({data}) => {
        Auth.setToken(data.jwt)
        this.$router.push('/reviews')
        // const teste = `https://api.ufabcnext.com/connect/google?userId=${res.data.userId}`
        // await axios.get(teste).catch(err => console.log(err))

      }).catch(() => {
        if (err.response.data.error == 'Essa conta foi desativada') {
        this.$dialog({
          title: 'Sua conta foi desativada',
          html: `Para ativar novamente a sua conta, preencha este <a href="https://ufabcnext.com/app/#/recovery" target="_blank">formulário</a>.`,
          buttons: [{ name: 'OK', class: 'grey--text' }],
        });
      }
      }).finally(() => this.loading = false)
    },

    back() {
      if (this.currentStep-- < 0) this.currentStep = 0;
    },

    async login() {
      try {
        this.loading = true;

        let res = await User.info();
        this.loading = false;
        if (res.data) Auth.user = res.data;

        if (res.data.confirmed) {
          this.$router.push({ path: '/reviews' });
        } else {
          this.redirectIfIsFilled();
        }
      } catch (err) {
        Auth.user = null;

        this.loading = false;

        // Redirect to final screen if all info was filled
        this.redirectIfIsFilled();
      }
    },

    redirectIfIsFilled() {
      if (
        Auth.user &&
        Auth.user.email &&
        Auth.user.ra &&
        !Auth.user.confirmed
      ) {
        this.currentStep = 1;
        this.studentData.email = Auth.user.email.replace(this.emailSuffix, '');
        this.studentData.ra = Auth.user.ra;
        this.next();
      }
    },
  },
};
</script>

<template>
  <div style="background-color: white; height: 100%; width: 100%;">
    <v-container
      column
      style="background-color: white; height: 100%; width: 100%;"
    >
      <v-layout row wrap style="width: 100%; flex: none" v-if="!loading">
        <v-flex xs3 sm1 md2 lg2>
          <img style="max-width: 100%; height: auto;" src="@/assets/logo.svg" />
        </v-flex>
      </v-layout>

      <v-layout
        v-loading="loading"
        align-center
        row
        wrap
        style="width: 100%; flex: 1 1 auto;"
      >
        <v-flex sm12 md7 lg7 v-if="!loading">
          <img
            style="max-width: 100%; height: auto;"
            src="@/assets/signup.svg"
          />
        </v-flex>

        <!-- Steps -->
        <v-flex sm12 md5 lg5 v-if="!loading">
          <!-- Step 1 -->
          <v-layout column fill-width v-if="currentStep == 0">
            <div class="text-xs-center mb-2">
              <img
                style="width: 50px; height: 50px;"
                src="https://upload.wikimedia.org/wikipedia/en/0/04/Facebook_f_logo_%282021%29.svg"
              />
            </div>
            <h1 class="mb-2 text-xs-center">
              Houve um problema com seu login através do Facebook
            </h1>
            <p class="step-subtitle mb-4 text-xs-center">
              Mas não se preocupe, estamos aqui para te ajudar a recuperar o
              acesso à sua conta.
            </p>

            <v-form v-model="validForm">
              <div class="my-2">Insira o email do seu Facebook</div>
              <v-text-field
                placeholder="Insira seu email"
                v-model="studentData.email"
                name="studentEmail"
                data-vv-as="email institucional"
                v-validate="'required|email'"
                :error-messages="errors.collect('studentEmail')"
                solo
              >
              </v-text-field>

              <div class="my-2">Insira seu RA</div>
              <v-text-field
                placeholder="Ex: 11012014"
                v-model="studentData.ra"
                name="studentRa"
                v-validate="'required|min:8|numeric'"
                data-vv-as="RA"
                :error-messages="errors.collect('studentRa')"
                solo
              >
              </v-text-field>
            </v-form>
          </v-layout>

        </v-flex>
      </v-layout>

      <v-layout align-end row style="width: 100%; flex: none; height:57px;">
        <v-flex sm7 md7 lg7> </v-flex>
        <v-flex sm5 md5 lg5 class="border-top" style="display: flex;">
          <v-btn
            flat
            round
            large
            class="mr-2"
            v-show="currentStep != 0"
            @click="back()"
          >
            &lt Anterior
          </v-btn>
          <v-flex></v-flex>
          <v-btn
            :disabled="disableBtn"
            style="background-color: #00EB5E; color: white;"
            round
            large
            @click="next()"
          >
            Próximo >
          </v-btn>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<style scoped>
.step-title {
  font-size: 26px;
  font-weight: bold;
}

.step-subtitle {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.6);
}
</style>
