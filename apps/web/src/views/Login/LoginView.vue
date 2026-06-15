<script setup lang="ts">
import { computed } from 'vue';

import { buildGoogleAuthUrl, isLocalAppSession } from '@/utils/runtimeConfig';

const googleAuthUrl = computed(() =>
  buildGoogleAuthUrl({ requesterKey: 'ufabc-next' }),
);
</script>

<template>
  <v-container fluid class="login-view pa-4 pa-md-8">
    <section class="login-card" aria-label="Login UFABC Next">
      <div class="brand-panel">
        <img
          class="brand-logo"
          src="@/assets/logo.svg"
          alt="logo do UFABC Next"
        />
        <div class="brand-curves" aria-hidden="true" />
      </div>

      <div class="auth-panel">
        <div class="auth-content">
          <p v-if="isLocalAppSession()" class="auth-env">Ambiente DEV</p>
          <h1 class="auth-title">Bem-vindo(a)!</h1>
          <p class="auth-subtitle">Entre com sua conta institucional</p>

          <v-btn
            class="google-login-button"
            color="primary"
            rounded="lg"
            size="x-large"
            tag="a"
            :href="googleAuthUrl"
            aria-label="Entrar com Google"
          >
            <span class="google-icon-chip" aria-hidden="true">
              <img class="google-icon" src="@/assets/google-logo.png" alt="" />
            </span>
            <span>Entrar com Google</span>
          </v-btn>
        </div>
      </div>
    </section>
  </v-container>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.login-card {
  width: min(1280px, 100%);
  min-height: min(720px, calc(100vh - 64px));
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.brand-panel {
  position: relative;
  background: #f8faff;
  display: grid;
  place-items: center;
  padding: 56px;
}

.brand-logo {
  width: min(470px, 90%);
  max-width: 100%;
  position: relative;
  z-index: 1;
}

.brand-curves {
  position: absolute;
  inset: auto auto 0 0;
  width: 78%;
  aspect-ratio: 1 / 1;
  opacity: 0.8;
  background: repeating-radial-gradient(
    circle at 0% 100%,
    transparent 0,
    transparent 24px,
    rgba(59, 130, 246, 0.12) 24px,
    rgba(59, 130, 246, 0.12) 26px
  );
  clip-path: inset(0 0 0 0 round 0 100% 0 0);
  pointer-events: none;
}

.auth-panel {
  background: #ffffff;
  display: grid;
  place-items: center;
  padding: 56px;
}

.auth-content {
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.auth-env {
  color: rgb(var(--v-theme-primary));
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auth-title {
  margin: 0;
  font-size: clamp(1.75rem, 2.8vw, 2.25rem);
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #111111;
}

.auth-subtitle {
  margin-top: 16px;
  margin-bottom: 0;
  font-size: clamp(0.95rem, 1.5vw, 1.05rem);
  font-weight: 400;
  color: #666666;
}

.google-login-button {
  margin-top: 25px;
  width: 100%;
  min-height: 56px;
  border-radius: 16px;
  text-transform: none;
  font-size: clamp(0.95rem, 1.45vw, 1rem);
  font-weight: 600;
  letter-spacing: 0;
  background: #1a73e8;
  box-shadow: 0 10px 24px rgba(26, 115, 232, 0.28);
  display: inline-flex;
  justify-content: flex-start;
  padding-inline: 16px;
  gap: 12px;
}

.google-icon-chip {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  margin-right: 8px;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.auth-links {
  margin-top: 32px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.auth-link {
  font-size: clamp(0.95rem, 1.4vw, 1rem);
  font-weight: 500;
  color: #1dba9b;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.auth-link:hover {
  opacity: 0.8;
}

.google-login-button:hover {
  transform: translateY(-1px);
}

.google-login-button:active {
  transform: scale(0.99);
}

@media (max-width: 959px) {
  .login-card {
    min-height: 0;
    grid-template-columns: 1fr;
  }

  .brand-panel,
  .auth-panel {
    padding: 32px 24px;
  }

  .brand-logo {
    width: min(320px, 80%);
  }

  .brand-curves {
    display: none;
  }

  .auth-content {
    align-items: center;
    text-align: center;
  }

  .google-login-button {
    justify-content: center;
  }
}
</style>
