<img src="https://github.com/ufabc-next/ufabc-next-web/blob/master/public/assets/images/cover.jpg" />

O UFABC Next é uma plataforma criada por alunos da UFABC para melhorar o planejamento da graduação. Esse repositório está o código do web-app que roda no site.

<img src="https://github.com/ufabc-next/ufabc-next-web/blob/master/public/assets/images/reviews.png" />

## O que é UFABC Next
Um sistema que permite ver desempenho da graduação e criar um planejamento feito com
[Vue.js](https://vuejs.org/), [Node.JS](https://nodejs.org), [Extensão Chrome/JS](https://developer.chrome.com/extensions) e [MongoDB](https://www.mongodb.com/).

Foi criado com uma interface fácil para você:
* Visualizar histórico do CR (performance)
* Avaliar professores
* Visualizar gráfico do seu CR em comparação aos outros
* Simular o sistema de chutes em disciplinas
* Ver distribuição de conceitos de uma professor

## Pre-requisitos
Você precisa rodar o [ufabc-next-server](https://github.com/ufabc-next/ufabc-next-server) para ter um ambiente de testes completo:

1. Clone o repositório [ufabc-next-server](https://github.com/ufabc-next/ufabc-next-server)
2. Entre na pasta `ufabc-next-server/app` e rode `yarn install`
3. Instale o [Docker](https://www.docker.com/)
4. Execute o comando `docker-compose up -d`
5. Para subir o server, por fim, execute o comando `yarn start:watch`

## Executando o UFABC Next Web
1. Clone este repositório
2. Entre na pasta `ufabc-next-web/web` e rode `yarn install`
3. Depois rode o comando `yarn start`

## Buildando o UFABC Next App (Android)
1. Entre na pasta `ufabc-next-web/web/` e rode `yarn install`
2. Entre na pasta `ufabc-next-web/web/src-cordova` e rode `yarn install`
3. Crie uma pasta vazia chamada `www` dentro da pasta `ufabc-next-web/web/src-cordova`
4. Execute o comando `yarn cordova platform add android`
5. Volte para a pasta `ufabc-next-web/web` e depois execute o comando `yarn cordova-build-android` (para compilar o aplicativo)
6. Por fim, entre na pasta `src-cordova` e execute `yarn cordova run android` (para executar no emulador ou no seu dispositivo Android)