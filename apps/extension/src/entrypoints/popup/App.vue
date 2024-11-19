<script lang="ts" setup>
import { Loader2 } from 'lucide-vue-next'
import { useStorage } from '@/composables/useStorage'
import { useDateFormat } from '@vueuse/core'
import type { Student } from '@/scripts/sig/homepage'

const { state: student, isLoading: loading, error } = useStorage<Student>('sync:student');

const formattedDate = useDateFormat(student.value?.lastUpdate, 'DD/MM/YYYY HH:mm', { locales: 'pt-BR' })
console.log(student.value)
</script>

<template>
  <div class="w-64 p-4">
    <img src="/logo.svg" class="h-8 w-36" alt="next logo" />

    <main class="mt-4 text-sm">
      <div class="flex items-center justify-center h-[4.4rem]" v-if="loading">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span class="ml-2">Carregando informações...</span>
      </div>

      <div v-else-if="error">
        Aconteceu um erro ao carregar suas informações. 😬
        <br /><br />
        Caso o error persistir, entre em contato conosco pelo <a href='https://instagram.com/ufabc_next' target='_blank'>Instagram</a>
      </div>

      <div v-else-if="student">
        <p class="mb-2">Esses são seus dados</p>
        <section class="mb-2 border border-solid border-b-gray-400 rounded p-1.5">
          <div class="flex mb-2">
            <h3 class="font-bold flex-auto">{{ student.login }}</h3>
            <span class="flex-none text-right text-sm">{{ student.ra }}</span>
          </div>
          <template v-if="student.graduations?.length">
            <div class="mb-2 border border-solid border-[#efefef] rounded p-1.5" v-for="graduation in student.graduations">
              <div class="text-sm mb-1">
                {{ graduation.course }}<br />
                <b>{{ graduation.shift }}</b>
              </div>
              <div class="flex">
                <span class="flex-1 text-sm text-left text-[#c78d00]">CP: {{ 1 }}</span>
                <span class="flex-1 text-sm text-center text-[#05C218]">CR: {{ 1 }}</span>
                <span class="flex-1 text-sm text-right text-[#2E7EED]">CA: {{ 1 }}</span>
              </div>
            </div>
          </template>
          <p class="flex-none text-sm">Última atualização: {{ formattedDate }}</p>
        </section>

        <div class="flex items-center justify-center mb-3">
          <a href='https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf' target='_blank'>Atualizar dados agora</a>
        </div>
      </div>

      <template v-else>
        <p class="mb-1.5 text-xs">Seja bem-vindo à extensão do UFABC next.</p>
        <p class="mb-1.5 text-xs">Parece que nós não temos suas informações,
          <a
          href='https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf'
          target='_blank'
          class="underline text-xs decoration-sky-500"
          >vamos carregá-las?</a>
        </p>
      </template>

      <div class="text-center underline text-[11px] font-normal decoration-sky-500">
        <a href='https://bit.ly/extensao-problemas' target='_blank'>Está com problemas com a extensão? <br />Clique aqui</a>
      </div>
    </main>
  </div>
</template>
