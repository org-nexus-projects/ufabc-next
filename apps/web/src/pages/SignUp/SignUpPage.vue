<template>
  <FeedbackAlert v-if="fetchEmailError" :text="handleEmailError" />
  <v-form @submit.prevent="onSubmit">
    <v-container class="pt-md-10 container">
      <v-row class="d-flex mb-5 flex-grow-0">
        <v-col xs="12" class="d-flex align-center justify-space-between">
          <img height="32" src="@/assets/logo.svg" alt="logo do UFABC Next" />
          <v-btn
            v-if="!smAndDown && !isAdvice"
            prepend-icon="mdi-exit-to-app"
            style="text-transform: unset !important"
            color="ufabcnext-red"
            @click="handleLogout"
          >
            Usar outra conta do google
          </v-btn>
        </v-col>
      </v-row>
      <v-row class="justify-md-start h-100 w-100 justify-center">
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
            class="mb-5 w-100"
            align-center
            finish-status="success"
          >
            <el-step title="Conta" />
            <el-step title="Dados" />
            <el-step title="Verificação" />
          </el-steps>
          <div
            v-if="step === 1"
            class="d-flex flex-column align-center align-md-start justify-md-center"
          >
            <div class="mb-6">
              <h1
                class="text-h6 text-md-h5 text-md-start font-weight-bold pb-4 text-center"
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
                class="d-flex px-md-2 justify-center px-0"
              >
                <v-btn
                  class="text-capitalize w-100"
                  rounded="lg"
                  size="x-large"
                  @click="handleAccountType('student')"
                >
                  <v-icon class="mr-2"> mdi-school </v-icon>
                  Aluno
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="d-flex px-md-2 justify-center px-0"
              >
                <v-btn
                  class="text-capitalize w-100"
                  rounded="lg"
                  size="x-large"
                  @click="handleAccountType('teacher')"
                >
                  <v-icon class="mr-2"> mdi-account </v-icon>
                  Professor
                </v-btn>
              </v-col>
            </v-row>
            <router-link
              to="/login"
              :style="smAndDown ? 'max-width: 300px' : ''"
              class="mt-md-2 text-primary font-weight-medium text-decoration-none mt-4 text-center"
            >
              Já tem uma conta? Faça login
            </router-link>
            <router-link
              to="/recovery"
              :style="smAndDown ? 'max-width: 300px' : ''"
              class="text-caption mt-2 text-center"
            >
              Já tenho uma conta no UFABC Next e quero recuperá-la
            </router-link>
          </div>
          <div
            v-if="step === 2 && accountType === 'student'"
            class="d-flex flex-column align-center align-md-start justify-md-center"
          >
            <h1
              class="text-h6 text-md-h5 text-md-start font-weight-bold mb-4 text-center"
            >
              Falta pouco para completar o seu cadastro
            </h1>
            <v-text-field
              v-model.trim="ra.value.value"
              label="Insira seu RA"
              :disabled="isFetchEmailLoading"
              variant="solo"
              class="mb-4 w-100"
              placeholder="11201911111"
              prepend-inner-icon="mdi-school"
              :error-messages="ra.errorMessage.value"
              @update:focused="getUserEmail"
            />

            <v-text-field
              v-model.trim="raConfirm.value.value"
              :disabled="isFetchEmailLoading"
              label="Confirme seu RA"
              variant="solo"
              class="mb-4 w-100"
              placeholder="11201911111"
              prepend-inner-icon="mdi-school-outline"
              :error-messages="raConfirm.errorMessage.value"
              @update:focused="getUserEmail"
            />

            <v-text-field
              v-model.trim="email.value.value"
              :loading="isFetchEmailLoading"
              :disabled="true"
              label="Email institucional"
              variant="solo"
              class="mb-4 w-100"
              placeholder="joao.silva"
              prepend-inner-icon="mdi-email"
              :error-messages="email.errorMessage.value"
              readonly
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
              class="text-h6 text-md-h5 text-md-start font-weight-bold pb-4 text-center"
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
              class="text-h6 text-md-h5 text-md-start font-weight-bold text-center"
            >
              Enviamos um email de confirmação para
            </h1>
            <span
              class="text-h6 text-md-h5 text-md-start font-weight-bold text-primary text-break pb-4 text-center"
            >
              {{ email.value.value }}
            </span>

            <v-row class="mb-md-0 mb-7 w-100 flex-grow-0">
              <v-col
                cols="12"
                md="6"
                class="d-flex px-md-2 justify-center px-0"
              >
                <v-btn
                  style="text-transform: unset !important"
                  class="flex-grow-1"
                  rounded="lg"
                  size="x-large"
                  @click="step = 2"
                >
                  <v-icon class="mr-2"> mdi-pencil </v-icon>
                  Alterar email
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="d-flex px-md-2 justify-center px-0"
              >
                <v-btn
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
                  @click="mutateResendEmail"
                >
                  <v-icon class="mr-2">
                    {{ enableResendEmail ? 'mdi-email' : 'mdi-check-circle' }}
                  </v-icon>
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
                class="d-flex px-md-2 justify-center px-0"
              >
                <v-btn
                  style="text-transform: unset !important"
                  class="flex-grow-1"
                  rounded="xl"
                  size="x-large"
                  @click="step -= 1"
                >
                  Voltar
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                md="6"
                class="d-flex px-md-2 justify-center px-0"
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
                >
                  Enviar
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
      <v-row v-if="smAndDown">
        <v-col class="d-flex w-100 justify-end">
          <v-btn
            label="Usar outra conta do google"
            prepend-icon="mdi-exit-to-app"
            style="text-transform: unset !important"
            color="ufabcnext-red"
            size="large"
            @click="handleLogout"
          >
            <div>
              <p>Usar outra conta do</p>
              <p>google</p>
            </div>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { RequestError, Users } from '@next/services';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { toTypedSchema } from '@vee-validate/zod';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { useField, useForm } from 'vee-validate';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay, useTheme } from 'vuetify';
import { useRoute } from 'vuetify/lib/composables/router.mjs';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { SignUpSchema } from '@/features/auth/validation/signUpValidationSchema';
import { useAuthStore } from '@/stores/auth';

const theme = useTheme();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

theme.change('light');

const advice = route.value?.query.advice;
const isAdvice = !!advice;

onMounted(() => {
  if (advice === 'true') {
    ElMessage({
      // @ts-expect-error TODO(nic): fix it
      customClass: 'custom-warn',
      duration: 0,
      message:
        'Você não tem uma conta no UFABC next. Para continuar o login no UFABC Cronos, continue criando sua conta aqui.',
      showClose: true,
      type: 'warn',
    });
  }
});

function handleLogout() {
  authStore.logOut();
  window.location.href = '/';
}

const { smAndDown } = useDisplay();
const step = ref(1);
const accountType = ref('student');
const enableResendEmail = ref(true);
function handleAccountType(type: string) {
  accountType.value = type;
  step.value = 2;
}

const validationSchema = toTypedSchema(SignUpSchema);

const { handleSubmit, meta, setValues } = useForm({
  validationSchema,
});

const email = useField('email');
const ra = useField<string>('ra.ra');
const raConfirm = useField('ra.confirm');
const check = useField('check');

const { mutate: mutateSignUp, isPending: isPendingSubmit } = useMutation({
  mutationFn: Users.completeSignup,
  onError: (error: AxiosError<RequestError>) => {
    const message =
      error.status === 500
        ? 'Seu login falhou, tente novamente com o email institucional (@aluno.ufabc.edu.br ou @ufabc.edu.br)'
        : error.response?.data.message;
    ElMessage({
      message,
      showClose: true,
      type: 'error',
    });
  },
  onSuccess: (data) => {
    if (data?.token) {
      authStore.authenticate(data.token);
      router.push('/');
    } else {
      step.value = 3;
    }
  },
});

const onSubmit = handleSubmit((values) =>
  mutateSignUp({
    email: values.email.toLowerCase(),
    ra: Number(values.ra.ra),
  })
);

const isFetchEmailEnabled = computed(
  () => raConfirm.value.value === ra.value.value
);
const {
  refetch: fetchEmail,
  isLoading: isFetchEmailLoading,
  data: verifiedEmail,
  error: fetchEmailError,
} = useQuery({
  enabled: false,
  queryFn: () => Users.getEmail(ra.value.value),
  queryKey: ['email'],
});

const handleEmailError = computed(() => {
  const error = fetchEmailError.value as AxiosError<RequestError>;
  if (!error?.response) {
    return 'Um Erro inesperado ocorreu, tente novamente';
  }

  if (error?.response.status === 400) {
    return error.response.data.message;
  }

  if (error?.status === 403) {
    return error.response.data.message;
  }

  return 'Um Erro inesperado ocorreu, tente novamente';
});

function getUserEmail(fieldState: boolean) {
  if (fieldState || !ra.value.value || !isFetchEmailEnabled.value) {
    return;
  }

  fetchEmail();
}

watch(
  () => verifiedEmail.value,
  (newEmail) => {
    if (newEmail) {
      email.value.value = newEmail.email;
    }
  }
);

const { mutate: mutateResendEmail, isPending: isPendingResendEmail } =
  useMutation({
    mutationFn: Users.resendEmail,
    onError: (error: AxiosError<RequestError>) => {
      ElMessage({
        message: error.response?.data.error,
        showClose: true,
        type: 'error',
      });
    },
    onSuccess: () => {
      ElMessage({
        message: 'Email reenviado com sucesso',
        showClose: true,
        type: 'success',
      });
      enableResendEmail.value = false;
    },
  });

const { data: user } = useQuery({
  queryFn: Users.info,
  queryKey: ['users', 'info'],
});

watch(
  () => user.value,
  () => {
    if (user.value?.ra && user.value?.email) {
      step.value = 3;
      setValues({
        check: true,
        email: user.value.email.replace(/@(?:aluno\.)?ufabc\.edu\.br$/u, ''),
        ra: {
          confirm: user.value.ra.toString(),
          ra: user.value.ra.toString(),
        },
      });
    }
  }
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
