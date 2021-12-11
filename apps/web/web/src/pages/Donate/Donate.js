export default {
    name: 'Donate',
    methods: {
        async teste() {
            await this.$dialog({
              title: 'teste',
              html: `teste do dinheiro`,
              buttons: [
                {  name: 'botao 1', class: 'red--text'},
                {  name: 'botao 2', action: true, class: 'green--text'}
              ]
            })
        }
    }   
}