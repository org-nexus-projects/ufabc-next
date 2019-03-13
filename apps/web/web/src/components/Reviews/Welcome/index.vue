<template>
  <v-layout column align-center class="mt-3" v-else>
    <v-layout column class="grid-explain-review">
      <div class="subheading mt-3 mb-4 pb-2">Como funciona o UFABC Next e os Reviews?</div>
      <v-layout row wrap>
        <v-flex class="mb-5" xs12 sm5 md5>
          <img src="@/assets/review_info.gif" />
        </v-flex>
        <v-flex xs12 sm7 md7>
          <div class="title mb-2">Centralização da informação</div>
          <div class="grey--text">Fazemos um <i>big data</i> coletando informações públicas como turmas de uma disciplinas e unimos com as informações fornecidas pelos usuários.</div>

          <div class="title mb-2 mt-4">Informações anônimas e segurança de dados</div>
          <div class="grey--text">Todos nossos dados de comentários e conceitos estão armazenados em nuvem e estão criptografados.</div>

          <div class="title mb-2 mt-4">Interface responsiva, acesse pelo celular 😀</div>
        </v-flex>
      </v-layout>
    </v-layout>
  </v-layout>
</template>
<script>
export default {
  name: 'WelcomeReview'
}  
</script>
<style>
.grid-explain-review {
  max-width: 726px;
  text-align: left;
}
.grid-explain-review img {
  width: 100%;
  height: auto;
  padding-right: 24px;
  max-width: 272px;
}

@media (max-width: 600px) {
  .grid-explain-review img{
    width: 128px;
    height: 128px;
    padding: 0;
  }
  .grid-explain-review {
    max-width: 100%;
    text-align: center;
  }
}
</style>