<template>
  <div class="pa-4">
    <VueMarkdown
      class="title mb-3"
      :source="commentId ? 'Atualizar comentário' : 'Fazer review'"
      :html="false"
      :xhtml-out="true"
      :breaks="true"
      :anchorAttributes="{target: '_blank'}"/>

    <v-layout>
      <v-flex sm6>
        <small class="mt-3 ufabcnext-grey--text">Disciplina:</small>
        <div class="mt-1 mb-3">Algoritmos e Estruturas de Dados I</div>
      </v-flex>
      <v-flex sm3>
        <small class="mt-3 ufabcnext-grey--text">Conceito:</small>
        <div class="mt-1 mb-3">A</div>
      </v-flex>
      <v-flex sm3>
        <small class="mt-3 ufabcnext-grey--text">Período:</small>
        <div class="mt-1 mb-3">2º Quadrimestre de 2019</div>
      </v-flex>
    </v-layout>

    <small class="mt-3 ufabcnext-grey--text">Professor:</small>
    <div class="mb-3">
      Antonio Sergio Munhoz 
      <el-tooltip content="Alterar professor">
        <v-btn icon class="my-0" style="margin-top: -6px!important">
          <v-icon color="grey" size="22">edit</v-icon>
        </v-btn>
      </el-tooltip>
    </div>

    <el-tabs v-model="activeName">
      <el-tab-pane label="Comentários sobre o professor" name="first">
        <ReviewComment
          v-for='_comment in comments'
          :comment="_comment"
          class="mb-4" 
          :key="_comment._id" 
          @input="updateComment($event)"
          helpfulCheckMode
        />
      </el-tab-pane>
      <el-tab-pane label="Novo comentário" name="second">
        <div class="mx-1">
          <v-textarea solo placeholder="Diga como foi a prova, a didática, se ele cobra presença..."></v-textarea>
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
import Teacher from '@/services/Teacher'
import ErrorMessage from '@/helpers/ErrorMessage'
import VueMarkdown from 'vue-markdown'
import ReviewComment from '@/components/Reviews/Comment'

export default {
  name: 'CommentEditor',
  components: {
    VueMarkdown,
    ReviewComment
  },

  data() {
    return {
      loading: false,
      comment: null,

      comments: null,
      activeName: 'first',
    }
  },

  props: {
    commentId: {
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

    buttons() {
      if(this.activeName == 'first') {
        return [
          {name: 'Fechar', class: 'grey--text'},
          {name: 'Salvar', class: 'green--text'}
        ]
      }
      return [
        {name: 'Cancelar', class: 'grey--text'},
        {name: 'Comentar', action: true, class: 'green--text'}
      ]
    }
  },

  created() {
    if (this.cache && this.commentId == this.cache._id) {
      this.comment = this.cache
    }

    this.getTeacherComments()
    if(!this.commentId) {
      this.comment = Object.assign({}, this.defaults)
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
        this.$emit('answer', button.action)
      }
    },
    
    async fetch() {
      this.loading = true
      try {
        let res = await Comment.get(this.commentId)

        this.loading = false
        if(res.data){
          this.comment = _.defaultsDeep(res.data, this.defaults)
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
        let res = await Teacher.getComments('')

        this.loading = false
        if(res.data){
          this.comments = res.data.map(c => {
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