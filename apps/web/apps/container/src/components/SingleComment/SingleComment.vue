<template>
  <v-container>
    <v-row
      align="start"
      justify="start"
    >
      <v-col
        sm=""
        order="1"
        class="mr-3 justify-center pa-0 flex-grow-0 flex-shrink-1"
      >
        <div
          :style="conceptStyle"
          class="text-white d-flex align-center justify-center rounded-lg"
        >
          {{ comment?.enrollment.conceito }}
        </div>
        <p
          class="text-primary"
          style="white-space: nowrap"
        >
          {{ season }}
        </p>
      </v-col>
      <v-col
        cols="12"
        sm=""
        order="3"
        order-sm="2"
        class="comment-text-container mr-2 pa-0"
        :style="`max-height: ${expanded || smAndDown ? 'unset' : '80px'}`"
      >
        <div>
          <div class="d-flex align-center text-primary">
            <v-chip
              v-if="isEAD"
              density="compact"
              class="px-2 mr-1"
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
        class="pa-0 justify-start text-subtitle-2 text-next-light-gray flex-grow-0 flex-shrink-1"
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
            <v-icon
              size="small"
              class="mr-1"
            />
            {{ likeCount }}
          </v-btn>
          <v-btn
            :aria-label="(recommendation ? 'Remover' : 'Deixar') + ' recomendação'
            "
            :loading="isPendingRecommendation || isPendingRemoveRecommendation"
            class="ml-1 icon-button text-subtitle-2"
            variant="text"
            :icon="recommendation ? 'mdi-medal' : 'mdi-medal-outline'"
            :color="recommendation ? 'primary' : ''"
            @click="
              recommendation
                ? mutateRemoveRecommendation()
                : mutateRecommendation()
            "
          >
            <v-icon
              size="small"
              class="mr-1"
            />
            {{ recommendationCount }}
          </v-btn>
        </div>
        Há {{ date }}
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { useMutation } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { Comments } from 'services';
import { Comment, RequestError } from 'types';
import { checkEAD, conceptsColor, dateToTimeAgo, formatSeason } from 'utils';
import { computed, onMounted, PropType, ref } from 'vue';
import { useDisplay } from 'vuetify';

const { smAndDown } = useDisplay();
const props = defineProps({
  comment: {
    type: Object as PropType<Comment>,
    required: true,
  },
});

const comment = computed(() => props.comment);

const like = ref(comment.value.myReactions.like ?? false);
const likeCount = ref(comment.value.reactionsCount?.like ?? 0);
const recommendation = ref(comment.value.myReactions.recommendation ?? false);
const recommendationCount = ref(
  comment.value.reactionsCount?.recommendation ?? 0,
);

const conceptStyle = computed(() => ({
  backgroundColor: conceptsColor[props.comment?.enrollment.conceito ?? ''],
  height: '54px',
  width: '54px',
  fontSize: '34px',
}));

const { mutate: mutateLike, isPending: isPendingLike } = useMutation({
  mutationFn: () => Comments.like(props.comment?._id),
  onSuccess: () => {
    like.value = true;
    likeCount.value++;
  },
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message: error.response?.data.error,
      type: 'error',
      showClose: true,
    });
  },
});

const { mutate: mutateRecommendation, isPending: isPendingRecommendation } =
  useMutation({
    mutationFn: () => Comments.recommendation(props.comment?._id),
    onSuccess: () => {
      recommendation.value = true;
      recommendationCount.value++;
    },
    onError: (error: AxiosError<RequestError>) => {
      ElMessage({
        message: error.response?.data.message,
        type: 'error',
        showClose: true,
      });
    },
  });

const { mutate: mutateRemoveLike, isPending: isPendingRemoveLike } =
  useMutation({
    mutationFn: () => Comments.removeLike(props.comment?._id),
    onSuccess: () => {
      like.value = false;
      likeCount.value--;
    },
    onError: (error: AxiosError<RequestError>) => {
      ElMessage({
        message: error.response?.data.error,
        type: 'error',
        showClose: true,
      });
    },
  });

const {
  mutate: mutateRemoveRecommendation,
  isPending: isPendingRemoveRecommendation,
} = useMutation({
  mutationFn: () => Comments.removeRecommendation(props.comment?._id),
  onSuccess: () => {
    recommendation.value = false;
    recommendationCount.value--;
  },
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message: error.response?.data.error,
      type: 'error',
      showClose: true,
    });
  },
});

const date = computed(() => dateToTimeAgo(props.comment?.createdAt));

const season = computed(() => {
  if (!props.comment?.enrollment?.season && !props.comment?.enrollment?.year)
    return '';

  const [year, quad] = props.comment.enrollment.season?.split(':') ?? [];

  return formatSeason(
    (year ?? props.comment.enrollment.year) +
    ':' +
    (quad ?? props.comment.enrollment.quad),
  );
});

const isEAD = computed(() =>
  checkEAD(props.comment?.enrollment.year, props.comment?.enrollment.quad),
);

const expanded = ref(false);
const commentText = ref<HTMLElement | null>(null);

const showMore = () => {
  if (!commentText.value) return;
  expanded.value = true;
};
onMounted(() => {
  if (!commentText.value) return;
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
  background-image: linear-gradient(to right, transparent, white 40%);
}

.v-btn--icon.v-btn--density-default.icon-button {
  height: 36px;
  width: 36px;
}
</style>
