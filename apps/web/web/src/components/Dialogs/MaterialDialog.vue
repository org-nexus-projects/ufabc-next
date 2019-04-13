<template>
  <div class="pa-4">
    <VueMarkdown
      v-if="title"
      class="title mb-3"
      :source="title"
      :html="false"
      :xhtml-out="true"
      :breaks="true"
      :anchorAttributes="{target: '_blank'}"/>

    <VueMarkdown
      v-if="content"
      class="body-1 mb-3 translucid"
      :source="content"
      :html="false"
      :xhtml-out="true"
      :breaks="true"
      :anchorAttributes="{target: '_blank'}"/>

    <div v-if="html" v-html="html"></div>

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
import VueMarkdown from 'vue-markdown'

export default {
  name: 'MaterialDialog',

  components: {VueMarkdown},

  props: {
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
    },
    html: {
      type: String,
    },
    buttons: {
      type: Array,
      default() {
        return [
          {name: 'Cancelar', class: 'grey--text'},
          {name: 'OK', action: true, class: 'green--text'}
        ]
      },
    }, 
  },
  data() {
    return {
      loading: false
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