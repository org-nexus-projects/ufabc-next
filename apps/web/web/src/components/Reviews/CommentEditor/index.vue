<template>
  <div class="pa-4">
    <VueMarkdown
      class="title mb-3"
      :source="commentId ? 'Atualizar comentário' : 'Criar comentário'"
      :html="false"
      :xhtml-out="true"
      :breaks="true"
      :anchorAttributes="{target: '_blank'}"/>


      <div class="mt-3 mb-2">Disciplina:</div>
    
        <v-text-field
      disabled
      solo
      :value='"Algoritmos e Estruturas de Dados I"'
      hide-details
      />

          <div class="mt-3 mb-2">Professor:</div>
    <v-text-field
      disabled
      solo
      hide-details
      :value='"Antonio Sérgio Munhoz"'
      />

      <el-button type="text" class="pt-0 mt-3 mb-2">Eu não fiz essa matéria com esse professor</el-button>


      <div class="">Conceito Final: A</div>

      <div class="mt-4 mb-2">Comentários sobre o professor: </div>
      <v-textarea solo placeholder="Diga como foi a prova, a didática, se ele cobra presença..."></v-textarea>


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
import ErrorMessage from '@/helpers/ErrorMessage'
import VueMarkdown from 'vue-markdown'

export default {
  name: 'CommentEditor',
  components: {VueMarkdown},

  data() {
    return {
      loading: false,
      comment: null,
      buttons: [
        {name: 'Cancelar', class: 'grey--text'},
        {name: 'Comentar', action: true, class: 'green--text'}
      ]
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
    }
  },

  created() {
    if (this.cache && this.commentId == this.cache._id) {
      this.comment = this.cache
    }

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

        if(res.data){
          this.loading = false
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
</style>