# Contribuindo com o UFABC Next Web

Queremos garantir que o projeto continue a viver e crescer. Assim, gostariamos de incentivar a todos para que ajudem e deem suporte através de contribuições.

## Contribuições de código

O código deve ser feito em inglês.

#### 🚧Em construção🚧

---

### Commit

Os commits devem seguir os padrões especificados pelo [conventinal commits](https://www.conventionalcommits.org/en/v1.0.0/) e devem ser feitos preferencialmente em inglês.|

Dessa forma, o commit segue a seguinte estrutura:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Exemplos:

```
fix: broken home button
```

```
feat(login): create new authentication flow

Introduce OAuth 2.0 password grant type to our login.
Build a new login page for the new login type.

Co-authored-by: Renan Zago Lorijola <renanzago@gmail.com>
```

## Estilo de código

Por favor, siga o estilo de código do projeto. O projeto utiliza eslint e prettier. Se possível, habilite seus plugins em seu editor para receber feedback em tempo real. O lint pode ser realizado manualmente usando o segundo comando:

```
yarn lint
```

## Testes unitários

Para executar os testes unitários, basta executar:

```
yarn test
```

Os testes unitários das funções são realizadas utilizando o [Jest.js](https://jestjs.io/pt-BR/docs/29.3/getting-started).

Os testes de UI, em conjunto com simulações de ações do usuário, utilizam do Jest.js e [Vue Testing Library](https://testing-library.com/docs/vue-testing-library/intro).

É necessário atingir uma cobertura de pelo menos 80% em todos os arquivos de código desenvolvido. Caso algum arquivo que não é de código esteja abaixando a cobertura, adicone o mesmo dentro da configuração de `coveragePathIgnorePatterns` no arquivo `jest.config.js`

## Licença

Ao contribuir com seu código para o repositório do UFABC Next Web no GitHub, você concorda em licenciar sua contribuição sob a licença AGPL-3.0.
