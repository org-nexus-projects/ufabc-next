<template>
  <div>
    <v-container grid-list-lg text-xs-center v-if='enrollments && enrollments.length'>
      <div class="title mb-2 mt-4" style="text-align: left;">Minhas matérias para avaliar</div>
      <transition-group tag="div" key="index" name="slide-y-transition" class="layout" style="width: 100%; flex-wrap: wrap;">
        <v-flex md6 align-center v-for='(subject, index) in enrollments' :key="subject._id">
          <div class="subject elevate-3d elevate-3">
            <div class="subject-name">
              <span>{{ subject.disciplina }}</span>
<!--               <v-btn @click="close(index)" icon style="margin: 0px; width: 22px; height: 22px;">
                <v-icon size="18" style="color: rgba(0,0,0,0.2);">mdi-close</v-icon>
              </v-btn> -->
            </div>
            <div style="align-items: center; display:flex; height: calc(100% - 26px);">
              <div 
                class="concept-comment" 
                :style="{'backgroundColor': conceptsColor[subject.conceito || 'null']}">
                  {{ subject.conceito }}
              </div>

              <div class="teachers mr-3">
                <div class="teacher teacher-teoria mb-2" v-if='subject.teoria && subject.teoria.name'>
                  <span class="mr-2">
                    {{ subject.teoria.name }} <el-tag class="ml-2" color="primary" size="mini">Teoria</el-tag> <el-tag class="ml-2" color="primary" size="mini" v-if='sameBothProfessor'>Prática</el-tag>
                  </span>
                  <el-button @click="comment()" class="pa-0" type="text" style="width: 85px;">
                    <div style="display: flex; align-items: center;">
                      <v-icon class="mr-2" size="18" color="ufabcnext-grey">mdi-plus-circle-outline</v-icon>
                      AVALIAR
                    </div>
                  </el-button>
                </div>

                <div class="teacher teacher-pratica" v-if='subject.pratica && subject.pratica.name && !sameBothProfessor'>
                  <span class="mr-2">
                    {{ subject.pratica.name }} <el-tag class="ml-2" size="mini">Prática</el-tag>
                  </span>
                  <el-button @click="comment()" class="pa-0" type="text" style="width: 85px;">
                    <div style="display: flex; align-items: center;">
                      <v-icon class="mr-2" size="18" color="ufabcnext-green">mdi-checkbox-marked-circle</v-icon>
                      VER
                    </div>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </v-flex>
      </transition-group>
    </v-container>
  </div>
</template>

<script type="text/javascript">
import Enrollment from '@/services/Enrollment'
import ErrorMessage from '@/helpers/ErrorMessage'
import Vue from 'vue'
import CommentEditor from '@/components/Reviews/CommentEditor'

export default {
  name: 'ReviewQuickComment',

  data() {
    return {
      enrollments: null,
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
    sameBothProfessor(teoria, pratica) {
      return teoria._id == pratica._id
    },

    close(index) {
      if(this.enrollments[index]) {
        this.enrollments.splice(index, 1)
      }
    },

    async fetch() {
      this.loading = true

      try {
        let res = await Enrollment.list()

        this.loading = false
        if(res.data){
          let history = res.data

          history.map((h) => {
            h.quad = h.year + ':' + h.quad
            return h
          })
          let seasons = _.groupBy(history, 'quad')
          let seasonsKeys = _.keys(seasons)
          if(!seasonsKeys.length) return

          // Get last season filtering by reviewed
          this.enrollments = seasons[seasonsKeys[seasonsKeys.length - 1]]//.filter(c => c.reviewed)
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
  font-size: 14px;
  height: 26px;
  display: flex;
  align-items: center;
  background: #e8e8e8;
  color: rgba(0,0,0,0.8);
  padding-left: 12px;
  padding-right: 12px;
}
.subject-name > span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  height: 22px;
  text-align: left;
  flex: 1 1 auto;
}
.concept-comment {
  font-size: 26px;
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
  width: 52px;
  height: 52px;
  border-radius: 8px;
  color: #fff;
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
  font-weight: 300;
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