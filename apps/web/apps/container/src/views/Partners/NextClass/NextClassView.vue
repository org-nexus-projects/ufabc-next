<script setup lang="ts">
import { PaperCard } from '@/components/PaperCard';

</script>

<template>
  <section class="d-flex fill-height justify-center align-center">
    <div class="text-h2">
      <img src="../../../assets/auloes-next-banner-2.png" alt="banner auloes next">
    </div>
  </section>

  <section>
    <v-layout>
      <v-row>
        <v-col cols="12" sm="12" md="8">
          <PaperCard class="mt-4">
            <h2 class="text-primary font-weight-bold mb-4">
              Com medo das provas? Os <strong>Aulões Next</strong> podem te ajudar!
            </h2>
            <div>
              <p class="mb-4">
                Em parceria com a <a href="https://www.instagram.com/p/C9dvkVWuPEG/" class="font-weight-bold"
                  target="_blank">NOC Educação</a>,
                estamos inaugurando os Aulões Next! Agora você poderá
                participar de um
                aulão preparatório para as suas provas (P1 e P2) com o
                intuito de facilitar matérias que sabemos que podem acabar complicando a nossa vida, principalmente para
                ingressantes.
              </p>
              <p class="mb-4">
                Nosso primeiro aulão será no dia <strong>20/07/2024</strong> para a disciplina <strong>Estrutura da
                  Matéria</strong>. <br>
                <strong>Para se inscrever, clique ou escaneie o QR code</strong>
              </p>
              <p class="mb-4">
                O UFABC Next passou por algumas reestruturações e já estamos estabilizando os serviços existentes, além
                de
                expandir novos serviços para gerar impacto na vida do alunos e arrecadar fundos para mantermos o projeto
                funcionando para vocês
              </p>
              <p class="mb-4">
                Logo traremos atualizações para esse projeto com mais disciplinas e inovações, levando você sempre para
                o
                next level.
              </p>
              <p class="mb-4">Não perca essa oportunidade, te esperamos lá! 😉🎓</p>
              <p class="mb-4">
                E não esqueçam:
                <br>
                Juntos somos mais fortes!
              </p>
            </div>
          </PaperCard>
        </v-col>
        <v-col cols="12" sm="12" md="4" class="grid-cta">
          <PaperCard class="p-4 mb-4">
            <div class="card-informations">
              <h2>Por apenas R$ 40,00</h2>
              <ul class="mb-4">
                <li>Aula presenial</li>
                <li>Revisão teórica</li>
                <li>Exercícios descomplicados</li>
                <li>Didática diferenciada</li>
                <li>Gravação da aula</li>
                <li>Material extra de apoio</li>
                <li>Impacto real no seu conhecimento</li>
              </ul>
            </div>
          </PaperCard>
          <PaperCard class="p-4 mb-4">
            <div class="card-informations">
              <h2>Clique para Inscrever-se</h2>
              <div class="img-style">
                <img src="../../../assets/qr-code-auloes.png" alt="auloes next" height="250" width="250">
              </div>
            </div>
          </PaperCard>
        </v-col>
      </v-row>
    </v-layout>
  </section>
</template>

<style lang="css" scoped>
.card-informations {
  border-bottom: 6px solid #FFCB17;

}

.card-informations ul {
  padding-left: 0;
  margin-left: 0;
  list-style-position: inside;
}

.grid-cta {
  display: grid;
  grid-template-columns: 1fr;
}

@media (max-width: 960px) {
  .grid-cta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.4rem;
  }
}
</style>