<template>
  <FeedbackAlert
    v-if="isFetchingTeacherEnrollmentError || teacherIdError"
    text="Erro ao carregar as informações do professor desta disciplina"
  />
  <v-dialog v-model="showDialog" max-width="1200">
    <PaperCard>
      <div class="d-flex w-100 justify-end">
        <v-btn
          variant="tonal"
          icon="mdi-window-close"
          aria-label="Fechar"
          @click="showDialog = false"
        />
      </div>
      <v-container class="pa-0 my-2" style="max-width: none">
        <v-row class="ma-0">
          <v-col class="pa-0 pa-sm-3 pb-5" cols="12" md="5">
            <p class="text-h4 font-weight-bold text-primary mb-2">
              {{ capitalizeName(teacherName) }}
            </p>
            <p>
              <span class="item-name"> Disciplina:</span>
              {{ enrollment?.subject.name }}
            </p>
            <div class="d-flex align-center">
              <span class="item-name"> Conceito:</span>
              <div
                class="d-flex align-center ml-1 justify-center rounded text-white"
                :style="
                  enrollment?.conceito &&
                  `background-color:${
                    conceptsColor[enrollment.conceito]
                  }; width: 20px; height: 20px;`
                "
              >
                {{ enrollment?.conceito }}
              </div>
              <span class="font-weight-bold ml-1" />
            </div>
            <v-chip
              v-for="tag in tags"
              :key="tag"
              density="compact"
              class="mr-1 rounded-sm px-2"
              style="font-size: 12px"
            >
              {{ tag }}
            </v-chip>
            <p class="text-subtitle-1 pt-3">Seu comentário:</p>
            <v-textarea
              v-model="userCommentMessage"
              variant="solo"
              placeholder="Faça aqui um comentário em relação ao docente e sua disciplina."
              rows="3"
              max-rows="5"
              no-resize
              auto-grow
              :loading="isFetchingTeacherEnrollment"
            />
            <div class="d-flex w-100 justify-end">
              <v-btn
                color="primary"
                :disabled="disableMutateComment"
                :loading="isCreatingComment || isUpdatingComment"
                @click="submit"
              >
                {{ hasUserComment ? 'Atualizar comentário' : 'Enviar' }}
              </v-btn>
            </div>
          </v-col>
          <v-col v-if="teacherId" class="pa-0 pa-sm-3" cols="12" md="7">
            <CommentsList
              :teacher-id="teacherId"
              :selected-subject="selectedSubject"
              @update:selected-subject="selectedSubject = $event"
            />
          </v-col>
        </v-row>
      </v-container>
    </PaperCard>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Enrollment, RequestError } from '@next/services';
import { Comments, Enrollments } from '@next/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { computed, PropType, ref, watch } from 'vue';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { PaperCard } from '@/components/ui/PaperCard';
import { capitalizeName } from '@/utils/capitalizeName';
import { conceptsColor } from '@/utils/consts';

import { CommentsList } from '../CommentsList';

const selectedSubject = ref<string>('Todas as matérias');

const props = defineProps({
  enrollment: {
    type: Object as PropType<Enrollment>,
  },
  showDialog: {
    required: true,
    type: Boolean,
  },
  tags: {
    required: true,
    type: Object as PropType<string[]>,
  },
});

const enrollmentId = computed(() => props.enrollment?._id || '');

const subjectType = computed(() => {
  if (props.tags[0] === 'teoria e prática') {
    return 'teoria';
  }
  return props.tags[0];
});

const teacherId = computed(() => {
  let id = '';
  if (subjectType.value === 'teoria e prática') {
    id = props.enrollment?.pratica?._id || props.enrollment?.teoria?._id || '';
  } else if (subjectType.value === 'prática') {
    id = props.enrollment?.pratica?._id || '';
  } else {
    id = props.enrollment?.teoria?._id || '';
  }

  return id;
});

const teacherIdError = ref(false);
if (!teacherId.value) {
  teacherIdError.value = true;
}

const teacherName = computed(() => {
  if (subjectType.value === 'teoria e prática') {
    return (
      props.enrollment?.pratica?.name || props.enrollment?.teoria?.name || ''
    );
  }
  if (subjectType.value === 'prática') {
    return props.enrollment?.pratica?.name || '';
  }
  return props.enrollment?.teoria?.name || '';
});

const subjectId = computed(() => props.enrollment?.subject._id ?? '');

const emit = defineEmits(['update:showDialog']);
const showDialog = computed({
  get: () => props.showDialog,
  set: (value: boolean) => {
    emit('update:showDialog', value);
  },
});

const {
  data: teacherEnrollment,
  isFetching: isFetchingTeacherEnrollment,
  isError: isFetchingTeacherEnrollmentError,
} = useQuery({
  enabled: showDialog,
  queryFn: () => Enrollments.get(enrollmentId.value),
  queryKey: ['enrollments', 'get', enrollmentId],
  refetchOnWindowFocus: false,
});

const comment = ref<string>('');
const teacherEnrollmentComment = computed(() => ({
  prática: teacherEnrollment.value?.pratica?.comment?.comment,
  teoria: teacherEnrollment.value?.teoria?.comment?.comment,
}));

const userCommentMessage = computed({
  get: () => {
    const currentComment =
      teacherEnrollmentComment.value[subjectType.value as 'teoria' | 'prática'];
    return comment.value || (currentComment ?? '');
  },
  set: (value: string) => {
    comment.value = value;
  },
});

const disableMutateComment = computed(
  () =>
    !userCommentMessage.value ||
    teacherEnrollmentComment.value[
      subjectType.value as 'teoria' | 'prática'
    ] === userCommentMessage.value
);

const hasUserComment = computed(
  () =>
    !!teacherEnrollmentComment.value[subjectType.value as 'teoria' | 'prática']
);

const queryClient = useQueryClient();
const { mutate: mutateCreate, isPending: isCreatingComment } = useMutation({
  mutationFn: () =>
    Comments.create({
      comment: comment.value,
      enrollment: enrollmentId.value,
      type: subjectType.value === 'prática' ? 'pratica' : 'teoria',
    }),
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message:
        error.response?.data.translatedDescription ??
        error.response?.data.message ??
        'Ocorreu um erro ao enviar o comentário',
      showClose: true,
      type: 'error',
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['comments', teacherId],
    });
    queryClient.invalidateQueries({
      queryKey: ['enrollments', 'get', subjectId],
    });
    ElMessage({
      message: 'Comentário enviado com sucesso',
      showClose: true,
      type: 'success',
    });
  },
});

const { mutate: mutateUpdate, isPending: isUpdatingComment } = useMutation({
  mutationFn: () =>
    Comments.update({
      comment: comment.value,
      id:
        teacherEnrollment.value?.teoria?.comment?._id ??
        teacherEnrollment.value?.pratica?.comment?._id ??
        '',
    }),
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message:
        error.response?.data.translatedDescription ??
        error.response?.data.message ??
        'Ocorreu um erro ao editar o comentário',
      showClose: true,
      type: 'error',
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['comments'],
    });
    queryClient.invalidateQueries({
      queryKey: ['enrollments', 'get', enrollmentId],
    });
    ElMessage({
      message: 'Comentário editado com sucesso',
      showClose: true,
      type: 'success',
    });
  },
});

function submit() {
  if (hasUserComment.value) {
    mutateUpdate();
    return;
  }
  mutateCreate();
}

watch(
  () => props.showDialog,
  () => {
    if (!showDialog.value) {
      comment.value = '';
    }
  }
);
</script>

<style scoped>
.item-name {
  font-weight: 700;
}
.line-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}
</style>
