<template>
  <v-layout>
    <v-flex>
      <v-layout row wrap>
        <div style="display: flex; flex: 1 1 auto; align-items: center; min-height: 32px; flex-wrap: wrap;">
          <div class="ufabcnext-blue--text mr-2">
            <!-- <router-link :to="{ name: 'reviews', query: { subjectId: comment.subject._id }"> -->
              {{ comment.subject.name }}
            <!-- </router-link> -->
          </div>
          
          <div class="concept-author mr-2" :style="{ 'background': conceptsColor[comment.conceito || 'null'] }">
            {{ comment.conceito }}
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

      <v-layout column wrap align-content-start>
        <div class="comment-text" :class="{'show-more': comment.showMore}">
          {{ comment.text }}
        </div>
        <el-button 
          @click="showMore(comment._id)" 
          type="text" 
          style="text-align: left;">
          MOSTRAR {{ comment.showMore ? 'MENOS' : 'MAIS' }}
        </el-button>
      </v-layout>
    </v-flex>
  </v-layout>
</template>
<script>
import _ from 'lodash'
import Vue from 'vue'

export default {
  name: 'ReviewComment',

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
    comment: {
      type: Object
    }
  },

  methods: {
    showMore(commentId){
      let comment = Object.assign({}, this.comment)
      comment.showMore = !this.comment.showMore
      this.$emit('input', comment)
    }
  }
}
</script>

<style>
.concept-author {
  height: 24px;
  width: 24px;
  border-radius: 4px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.comment-text {
  max-height: 250px;
  overflow: hidden;
}
.comment-text.show-more {
  max-height: initial;
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