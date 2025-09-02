<template>
    <section>
        <v-container>
            <PaperCard title="Integração com Notion" class="text-md-left text-center">
                <v-form @submit.prevent="onSubmit">
                    <v-row class="mt-4">
                        <v-col cols="12">
                            <p class="text-body-1 mb-4">
                                Crie um card no Notion com as suas informações
                            </p>
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="title.value.value" :error-messages="title.errorMessage.value"
                                label="Título do Card" placeholder="Digite o título do seu card" outlined dense
                                :disabled="isPendingSubmit" />
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12">
                            <v-textarea v-model="description.value.value"
                                :error-messages="description.errorMessage.value" label="Descrição"
                                placeholder="Descreva o conteúdo do seu card" outlined rows="4"
                                :disabled="isPendingSubmit" />
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12">
                            <v-select v-model="priority.value.value" :error-messages="priority.errorMessage.value"
                                :items="priorityOptions" label="Prioridade" outlined dense
                                :disabled="isPendingSubmit" />
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12" class="text-center">
                            <v-btn type="submit" color="primary" :loading="isPendingSubmit"
                                :disabled="!meta.valid || isPendingSubmit" size="large">
                                Criar Card no Notion
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-form>

              </PaperCard>
        </v-container>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMutation } from '@tanstack/vue-query';
import { useForm, useField } from 'vee-validate';
import { ElMessage } from 'element-plus';
import { AxiosError } from 'axios';

import { createNotionCard } from 'services';
import { PaperCard } from '@/components/PaperCard';
import { RequestError } from 'types';

const successMessage = ref<string>('');

const priorityOptions = [
    { title: 'Baixa', value: 'Baixa' },
    { title: 'Média', value: 'Média' },
    { title: 'Alta', value: 'Alta' },
];

const { handleSubmit, meta, resetForm } = useForm({
    initialValues: {
        title: '',
        description: '',
        priority: 'Média' as const,
    },
});

const title = useField('title');
const description = useField('description');
const priority = useField('priority');

const { mutate: mutateCreateCard, isPending: isPendingSubmit } = useMutation({
    mutationFn: createNotionCard,
    onSuccess: (response) => {
        successMessage.value = `Card criado com sucesso! Response: ${response}`;
        resetForm();
        ElMessage({
            message: 'Card criado no Notion com sucesso!',
            type: 'success',
            showClose: true,
        });
    },
    onError: (error: AxiosError<RequestError>) => {
        ElMessage({
            message: 'Erro ao criar card no Notion: ' + error.response?.data?.error,
            type: 'error',
            showClose: true,
        });
    },
});

const onSubmit = handleSubmit((values) => {
    successMessage.value = '';
    mutateCreateCard(values);
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