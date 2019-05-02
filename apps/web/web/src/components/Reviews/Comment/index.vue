<template>
  <v-layout>
    <v-flex>
      <v-layout row wrap>
        <div style="display: flex; flex: 1 1 auto; align-items: center; min-height: 32px; flex-wrap: wrap;">
          <div class="ufabcnext-blue--text mr-2">
            <router-link :to="{ name: 'reviews', query: { subjectId: comment.subject._id }}" style="text-decoration: none">
              {{ comment.subject.name || '(disciplina desconhecida)' }}
            </router-link>
          </div>
          
          <div class="concept-author mr-2" :style="{ 'background': conceptsColor[comment.enrollment.conceito || 'null'] }" v-if='comment.enrollment && comment.enrollment.conceito'>
            {{ comment.enrollment.conceito }}
          </div>

          <div class="ufabcnext-grey--text">
            {{ prettySeason }}
          </div>
        </div>

        <el-checkbox 
          v-loading="loadingRecommendation"
          @change="!loadingRecommendation ? giveReaction('recommendation') : null"
          v-model='recommended' 
          v-if='recommendationCheckMode' 
          class="recommendation-checkbox" 
          label="Útil" 
          border 
          size="small"
        ></el-checkbox>
        <div style="display:flex; align-items: center; flex: none; min-height: 32px;" v-else>
          <div class="mr-3 comment-like-area" @click="!loadingLike ? giveReaction('like') : null" v-loading="loadingLike">
            <v-icon :color="(comment.myReactions && comment.myReactions.like) ? 'ufabcnext-liked' : 'ufabcnext-like'" size="16" v-ripple>
              mdi-thumb-up
            </v-icon>
            {{ (comment.reactionsCount && comment.reactionsCount.like) || 0 }}
          </div>
          <v-tooltip top v-if='recommendationCount >= 0'>
            <template v-slot:activator="{ on }">
              <div class="comment-like-area" v-on="on" @click="!loadingRecommendation ? giveReaction('recommendation') : null" v-loading="loadingRecommendation">
                <v-icon :color="(comment.myReactions && comment.myReactions.recommendation) ? 'ufabcnext-liked' : 'ufabcnext-like'" size="20" v-ripple>
                  mdi-medal
                </v-icon>
                {{ recommendationCount }}
              </div>
            </template>
            <span>
            {{ recommendationCount == 0 ? 'Ninguém recomendou esse comentário ainda': recommendationCount + ' recomendaram esse comentário' }} 
          </span>
          </v-tooltip>
        </div>
      </v-layout>

      <v-layout column wrap align-content-start>
        <div class="comment-text" :class="{'collapsed': !comment.showMore}">
          <p>{{ comment.comment }}</p>
          <div class="show-more">
            <el-button 
              @click="showMore(comment._id)" 
              type="text" 
              class="ma-0 pa-0"
              style="text-align: left;background: #fff;font-size: 13px;">
              MOSTRAR MAIS <i class="el-icon-arrow-down"></i>
            </el-button>
          </div>
        </div>
      </v-layout>
    </v-flex>
  </v-layout>
</template>
<script>
import _ from 'lodash'
import Vue from 'vue'
import PrettySeason from '@/helpers/PrettySeason'
import ErrorMessage from '@/helpers/ErrorMessage'
import Reactions from '@/services/Reactions'

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
      },

      loadingLike: false,
      loadingRecommendation: false,
      recommended: false,
    }
  },

  props: {
    comment: {
      type: Object
    },

    recommendationCheckMode: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    prettySeason() {
      if(!this.comment || !this.comment.enrollment || !this.comment.enrollment.season) return ''
      return PrettySeason(this.comment.enrollment.season)
    },

    recommendationCount() {
      return _.get(this.comment, 'reactionsCount.recommendation', 0)
    }
  },

  methods: {
    showMore(commentId){
      let comment = Object.assign({}, this.comment)
      comment.showMore = !this.comment.showMore
      this.$emit('input', comment)
    },

    async giveReaction(kind) {
      if(!this.comment || !this.comment._id || !this.comment.myReactions) return

      let recommended = this.recommended
      try {
        this.loadingLike = true

        // Create reaction
        if(!this.comment.myReactions[kind]) {
          let res = await Reactions.create(this.comment._id, kind)
          this.comment.myReactions[kind] = true

          if(!this.comment.reactionsCount) {
            Vue.set(this.comment, 'reactionsCount', {
              [kind]: 1
            })
          } else if(!this.comment.reactionsCount[kind] && this.comment.reactionsCount[kind] != 0) {
            this.comment.reactionsCount = Object.assign({
              [kind]: 1
            }, this.comment.reactionsCount)
          } else {
            this.comment.reactionsCount[kind]++
          }

          if(this.comment.myReactions[kind] == 'recommendation') this.recommended = true
        } else {
          let res = await Reactions.delete(this.comment._id, kind)
          this.comment.myReactions[kind] = false 
          this.comment.reactionsCount[kind]--
          if(this.comment.myReactions[kind] == 'recommendation') this.recommended = false
        }

        this.loadingLike = false
      } catch(err) {
        this.loadingLike = false
        this.recommended = recommended

        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        })
      }
    },


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
  max-height: 300px;
  transition: max-height 0.5s ease-in-out;
  line-height: 1.3em;
  overflow: hidden;
  position: relative;
}
.comment-text.collapsed {
  max-height: 3.9em; 
}
.comment-text:not(.collapsed) > .show-more {
  display: none;
}
.show-more {
  position: absolute;
  text-align: center;
  top: 2.6em;
  width: 100%;
  height: 1.3em;
  background-image: linear-gradient(to right, transparent, white 40%);
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
@media (max-width: 600px) {
  .comment-text {
    max-height: 700px;
    line-height: 1.3em;
  }
  .comment-text.collapsed {
    max-height: 10.4em; 
  }
  .show-more {
    top: 9.1em;
    height: 1.3em;
  }
}
</style>