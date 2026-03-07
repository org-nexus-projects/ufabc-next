<div align="center">

  <h1>UFABC Next</h1>
  
  <p>
    <strong>O portal para estudantes da UFABC consultarem avaliações de professores e disciplinas, planejarem suas grades e acompanharem seu desempenho acadêmico.</strong>
  </p>
  
  <p>
    <a href="https://github.com/ufabc-next/ufabc-next-web/actions"><img src="https://img.shields.io/github/actions/workflow/status/ufabc-next/ufabc-next-web/integration-deploy.yml?branch=main" alt="Build Status"/></a>
    <a href="https://github.com/ufabc-next/ufabc-next-web/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ufabc-next/ufabc-next-web" alt="License: GNU AGPLv3"/></a>
    <img src="https://img.shields.io/badge/Node-^20.19.6-success?logo=nodedotjs" alt="Node Version"/>
    <img src="https://img.shields.io/badge/pnpm-^10.28.0-yellow?logo=pnpm" alt="pnpm"/>
    <img src="https://img.shields.io/badge/Vue-3.x-42b883?logo=vuedotjs" alt="Vue 3"/>
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript"/>
  </p>
</div>

---

O **UFABC Next** é uma plataforma colaborativa feita por alunos e para alunos. Nosso principal objetivo é reunir dados da universidade e oferecer ferramentas que facilitam a vida de quem passa pela UFABC, desde a incerteza durante as matrículas até o acompanhamento histórico do curso.

## ✨ O que você encontra aqui (Features)

- [x] **Avaliações de Professores e Disciplinas**: Confira a opinião de quem já cursou aquela disciplina difícil e escolha a melhor opção para sua matrícula.
- [x] **Gerador de Grade (Calengrade)**: exporte a sua grade no formato `.ics` para o seu app de agenda Google Calendar, Apple Calendar, Notion, etc.
- [x] **Dashboard de Histórico e Desempenho**: Gráficos analíticos mostrando seus CRs e performance global atualizada automaticamente com base no seu histórico.
- [x] **Links para Grupos de WhatsApp**: Encontre os grupos das disciplinas de forma fácil no portal do Next.

---

## 🚀 Como Iniciar (Setup Local)

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (^20.19.x)
- [pnpm](https://pnpm.io/) (^10.28.x)

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/ufabc-next/ufabc-next-web.git
cd ufabc-next-web

# 2. Instale as dependências através do Root (Monorepo)
pnpm install

# 3. Inicie o servidor de desenvolvimento
pnpm dev
```

E pronto!

## 🏗️ Arquitetura do projeto

O projeto é um monorepo que usa **Turborepo** para gerenciar a execução rápida dos scripts e estruturar diferentes escopos da plataforma (Interface Web vs. Serviços Lógicos).

```text
ufabc-next-web/
├── apps/
│   └── container/        # A aplicação principal (SPA Vue 3 com Vite).
└── packages/
    ├── services/         # Funções para realizar Fetch/Mutations na API (Axios).
    ├── types/            # Definições (Interfaces) do TypeScript para toda a plataforma.
    ├── utils/            # Funções utilitárias puras.
    └── eslint-config-custom/ # Regras de linting padronizadas do projeto.
```

## 🛠️ Tech Stack

- **Framework Core**: [Vue 3](https://vuejs.org/) (Composition API) e [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (Tipagem ponta-a-ponta com `packages/types`)
- **Bibliotecas UI/Styling**: [Vuetify 3](https://vuetifyjs.com/) e [Sass](https://sass-lang.com/)
- **Data Fetching & Cache**: [TanStack Query (Vue Query)](https://tanstack.com/query/latest)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Testes**: [Vitest](https://vitest.dev/) e `@testing-library/vue`

---

## 🤝 Como Contribuir

Queremos democratizar e aprimorar esta ferramenta com a sua contribuição, seja através de código, design, escrita de testes ou report de bugs.

Fique à vontade para [abrir uma Issue](https://github.com/ufabc-next/ufabc-next-web/issues/new/choose).

<br />

## Instituto Nexus

O **UFABC Next** é um dos principais projetos desenvolvidos e mantidos pelo **[Instituto Nexus](https://fundacaonexus.com/)**, uma iniciativa criada por e para alunos da UFABC.
O **Instituto Nexus** atua como um ecossistema de inovação que tem como missão resolver as dores e melhorar a vida acadêmica dos estudantes da UFABC através da tecnologia.

<div align="center">
  <p>Feito com ❤️ por alunos da UFABC</p>
</div>
