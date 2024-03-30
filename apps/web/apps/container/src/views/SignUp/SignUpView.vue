<template>
  <v-form @submit.prevent="onSubmit">
    <v-container class="container pt-md-10">
      <v-row class="d-flex mb-5 flex-grow-0">
        <v-col xs="12" class="d-flex align-center justify-space-between">
          <img height="32" src="@/assets/logo.svg" alt="logo do UFABC Next" />
          <v-btn
            v-if="!smAndDown"
            @click="handleLogout"
            prepend-icon="mdi-exit-to-app"
            style="text-transform: unset !important"
            color="ufabcnext-red"
          >
            Usar outra conta do google/facebook
          </v-btn>
        </v-col>
      </v-row>
      <v-row class="w-100 h-100 justify-center justify-md-start">
        <v-col cols="12" md="6" class="d-flex align-center justify-center">
          <img
            src="@/assets/signup.svg"
            class="w-100"
            style="max-width: 400px"
            alt="Pessoa meditando na frente do computador"
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
          :style="smAndDown ? 'max-width: 450px' : ''"
          class="d-flex flex-column justify-md-space-between w-100"
        >
          <el-steps
            :active="step"
            class="w-100 mb-5"
            align-center
            finish-status="success"
          >
            <el-step title="Conta"></el-step>
            <el-step title="Dados"></el-step>
            <el-step title="Verificação"></el-step>
          </el-steps>
          <div
            v-if="step === 1"
            class="d-flex flex-column align-center align-md-start justify-md-center"
          >
            <div class="mb-6">
              <h1
                class="text-h6 text-md-h5 text-center text-md-start font-weight-bold pb-4"
              >
                O que você faz na UFABC?
              </h1>
              <p class="text-body-2 font-weight-light">
                Selecione uma das opções:
              </p>
            </div>
            <v-row class="w-100 flex-grow-0">
              <v-col
                cols="12"
                md="6"
                class="d-flex justify-center px-0 px-md-2"
              >
                <v-btn
                  @click="handleAccountType('student')"
                  class="w-100 text-capitalize"
                  rounded="lg"
                  size="x-large"
                >
                  <v-icon class="mr-2">mdi-school</v-icon>
                  Aluno
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="d-flex justify-center px-0 px-md-2"
              >
                <v-btn
                  @click="handleAccountType('teacher')"
                  class="w-100 text-capitalize"
                  rounded="lg"
                  size="x-large"
                >
                  <v-icon class="mr-2">mdi-account</v-icon>
                  Professor
                </v-btn>
              </v-col>
            </v-row>
            <router-link
              to="/recovery"
              :style="smAndDown ? 'max-width: 300px' : ''"
              class="mt-4 mt-md-2 text-center"
            >
              Já tenho uma conta no UFABC Next e quero recuperá-la
            </router-link>
          </div>
          <div
            v-if="step === 2 && accountType === 'student'"
            class="d-flex flex-column align-center align-md-start justify-md-center"
          >
            <h1
              class="text-h6 text-md-h5 text-center text-md-start font-weight-bold mb-4"
            >
              Falta pouco para completar o seu cadastro
            </h1>
            <v-text-field
              v-model.trim="email.value.value"
              label="Insira seu email institucional"
              variant="solo"
              class="mb-4 w-100"
              placeholder="joao.silva"
              prepend-inner-icon="mdi-email"
              :error-messages="email.errorMessage.value"
            >
              <template #append-inner>@aluno.ufabc.edu.br</template>
            </v-text-field>
            <v-text-field
              v-model.trim="ra.value.value"
              label="Insira seu RA"
              variant="solo"
              class="mb-4 w-100"
              placeholder="11201911111"
              prepend-inner-icon="mdi-school"
              :error-messages="ra.errorMessage.value"
            />
            <v-text-field
              v-model.trim="raConfirm.value.value"
              label="Confirme seu RA"
              variant="solo"
              class="w-100"
              placeholder="11201911111"
              prepend-inner-icon="mdi-school-outline"
              :error-messages="raConfirm.errorMessage.value"
            />
            <v-checkbox
              v-model="check.value.value"
              :error-messages="check.errorMessage.value"
              class="align-self-start"
            >
              <template #label>
                <span>
                  Li e concordo com os
                  <a href="termos-de-uso.html">termos de uso</a>
                </span>
              </template>
            </v-checkbox>
          </div>
          <div
            v-if="step === 2 && accountType === 'teacher'"
            class="d-flex flex-column align-center align-md-start justify-md-center"
          >
            <h1
              class="text-h6 text-md-h5 text-center text-md-start font-weight-bold pb-4"
            >
              Estamos trabalhando nisso!
            </h1>
            <p class="text-body-2 font-weight-light mb-6">
              Professor(a), estamos construindo algumas ferramentas especiais
              para você, por enquanto você pode verificar sua distribuição de
              notas por disciplinas
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfbwaJCw-t4SlHJ4akwQNCMNAEBREDcdfrqHs7ROhkuUUwDRQ/viewform"
                >aqui</a
              >
            </p>
          </div>
          <div
            v-if="step === 3"
            class="d-flex flex-column align-center align-md-start justify-md-center"
          >
            <h1
              class="text-h6 text-md-h5 text-center text-md-start font-weight-bold"
            >
              Enviamos um email de confirmação para
            </h1>
            <span
              class="text-h6 text-md-h5 text-center text-md-start font-weight-bold text-primary text-break pb-4"
            >
              {{ email.value.value }}@aluno.ufabc.edu.br
            </span>

            <v-row class="w-100 flex-grow-0 mb-7 mb-md-0">
              <v-col
                cols="12"
                md="6"
                class="d-flex justify-center px-0 px-md-2"
              >
                <v-btn
                  @click="step = 2"
                  style="text-transform: unset !important"
                  class="flex-grow-1"
                  rounded="lg"
                  size="x-large"
                >
                  <v-icon class="mr-2">mdi-pencil</v-icon>
                  Alterar email
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="d-flex justify-center px-0 px-md-2"
              >
                <v-btn
                  @click="mutateResendEmail"
                  :disabled="!enableResendEmail"
                  style="text-transform: unset !important"
                  class="flex-grow-1"
                  rounded="lg"
                  size="x-large"
                  :color="
                    enableResendEmail ? 'ufabcnext-yellow' : 'next-light-gray'
                  "
                  :loading="isPendingResendEmail"
                  aria-label="Reenviar email de confirmação"
                >
                  <v-icon class="mr-2">{{
                    enableResendEmail ? 'mdi-email' : 'mdi-check-circle'
                  }}</v-icon>
                  {{ enableResendEmail ? 'Reenviar email' : 'Email reenviado' }}
                </v-btn>
              </v-col>
            </v-row>
          </div>
          <div
            :style="step === 1 ? 'visibility: hidden' : ''"
            class="d-flex align-center align-md-start justify-md-center flex-column flex-md-row w-100"
          >
            <v-row class="w-100 flex-grow-0">
              <v-col
                cols="12"
                :md="step === 3 ? 12 : 6"
                class="d-flex justify-center px-0 px-md-2"
              >
                <v-btn
                  @click="step -= 1"
                  style="text-transform: unset !important"
                  class="flex-grow-1"
                  rounded="xl"
                  size="x-large"
                  >Voltar</v-btn
                >
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="d-flex justify-center px-0 px-md-2"
              >
                <v-btn
                  v-if="accountType === 'student' && step === 2"
                  :disabled="!meta.valid"
                  color="primary"
                  type="submit"
                  style="text-transform: unset !important"
                  class="flex-grow-1"
                  rounded="xl"
                  size="x-large"
                  :loading="isPendingSubmit"
                  >Enviar</v-btn
                >
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
      <v-row v-if="smAndDown">
        <v-col class="d-flex justify-end w-100">
          <v-btn
            label="Usar outra conta do google/facebook"
            @click="handleLogout"
            prepend-icon="mdi-exit-to-app"
            style="text-transform: unset !important"
            color="ufabcnext-red"
            size="large"
          >
            <div>
              <p>Usar outra conta do</p>
              <p>google/facebook</p>
            </div>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { Users } from 'services';
import { z } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm, useField } from 'vee-validate';
import { AxiosError } from 'axios';
import { RequestError } from 'types';
import { ElMessage } from 'element-plus';
import { useDisplay } from 'vuetify';
import { watch } from 'vue';
import { useAuth } from '@/stores/useAuth';
const { logOut } = useAuth();

const handleLogout = () => {
  logOut.value();
};

const { smAndDown } = useDisplay();
const step = ref(1);
const accountType = ref('student');
const enableResendEmail = ref(true);
const handleAccountType = (type: string) => {
  accountType.value = type;
  step.value = 2;
};

const validationSchema = toTypedSchema(
  z
    .object({
      email: z
        .string({
          required_error: 'Este campo é obrigatório',
          invalid_type_error: 'Digite um email UFABC válido',
        })
        .refine(
          (email) => !/@/.test(email),
          'Não digite o conteúdo depois do @',
        )
        .refine((email) => /^\S+$/.test(email), 'Não digite espaços em branco'),
      ra: z
        .object({
          ra: z
            .string({
              required_error: 'Este campo é obrigatório',
              invalid_type_error: 'Digite um RA válido',
            })
            .regex(/^\d+$/, {
              message: 'Insira apenas números',
            })
            .refine(
              (ra) => ra.length >= 8,
              'O campo RA deve conter pelo menos 8 dígitos.',
            ),
          confirm: z.string({
            required_error: 'Este campo é obrigatório',
            invalid_type_error: 'Digite um RA válido',
          }),
        })
        .superRefine((val, ctx) => {
          if (val.ra !== val.confirm) {
            ctx.addIssue({
              code: 'custom',
              message: 'Os campos RA devem ser iguais',
              path: ['confirm'],
            });
          }
        }),
      check: z.boolean(),
    })
    .superRefine((val, ctx) => {
      if (!val.check) {
        ctx.addIssue({ code: 'custom' });
      }
    }),
);

const { handleSubmit, meta, setValues } = useForm({
  validationSchema,
});

const email = useField('email');
const ra = useField('ra.ra');
const raConfirm = useField('ra.confirm');
const check = useField('check');

const { mutate: mutateSignUp, isPending: isPendingSubmit } = useMutation({
  mutationFn: Users.completeSignup,
  onSuccess: () => {
    step.value = 3;
  },
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message: error.response?.data.error,
      type: 'error',
      showClose: true,
    });
  },
});

const onSubmit = handleSubmit(({ email, ra }) =>
  mutateSignUp({
    email: email.toLowerCase().trim() + '@aluno.ufabc.edu.br',
    ra: Number(ra.ra),
  }),
);

const { mutate: mutateResendEmail, isPending: isPendingResendEmail } =
  useMutation({
    mutationFn: Users.resendEmail,
    onSuccess: () => {
      ElMessage({
        message: 'Email reenviado com sucesso',
        type: 'success',
        showClose: true,
      });
      enableResendEmail.value = false;
    },
    onError: (error: AxiosError<RequestError>) => {
      ElMessage({
        message: error.response?.data.error,
        type: 'error',
        showClose: true,
      });
    },
  });

const { data: user } = useQuery({
  queryKey: ['users', 'info'],
  queryFn: Users.info,
  select: (response) => response.data,
});

watch(
  () => user.value,
  () => {
    if (user.value?.ra && user.value?.email) {
      step.value = 3;
      setValues({
        email: user.value.email.replace('@aluno.ufabc.edu.br', ''),
        ra: {
          ra: user.value.ra.toString(),
          confirm: user.value.ra.toString(),
        },
        check: true,
      });
    }
  },
);
</script>

<style scoped>
.container {
  min-height: calc(100vh - 64px);
  min-height: calc(100svh - 64px);
  display: flex;
  flex-direction: column;
}
.user-type-button {
  height: 60px;
  width: 160px;
}
</style>
