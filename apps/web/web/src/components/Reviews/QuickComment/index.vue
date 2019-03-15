<template>
  <v-container grid-list-lg text-xs-center>
    <transition-group tag="div" key="index" name="slide-y-transition" class="layout" style="width: 100%; flex-wrap: wrap;">
      <v-flex md6 align-center v-for='(subject, index) in subjects' :key="subject.codigo">
        <div class="subject elevate-3d elevate-3">
          <div class="subject-name">
            <span>{{ subject.disciplina }}</span>
            <v-btn @click="close(index)" icon style="margin: 0px; width: 22px; height: 22px;">
              <v-icon size="18" color="white">mdi-close</v-icon>
            </v-btn>
          </div>
          <div style="display:flex; height: calc(100% - 26px);">
            <div 
              class="concept-comment" 
              :style="{'color': conceptsColor[subject.conceito || 'null']}">
              <div class="concept-circle elevation-3">{{ subject.conceito }}</div>
            </div>

            <div class="teachers mr-3">
              <div class="teacher teacher-teoria mb-2">
                <span class="mr-2">
                  Juliana Kelmy Macario De Faria Daguano
                </span>
                <el-button @click="comment()" class="pa-0" type="text">
                  <div style="display: flex; align-items: center;">
                    <v-icon class="mr-2" size="18" color="ufabcnext-grey">mdi-message-draw</v-icon>
                    COMENTAR
                  </div>
                </el-button>
              </div>

              <div class="teacher teacher-pratica">
                <span class="mr-2">
                  Antonio Sérgio Munhoz
                </span>
                <el-button   @click="comment()" class="pa-0" type="text">
                  <div style="display: flex; align-items: center;">
                    <v-icon class="mr-2" size="18" color="ufabcnext-green">mdi-message-draw</v-icon>
                    COMENTAR
                  </div>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </v-flex>
    </transition-group>
  </v-container>
</template>

<script type="text/javascript">
import History from '@/services/History'
import ErrorMessage from '@/helpers/ErrorMessage'
import Vue from 'vue'
import CommentEditor from '@/components/Reviews/CommentEditor'

export default {
  name: 'ReviewQuickComment',

  data() {
    return {
      subjects: null,
      loading: false,
      conceptsColor: {
        'A': 'rgb(63, 207, 140)',
        'B': 'rgb(184, 233, 134)',
        'C': 'rgb(248, 183, 76)',
        'D': 'rgb(255, 160, 4)',
        'F': 'rgb(249, 84, 105)',
        'O': 'rgb(169, 169, 169)',

        // exceptions
        'I': 'rgb(25, 118, 210)',
        'E': 'rgb(25, 118, 210)',
        'null': 'rgb(0, 0, 0)',
      }
    }
  },

  created() {
    this.fetch()
  },

  methods:{
    close(index) {
      if(this.subjects[index]) {
        this.subjects.splice(index, 1)
      }
    },

    async fetch() {
      this.loading = true

      try {
        let res = await History.get()

        this.loading = false
        if(res.data){
          let history = res.data

          history.disciplinas.map((h) => {
            h.quad = h.ano + ':' + h.periodo
            return h
          })
          let seasons = _.groupBy(history.disciplinas, 'quad')
          let seasonsKeys = _.keys(seasons)
          if(!seasonsKeys.length) return

          // Get last season filtering by reviewed
          this.subjects = seasons[seasonsKeys[seasonsKeys.length - 5]]//.filter(c => c.reviewed)
        }
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    async comment() {
      let dialog = this.$dialog({
        width: '750px',
        top: '10vh',
      }, CommentEditor)

      try {
        let res = await dialog

      } catch(e) {} 
    }
  }

}
</script>

<style scoped>
.subject {
  background-color: #fff; 
  border-radius: 4px; 
  overflow: hidden; 
  height: 92px;
}
.subject-name {
  font-size: 16px;
  height: 26px;
  display: flex;
  align-items: center;
  background: #56cdb7;
  color: #fff;
  padding-left: 12px;
  padding-right: 12px;
}
.subject-name > span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  height: 26px;
  text-align: left;
  flex: 1 1 auto;
}
.concept-comment {
  font-family: Lato;
  font-size: 28px;
  font-weight: bold;
  font-style: normal;
  font-stretch: normal;
  line-height: 2;
  letter-spacing: normal;
  text-align: center;
  margin-left: 12px;
  margin-right: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
}
.concept-circle {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.teachers {
  flex: 1 1 auto;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}
.teacher {
  display: flex; 
  align-items: center;
}
.teacher > span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  height: 22px;
  line-height: 22px;
  text-align: left;
  flex: 1 1 auto;
}


</style>