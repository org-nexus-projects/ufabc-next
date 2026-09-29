<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { PaperCard } from '@/components/ui/PaperCard';
import { eventTracker } from '@/helpers/EventTracker';
import { WebEvent } from '@/helpers/WebEvent';

const dialog = ref(false);

const handleCloseDialog = () => {
  dialog.value = false;
};

const handleOpenDialog = () => {
  dialog.value = true;

  eventTracker.track(WebEvent.DONATE_DIALOG_OPENED, {
    event_type: 'dialog_open',
  });
};

const handlePixLinkClick = () => {
  eventTracker.track(WebEvent.DONATE_PIX_LINK_CLICKED);
};

const tableData = [
  {
    name: 'Domínio ufabcnext.com',
    description:
      'É o nome da nossa URL. Os domínios servem para identificar, de forma amigável, os endereços das aplicações pela internet.',
    amount: 'R$ 70,00/ano',
  },
  {
    name: 'Servidor (Digital Ocean)',
    description:
      'Para a plataforma poder estar no ar, precisamos hospedar toda a interface e sua infraestrutura, assim como a sua API. Para isso, usamos um servidor na cloud DigitalOcean, o que também nos gera custos',
    amount: 'US$ 120,00/ano',
  },
  {
    name: 'Conta Apple Developer',
    description:
      'Precisamos pagar uma taxa anual para podermos ter uma conta de desenvolvedor na Apple, e assim poder publicar aplicativos para a Apple Store.',
    amount: 'US$ 100,00/ano',
  },
];

onMounted(() => {
  eventTracker.track(WebEvent.DONATE_VIEW_ENTERED, {
    event_type: 'page_view',
  });
});
</script>

<template>
  <PaperCard class="mt-4">
    <v-row class="justify-center">
      <v-col sm="12" md="12" lg="12" class="justify-center">
        <div class="donation-text">
          <h2 class="donate-title text-primary font-weight-bold">
            Ajude o UFABC Next
          </h2>
          <div class="history-text mt-3 mb-4">
            <p>Que bom que temos você como nosso usuário 🥰🥳</p>
            O Next foi desenvolvido em 2019
            <strong>de alunos para alunos</strong> e desde então é um projeto
            colaborativo 🤝 , onde você
            <a
              href="https://feedback.userreport.com/82aa815c-a1d6-440d-8759-02ccaa78d9fa/#ideas/popular"
              target="_blank"
              rel="noopener noreferrer"
              style="text-decoration: none"
              >pode opinar, dar sugestões</a
            >
            e criar novas funcionalidades, pois é um
            <a
              href="https://github.com/ufabc-next"
              target="_blank"
              rel="noopener noreferrer"
              style="text-decoration: none"
              >projeto open-source.</a
            >
            <br /><br />
            Como nem tudo são flores 🥲, o projeto é mantido pelos seus próprios
            desenvolvedores, que já gastaram mais de 300h desenvolvendo sem ter
            nenhum retorno financeiro 🙃, com apenas o objetivo de ganhar
            conhecimento e colaborar com a comunidade da UFABC.
            <br /><br />
            Em 2020, lançamos uma
            <a
              href="https://www.kickante.com.br/campanhas/ajude-ufabc-next"
              target="_blank"
              rel="noopener noreferrer"
              style="text-decoration: none"
              >campanha de crowdfunding</a
            >
            que foi sucesso (🎉) e arrecadamos R$ 1.650,00 para manter o projeto
            no ar até junho de 2022. Como os custos do projeto são mensais e em
            dólar, precisamos de sua ajuda para continuar com o projeto
            funcionando e ajudando todos os alunos da UFABC a encontrar um
            professor ideal, ter uma perspectiva sobre os chutes, além de
            acompanhar e melhorar sua performance acadêmica 😍. Tudo isso para
            ajudar os alunos da UFABC a se formar (sabemos que é quase uma
            missão impossível, mas com o Next fica mais fácil 🚀).
            <br /><br />
            Abaixo temos os custos detalhados:
          </div>
        </div>

        <v-table class="mb-3 costs-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Custo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in tableData" :key="item.name">
              <td>{{ item.name }}</td>
              <td>{{ item.description }}</td>
              <td>{{ item.amount }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="2" class="summary-text">Total de aproximadamente</td>
              <td class="summary-total">~R$ 1200,00/ano 😬</td>
            </tr>
          </tfoot>
        </v-table>

        <v-btn
          rounded
          variant="outlined"
          class="dialog-open-btn bg-primary"
          size="x-large"
          @click="handleOpenDialog()"
        >
          Quero ajudar!
        </v-btn>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" width="700px" transition="scroll-y-transition">
      <v-card class="dialog-content">
        <div class="dialog-header">
          <v-card-actions class="dialog-close-btn">
            <v-btn
              variant="tonal"
              icon="mdi-window-close"
              aria-label="Fechar"
              @click="handleCloseDialog()"
            />
          </v-card-actions>
        </div>

        <v-card-text
          class="dialog-body"
          :style="{
            display: $vuetify.display.smAndDown ? 'block' : 'flex',
            padding: $vuetify.display.smAndDown ? '0' : '0 40px',
          }"
        >
          <div class="dialog-body-qrcode">
            <img
              src="@/assets/pix.webp"
              style="width: 250px"
              alt="PIX do UFABC Next"
            />
          </div>
          <div
            class="dialog-body-account"
            :style="{
              marginLeft: $vuetify.display.smAndDown ? '10px' : '30px',
            }"
          >
            <p class="dialog-body-account-item">Nome: Gabriel Monteiro Rocha</p>
            <p class="dialog-body-account-item">
              Chave Pix: <br /><strong>ufabcnext@gmail.com</strong>
            </p>
            <a
              href="https://nubank.com.br/pagar/cs8ck/sVTkIdy1Yx"
              target="_blank"
              rel="noopener noreferrer"
              @click="handlePixLinkClick"
              ><p>Clique e contribua!</p></a
            >
          </div>
        </v-card-text>

        <v-card-text class="dialog-footer">
          <div>O NEXT SÓ EXISTE POR PESSOAS COMO VOCÊ 😍</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </PaperCard>
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
  border: none;
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

.costs-table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.costs-table th {
  font-weight: 600;
  text-align: left;
}

.costs-table td,
.costs-table th {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 12px;
}

.summary-row {
  background: rgba(var(--v-theme-surface), 0.5);
  font-weight: 500;
}

.summary-text {
  text-align: center;
  font-weight: bold;
}

.summary-total {
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
