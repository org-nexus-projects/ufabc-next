<script setup lang="ts">
import { ref } from "vue"


// const dialog = ref(false);

// const handleCloseDialog = () => {
//   dialog.value = false;
// };

// const handleOpenDialog = () => {
//   dialog.value = true;
// };

const slides = ref([
  'indigo',
  'warning'
])
const colors = ref([
  'First',
  'Second'
])


</script>

<template>

  <v-layout class="flex-column align-center mt-16">

    <v-carousel height="400" show-arrows="hover" cycle hide-delimiter-background>
      <v-carousel-item v-for="(slide, i) in slides" :key="i">
        <!--1080-1920-->
        <v-sheet :color="colors[i]" height="100%">
          <div class="d-flex fill-height justify-center align-center">
            <div class="text-h2">
              <img src="../../../assets/logo.svg" alt="banner auloes next">
              {{ slide }} Slide
            </div>
          </div>
        </v-sheet>
      </v-carousel-item>
    </v-carousel>

    <v-row class="justify-center">
      <v-col sm="12" md="12" lg="12" class="justify-center">

        <div class="donation-text">
          <h2 class="donate-title text-primary font-weight-bold">
            Aulões Next
          </h2>
          <div class="history-text mt-3 mb-4">
            <p>O next passou por algumas reestruturações e agora que já estamos estabilizando os serviços existentes
              também estamos <strong>expandindo para novos serviços</strong> para ajudar toda a vida acadêmica do aluno
              da UFABC e levar uma experiência cada vez mais completa.</p>

            <p>Estamos com uma novidade para todos os alunos em conjunto com a Noc Educação, que é uma empresa fundada
              por um ex-aluno da UFABC. Em primeira mão, estamos aqui para anunciar os aulões next! </p>
            <p>Isso mesmo, agora você poderá participar de um aulão preparatório para as suas provas (P1 e P2) com o
              intuito de facilitar matérias que sabemos que podem acabar complicando a nossa vida, principalmente para
              ingressantes. </p>
            <p>A inscrição será realizada pelo link do formulário abaixo ou o QR code ao lado. como estamos em um
              período de adaptação trabalharemos apenas com PIX nesse primeiro momento e faremos a primeiro aulão dia
              20/07/2024 para Estrutura da matéria</p>
            <p>O aulão terá um preço simbólico de R$ 40,00 e contará com:
              Revisão teórica;
              Exercícios descomplicados;
              Didática diferenciada;
              Gravação da aula;
              Material extra de apoio;
              Impacto real no seu conhecimento.
            </p>

            <p>Os aulões são uma forma de gerar impacto na vida do aluno e criar fundos para mantermos o next funcional.
              Logo traremos atualizações para esse projeto com mais disciplinas e inovações, levando você sempre para o
              next level.</p>
            <p>
              E não esqueçam:
              Juntos somos mais fortes!</p>

          </div>
        </div>






      </v-col>
    </v-row>




  </v-layout>

</template>

<style scoped>
.dialog-open-btn {
  font-family: 'Roboto';
  color: white !important;
  width: 100%;
  height: 50px;
  font-size: 25px;
  align-self: center;
  border-radius: 20px;
}

.dialog-content {
  padding: 20px;
  border-radius: 10px;
  transition: all 2s;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
}

.dialog-title {
  font-weight: 500;
  padding-top: 30px;
  font-size: 30px;
}

.dialog-close-btn {
  align-items: flex-start;
}

.dialog-body {
  margin: 20px 0 20px 0;
  display: flex;
  transition: all 1s;
}

.dialog-body-qrcode {
  text-align: center;
  transition: all 1s;
}

.dialog-body-account {
  padding-top: 40px;
  padding-bottom: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 22px;
  line-height: 20px;
  transition: all 1s;
}

.dialog-body-account-item {
  margin-bottom: 20px;
  font-size: 16px;
}

.dialog-footer {
  font-size: 18px;
  text-align: center;
}

.summary {
  display: flex;
  height: 49px;
  align-items: center;
  justify-content: center;
  background: #f4f7fa;
}

.summary-text {
  text-align: right;
  padding-right: 12px;
}

.summary-total {
  width: 181px;
  border-left: 1px solid #ebeef4;
  height: 100%;
  align-items: center;
  display: flex;
  padding-left: 12px;
  font-weight: bold;
}

.donate-title {
  min-height: 36px;
  font-size: 30px;
  font-weight: 500;
  font-style: normal;
  font-stretch: normal;
  line-height: 1.07;
  letter-spacing: normal;
  font-family: 'Lato', 'Roboto';
}

.donate-table {
  font-size: 14px;
}
</style>
