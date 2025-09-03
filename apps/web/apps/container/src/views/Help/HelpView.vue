<template>
  <section>
    <v-container>
      <PaperCard title="Ajuda" class="text-md-left text-center">
        <v-form @submit.prevent="onSubmit">
          <v-row class="mt-4">
            <v-col cols="12">
              <p class="text-body-1 mb-4">
                Envie uma mensagem à equipe sobre algum problema que você está
                enfrentando
              </p>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="emailField.value.value"
                :error-messages="emailField.errorMessage.value"
                label="Email"
                placeholder="Digite seu email"
                outlined
                dense
                :disabled="isPendingSubmit || isDataFromStore"
                :readonly="isDataFromStore"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="raField.value.value"
                :error-messages="raField.errorMessage.value"
                label="RA"
                placeholder="Digite seu RA"
                outlined
                dense
                :disabled="isPendingSubmit || isDataFromStore"
                :readonly="isDataFromStore"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="problemTitleField.value.value"
                :error-messages="problemTitleField.errorMessage.value"
                label="Título do Problema"
                placeholder="Digite um título"
                outlined
                dense
                :disabled="isPendingSubmit"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="problemDescriptionField.value.value"
                :error-messages="problemDescriptionField.errorMessage.value"
                label="Descrição do Problema"
                placeholder="Descreva o problema"
                outlined
                rows="4"
                :disabled="isPendingSubmit"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-file-upload
                :key="fileUploadKey"
                v-model="imageField.value.value"
                :error-messages="imageField.errorMessage.value"
                density="comfortable"
                show-size
                title="Envie sua imagem"
                clearable
                accept="image/jpeg,image/jpg,image/png"
                :disabled="isPendingSubmit"
              />
              <small class="text-caption text-grey ml-3 mt-1 d-block">
                Formatos: JPEG, JPG e PNG
              </small>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" class="text-center">
              <v-btn
                type="submit"
                color="primary"
                :loading="isPendingSubmit"
                :disabled="!meta.valid || isPendingSubmit"
                size="large"
              >
                Enviar
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </PaperCard>
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query';
import { sendHelpForm } from '@ufabc-next/services';
import { RequestError } from '@ufabc-next/types';
import { toTypedSchema } from '@vee-validate/zod';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { useField, useForm } from 'vee-validate';
import { computed, nextTick, ref } from 'vue';

import { PaperCard } from '@/components/PaperCard';
import { useAuthStore } from '@/stores/auth';

import { helpFormSchema } from './helpValidationSchema';

const authStore = useAuthStore();
const successMessage = ref<string>('');
const fileUploadKey = ref<number>(0);

const userEmail = computed(
  () => authStore.user?.email ?? authStore.user?.oauth?.email ?? '',
);
const userRa = computed(() => authStore.user?.ra ?? '');
const isDataFromStore = computed(() =>
  Boolean(userEmail.value && userRa.value),
);

const validationSchema = toTypedSchema(helpFormSchema);

const { handleSubmit, meta, resetForm } = useForm({
  validationSchema,
  initialValues: {
    email: userEmail.value,
    ra: String(userRa.value), // todo: string here:
    problemTitle: '',
    problemDescription: '',
    image: undefined,
  },
});

const emailField = useField('email');
const raField = useField('ra');
const problemTitleField = useField('problemTitle');
const problemDescriptionField = useField('problemDescription');
const imageField = useField<File>('image');

const { mutate: mutateSendForm, isPending: isPendingSubmit } = useMutation({
  mutationFn: sendHelpForm,
  onSuccess: () => {
    resetForm();
    // Force re-render of file upload component to ensure proper reset state
    nextTick(() => {
      fileUploadKey.value += 1;
    });
    ElMessage({
      message: 'Mensagem de ajuda enviada com sucesso!',
      type: 'success',
      showClose: true,
    });
  },
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message:
        'Erro ao enviar mensagem de ajuda: ' +
        (error.response?.data?.error || error.message),
      type: 'error',
      showClose: true,
    });
  },
});

const onSubmit = handleSubmit((values) => {
  successMessage.value = '';

  mutateSendForm({
    email: values.email,
    ra: values.ra,
    problemTitle: values.problemTitle,
    problemDescription: values.problemDescription,
    image: values.image,
  });
});
</script>

<style scoped>
.container {
  min-height: calc(100vh - 64px);
  min-height: calc(100svh - 64px);
  display: flex;
  flex-direction: column;
}
</style>
