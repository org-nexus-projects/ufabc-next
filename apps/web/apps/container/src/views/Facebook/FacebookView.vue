<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@tanstack/vue-query';
import { toTypedSchema } from '@vee-validate/zod';
import { facebookValidationSchema } from './facebookValidationSchema'
import { useForm, useField } from 'vee-validate';
import { ElMessage } from 'element-plus';

import { useAuth } from '@/stores/useAuth';
import { Users } from 'services';

const facebookNotFound = ref(false);

const { authenticate } = useAuth();
const router = useRouter();

const validationSchema = toTypedSchema(facebookValidationSchema as any);
const { handleSubmit } = useForm({
  validationSchema,
});

const { value: emailField, errorMessage: emailErrorMessage } =
  useField('email');
const { value: raField, errorMessage: raErrorMessage } = useField('ra');
const { mutate: mutateFacebook, isPending: isPendingSubmit } = useMutation({
  mutationFn: Users.facebookAuth,
  onSuccess({ data }) {
    ElMessage({
      message: 'Realizando seu login',
      type: 'success',
      showClose: true,
      duration: 5_000,
    });
    authenticate.value(data.token);
    router.push('/partners');
  },
  onError() {
    window.Toaster.error('Login com Facebook não encontrado');
    facebookNotFound.value = true;
  },
});

const windowLocation = window.location;
const redirectToHome = () => (windowLocation.pathname = '/');
const onSubmit = handleSubmit(({ email, ra }) =>
  mutateFacebook({ email: email.toLowerCase(), ra }),
);
</script>

<template>
  <v-container class="container">
    <v-row class="d-flex mb-5 flex-grow-0">
      <v-col xs="12" class="d-flex align-center justify-space-between">
        <img height="32" src="@/assets/logo.svg" alt="logo do UFABC Next" />
      </v-col>
    </v-row>
    <v-row class="w-100 h-100 justify-center justify-md-start">
      <v-col cols="12" md="6" class="d-flex align-center justify-center">
        <img src="@/assets/signup.svg" class="w-100" style="max-width: 400px"
          alt="Pessoa meditando na frente do computador" />
      </v-col>

      <v-col cols="12" md="6" class="mt-6 d-flex flex-column ga-4" v-if="!facebookNotFound">
        <div class="d-flex align-center w-100 flex-column">
          <img style="width: 50px; height: 50px"
            src="https://upload.wikimedia.org/wikipedia/en/0/04/Facebook_f_logo_%282021%29.svg"
            alt="Logo do Facebook" />
          <h1 class="text-center">
            Houve um problema com seu login através do Facebook
          </h1>
          <p class="step-subtitle text-center">
            Mas não se preocupe, estamos aqui para te ajudar a recuperar o
            acesso à sua conta.
          </p>
        </div>

        <v-form @submit.prevent="onSubmit">
          <v-text-field v-model.trim="emailField" label="Insira seu email do Facebook" variant="solo" class="w-100"
            prepend-inner-icon="mdi-email" :error-messages="emailErrorMessage">
          </v-text-field>

          <v-text-field v-model="raField" label="Insira seu RA" variant="solo" class="w-100" placeholder="11201911111"
            prepend-inner-icon="mdi-school" :error-messages="raErrorMessage" />
          <v-col md="6" class="d-flex justify-center px-0 px-md-2">
            <v-btn color="primary" type="submit" style="text-transform: unset !important" class="flex-grow-1"
              size="x-large" :loading="isPendingSubmit">Enviar</v-btn>
          </v-col>
        </v-form>
      </v-col>

      <v-col v-else cols="12" md="6" class="mt-6 d-flex flex-column ga-4">
        <div class="d-flex align-center w-100 flex-column">
          <img style="width: 50px; height: 50px"
            src="https://upload.wikimedia.org/wikipedia/en/0/04/Facebook_f_logo_%282021%29.svg"
            alt="Logo do Facebook" />
          <h1 class="text-center mb-4">
            Sua conta do UFABC Next não foi encontrada
          </h1>
          <p class="step-subtitle text-center mb-5">
            Identificamos que você não tem um cadastro no UFABC Next através do
            Facebook. <br />
            Para continuar, volte para a página inicial e
            <strong>crie uma conta</strong> utilizando o
            <strong>Google</strong>.
          </p>
          <div>
            <v-btn color="white" @click="facebookNotFound = false" style="text-transform: unset !important"
              class="flex-grow-1 mr-4" size="x-large">Tentar novamente</v-btn>
            <v-btn color="primary" @click="redirectToHome()" style="text-transform: unset !important"
              class="flex-grow-1" size="x-large">Voltar para a página inicial</v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="css">
.container {
  min-height: calc(100vh - 64px);
  min-height: calc(100svh - 64px);
  display: flex;
  flex-direction: column;
}
</style>
