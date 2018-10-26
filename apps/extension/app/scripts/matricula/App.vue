<template>
  <v-container fluid px-0>
      <div v-for="f in customFilters">
        <v-switch
          :label="f.name"
          v-model="f.val"
          @change="filter(f)"
        ></v-switch>
      </div>

      <v-switch
        label='Mostra materias selecionadas'
        v-model='selected'
        @change="changeSelected()"
      >
      </v-switch>

      <v-switch
        label='Remove disciplinas cursadas'
        v-model='cursadas'
        @change="changeCursadas()"
      >
      </v-switch>

      <v-switch
        label='Carregar professores'
        v-model='teachers'
        @change="changeTeachers()"
      >
      </v-switch>
    </v-container>
</template>
<script>
  import $ from 'jquery'
  import MatriculaHelper from '../helpers/matricula'
  import Utils from '../helpers/utils'
  import Mustache from 'mustache'
  // await MatriculaHelper.getTotalMatriculas() 

  export default {
    name: 'App',
    data () {
      return {
        selected: false,
        cursadas: false,
        teachers: false,
        customFilters: [{
          name: 'Noturno',
          class: 'notNoturno',
          val: false,
          comparator: 'matutino',
        }, {
          name: 'Matutino',
          class: 'notMatutino',
          val: false,
          comparator: 'noturno',
        }, {
          name: 'São Bernardo',
          class: 'notBernardo',
          val: false,
          comparator: 'andr',
        },{
          name: 'Santo André',
          class: 'notAndre',
          val: false,
          comparator: 'bernardo',
        }],
      }
    },
    created() {
      this.teachers = true
      this.changeTeachers()
    },

    methods: {
      filter(params) {
        if (!params.val) {
          $("#tabeladisciplinas tr").each(function(){
            $(this).removeClass(params.class)
          })
          return
        }

        $("#tabeladisciplinas tr td:nth-child(3)").each(function(){
          var campus = $(this).text().toLowerCase()
          if(campus.indexOf(params.comparator) != -1) {
            $(this).parent().addClass(params.class)
          }
        })
      },
      changeSelected() {
        if (!this.selected) {
          $(".notSelecionada").css('display', '')
          return
        }

        const aluno_id = MatriculaHelper.getAlunoId()
        const matriculas = window.matriculas[aluno_id] || []

        $('tr').each(function () {
          const disciplina_id = $(this).attr('value')
          if(disciplina_id && !matriculas.includes(disciplina_id.toString())) {
            $(this).addClass("notSelecionada")
            $(this).css('display', 'none')
          }
        })
      },
      changeCursadas() {
        let self = this
        if(!this.cursadas) {
          $(".isCursada").css('display', '')
          return
        }

        chrome.runtime.sendMessage(Utils.EXTENSION_ID, {
          method: 'storage', 
          key: MatriculaHelper.currentUser()
        }, function(item) {
          if (item == null) {
            self.$notify({
              message: 'Não temos as diciplinas que você cursou...'
            })
            return
          }
          // se nao tiver nada precisa mandar ele cadastrar
          var todas_cursadas = _(item[0].cursadas)
            .filter(d => ['A', 'B', 'C', 'D', 'E'].includes(d.conceito))
            .map('disciplina')
            .value()

          $("table tr td:nth-child(3)").each(function () {
            var el = $(this)
            // tira apenas o nome da disciplina -> remove turma, turno e campus
            var disciplina = el.text().split("-")[0]
            disciplina = disciplina.substring(0, disciplina.lastIndexOf(" "))
            // verifica se ja foi cursada
            if (todas_cursadas.includes(disciplina)) {
              el.parent().addClass("isCursada")
              el.parent().css('display', 'none')
            }
          })
        })
      },
      changeTeachers() {
        let self = this
        if(!this.teachers) {
          $(".isHelp").css('display', 'none')
          return
        }

        // se ja tiver calculado nao refaz o trabalho
        if ($(".isHelp").length > 0) {
          $(".isHelp").css('display', '');
          return;
        }

        chrome.runtime.sendMessage(Utils.EXTENSION_ID, {
          method: 'storage', 
          key: 'ufabc-extension-disciplinas'
        }, async function(item) {
          if (item == null) {
            return
          }
          
          const disciplinaMap = new Map([...item.map(d => [d.disciplina_id.toString(), d])])
          const htmlPop = await Utils.fetchChromeUrl('pages/matricula/fragments/professorPopover.html')
          const corteHtml = await Utils.fetchChromeUrl('pages/matricula/corte.html')

          $("table tr").each(function () {
            var el = $(this).find('td:nth-child(3)')
            var corteEl = $(this).find('td:nth-child(5)')

            var disciplinaId = el.parent().attr('value')
            
            const disciplinaInfo = disciplinaMap.get(disciplinaId)
            if(!disciplinaInfo) return

            const data = { disciplina: disciplinaInfo }

            el.append(Mustache.render(htmlPop.data, data))
            corteEl.append(corteHtml.data)
          })
        })
      }
    }
  }
</script>
<style></style>