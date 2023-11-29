<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query';

import { Users } from 'services';
import { z } from 'zod';

import { toTypedSchema } from '@vee-validate/zod';
import { useForm, useField } from 'vee-validate';
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/useAuth';
import { ElMessage } from 'element-plus';
const redirectToHome = () => windowLocation.pathname = '/';


const { authenticate } = useAuth();
const router = useRouter();
const windowLocation = window.location

const validationSchema = toTypedSchema(
  z.object({
    email: z
      .string({
        required_error: 'Este campo é obrigatório',
        invalid_type_error: 'Digite um email válido',
      })
      .email({
        message: 'Por favor, digite um email válido'
      }),
    ra: z.string({ required_error: 'Este campo é obrigatório' })
  }),
);


const { handleSubmit } = useForm({
  validationSchema,
});
const { value: emailField, errorMessage: emailErrorMessage } = useField('email');
const { value: raField, errorMessage: raErrorMessage } = useField('ra');

const { mutate: mutateFacebook, isPending: isPendingSubmit } = useMutation({
  mutationFn: Users.facebookAuth,
  onSuccess({ data }) {
    ElMessage({
      message: 'Realizando seu login',
      type: 'success',
      showClose: true,
      duration: 5_000,
    })
    authenticate.value(data.token)
    router.push('/reviews')
  },
  onError() {
    redirectToHome();
  }
})

const onSubmit = handleSubmit(({ email, ra }) => mutateFacebook({ email, ra }));

</script>

<template>
  <v-form @submit.prevent="onSubmit">
    <v-container class="container pt-md-10">
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

        <v-col cols="12" md="6" class="mt-6 d-flex flex-column ga-4">
          <div class="d-flex align-center w-100 flex-column">
            <img style="width: 50px; height: 50px; "
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

          <v-text-field v-model="emailField" label="Insira seu email do Facebook" variant="solo" class="w-100"
            prepend-inner-icon="mdi-email" :error-messages="emailErrorMessage">
          </v-text-field>

          <v-text-field v-model="raField" label="Insira seu RA" variant="solo" class="w-100" placeholder="11201911111"
            prepend-inner-icon="mdi-school" :error-messages="raErrorMessage" />
          <v-col md="6" class="d-flex justify-center px-0 px-md-2">
            <v-btn color="primary" type="submit" style="text-transform: unset !important" class="flex-grow-1"
              size="x-large" :loading="isPendingSubmit">Enviar</v-btn>
          </v-col>
        </v-col>

      </v-row>
    </v-container>
  </v-form>
</template>


<style scoped lang="css">
.container {
  min-height: calc(100vh - 64px);
  min-height: calc(100svh - 64px);
  display: flex;
  flex-direction: column;
}
</style>
