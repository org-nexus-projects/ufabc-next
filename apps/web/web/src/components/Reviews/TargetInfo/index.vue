<template>
  <v-layout class="target-info" wrap style="display: flex; flex-direction: column; align-items: start;" :class="$vuetify.breakpoint.xsOnly ? 'mb-0' : 'mb-3'">
    <div class="chipzinha" xs12 :style="style"  v-if='conceptsCount != null & conceptsCount >= 0'>
      <v-icon size="20" class="mr-1" color="inherit">mdi-format-annotation-plus</v-icon> {{ conceptsCount }} conceitos
    </div>
    <div class="chipzinha" xs12 :style="style"  v-if='commentsCount >= 0 && target.kind == "teacher"'>
      <v-icon size="20" class="mr-1" color="inherit">mdi-message-text-outline</v-icon> {{ commentsCount }} {{ commentsCount == '1' ? 'comentário' : 'comentários' }}
    </div>
    <div class="chipzinha" xs12 :style="style"  v-if='classesCount >= 0 && target.kind == "teacher"'>
      <v-icon size="20" class="mr-1" color="inherit">mdi-teach</v-icon> {{ classesCount }} {{ classesCount == '1' ? 'disciplina' : 'disciplinas' }}
    </div><!-- 
    <div xs12 :style="style" v-if='target.kind == "teacher"' style="display: flex;">
      <v-icon size="20" class="mr-1" color="grey">mdi-gmail</v-icon> 
      <a href="mailto:professor@ufabc.edu.br" style="text-decoration: none;">
        professor@email.edu.br
      </a>
    </div> --><!-- 
    <div xs12 :style="style"  style="display: flex;" v-if='target.kind == "teacher"'>
      <v-icon size="20" class="mr-1" color="grey">mdi-home</v-icon> Sala 9999 (Bloco B)
    </div> -->
<!--     <div xs12 :style="style"  style="display: flex;" v-if='target.kind == "teacher"'>
      <v-icon size="20" class="mr-1" color="grey">mdi-phone</v-icon> (11) 4444-4444
    </div> -->
    <!-- Subject -->
    <div class="chipzinha" xs12 :style="style" v-if='teachersCount >= 0 && target.kind == "subject"' style="display: flex;">
      <v-icon size="20" class="mr-1" color="inherit">mdi-account</v-icon> {{ teachersCount }} professores
    </div>
  </v-layout>
</template>

<script>
export default {
  name: 'TargetInfo',

  props: {
    conceptsCount: {
      type: Number
    },

    commentsCount: {
      type: Number
    },

    target: {
      type: Object
    },

    classesCount: {
      type: Number,
    },

    teachersCount: {
      type: Number
    }
  },

  computed:{
    style() {
      if(!this.$vuetify.breakpoint.smAndUp) return {}
      return { 
        'flex': 'none',
        'marginRight': '16px',
        'marginBottom': '4px',
      }
    }
  }
}
</script>

<style scoped>
.chipzinha {
  border: 1px solid;
  border-color: var(--ufabcnext-blue);
  padding: 4px 8px;
  border-radius: 16px;
  color: var(--ufabcnext-blue);
  display: inline-flex;
  margin-bottom: 8px;
}
</style>
