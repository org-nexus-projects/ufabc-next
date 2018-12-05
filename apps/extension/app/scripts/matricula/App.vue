<template>  
  <div class="ufabc-row filters">
    <div class="mr-3 ufabc-row ufabc-align-center">
      <img :src="getUrl('/images/icon-128.png')" style="width: 32px; height: 32px;" />
    </div>
    <div class="mr-5">
      <div class="title-filter">Câmpus</div>
      <div>
        <el-checkbox 
         v-for='filter in campusFilters' 
         @change="applyFilter(filter)" 
         v-model="filter.val">
          {{ filter.name }}
        </el-checkbox>
      </div>
    </div>
    <i class="mdi mdi-ear"></i>
    <div class="mr-5">
      <div class="title-filter">Turno</div>
      <div>
        <el-checkbox 
         v-for='filter in shiftFilters' 
         @change="applyFilter(filter)" 
         v-model="filter.val">
          {{ filter.name }}
        </el-checkbox>
      </div>
    </div>

    <div class="pr-5">
      <div class="title-filter">Extras</div>
      <div>
        <el-switch  
          class="mr-3 ufabc-element-switch"
          active-text="Disciplinas escolhidas" 
          v-model="selected" 
          @change="changeSelected()"
          ></el-switch>

        <el-switch  
          class="mr-3 ufabc-element-switch"
          active-text="Disciplinas cursadas" 
          v-model="cursadas" 
          @change="changeCursadas()"
          ></el-switch>

        <el-switch  
          class="mr-3 ufabc-element-switch"
          active-text="Professores" 
          v-model="teachers" 
          @change="changeTeachers()"
          ></el-switch>
      </div>
    </div>

    <div class="share ufabc-row align-center">
      <div class="fb-share-button fb_iframe_widget" data-href="https://chrome.google.com/webstore/detail/ufabc-matricula/gphjopenfpnlnffmhhhhdiecgdcopmhk?hl=pt-BR" data-layout="button" data-size="small" data-mobile-iframe="true" fb-xfbml-state="rendered" fb-iframe-plugin-query="app_id=283675788310945&amp;container_width=300&amp;href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Fufabc-matricula%2Fgphjopenfpnlnffmhhhhdiecgdcopmhk%3Fhl%3Dpt-BR&amp;layout=button&amp;locale=pt_BR&amp;mobile_iframe=true&amp;sdk=joey&amp;size=small"><span style="vertical-align: bottom; width: 97px; height: 20px;"><iframe name="f3f6380124e0d68" width="1000px" height="1000px" frameborder="0" allowtransparency="true" allowfullscreen="true" scrolling="no" allow="encrypted-media" title="fb:share_button Facebook Social Plugin" src="https://www.facebook.com/v2.10/plugins/share_button.php?app_id=283675788310945&amp;channel=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2FafATJJjxKE6.js%3Fversion%3D43%23cb%3Df9fea2ad7fa08c%26domain%3Dufabc-matricula-test.cdd.naoseiprogramar.com.br%26origin%3Dhttps%253A%252F%252Fufabc-matricula-test.cdd.naoseiprogramar.com.br%252Ff1f7e9e9fbd3a%26relation%3Dparent.parent&amp;container_width=300&amp;href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Fufabc-matricula%2Fgphjopenfpnlnffmhhhhdiecgdcopmhk%3Fhl%3Dpt-BR&amp;layout=button&amp;locale=pt_BR&amp;mobile_iframe=true&amp;sdk=joey&amp;size=small" style="border: none; visibility: visible; width: 97px; height: 20px;" class=""></iframe></span></div>
    </div>
  </div>
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

        shiftFilters: [{
          name: 'Noturno',
          class: 'notNoturno',
          val: true,
          comparator: 'matutino',
        }, {
          name: 'Matutino',
          class: 'notMatutino',
          val: true,
          comparator: 'noturno',
        }],

        campusFilters: [{
          name: 'São Bernardo',
          class: 'notBernardo',
          val: true,
          comparator: 'andr', //isso está correto
        },{
          name: 'Santo André',
          class: 'notAndre',
          val: true,
          comparator: 'bernardo',
        }],
      }
    },
    created() {
      // $('#sessao').remove()
      // window.tempo = Infinity

      // setTimeout(() => {
      //   this.$notify({
      //     title: 'UHU!',
      //     message: 'Retiramos o timer para você fazer a sua matrícula com tranquilidade 😉',
      //     type: 'success',
      //     duration: 8000,
      //   });
      // }, 5000)
      this.teachers = true
      this.changeTeachers()
    },

    methods: {
      getUrl(path) {
        return Utils.getChromeUrl(path)
      },

      applyFilter(params) {
        // if(this.shiftFilters.every(f => f.val == false) || this.campusFilters.every(f => f.val == false)) return

        if (!params.val) {
          $("#tabeladisciplinas tr td:nth-child(3)").each(function(){
            var campus = $(this).text().toLowerCase()
            if(campus.indexOf(params.comparator) == -1) {
              $(this).parent().addClass(params.class)
            }
          })
          return
        }

        $("#tabeladisciplinas tr").each(function(){
          $(this).removeClass(params.class)
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

        const storageUser = 'ufabc-extension-' + MatriculaHelper.currentUser()
        Utils.storage.getItem(storageUser).then(cursadas => {
          if(cursadas == null) {
            self.$notify({
              message: 'Não temos as diciplinas que você cursou, acesse o Portal do Aluno'
            })
            return
          }

          // se nao tiver nada precisa mandar ele cadastrar
          var todas_cursadas = _(cursadas[0].cursadas)
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

        // chrome.runtime.sendMessage(Utils.EXTENSION_ID, {
        //   method: 'storage', 
        //   key: 
        // }, function(item) {
        //   if (item == null) {
        //     self.$notify({
        //       message: 'Não temos as diciplinas que você cursou, acesse o Portal do Aluno'
        //     })
        //     return
        //   }
          
        // })
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

        Utils.storage.getItem('ufabc-extension-disciplinas').then(async item => {
          if (item == null) {
            item = await MatriculaHelper.getProfessors()
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
<style scoped>
* {
  font-family: Ubuntu;
}
.filters { 
  position: sticky;
  top: 0px;
  background: #fff;
  min-height: 56px;
  padding-left: 24px;
  padding-top: 6px;
  z-index: 1;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  padding-bottom: 12px;
}

.title-filter {
  font-size: 14px; 
  margin-bottom: 2px;
  color: rgba(0,0,0,0.9);
}

.share {
  height: 100%;
  position: absolute;
  top: 0px;
  right: 22px;
}
</style>