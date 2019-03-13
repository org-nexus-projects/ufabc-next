<template>
  <v-layout class="target-info mb-3" wrap>
    <v-flex xs12 :style="style"  v-if='conceptsCount >= 0' style="display: flex;">
      <v-icon size="20" class="mr-1" color="grey">mdi-alpha-n-box</v-icon> {{conceptsCount}} conceitos
    </v-flex>
    <v-flex xs12 :style="style"  v-if='commentsCount >= 0 && target.kind == "teacher"' style="display: flex;">
      <v-icon size="20" class="mr-1" color="grey">mdi-message-draw</v-icon> {{ commentsCount }} comentários
    </v-flex>
    <v-flex xs12 :style="style" v-if='target.kind == "teacher"' style="display: flex;">
      <v-icon size="20" class="mr-1" color="grey">mdi-gmail</v-icon> 
      <a href="mailto:professor@ufabc.edu.br" style="text-decoration: none;">
        professor@ufabc.edu.br
      </a>
    </v-flex>
    <v-flex xs12 :style="style"  style="display: flex;" v-if='target.kind == "teacher"'>
      <v-icon size="20" class="mr-1" color="grey">mdi-home</v-icon> Sala 1035 (Bloco B)
    </v-flex>
    <v-flex xs12 :style="style"  style="display: flex;" v-if='target.kind == "teacher"'>
      <v-icon size="20" class="mr-1" color="grey">mdi-phone</v-icon> (11) 4444-4444
    </v-flex>

    <!-- Subject -->
    <v-flex xs12 :style="style" v-if='teachersCount >= 0 && target.kind == "subject"' style="display: flex;">
      <v-icon size="20" class="mr-1" color="grey">mdi-account</v-icon> {{ teachersCount }} professores
    </v-flex>
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
      type: Number,
      default: 12
    },

    target: {
      type: Object
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