import Vue from 'vue'
import Vuetify from 'vuetify/lib'

export default {
    name: 'Donate',
    created(){
      console.log(this)
    },
    methods: {
        async showModal() {
            await this.$dialog({
              title: 'Informações da conta:',
              html: `
              <img src="./images/pix-fe.png" alt="QRCode Pix" aria-label="QRCode da chave pix">
              <p> Nome: Felipe Oliveira Silva </p>
              <p> Chave Pix: 4e031758-52fb-4c9c-876c-894dcaa6afe9 </p>
              <a href="https://nubank.com.br/pagar/1b0zby/HVkAkLCsHr">
                <p> Clique e contribua!</p>
              </a>
              `,
              buttons: [
                {  name: 'Voltar', class: 'ufabcnext-grey--text'},
                {  name: 'Qqr', class: 'red--text'},
              ]
            })
        }
    }   
}