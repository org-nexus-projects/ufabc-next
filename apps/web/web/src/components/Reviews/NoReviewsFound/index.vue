<template>
  <v-layout class="text-xs-center" column align-center justify-center>
    <v-flex xs12 class="mb-3"><img src="@/assets/comment_not_found.gif" width="256" height="256" /></v-flex>
    <v-flex class="mb-3" xs12>
      Nenhum dado encontrado 😕 <br />
      Você já fez matéria com esse professor? Se sim, atualize seu histórico
    </v-flex>
    <v-btn @click="$router.push({ name: 'history' })" color="info">Atualizar</v-btn>
  </v-layout>
</template>

<script>
export default {
  name: 'NoReviewsFound'
}
</script>