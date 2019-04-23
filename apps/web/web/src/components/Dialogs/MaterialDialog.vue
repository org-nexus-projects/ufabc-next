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

    <v-select
      v-if="inputType == 'select'"
      v-validate="validationRules"
      class="ra-1 mt-4"
      :name="inputName"
      :items="items"
      :placeholder="inputPlaceholder"
      :error-messages="errors.collect(inputName)"
      v-model="inputData"
      :returnObject="returnObject"
      hide-details
      solo
    />

    <div class="prompt-buttons mt-2">
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

  $_veeValidate: {
    validator: 'new'
  },

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
    inputPlaceholder: {
      type: String,
    },
    inputLabel: {
      type: String,
    },
    inputType:{
      type: String,
    },
    items: {
      type: Array,
      default: null,
    },
    inputName:{
      type: String,
      default:'input',
    },
    validationRules:{
      default: ''
    },
    returnObject: {
      type: Boolean
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
      loading: false,
      inputData: null
    }
  },
  methods: {
    selectButton(button) {
      if (!button || button.action === undefined) {
        this.$emit('close')
      } else {
        if(this.inputType) {
          this.$validator.validateAll().then((isValid) => {
            if(isValid) {
              this.$emit('answer', this.inputData)
              return
            }
          })
        } else {
          this.$emit('answer', button.action)
        }
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