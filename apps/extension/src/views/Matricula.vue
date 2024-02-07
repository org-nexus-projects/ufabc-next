<template>
  <div class="ufabc-row filters">
    <div class="mr-3 ufabc-row ufabc-align-center">
      <img
        :src="getUrl('/images/icon-128.png')"
        style="width: 32px; height: 32px"
      />
    </div>
    <div class="mr-5">
      <div class="title-filter">Câmpus</div>
      <div>
        <el-checkbox
          v-for="(filter, index) in campusFilters"
          :key="index"
          @change="applyFilter(filter)"
          v-model="filter.val"
        >
          {{ filter.name }}
        </el-checkbox>
      </div>
    </div>
    <i class="mdi mdi-ear"></i>
    <div class="mr-5">
      <div class="title-filter">Turno</div>
      <div>
        <el-checkbox
          v-for="(filter, index) in shiftFilters"
          :key="index"
          @change="applyFilter(filter)"
          v-model="filter.val"
        >
          {{ filter.name }}
        </el-checkbox>
      </div>
    </div>

    <div class="pr-5">
      <div class="title-filter">Filtros</div>
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

        <el-popover
          v-if="showWarning"
          placement="bottom"
          title="Atenção"
          width="450"
          trigger="hover"
        >
          <div class="warning-advice">
            Faz mais de uma semana que você não sincroniza seus dados.<br />
            Isso pode acabar afetando a ordem dos chutes. <br /><Br />
            <a
              href="https://aluno.ufabc.edu.br/fichas_individuais"
              target="_blank"
            >
              Atualizar dados agora
            </a>
          </div>
          <el-button
            v-if="showWarning"
            slot="reference"
            type="danger"
            icon="el-icon-warning"
            class="ml-3"
            circle
          ></el-button>
        </el-popover>

        <!--         <el-switch
          class="mr-3 ufabc-element-switch"
          active-text="Professores"
          v-model="teachers"
          @change="changeTeachers()"
          ></el-switch> -->
      </div>
    </div>
  </div>
</template>
<script>
import $ from "jquery";
import matriculaUtils from "../utils/Matricula";
import Utils from "../scripts/helpers/utils";
import Mustache from "mustache";
// await MatriculaHelper.getTotalMatriculas()

export default {
  name: "App",
  data() {
    return {
      showWarning: false,
      selected: false,
      cursadas: false,
      teachers: false,

      shiftFilters: [
        {
          name: "Noturno",
          class: "notNoturno",
          val: true,
          comparator: "matutino",
        },
        {
          name: "Matutino",
          class: "notMatutino",
          val: true,
          comparator: "noturno",
        },
      ],

      campusFilters: [
        {
          name: "São Bernardo",
          class: "notBernardo",
          val: true,
          comparator: "andr", //isso está correto
        },
        {
          name: "Santo André",
          class: "notAndre",
          val: true,
          comparator: "bernardo",
        },
      ],
    };
  },
  async created() {
    const students = await Utils.storage.getItem("ufabc-extension-students");
    const currentUser = matriculaUtils.currentUser();

    const currentStudent = students.find(
      (student) => student.name == currentUser
    );
    if (currentStudent && currentStudent.lastUpdate) {
      const diff = Date.now() - currentStudent.lastUpdate;
      const MAX_UPDATE_DIFF = 1000 * 60 * 60 * 24 * 7; // 7 days
      if (diff > MAX_UPDATE_DIFF) {
        this.showWarning = true;
      }
    }

    this.teachers = true;
    this.changeTeachers();
  },

  methods: {
    getUrl(path) {
      return Utils.getChromeUrl(path);
    },

    applyFilter(params) {
      // if(this.shiftFilters.every(f => f.val == false) || this.campusFilters.every(f => f.val == false)) return

      if (!params.val) {
        $("#tabeladisciplinas tr td:nth-child(3)").each(function () {
          var campus = $(this).text().toLowerCase();
          if (campus.indexOf(params.comparator) == -1) {
            $(this).parent().addClass(params.class);
          }
        });
        return;
      }

      $("#tabeladisciplinas tr").each(function () {
        $(this).removeClass(params.class);
      });
    },
    changeSelected() {
      if (!this.selected) {
        $(".notSelecionada").css("display", "");
        return;
      }

      const aluno_id = matriculaUtils.getAlunoId();
      const matriculas = window.matriculas[aluno_id] || [];

      $("tr").each(function () {
        const disciplina_id = $(this).attr("value");
        if (disciplina_id && !matriculas.includes(disciplina_id.toString())) {
          $(this).addClass("notSelecionada");
          $(this).css("display", "none");
        }
      });
    },
    changeCursadas() {
      let self = this;
      if (!this.cursadas) {
        $(".isCursada").css("display", "");
        return;
      }

      const storageUser = "ufabc-extension-" + matriculaUtils.currentUser();
      Utils.storage.getItem(storageUser).then((cursadas) => {
        if (cursadas == null) {
          self.$notify({
            message:
              "Não temos as diciplinas que você cursou, acesse o Portal do Aluno",
          });
          return;
        }

        // se nao tiver nada precisa mandar ele cadastrar
        var todas_cursadas = _(cursadas[0].cursadas)
          .filter((d) => ["A", "B", "C", "D", "E"].includes(d.conceito))
          .map("disciplina")
          .value();

        $("table tr td:nth-child(3)").each(function () {
          var el = $(this);
          // tira apenas o nome da disciplina -> remove turma, turno e campus
          var disciplina = el.text().split("-")[0];
          disciplina = disciplina.substring(0, disciplina.lastIndexOf(" "));
          // verifica se ja foi cursada
          if (todas_cursadas.includes(disciplina)) {
            el.parent().addClass("isCursada");
            el.parent().css("display", "none");
          }
        });
      });

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
      let self = this;
      if (!this.teachers) {
        $(".isTeacherReview").css("display", "none");
        return;
      }

      // se ja tiver calculado nao refaz o trabalho
      if ($(".isTeacherReview").length > 0) {
        $(".isTeacherReview").css("display", "");
        return;
      }

      Utils.storage
        .getItem("ufabc-extension-disciplinas")
        .then(async (item) => {
          if (item == null) {
            item = await matriculaUtils.getProfessors();
          }

          const disciplinaMap = new Map([
            ...item.map((d) => [d.disciplina_id.toString(), d]),
          ]);
          const htmlPop = await Utils.fetchChromeUrl(
            "pages/matricula/fragments/professorPopover.html"
          );
          const corteHtml = await Utils.fetchChromeUrl(
            "pages/matricula/corte.html"
          );

          $("table tr").each(function () {
            var el = $(this).find("td:nth-child(3)");
            var subjectEl = $(this).find("td:nth-child(3) > span");
            var corteEl = $(this).find("td:nth-child(5)");
            var disciplinaId = el.parent().attr("value");

            const disciplinaInfo = disciplinaMap.get(disciplinaId);
            if (!disciplinaInfo) return;

            // Add subject id to span with subject
            if (disciplinaInfo.subject) {
              subjectEl.attr("subjectId", disciplinaInfo.subject);
            }

            const data = { disciplina: disciplinaInfo };

            el.append(Mustache.render(htmlPop.data, data));
            corteEl.append(corteHtml.data);
          });
        });
    },
  },
};
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 12px;
}

.title-filter {
  font-size: 14px;
  margin-bottom: 2px;
  color: rgba(0, 0, 0, 0.9);
}
.warning-advice > a {
  color: rgb(0, 0, 238);
}
</style>
