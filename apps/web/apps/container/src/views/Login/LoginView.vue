<script setup lang="ts">
import { computed } from 'vue';

import { buildGoogleAuthUrl, runtimeConfig } from '@/utils/runtimeConfig';

const environmentLabels = {
  local: 'Local',
  staging: 'Staging',
  production: 'Produção',
} as const;

const environmentLabel = computed(() => {
  return environmentLabels[
    runtimeConfig.appEnv as keyof typeof environmentLabels
  ];
});

const googleAuthUrl = computed(() =>
  buildGoogleAuthUrl({ requesterKey: 'ufabc-next' }),
);
</script>

<template>
  <v-container class="login-view">
    <v-row class="login-row" align="center" justify="center">
      <v-col cols="12" md="5" class="login-copy">
        <img
          class="login-logo"
          src="@/assets/logo.svg"
          alt="logo do UFABC Next"
        />
        <p class="login-eyebrow">Ambiente {{ environmentLabel }}</p>
        <h1 class="login-title">
          Entre no UFABC Next com a conta institucional
        </h1>
        <p class="login-description">
          Use o mesmo fluxo de Google OAuth do ambiente selecionado para abrir o
          app localmente sem depender da landing page estática.
        </p>
        <v-btn
          class="login-button"
          color="primary"
          size="x-large"
          rounded="lg"
          tag="a"
          :href="googleAuthUrl"
        >
          Entrar com Google
        </v-btn>
        <div class="login-links">
          <router-link to="/signup">Criar conta</router-link>
          <router-link to="/recovery">Recuperar conta</router-link>
        </div>
      </v-col>
      <v-col cols="12" md="5" class="login-illustration-column">
        <img
          class="login-illustration"
          src="@/assets/signup.svg"
          alt="Pessoa estudando com um notebook"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.login-row {
  width: 100%;
  gap: 24px;
}

.login-copy {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-logo {
  width: 180px;
  max-width: 100%;
}

.login-eyebrow {
  color: rgb(var(--v-theme-primary));
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.login-title {
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.05;
  font-weight: 800;
}

.login-description {
  max-width: 32rem;
  color: rgba(0, 0, 0, 0.72);
  font-size: 1rem;
  line-height: 1.6;
}

.login-button {
  align-self: flex-start;
  text-transform: none;
  font-weight: 700;
}

.login-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-weight: 600;
}

.login-illustration-column {
  display: flex;
  justify-content: center;
}

.login-illustration {
  width: min(100%, 420px);
}

@media (max-width: 959px) {
  .login-view {
    padding-top: 32px;
    padding-bottom: 32px;
  }

  .login-copy {
    align-items: center;
    text-align: center;
  }

  .login-button {
    align-self: stretch;
  }

  .login-links {
    justify-content: center;
  }
}
</style>
