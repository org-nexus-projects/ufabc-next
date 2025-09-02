<template>
  <v-container class="container pt-md-10">
    <v-row class="d-flex mb-5 flex-grow-0">
      <v-col
        xs="12"
        class="d-flex align-center justify-space-between"
      >
        <img
          height="32"
          src="@/assets/logo.svg"
        >
      </v-col>
    </v-row>
    <v-row class="h-100">
      <v-col class="d-flex justify-center align-center">
        <div
          v-if="isPendingConfirmToken"
          class="d-flex flex-column align-center"
        >
          <h1 class="text-h5 mb-4">
            Estamos validando sua conta, aguarde um momento...
          </h1>
          <CenteredLoading />
        </div>

        <div
          v-else
          class="text-center"
        >
          <img
            src="@/assets/error-token.svg"
            style="max-width: 260px; width: 100%"
          >
          <h1 class="text-h5 mb-4">
            Erro ao confirmar sua conta
          </h1>
          <p class="text-left text-body-1 mb-2">
            A URL que você entrou para confirmar sua conta não é válida. Siga
            esses passos:
          </p>
          <p class="text-left text-body-1 mb-1">
            1. Acesse o email que você recebeu de confirmação.
          </p>
          <p class="text-left text-body-1 mb-1">
            2. Copie o link que está abaixo do botão verde de "Confirmar conta".
          </p>
          <p class="text-left text-body-1 mb-1">
            3. Cole esse link no navegador e tente confirmar a conta novamente.
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query';
import { Users } from '@ufabc-next/services';
import { RequestError } from '@ufabc-next/types';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { CenteredLoading } from '@/components/CenteredLoading';
import { useAuth } from '@/stores/useAuth';

const { authenticate } = useAuth();

const router = useRouter();

const { mutate: mutateConfirmToken, isPending: isPendingConfirmToken } =
  useMutation({
    mutationFn: Users.confirmSignup,
    onSuccess: (data) => {
      ElMessage({
        message: 'Conta confirmada com sucesso',
        type: 'success',
        showClose: true,
      });
      authenticate.value(data.data.token);
      router.push('/');
    },
    onError: (error: AxiosError<RequestError>) => {
      ElMessage({
        message: error.response?.data.error,
        type: 'error',
        showClose: true,
      });
    },
  });

onMounted(async () => {
  await router.isReady();
  const token = router.currentRoute.value.query.token as string;
  if (!token) {
    ElMessage({
      message: 'Token de confirmação não encontrado',
      type: 'error',
      showClose: true,
    });
    return;
  }
  mutateConfirmToken(token);
});
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
