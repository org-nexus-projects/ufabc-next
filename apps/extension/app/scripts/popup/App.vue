<template>
  <div class="ufabc-next-popup">
    <img src="./logo.svg" width="150" height="33" />

    <div class="intro">

      <div class="loading" v-if="loading">
        <v-progress-circular
          :size="32"
          :width="4"
          color="primary"
          indeterminate
        ></v-progress-circular>
        <div class="loading-text">
          <span>Carregando informações...</span>
        </div>
      </div>

      <div class="error" v-else-if="error">
        Aconteceu um erro ao carregar suas informações. 😬
        <br /><br />
        Caso o error persistir, entre em contato conosco pelo <a href='https://facebook.com/ufabcnext' target='_blank'>Facebook</a>

        <div class="retry-button">
          <v-btn color="#2E7EED" dark @click="fetch()">Recarregar</v-btn>
        </div>
      </div>

      <div v-else-if="students && students.length">
        <div class="intro-student">
          Você tem salvo os seguintes dados:
        </div>
        <div class="student" v-for="student in students" :key="student.name">
          <div class="student-top">
            <div class="student-name">{{ student.name }}</div>
            <div class="student-ra">{{ student.ra }}</div>
          </div>
          <template v-if="student.cursos && student.cursos.length">
            <div class="student-curso" v-for="curso in student.cursos">
              <div class="student-curso-name">
                {{ curso.curso }}<br />
                <b>{{ curso.turno }}</b>
              </div>
              <div class="student-coeficients">
                <span class="cp">CP: {{ curso.cp }}</span>
                <span class="cr">CR: {{ curso.cr }}</span>
                <span class="ca">CA: {{ curso.ca }}</span>
              </div>
            </div>
          </template>
          <div class="student-last-update">Última atualização: {{ formatDate(student.lastUpdate) }}</div>
        </div>

        <div class="student-update">
          <a href='https://aluno.ufabc.edu.br/fichas_individuais' target='_blank'>Atualizar dados agora</a>
        </div>
      </div>

      <template v-else>
        <p>Seja bem-vindo à extensão do UFABC Next.</p>
        <p>Parece que nós não temos suas informações, <a href='https://aluno.ufabc.edu.br/' target='_blank'>vamos carregá-las?</a></p>
      </template>

      <div class="extension-troubleshooting">
        <a href='https://bit.ly/extensao-problemas' target='_blank'>Está com problemas com a extensão? <br />Clique aqui</a>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from 'vue'
import Vuetify from 'vuetify'
Vue.use(Vuetify)

import Utils from '../helpers/utils'
import setupStorage from '../helpers/setupStorage'

setupStorage()

  export default {
    name: 'App',

    data() {
      return {
        students: null,
        loading: false,
        error: false,
      }
    },

    created() {
      this.loading = true
      setTimeout(() => this.fetch(), 2000)
    },

    methods: {
      async fetch() {
        this.loading = true
        this.error = false

        try {
          this.students = await Utils.storage.getItem('ufabc-extension-students')
          this.error = false
        } catch(err) {
          this.error = true
        }
        this.loading = false
      },

      formatDate(date) {
        if(!date) return

        let d = new Date(date)
        const day = (d.getDate() < 10 ? '0' : '') + d.getDate()
        const month = (d.getMonth() < 10 ? '0' : '') + (d.getMonth() + 1)
        const year = d.getFullYear()
        const hour = (d.getHours() < 10 ? '0' : '') + d.getHours()
        const minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
        return day + '/' + month + '/' + year + ' ' + hour + ':' + minutes
      }
    }
  }
</script>
<style scoped>
.ufabc-next-popup {
  padding: 16px;
  width: 250px;
}
.intro {
  margin-top: 16px;
  font-size: 12px;
}
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70px;
}
.loading-text {
  margin-left: 8px;
}
.error {
  color: #F00;
}
.retry-button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}
.intro-student {
  margin-bottom: 8px;
}
.student {
  margin-bottom: 8px;
  border: 1px solid #939393;
  border-radius: 4px;
  padding: 6px;
}
.student-top {
  display: flex;
  margin-bottom: 6px;
}
.student-name {
  font-weight: bold;
  flex: 1 1 auto;
}
.student-ra {
  flex: none;
  text-align: right;
  font-size: 11px;
}
.student-curso {
  margin-bottom: 8px;
  border: 1px solid #efefef;
  border-radius: 4px;
  padding: 6px;
}
.student-curso-name {
  font-size: 10px;
  margin-bottom: 4px;
}
.student-coeficients {
  display: flex;
}
.student-coeficients > span {
  flex: 1 1 auto;
  font-size: 11px;
}
.student-last-update {
  flex: none;
  font-size: 10px;
}
.student-update {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.cp {
  text-align: left;
  color: #c78d00;
}
.cr {
  text-align: center;
  color: #05C218;
}
.ca {
  text-align: right;
  color: #2E7EED;
}
.extension-troubleshooting {
  text-align: center;
}
</style>