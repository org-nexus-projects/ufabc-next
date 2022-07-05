<template>
  <div
    class="row"
    :style="{ 'flex-wrap': $vuetify.breakpoint.xsOnly ? 'wrap' : '' }"
  >
    <div class="column" :class="$vuetify.breakpoint.xsOnly ? 'mr-2' : 'mr-3'">
      <div
        class="concept-author column"
        :style="{
          'background-color':
            conceptsColor[comment.enrollment.conceito || 'null'],
        }"
        v-if="comment.enrollment && comment.enrollment.conceito"
      >
        <div class="concept">{{ comment.enrollment.conceito }}</div>
      </div>
      <div class="quad text-center blue--text mt-1">{{ prettySeason }}</div>
    </div>
    <div class="column flex">
      <div class="row wrap mb-0">
        <div class="ufabcnext-blue--text mr-2 flex ellipsis">
          <router-link
            :to="{
              path: '/reviews',
              query: { subjectId: comment.subject._id },
            }"
            style="text-decoration: none"
          >
            {{ comment.subject.name || "(disciplina desconhecida)" }}
            <el-tag class="ml-2" size="small" v-if="isEAD">EAD</el-tag>
          </router-link>
        </div>
      </div>

      <div class="comment-text" :class="{ collapsed: !comment.showMore }">
        <p>{{ comment.comment }}</p>
        <div class="show-more">
          <el-button
            @click="showMore(comment._id)"
            type="text"
            class="ma-0 pa-0"
            style="text-align: left; background: #fff; font-size: 13px"
          >
            MOSTRAR MAIS <i class="el-icon-arrow-down"></i>
          </el-button>
        </div>
      </div>
    </div>
    <div
      class="ml-3"
      :style="{
        width: $vuetify.breakpoint.xsOnly ? '100%' : '',
        margin: $vuetify.breakpoint.xsOnly ? '0px!important' : '',
      }"
    >
      <el-checkbox
        v-loading="loading.recommendation"
        @change="
          !loading.recommendation ? giveReaction('recommendation') : null
        "
        v-model="recommended"
        v-if="recommendationCheckMode"
        class="recommendation-checkbox"
        label="Útil"
        border
        size="small"
      ></el-checkbox>
      <div
        style="display: flex; align-items: center; flex: none; min-height: 28px"
        :style="{
          'justify-content': $vuetify.breakpoint.xsOnly
            ? 'flex-start'
            : 'flex-end',
        }"
        v-else
      >
        <div
          class="mr-1 comment-like-area"
          @click="!loading.like ? giveReaction('like') : null"
          v-loading="loading.like"
        >
          <v-icon
            :color="
              comment.myReactions && comment.myReactions.like
                ? 'ufabcnext-liked'
                : 'ufabcnext-like'
            "
            size="16"
            v-ripple
          >
            mdi-thumb-up
          </v-icon>
          {{ (comment.reactionsCount && comment.reactionsCount.like) || 0 }}
        </div>
        <v-tooltip top v-if="recommendationCount >= 0">
          <template v-slot:activator="{ on }">
            <div
              class="comment-like-area"
              v-on="on"
              @click="
                !loading.recommendation ? giveReaction('recommendation') : null
              "
              v-loading="loading.recommendation"
            >
              <v-icon
                :color="
                  comment.myReactions && comment.myReactions.recommendation
                    ? 'ufabcnext-liked'
                    : 'ufabcnext-like'
                "
                size="20"
                v-ripple
              >
                mdi-medal
              </v-icon>
              {{ recommendationCount }}
            </div>
          </template>
          <span>
            {{
              recommendationCount == 0
                ? "Ninguém recomendou esse comentário ainda"
                : recommendationCount + " recomendaram esse comentário"
            }}
          </span>
        </v-tooltip>
      </div>
      <div
        class="since-time"
        v-if="!$vuetify.breakpoint.xsOnly && !recommendationCheckMode"
      >
        {{ prettyDate }}
      </div>
    </div>
  </div>
</template>
<script>
import _ from "lodash";
import moment from "moment";
import Vue from "vue";
import PrettySeason from "@/helpers/PrettySeason";
import ErrorMessage from "@/helpers/ErrorMessage";
import Reactions from "@/services/Reactions";
moment.locale("pt-BR");

export default {
  name: "ReviewComment",

  data() {
    return {
      conceptsColor: {
        A: "rgb(63, 207, 140)",
        B: "rgb(184, 233, 134)",
        C: "rgb(248, 183, 76)",
        D: "rgb(255, 160, 4)",
        F: "rgb(249, 84, 105)",
        O: "rgb(169, 169, 169)",

        // exceptions
        I: "rgb(25, 118, 210)",
        E: "rgb(25, 118, 210)",
        null: "rgb(0, 0, 0)",
      },

      loading: {
        like: false,
        recommendation: false,
      },

      recommended: false,
    };
  },

  props: {
    comment: {
      type: Object,
    },

    recommendationCheckMode: {
      type: Boolean,
      default: false,
    },
  },

  created() {
    this.recommended = _.get(this.comment, "myReactions.recommendation", false);
  },

  computed: {
    isEAD() {
      if (!this.comment || !this.comment.enrollment) return false;
      if (!this.comment.enrollment.season && !this.comment.enrollment.year)
        return false;

      const season =
        this.comment.enrollment.season ||
        this.comment.enrollment.year + ":" + this.comment.enrollment.quad;

      const possibles = ["2020:1", "2020:2", "2020:3", "2021:1", "2021:2", "2021:3", "2022:1", "2022:2"];
      return _.includes(possibles, season);
    },

    prettySeason() {
      if (!this.comment || !this.comment.enrollment) return "";
      if (!this.comment.enrollment.season && !this.comment.enrollment.year)
        return "";

      const season =
        this.comment.enrollment.season ||
        this.comment.enrollment.year + ":" + this.comment.enrollment.quad;
      return PrettySeason(season).replace("º Quad de ", "Q ");
    },

    recommendationCount() {
      return _.get(this.comment, "reactionsCount.recommendation", 0);
    },
    prettyDate() {
      return moment(this.comment.createdAt).fromNow();
    },
  },

  methods: {
    sameBothProfessor(enrollment) {
      if (!enrollment || !enrollment.teoria || !enrollment.pratica)
        return false;
      return enrollment.teoria._id == enrollment.pratica._id;
    },

    showMore(commentId) {
      let comment = Object.assign({}, this.comment);
      comment.showMore = !this.comment.showMore;
      this.$emit("input", comment);
    },

    async giveReaction(kind) {
      if (!this.comment || !this.comment._id || !this.comment.myReactions)
        return;

      let recommended = this.recommended;
      try {
        this.loading[kind] = true;

        // Create reaction
        if (!this.comment.myReactions[kind]) {
          let res = await Reactions.create(this.comment._id, kind);
          this.comment.myReactions[kind] = true;

          if (!this.comment.reactionsCount) {
            Vue.set(this.comment, "reactionsCount", {
              [kind]: 1,
            });
          } else if (
            !this.comment.reactionsCount[kind] &&
            this.comment.reactionsCount[kind] != 0
          ) {
            this.comment.reactionsCount = Object.assign(
              {
                [kind]: 1,
              },
              this.comment.reactionsCount
            );
          } else {
            this.comment.reactionsCount[kind]++;
          }

          if (this.comment.myReactions[kind] == "recommendation")
            this.recommended = true;
        } else {
          let res = await Reactions.delete(this.comment._id, kind);
          this.comment.myReactions[kind] = false;
          this.comment.reactionsCount[kind]--;
          if (this.comment.myReactions[kind] == "recommendation")
            this.recommended = false;
        }

        this.loading[kind] = false;
      } catch (err) {
        this.loading[kind] = false;
        this.recommended = recommended;

        this.$message({
          type: "error",
          message: ErrorMessage(err),
        });
      }
    },
  },
};
</script>

<style>
.concept-author {
  height: 54px;
  width: 54px;
  border-radius: 4px;

  display: flex;
  align-items: center;
  justify-content: center;
}
.concept-author .concept {
  font-size: 34px;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 0.9);
  line-height: 40px;
}

.comment-text {
  max-height: 100%;
  transition: max-height 0.5s ease-in-out;
  line-height: 1.3em;
  font-size: 18px;
  overflow: hidden;
  position: relative;
}
.comment-text.collapsed {
  max-height: 3.9em;
}
.comment-text > p {
  font-size: 16px;
  margin-bottom: 0;
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
  display: flex;
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
.since-time {
  opacity: 0.6;
  text-align: center;
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
  .comment-text > p {
    font-size: 14px;
  }
  .concept-author {
    width: 42px;
    height: 42px;
  }
  .quad {
    font-size: 12px;
  }
}
</style>
