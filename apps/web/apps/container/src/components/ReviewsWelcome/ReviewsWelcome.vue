<template>
  <div style="max-width: 750px">
    <p class="mb-6">Como funciona o UFABC Next e os Reviews?</p>
    <v-layout row wrap>
      <v-row>
        <v-col cols="12" xs="12" sm="5" class="welcome-image">
          <img
            src="@/assets/review_info.gif"
            style="width: 100%; max-width: 275px"
            alt="Animação de review"
          />
        </v-col>
        <v-col cols="12" xs="12" sm="7" class="text-center text-sm-left">
          <p class="welcome-subtitle">Centralização da informação</p>
          <p class="text-body-2 text-medium-emphasis">
            Fazemos um <i>big data</i> coletando informações públicas como
            turmas de uma disciplinas e unimos com as informações fornecidas
            pelos usuários.
          </p>
          <p class="welcome-subtitle">
            Informações anônimas e segurança de dados
          </p>
          <p class="text-body-2 text-medium-emphasis">
            Todos nossos dados de comentários e conceitos estão armazenados em
            nuvem e estão criptografados.
          </p>
          <p class="welcome-subtitle">
            Interface responsiva, acesse pelo celular 😀
          </p>
        </v-col>
      </v-row>
    </v-layout>
  </div>
</template>

<style lang="scss" scoped>
.welcome-image {
  display: flex;
  justify-content: center;
  align-items: center;
}
.welcome-subtitle {
  font-weight: 700;
  font-size: 20px;
  margin-top: 20px;
  margin-bottom: 8px;
}
.welcome-subtitle:nth-of-type(1) {
  margin-top: 0;
}
</style>

<script lang="ts" setup />
