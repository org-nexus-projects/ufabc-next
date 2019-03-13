<template>
  <div class="comment-list">
    <v-layout class="mb-4 pb-2" key="_id" v-for='comment in comments'>
      <v-avatar 
        :class="$vuetify.breakpoint.xsOnly ? 'mt-1' : 'mt-2'"
        class="mr-3" 
        :size="38" 
        :color="conceptsColor[comment.conceito || 'null']" 
        style="flex: none;">
         <span class="white--text">{{comment.conceito}}</span>
      </v-avatar>
      <v-flex>
        <v-layout row wrap>
          <div style="display: flex; flex: 1 1 auto; align-items: center; min-height: 32px; flex-wrap: wrap;">
            <div class="ufabcnext-blue--text mr-3">
              <!-- <router-link :to="{ name: 'reviews', query: { subjectId: comment.subject._id }"> -->
                {{ comment.subject.name }}
              <!-- </router-link> -->
            </div>

            <div class="ufabcnext-grey--text">
              {{ comment.quad }}º quadrimestre de {{ comment.year }} 
            </div>
          </div>

          <div style="display:flex; align-items: center; flex: none; min-height: 32px;">
            <div class="mr-3 comment-like-area">
              <v-icon color="ufabcnext-liked" size="16" v-ripple>mdi-thumb-up</v-icon>
              10
            </div>
            <div class="comment-like-area">
              <v-icon color="ufabcnext-like" size="16" v-ripple>mdi-thumb-down</v-icon>
              3,5 mil
            </div>
          </div>
        </v-layout>

        <v-layout row>
          {{ comment.text }}
        </v-layout>
      </v-flex>

    </v-layout>
  </div>
</template>
<script>
export default {
  name: 'TeacherCommentsReader',

  data(){
    return {
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

  props: {
    comments: {
      type: Array
    }
  }
}
</script>

<style>
@media (min-width: 1264px) {
  .comment-list {
    max-height: 420px;
    overflow-y: auto;
  }
}
.comment-like-area {
  display:flex; 
  align-items: center; 
  color: #606060; 
  font-size: 13px;
  cursor: pointer;
}
.comment-like-area > i {
  border-radius: 14px;
  width: 28px;
  height: 28px;
}
</style>