export default {
  name: "Donate",
  data() {
    return {
      dialog: false,
      tableData: [
        {
          name: 'Domínio ufabcnext.com',
          description: 'É o nome da nossa URL. Os domínios servem para identificar, de forma amigável, os endereços das aplicações pela internet.',
          amount: 'R$ 70,00/ano'
        },
        {
          name: 'Servidor (Digital Ocean)',
          description: 'Para a plataforma poder estar no ar, precisamos hospedar toda a interface e sua infraestrutura, assim como a sua API. Para isso, usamos um servidor na cloud DigitalOcean, o que também nos gera custos',
          amount: 'US$ 120,00/ano'
        },
        {
          name: 'Conta Apple Developer',
          description: 'Precisamos pagar uma taxa anual para podermos ter uma conta de desenvolvedor na Apple, e assim poder publicar aplicativos para a Apple Store.',
          amount: 'US$ 100,00/ano'
        },
      ]
    };
  },
};
