<template>
  <section>
    <v-container>
      <PaperCard v-if="!user">
        <v-row>
          <CenteredLoading v-if="isLoadingUser" />
          <div v-if="isErrorUser" class="text-center">
            <p class="text-box-settings">
              Ocorreu um problema ao carregar as informações do seu perfil
            </p>
            <p class="text-box-settings">
              Tente novamente
              <span class="text-decoration-underline" @click="reloadPage"
                >clicando aqui</span
              >
            </p>
          </div>
        </v-row>
      </PaperCard>
      <PaperCard
        v-else
        title="Configurações da conta"
        class="text-md-left text-center"
      >
        <v-row class="mt-4">
          <v-col
            cols="12"
            md="2"
            class="mb-3 d-flex justify-center d align-center"
          >
            <v-avatar
              :size="80"
              color="primary"
              class="white--text"
              style="font-size: 32px; font-weight: bold; text-transform: uppercase"
            >
              {{ userInitials }}
            </v-avatar>
          </v-col>
          <v-col class="mb-3">
            <section class="mb-3">
              <div class="username-settings">
                {{ userLogin }}
              </div>
              <div class="email-settings">
                {{ user?.email }}
              </div>
              <div class="createdAt-settings mb-3">
                Usuário desde {{ createdAt }}
              </div>
              <div class="links-container">
                <div v-if="user?.oauth?.facebook" href="#" class="links-settings">
                  <v-icon color="ufabcnext-green">mdi-check</v-icon>
                  Conta do Facebook associada
                </div>
                <div v-if="user?.oauth?.google" href="#" class="links-settings">
                  <v-icon color="ufabcnext-green">mdi-check</v-icon>
                  Conta do Google associada
                </div>
                <a
                  v-else-if="user"
                  :href="addGoogleAccount"
                  target="_blank"
                  class="links-settings add-account"
                >
                  <v-icon color="ufabcnext-blue" class="mr-2"
                    >mdi-plus-circle-outline</v-icon
                  >
                  Associar à uma conta do Google
                </a>
              </div>
            </section>
          </v-col>
          <v-col
            cols="12"
            md="3"
            class="d-flex justify-center justify-md-end align-center"
          >
            <v-btn
              class="settings-button error--text"
              outlined
              variant="outlined"
              color="error"
              @click="dialog = true"
            >
              Desativar Conta
            </v-btn>
          </v-col>
        </v-row>
      </PaperCard>
      <PaperCard class="mt-4">
        <v-row>
          <v-col>
            <h2 class="title-box-settings mb-3">
              Segurança e controle dos dados
            </h2>
            <p class="text-box-settings">
              Todos os seus dados que armazenamos (RA, histórico e avaliações)
              poderão ser excluídos a qualquer momento e você tem controle total
              sobre eles. Ao desativar sua conta, suas avaliações
              <b>não serão perdidas</b>.
            </p>
          </v-col>
        </v-row>
      </PaperCard>
    </v-container>

    <v-dialog v-model="dialog" width="450px">
      <v-card>
        <v-card-title class="text-h5"> Excluir conta </v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir seu usuário? <br /><br />Caso deseje
          voltar, tudo estará aqui 😀
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="green-darken-1" variant="text" @click="dialog = false">
            Agora não
          </v-btn>
          <v-btn color="error" variant="text" @click="removeAccount()">
            Excluir conta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@tanstack/vue-query';
import { api, Users } from '@ufabc-next/services';
import { ElMessage } from 'element-plus';
import { computed, ref } from 'vue';

import { CenteredLoading } from '@/components/CenteredLoading';
import { PaperCard } from '@/components/PaperCard';
import { useAuthStore } from '@/stores/auth';
import { useAliasInitials } from '@/utils/composables/aliasInitials';

const authStore = useAuthStore();

const {
  data: user,
  isLoading: isLoadingUser,
  error: isErrorUser,
} = useQuery({
  queryKey: ['users', 'info'],
  queryFn: Users.info,
  select: (response) => response.data,
});

const userLogin = computed(() => {
  return user.value?.email?.replace('@aluno.ufabc.edu.br', '');
});

const addGoogleAccount = computed(() => {
  return `${api.defaults.baseURL}/login/google?userId=${user.value?._id}`;
});

const createdAt = computed(() => {
  if (user.value?.createdAt) {
    const parsedDate = new Date(user.value.createdAt);
    return parsedDate.toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  }
  return '';
});

const userInitials = useAliasInitials();

const dialog = ref(false);

const handleLogout = () => {
  authStore.logOut();
};

const { mutate: removeUser } = useMutation({
  mutationFn: () => Users.delete(),
  onSuccess: () => {
    handleLogout();
  },
  onError: () => {
    ElMessage({
      message: 'Ocorreu um erro ao tentar excluir sua conta',
      type: 'error',
    });
  },
});

async function removeAccount() {
  dialog.value = false;
  removeUser();
}

const reloadPage = () => window.location.reload();
</script>

<style scoped>
.title-settings {
  font-family: Lato, Roboto;
  font-size: 28px;
}

.username-settings {
  font-family: Lato, Roboto;
  line-height: 1.5;
  font-size: 26px;
  height: 45px;
  font-weight: bold;
}

.email-settings {
  font-family: Lato, Roboto;
  font-size: 16px;
}

.createdAt-settings {
  font-family: Lato, Roboto;
  font-size: 16px;
}

.title-box-settings {
  font-family: Lato, Roboto;
  font-size: 26px;
  line-height: 1.3;
}

.text-box-settings {
  font-size: 16px;
}

.links-settings {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: rgba(var(--v-theme-ufabcnext-green), 0.87);
}

.add-account {
  border: 2px dashed #1976d2;
  padding: 2px;
  border-radius: 6px;
}
</style>
