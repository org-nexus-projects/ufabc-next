<script>
import ErrorMessage from '@/helpers/ErrorMessage';
import User from '@/services/User';
import Auth from '@/services/Auth';

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
      return !this.validForm;
    },
  },

  methods: {
    async next() {
      if (this.currentStep == 1) {
        if (await this.confirmAccount()) {
          this.currentStep++;
          this.resent = false;
          return;
        } else {
          return;
        }
      }

      if (this.currentStep++ > 2) {
        this.currentStep = 0;
      }
    },

    back() {
      if (this.currentStep-- < 0) this.currentStep = 0;
    },

    async confirmAccount() {
      let email = this.studentData.email.concat(this.emailSuffix);

      return this.$validator.validateAll().then(async (isValid) => {
        if (!isValid) {
          return false;
        }

        //Call confirmation route
        try {
          this.loading = true;

          let payload = {
            email: email,
            ra: this.studentData.ra,
          };

          let res = await User.completeSignup(payload);
          this.loading = false;
        } catch (err) {
          this.loading = false;

          if (err.response.data.error == 'Essa conta foi desativada') {
            await this.$dialog({
              title: 'Sua conta foi desativada',
              html: `Para ativar novamente a sua conta, preencha este <a href="https://ufabcnext.com/app/#/recovery" target="_blank">formulário</a>.`,
              buttons: [{ name: 'OK', class: 'grey--text' }],
            });
          }

          if (err.response.data.status == 409) {
            await this.$dialog({
              title: `Já existe alguem usando este ${err.response.data.error}`,
              html:
                'Caso não seja você que esteja usando, preencha esse <a href="https://ufabcnext.com/app/#/recovery" target="_blank">formulário</a>.',
              buttons: [{ name: 'OK', class: 'grey--text' }],
            });
          }

          this.$message({
            type: 'error',
            message: ErrorMessage(err),
          });
          return false;
        }

        return true;
      });
    },

    async resendEmail() {
      try {
        this.loadingResend = true;

        let res = await User.resendEmail();
        this.loadingResend = false;
        this.resent = true;
      } catch (err) {
        this.loadingResend = false;
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        });
      }
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
        <v-flex sm5 md5 lg5></v-flex>
        <v-flex sm5 md5 lg5>
          <el-steps :active="currentStep" finish-status="success">
            <el-step title="Passo 1"></el-step>
            <el-step title="Passo 2"></el-step>
            <el-step title="Passo 3"></el-step>
          </el-steps>
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
            {{ validForm }}
          </v-layout>

          <!-- Step 2 -->
          <v-layout column fill-width v-if="currentStep == 1">
            <div>
              <div class="step-title mb-4">
                Falta pouco para completar o seu cadastro
              </div>
              <div class="step-subtitle mb-2">
                Insira seu email institucional
              </div>
              <v-text-field
                placeholder="joão"
                suffix="@aluno.ufabc.edu.br"
                v-model="studentData.email"
                name="studentEmail"
                v-validate="{ required: true }"
                data-vv-as="email institucional"
                :error-messages="errors.collect('studentEmail')"
                persistent-hint
                :hint="
                  `Caso você não tenha um e-mail @aluno.ufabc.edu.br, <a href='${LOGIN_PROBLEMS_FORM}' class='ufabcnext-link--text' target='_blank' style='text-decoration: none'>clique aqui</a>`
                "
                solo
              ></v-text-field>
              <div class="step-subtitle mt-3 mb-2">Insira seu RA</div>
              <v-text-field
                v-model="studentData.ra"
                name="ra"
                v-validate="{ required: true, min: 8 }"
                data-vv-as="RA"
                :error-messages="errors.collect('ra')"
                ref="ra"
                placeholder="Ex: 11012014"
                solo
              ></v-text-field>
              <div>
                <span
                  class="v-messages error--text"
                  style="padding-left: 12px;"
                  v-show="errors.has('terms')"
                  >{{ errors.first('terms') }}</span
                >
              </div>
            </div>
          </v-layout>

          <!-- Step 3 -->
          <div v-if="currentStep == 2">
            <div>
              <div class="step-title mb-4">
                Enviamos um email de confirmação para
                <span class="ufabcnext-nav-blue--text">{{
                  `${studentData.email}${emailSuffix}`
                }}</span>
              </div>

              <div class="mt-3">
                <v-btn color="ufabcnext-yellow" @click="back()">
                  <v-icon class="mr-2">edit</v-icon> Digitei o email errado
                </v-btn>
                <v-btn
                  :loading="loadingResend"
                  :disabled="loadingResend || resent"
                  color="ufabcnext-blue"
                  :dark="!resent"
                  @click="resendEmail()"
                >
                  <v-icon class="mr-2">{{
                    resent ? 'mdi-check-circle' : 'email'
                  }}</v-icon>
                  {{ resent ? 'Email enviado' : 'Reenviar email' }}
                </v-btn>
              </div>
            </div>
          </div>
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
