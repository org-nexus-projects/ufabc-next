<template>
  <v-container>
    <v-row align="start" justify="start">
      <v-col
        sm=""
        order="1"
        class="pa-0 mr-3 flex-shrink-1 flex-grow-0 justify-center"
      >
        <div
          :style="conceptStyle"
          class="d-flex align-center justify-center rounded-lg text-white"
        >
          {{ comment?.enrollment.conceito }}
        </div>
        <p class="text-primary" style="white-space: nowrap">
          {{ season }}
        </p>
      </v-col>
      <v-col
        cols="12"
        sm=""
        order="3"
        order-sm="2"
        class="comment-text-container pa-0 mr-2"
        :style="`max-height: ${expanded || smAndDown ? 'unset' : '80px'}`"
      >
        <div>
          <div class="d-flex align-center text-primary">
            <v-chip
              v-if="isEAD"
              density="compact"
              class="mr-1 px-2"
              style="font-size: 12px"
            >
              EAD
            </v-chip>
            <p class="text-subtitle-2">
              {{ comment?.subject.name }}
            </p>
          </div>

          <p ref="commentText">
            {{ comment?.comment }}
          </p>
          <button
            class="show-more text-primary text-subtitle-2 text-uppercase"
            :style="`display:${expanded || smAndDown ? 'none' : 'block'}`"
            @click="showMore"
          >
            mostrar mais
            <v-icon>mdi-chevron-down</v-icon>
          </button>
        </div>
      </v-col>
      <v-col
        sm=""
        order="2"
        order-sm="3"
        class="pa-0 text-subtitle-2 text-next-light-gray flex-shrink-1 flex-grow-0 justify-start"
      >
        <div class="d-flex">
          <v-btn
            :aria-label="(like ? 'Remover' : 'Deixar') + ' like'"
            :loading="isPendingLike || isPendingRemoveLike"
            class="icon-button text-subtitle-2"
            variant="text"
            :icon="like ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
            :color="like ? 'primary' : ''"
            @click="like ? mutateRemoveLike() : mutateLike()"
          >
            <v-icon size="small" class="mr-1" />
            {{ likeCount }}
          </v-btn>
          <v-btn
            :aria-label="
              (recommendation ? 'Remover' : 'Deixar') + ' recomendação'
            "
            :loading="isPendingRecommendation || isPendingRemoveRecommendation"
            class="icon-button text-subtitle-2 ml-1"
            variant="text"
            :icon="recommendation ? 'mdi-medal' : 'mdi-medal-outline'"
            :color="recommendation ? 'primary' : ''"
            @click="
              recommendation
                ? mutateRemoveRecommendation()
                : mutateRecommendation()
            "
          >
            <v-icon size="small" class="mr-1" />
            {{ recommendationCount }}
          </v-btn>
        </div>
        Há {{ date }}
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { Comment, Comments, RequestError } from '@next/services';
import { useMutation } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { computed, onMounted, PropType, ref } from 'vue';
import { useDisplay } from 'vuetify';

import { conceptsColor } from '@/utils/consts';
import { dateToTimeAgo } from '@/utils/dateToTimeAgo';
import { checkEAD, formatSeason } from '@/utils/season';

const { smAndDown } = useDisplay();
const props = defineProps({
  comment: {
    required: true,
    type: Object as PropType<Comment>,
  },
});

const comment = computed(() => props.comment);

const like = ref(comment.value.myReactions.like ?? false);
const likeCount = ref(comment.value.reactionsCount?.like ?? 0);
const recommendation = ref(comment.value.myReactions.recommendation ?? false);
const recommendationCount = ref(
  comment.value.reactionsCount?.recommendation ?? 0
);

const conceptStyle = computed(() => ({
  backgroundColor: conceptsColor[props.comment?.enrollment.conceito ?? ''],
  fontSize: '34px',
  height: '54px',
  width: '54px',
}));

const { mutate: mutateLike, isPending: isPendingLike } = useMutation({
  mutationFn: () => Comments.like(props.comment?._id),
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message: error.response?.data.error,
      showClose: true,
      type: 'error',
    });
  },
  onSuccess: () => {
    like.value = true;
    likeCount.value += 1;
  },
});

const { mutate: mutateRecommendation, isPending: isPendingRecommendation } =
  useMutation({
    mutationFn: () => Comments.recommendation(props.comment?._id),
    onError: (error: AxiosError<RequestError>) => {
      ElMessage({
        message: error.response?.data.message,
        showClose: true,
        type: 'error',
      });
    },
    onSuccess: () => {
      recommendation.value = true;
      recommendationCount.value += 1;
    },
  });

const { mutate: mutateRemoveLike, isPending: isPendingRemoveLike } =
  useMutation({
    mutationFn: () => Comments.removeLike(props.comment?._id),
    onError: (error: AxiosError<RequestError>) => {
      ElMessage({
        message: error.response?.data.error,
        showClose: true,
        type: 'error',
      });
    },
    onSuccess: () => {
      like.value = false;
      likeCount.value -= 1;
    },
  });

const {
  mutate: mutateRemoveRecommendation,
  isPending: isPendingRemoveRecommendation,
} = useMutation({
  mutationFn: () => Comments.removeRecommendation(props.comment?._id),
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message: error.response?.data.error,
      showClose: true,
      type: 'error',
    });
  },
  onSuccess: () => {
    recommendation.value = false;
    recommendationCount.value -= 1;
  },
});

const date = computed(() => dateToTimeAgo(props.comment?.createdAt));

const season = computed(() => {
  if (!props.comment?.enrollment?.season && !props.comment?.enrollment?.year) {
    return '';
  }

  const [year, quad] = props.comment.enrollment.season?.split(':') ?? [];

  return formatSeason(
    `${year ?? props.comment.enrollment.year}:${
      quad ?? props.comment.enrollment.quad
    }`
  );
});

const isEAD = computed(() =>
  checkEAD(props.comment?.enrollment.year, props.comment?.enrollment.quad)
);

const expanded = ref(false);
const commentText = ref<HTMLElement | null>(null);

function showMore() {
  if (!commentText.value) {
    return;
  }
  expanded.value = true;
}
onMounted(() => {
  if (!commentText.value) {
    return;
  }
  if (commentText.value.clientHeight <= 60) {
    expanded.value = true;
  }
});
</script>

<style scoped lang="scss">
.comment-text-container {
  overflow: hidden;
  transition: max-height 0.5s ease-in-out;
  font-size: 14px;
  flex-grow: 1;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.show-more {
  position: absolute;
  width: 100%;
  top: 60px;
  background-image: linear-gradient(
    to right,
    transparent,
    rgb(var(--v-theme-surface)) 40%
  );
}

.v-btn--icon.v-btn--density-default.icon-button {
  height: 36px;
  width: 36px;
}
</style>
