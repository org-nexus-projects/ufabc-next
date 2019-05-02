<template>
  <div class="pa-4">
    <VueMarkdown
      class="title mb-3"
      :source="comment && comment._id ? 'Atualizar comentário' : 'Fazer review'"
      :html="false"
      :xhtml-out="true"
      :breaks="true"
      :anchorAttributes="{target: '_blank'}"/>

    <v-layout v-if='enrollment'>
      <v-flex sm6>
        <small class="mt-3 ufabcnext-grey--text">Disciplina:</small>
        <div class="mt-1 mb-3">{{ enrollment.disciplina }}</div>
      </v-flex>
      <v-flex sm3>
        <small class="mt-3 ufabcnext-grey--text">Conceito:</small>
        <div class="mt-1 mb-3">{{ enrollment.conceito }}</div>
      </v-flex>
      <v-flex sm3>
        <small class="mt-3 ufabcnext-grey--text">Período:</small>
        <div class="mt-1 mb-3">{{ prettySeason }} </div>
      </v-flex>
    </v-layout>

    <small class="mt-3 ufabcnext-grey--text">Professor:</small>
    <div class="mb-3" v-if='teacher'>
      {{ teacher.name }}
      <el-tooltip content="Alterar professor (ainda não disponível)">
        <v-btn icon class="my-0" style="margin-top: -6px!important">
          <v-icon color="grey" size="22">edit</v-icon>
        </v-btn>
      </el-tooltip>
    </div>
<!--     <div class="mb-3" v-else>
      Vincular professor
      <el-tooltip content="Alterar professor">
        <v-btn icon class="my-0" style="margin-top: -6px!important">
          <v-icon color="grey" size="22">edit</v-icon>
        </v-btn>
      </el-tooltip>
    </div> -->

    <el-tabs v-model="activeName" v-if='teacher'>
      <el-tab-pane label="Comentários sobre o professor" name="first">
        <ReviewComment
          v-if='!!(comments && comments.length)'
          v-for='_comment in comments'
          :comment="_comment"
          class="mb-4" 
          :key="_comment._id" 
          @input="updateComment($event)"
          recommendationCheckMode
        />
        <v-layout wrap align-center justify-center v-else>
          <v-flex xs12 class="text-center mb-3 mt-3"><img src="@/assets/certificate.svg" width="64" height="64" /></v-flex>
          <div @click='activeName = "second"' class="ufabcnext-link--text cursor-pointer">Seja o primeiro a comentar</div>
        </v-layout>
      </el-tab-pane>
      <el-tab-pane :label="comment && comment._id ? 'Atualizar comentário' : 'Novo comentário'" name="second">
        <div class="mx-1" v-if='comment'>
          <v-textarea v-model='comment.comment' solo placeholder="Diga como foi a prova, a didática, se ele cobra presença..."></v-textarea>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="prompt-buttons">
      <v-btn
        flat
        v-for='button in buttons'
        :key='button.name'
        :class="button.class"
        class="ma-0"
        style="height: 48px; min-width: initial;"
        :disabled="loading"
        :loading="button.showLoading && loading"
        @click="selectButton(button)">
        {{ button.name }}
      </v-btn>
    </div>
  </div>
</template>

<script>
import Comment from '@/services/Comment'
import Enrollment from '@/services/Enrollment'
import ErrorMessage from '@/helpers/ErrorMessage'
import VueMarkdown from 'vue-markdown'
import ReviewComment from '@/components/Reviews/Comment'
import PrettySeason from '@/helpers/PrettySeason'

export default {
  name: 'CommentEditor',
  components: {
    VueMarkdown,
    ReviewComment
  },

  data() {
    return {
      loading: false,
      enrollment: null,

      comments: null,
      comment: {},
      activeName: 'first',
      subjectId: null
    }
  },

  props: {
    enrollmentId: {
      type: String
    },

    teacherId: {
      type: String
    },

    teacher: {
      type: Object
    },

    teacherType: {
      type: String
    },

    cache: {
      type: Object,
    }
  },

  computed: {
    defaults() {
      return {

      }
    },

    prettySeason() {
      let year = _.get(this.enrollment, 'year', null)
      let quad = _.get(this.enrollment, 'quad', null)
      if(!year || !quad) return
      return PrettySeason(year + ':' + quad)
    },

    buttons() {
      if(this.activeName == 'first') {
        return [
          {name: 'Fechar', class: 'grey--text'},
        ]
      }
      return [
        {name: 'Cancelar', class: 'grey--text'},
        {name: (this.comment && this.comment._id) ? 'Atualizar' : 'Comentar', action: true, class: 'green--text'}
      ]
    }
  },

  created() {
    if (this.cache && this.enrollmentId == this.cache._id) {
      this.enrollment = this.cache
    }

    if(this.teacher && this.teacher._id) this.getTeacherComments()
    if(!this.enrollmentId) {
      this.enrollment = Object.assign({}, this.defaults)
    } else {
      this.fetch()
    }
  },

  methods: {
    selectButton(button) {
      if (!button || button.action === undefined) {
        this.$emit('close')
      } else {
        this.loading = true
        if(this.activeName == 'first') {
          return this.$emit('answer')
        }
        this.$emit('answer', {
          enrollmentId: this.enrollmentId,
          type: this.teacherType,
          comment: this.comment.comment,
          commentId: this.comment && this.comment._id,
          action: this.comment._id ? 'update' : 'create'
        })
      }
    },
    
    async fetch() {
      this.loading = true
      try {
        let res = await Enrollment.get(this.enrollmentId)

        this.loading = false
        if(res.data){
          this.enrollment = _.defaultsDeep(res.data, this.defaults)
          this.comment = _.get(this.enrollment[this.teacherType], 'comment', {})
        }
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
        this.$emit('close')
      }
    }, 

    async getTeacherComments(){
      this.loading = true

      try {
        let res = await Comment.get(this.teacher._id)

        this.loading = false
        if(res.data && res.data.data){
          this.comments = res.data.data.map(c => {
            c.showMore = false
            return c
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

  },
}
</script>
<style scoped>
.prompt-buttons {
  display:flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin: 0 -8px -8px -8px;
}
.reviews-options[data-v-b6d34bca] {
  display: flex;
  height: 200px;
  background: #87caba;
  align-items: center;
  justify-content: center;
}
</style>