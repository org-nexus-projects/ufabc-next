<script setup lang="ts">
import { PaperCard } from '@/components/PaperCard';

</script>

<template>
  <section class="mb-4">
    <a class="clean" href="https://linktr.ee/auloes.next" target="_blank">
      <img src="@/assets/auloes-next-banner.png" alt="banner auloes next" style="width: 100%">
    </a>
  </section>

  <section>
    <v-layout>
      <v-row>
        <v-col cols="12" sm="12" md="8">
          <PaperCard>
            <h2 class="text-primary font-weight-bold mb-4">
              Os <strong>Aulões Next</strong> para as P2 estão chegando!
            </h2>
            <div>
              <p class="mb-4">
                Em parceria com a <a href="https://www.instagram.com/p/C9dvkVWuPEG/" class="font-weight-bold"
                  target="_blank">NOC Educação</a>,
                estamos inaugurando os Aulões Next! Agora você poderá
                participar de um
                aulão preparatório para as suas provas (P1 e P2) com o
                intuito de facilitar matérias que sabemos que podem acabar complicando a sua vida, principalmente para
                ingressantes.
              </p>
              <p class="mb-4">
                As P2 estão cada vez mais próximas, e sabemos que a vida na UFABC pode ficar difícil. Então, confira o
                que
                preparamos para você:
              </p>
              <br>
              <ul class="mb-4 bullet-list">
                <li><strong>Estrutura da Matéria</strong> - 31/08 das 9h ás 13h</li>
                <li><strong>Funções de Várias Variáveis</strong> - 31/08 das 9h ás 13h</li>
                <li><strong>Bases Matemáticas</strong> - 14/09 das 9h ás 13h</li>
              </ul>
              <br>
              <p><strong>Clique <a href="https://linktr.ee/auloes.next" target="_blank">aqui</a> ou
                  escaneie o QR
                  code para fazer sua inscrição!</strong>
              </p>
              <p class="mb-4">Dúvidas? Mande uma mensagem para <a href="https://www.instagram.com/auloes.next/"
                  target="_blank">@auloes.next</a></p>
              <p class="mb-4">Não perca essa oportunidade, te esperamos lá! 😉🎓</p>
              <p class="mb-4">
                E não se esqueçam:
                <br>
                Juntos somos mais fortes!
              </p>
            </div>
          </PaperCard>
        </v-col>
        <v-col cols="12" sm="12" md="4" class="grid-cta">
          <PaperCard class="p-4">
            <div class="card-informations">
              <h2 style="margin-bottom: 10px;">Por apenas R$ 40,00</h2>
              <ul class="mb-4 bullet-list">
                <li><strong>Aula presencial</strong></li>
                <li>Revisão teórica</li>
                <li>Exercícios descomplicados</li>
                <li>Didática diferenciada</li>
                <li>Gravação da aula</li>
                <li>Material extra de apoio</li>
                <li>Impacto real no seu conhecimento</li>
              </ul>
              <a href="https://linktr.ee/auloes.next" target="_blank">
                <v-btn color="#2e7eed" class="w-100">
                  Acesse aqui
                </v-btn>
              </a>
            </div>
          </PaperCard>
          <PaperCard class="p-4 mb-4">
            <h2 style="margin-bottom: 10px; text-align: center;">Escaneie o QrCode</h2>
            <div class="img-style" style="display: flex; justify-content: center;">
              <a href="https://linktr.ee/auloes.next" target="_blank">
                <img src="@/assets/qr-code-auloes.png" alt="auloes next" height="250" width="250"></a>
            </div>
          </PaperCard>
        </v-col>
      </v-row>
    </v-layout>
  </section>
</template>

<style scoped lang="css">
.bullet-list {
  padding-left: 0;
  margin-left: 0;
  list-style-position: inside;
}

.grid-cta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.4rem;

}

@media (max-width: 960px) {
  .grid-cta {
    grid-template-columns: 1fr 1fr;
  }

  .clean {
    display: none;
  }
}

@media (max-width:600px) {
  .grid-cta {
    grid-template-columns: 1fr;
  }

  .clean {
    display: none;
  }
}
</style>