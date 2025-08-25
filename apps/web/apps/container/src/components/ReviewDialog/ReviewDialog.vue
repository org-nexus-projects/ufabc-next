<template>
  <FeedbackAlert
    v-if="isFetchingTeacherEnrollmentError || teacherIdError"
    text="Erro ao carregar as informações do professor desta disciplina"
  />
  <v-dialog
    v-model="showDialog"
    max-width="1200"
  >
    <PaperCard>
      <div class="w-100 d-flex justify-end">
        <v-btn
          variant="tonal"
          icon="mdi-window-close"
          aria-label="Fechar"
          @click="showDialog = false"
        />
      </div>
      <v-container
        class="pa-0 my-2"
        style="max-width: none"
      >
        <v-row class="ma-0">
          <v-col
            class="pa-0 pb-5 pa-sm-3"
            cols="12"
            md="5"
          >
            <p class="text-h4 font-weight-bold text-primary mb-2">
              {{ teacherName }}
            </p>
            <p>
              <span class="item-name"> Disciplina:</span>
              {{ enrollment?.subject.name }}
            </p>
            <div class="d-flex align-center">
              <span class="item-name"> Conceito:</span>
              <div
                class="text-white d-flex align-center justify-center rounded ml-1"
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
              class="px-2 mr-1 rounded-sm"
              style="font-size: 12px"
            >
              {{ tag }}
            </v-chip>
            <p class="text-subtitle-1 pt-3">
              Seu comentário:
            </p>
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
            <div class="w-100 d-flex justify-end">
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
          <v-col
            v-if="teacherId"
            class="pa-0 pa-sm-3"
            cols="12"
            md="7"
          >
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { Comments, Enrollments } from '@ufabc-next/services';
import type { Enrollment } from '@ufabc-next/types';
import { conceptsColor } from '@ufabc-next/utils';
import { ElMessage } from 'element-plus';
import { computed, PropType, ref, watch } from 'vue';

import { CommentsList } from '@/components/CommentsList';
import { FeedbackAlert } from '@/components/FeedbackAlert';
import { PaperCard } from '@/components/PaperCard';

const selectedSubject = ref<string>('Todas as matérias');

const props = defineProps({
  enrollment: {
    type: Object as PropType<Enrollment>,
  },
  showDialog: {
    type: Boolean,
    required: true,
  },
  tags: {
    type: Object as PropType<string[]>,
    required: true,
  },
});

const enrollmentId = computed(() => props.enrollment?._id || '');

const subjectType = computed(() => {
  if (props.tags[0] === 'teoria e prática') return 'teoria';
  return props.tags[0];
});

const teacherId = computed(() => {
  let id = '';
  if (subjectType.value === 'teoria e prática')
    id = props.enrollment?.pratica?._id || props.enrollment?.teoria?._id || '';
  else if (subjectType.value === 'prática')
    id = props.enrollment?.pratica?._id || '';
  else id = props.enrollment?.teoria?._id || '';

  return id;
});

const teacherIdError = ref(false);
if (!teacherId.value) {
  teacherIdError.value = true;
}

const teacherName = computed(() => {
  if (subjectType.value === 'teoria e prática')
    return (
      props.enrollment?.pratica?.name || props.enrollment?.teoria?.name || ''
    );
  if (subjectType.value === 'prática')
    return props.enrollment?.pratica?.name || '';
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
  refetchOnWindowFocus: false,
  queryKey: ['enrollments', 'get', enrollmentId],
  queryFn: () => Enrollments.get(enrollmentId.value),
  enabled: showDialog,
});

const comment = ref<string>('');
const teacherEnrollmentComment = computed(() => ({
  teoria: teacherEnrollment.value?.data.teoria?.comment?.comment,
  prática: teacherEnrollment.value?.data.pratica?.comment?.comment,
}));

const userCommentMessage = computed({
  get: () => {
    const currentComment =
      teacherEnrollmentComment.value[subjectType.value as 'teoria' | 'prática'];
    return comment.value ? comment.value : (currentComment ?? '');
  },
  set: (value: string) => {
    comment.value = value;
  },
});

const disableMutateComment = computed(() => {
  return (
    !userCommentMessage.value ||
    teacherEnrollmentComment.value[
      subjectType.value as 'teoria' | 'prática'
    ] === userCommentMessage.value
  );
});

const hasUserComment = computed(
  () =>
    !!teacherEnrollmentComment.value[subjectType.value as 'teoria' | 'prática'],
);

const queryClient = useQueryClient();
const { mutate: mutateCreate, isPending: isCreatingComment } = useMutation({
  mutationFn: () =>
    Comments.create({
      enrollment: enrollmentId.value,
      comment: comment.value,
      type: subjectType.value === 'prática' ? 'pratica' : 'teoria',
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['comments', teacherId],
    });
    queryClient.invalidateQueries({
      queryKey: ['enrollments', 'get', subjectId],
    });
    ElMessage({
      message: 'Comentário enviado com sucesso',
      type: 'success',
      showClose: true,
    });
  },
  onError: () => {
    ElMessage({
      message: 'Ocorreu um erro ao enviar o comentário',
      type: 'error',
      showClose: true,
    });
  },
});

const { mutate: mutateUpdate, isPending: isUpdatingComment } = useMutation({
  mutationFn: () =>
    Comments.update({
      id:
        teacherEnrollment.value?.data.teoria?.comment?._id ??
        teacherEnrollment.value?.data.pratica?.comment?._id ??
        '',
      comment: comment.value,
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['comments'],
    });
    queryClient.invalidateQueries({
      queryKey: ['enrollments', 'get', enrollmentId],
    });
    ElMessage({
      message: 'Comentário editado com sucesso',
      type: 'success',
      showClose: true,
    });
  },
  onError: () => {
    ElMessage({
      message: 'Ocorreu um erro ao editar o comentário',
      type: 'error',
      showClose: true,
    });
  },
});

const submit = () => {
  if (hasUserComment.value) {
    mutateUpdate();
    return;
  }
  mutateCreate();
};

watch(
  () => props.showDialog,
  () => {
    if (!showDialog.value) comment.value = '';
  },
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
