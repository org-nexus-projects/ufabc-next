<template>
  <div>
    <v-container grid-list-lg text-xs-center v-if='enrollments && enrollments.length' :class="$vuetify.breakpoint.xsOnly ? 'mx-0 px-1' : ''">
      <div class="title mb-2 mt-4 text-left" :class="$vuetify.breakpoint.mdAndUp ? '': ''">Minhas matérias para avaliar</div>
      <transition-group tag="div" key="index" name="slide-y-transition" class="layout" style="width: 100%; flex-wrap: wrap;" :class="$vuetify.breakpoint.xsOnly ? 'px-0 mx-0' : ''">
        <v-flex xs12 md6 align-center v-for='(enrollment, index) in enrollments' :key="enrollment._id" :class="$vuetify.breakpoint.xsOnly ? 'px-0' : ''">
          <div class="enrollment elevate-3d elevate-3">
            <div class="enrollment-name">
              <span>{{ enrollment.disciplina }}</span>
<!--               <v-btn @click="close(index)" icon style="margin: 0px; width: 22px; height: 22px;">
                <v-icon size="18" style="color: rgba(0,0,0,0.2);">mdi-close</v-icon>
              </v-btn> -->
            </div>
            <div style="align-items: center; display:flex; height: calc(100% - 26px);">
              <div 
                class="concept-comment" 
                style="flex: none;" 
                :style="{'backgroundColor': conceptsColor[enrollment.conceito || 'null']}">
                  {{ enrollment.conceito }}
              </div>

              <div class="teachers mr-3">
                <div class="teacher teacher-teoria mb-2" v-if='enrollment.teoria && enrollment.teoria.name'>
                  <span class="mr-2">
                    {{ enrollment.teoria.name }} <el-tag class="ml-2" color="primary" size="mini">Teoria</el-tag> <el-tag class="ml-2" color="primary" size="mini" v-if='sameBothProfessor(enrollment)'>Prática</el-tag>
                  </span>
                  <el-button @click="comment(enrollment._id, enrollment.teoria, 'teoria')" class="pa-0" type="text" style="width: 85px;">
                    <div style="display: flex; align-items: center;" v-if='enrollment.comments && includes(enrollment.comments, "teoria")'>
                      <v-icon class="mr-2" size="18" color="ufabcnext-green">mdi-checkbox-marked-circle</v-icon>
                      VER
                    </div>
                    <div style="display: flex; align-items: center;" v-else>
                      <v-icon class="mr-2" size="18" color="ufabcnext-grey">mdi-plus-circle-outline</v-icon>
                      AVALIAR
                    </div>
                  </el-button>
                </div>

                <div class="teacher teacher-pratica" v-if='enrollment.pratica && enrollment.pratica.name && !sameBothProfessor(enrollment)'>
                  <span class="mr-2">
                    {{ enrollment.pratica.name }} <el-tag class="ml-2" size="mini">Prática</el-tag>
                  </span>
                  <el-button @click="comment(enrollment._id, enrollment.pratica, 'pratica')" class="pa-0" type="text" style="width: 85px;">
                    <div style="display: flex; align-items: center;" v-if='enrollment.comments && includes(enrollment.comments, "pratica")'>
                      <v-icon class="mr-2" size="18" color="ufabcnext-green">mdi-checkbox-marked-circle</v-icon>
                      VER
                    </div>
                    <div style="display: flex; align-items: center;" v-else>
                      <v-icon class="mr-2" size="18" color="ufabcnext-grey">mdi-plus-circle-outline</v-icon>
                      AVALIAR
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
import Comment from '@/services/Comment'
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
    sameBothProfessor(enrollment) {
      if(!enrollment || !enrollment.teoria || !enrollment.pratica) return false
      return enrollment.teoria._id == enrollment.pratica._id
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
          this.enrollments = seasons[seasonsKeys[seasonsKeys.length - 1]].filter(e => {
            return !(_.includes(e.comments, 'teoria') || _.includes(e.comments, 'pratica')) 
                    && (e.teoria || e.pratica)
          })

        }
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    includes(array, target) {
      return _.includes(array, target)
    },

    async comment(enrollmentId, teacher = null, teacherType) {
      let dialog = this.$dialog({
        width: this.$vuetify.breakpoint.xsOnly ? '90%' : '750px',
        top: '10vh',
        margin: this.$vuetify.breakpoint.xsOnly ? '5%' : '',
        enrollmentId: enrollmentId,
        teacher: teacher,
        teacherType: teacherType,
      }, CommentEditor)

      try {
        let res = await dialog
        if(res) {
          if(res.action == 'create') this.createComment(res.enrollmentId, res.comment, res.type)
          if(res.action == 'update') this.updateComment(res.commentId, res.comment)
        }
      } catch(e) {} 
    },

    async createComment(enrollmentId, comment, type) {
      this.loading = true

      try {
        let res = await Comment.create({
          enrollment: enrollmentId,
          comment: comment,
          type: type,
        })

        this.loading = false
        this.$notify({
          title: 'Sucesso',
          message: 'Comentário criado',
          type: 'success'
        })

        this.fetch()
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    async updateComment(commentId, comment) {
      this.loading = true

      try {
        let res = await Comment.update(commentId, {
          comment: comment,
        })

        this.loading = false
        this.$notify({
          title: 'Sucesso',
          message: 'Comentário atualizado',
          type: 'success'
        });
        this.fetch()
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },
  }

}
</script>

<style scoped>
.enrollment {
  background-color: #fff; 
  border-radius: 4px; 
  overflow: hidden; 
  height: 92px;
}
.enrollment-name {
  font-size: 14px;
  height: 26px;
  display: flex;
  align-items: center;
  background: #e8e8e8;
  color: rgba(0,0,0,0.8);
  padding-left: 12px;
  padding-right: 12px;
}
.enrollment-name > span {
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