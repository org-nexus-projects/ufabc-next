<template>
  <div class="d-flex justify-center">
    <v-banner
      class="my-4 text-white px-15 py-6"
      style="
        border-radius: 12px;
        background: linear-gradient(90deg, #457ccf, #07306d);
        max-width: 100%;
        max-height: 100%;
      "
    >
      <div
        class="d-flex flex-column flex-md-row justify-space-between align-center w-100"
      >
        <div style="max-width: 330px">
          <h3 class="text-h6 font-weight-bold mb-3 mb-md-1">
            Encontre seu grupo ideal
          </h3>
          <p class="text-body-2 mb-0 mb-3 mb-md-0">
            Acesse os grupos de WhatsApp das matérias que você está cursando e
            fique por dentro de tudo com a sua turma.
          </p>
        </div>

        <div class="d-flex align-center ga-3 mt-4 mt-sm-0">
          <v-icon size="65"> mdi-whatsapp </v-icon>
          <span class="text-h5 font-weight-bold">+</span>
          <img
            src="@/assets/simple_logo_white.svg"
            alt="Logo do UFABC Next"
            width="65"
            height="65"
          />
        </div>
      </div>
    </v-banner>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
