<template>
  <section>
    <v-container>
      <PaperCard title="Anúncios" class="text-md-left text-center">
        <v-form @submit.prevent="onSubmit">
          <v-row class="mt-4">
            <v-col cols="12">
              <p class="text-body-1 mb-4">
                Envie uma mensagem a grupos especificos do whatsapp
              </p>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-autocomplete
                v-model="courseId.value.value"
                :items="coursesList"
                item-title="name"
                item-value="ufabcCourseIdentifier"
                :error-messages="courseId.errorMessage.value"
                label="Selecionar um Curso"
                placeholder="Selecione um curso"
                variant="outlined"
                prepend-inner-icon="mdi-school"
                :loading="isCoursesLoading"
                :disabled="isPendingSubmit || hasRestrictedCourseAccess"
                :clearable="!hasRestrictedCourseAccess"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="text.value.value"
                :error-messages="text.errorMessage.value"
                label="Texto do Anúncio"
                placeholder="Digite o texto do anúncio"
                variant="outlined"
                rows="4"
                :disabled="isPendingSubmit"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" class="text-center">
              <v-btn
                type="submit"
                color="primary"
                :loading="isPendingSubmit"
                :disabled="!meta.valid || isPendingSubmit"
                size="large"
              >
                Enviar
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </PaperCard>
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@tanstack/vue-query';
import { Announcements, Whatsapp } from '@ufabc-next/services';
import { RequestError, SearchCourseItem } from '@ufabc-next/types';
import { toTypedSchema } from '@vee-validate/zod';
import { AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { useField, useForm } from 'vee-validate';
import { computed, watch } from 'vue';

import { PaperCard } from '@/components/PaperCard';
import { useAuthStore } from '@/stores/auth';
import { PERMISSIONS } from '@/utils/consts';
import { getCurrentAcademicSeason } from '@/utils/currentQuarter';

import { announcementValidationSchema } from './announcementValidationSchema';

const authStore = useAuthStore();

const validationSchema = toTypedSchema(announcementValidationSchema);

const { handleSubmit, meta, resetForm } = useForm({
  validationSchema,
  initialValues: {
    courseId: undefined,
    text: '',
  },
});

const courseId = useField<number | undefined>('courseId');
const text = useField('text');

const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
  queryKey: ['courses'],
  queryFn: () => Whatsapp.getCourses(),
  staleTime: 1000 * 60 * 60,
});

const permissions = computed(() => authStore.user?.permissions ?? []);
const hasAdminPermission = computed(() =>
  permissions.value.includes(PERMISSIONS.ADMIN),
);
const hasAnnouncementsPermission = computed(() =>
  permissions.value.includes(PERMISSIONS.ANNOUNCEMENTS),
);
const hasAnnouncementsBccPermission = computed(() =>
  permissions.value.includes(PERMISSIONS.ANNOUNCEMENTS_BCC),
);
const hasRestrictedCourseAccess = computed(
  () =>
    !hasAdminPermission.value &&
    !hasAnnouncementsPermission.value &&
    hasAnnouncementsBccPermission.value,
);

const bccCourse = computed(() =>
  coursesData.value?.find(
    (course: SearchCourseItem) =>
      course.name === 'Bacharelado em Ciência da Computação',
  ),
);

const coursesList = computed(() => {
  if (!coursesData.value) return [];
  const availableCourses = hasRestrictedCourseAccess.value
    ? coursesData.value.filter(
        (course: SearchCourseItem) =>
          course.ufabcCourseIdentifier ===
          bccCourse.value?.ufabcCourseIdentifier,
      )
    : coursesData.value;

  return availableCourses
    .filter((course: SearchCourseItem) => course.name && course.name.trim())
    .sort((a: SearchCourseItem, b: SearchCourseItem) =>
      a.name.localeCompare(b.name),
    );
});

watch(
  [bccCourse, hasRestrictedCourseAccess],
  ([course, isRestricted]) => {
    if (isRestricted && course) {
      courseId.setValue(course.ufabcCourseIdentifier);
    }
  },
  { immediate: true },
);

const { mutate: sendAnnouncement, isPending: isPendingSubmit } = useMutation({
  mutationFn: Announcements.sendAnnouncement,
  onSuccess: () => {
    resetForm();
    ElMessage({
      message: 'Anúncio está sendo enviado para os grupos!',
      type: 'success',
      showClose: true,
    });
  },
  onError: (error: AxiosError<RequestError>) => {
    ElMessage({
      message:
        'Erro ao enviar anúncio: ' +
        (error.response?.data?.error || error.message),
      type: 'error',
      showClose: true,
    });
  },
});

const currentSeason = computed(() => getCurrentAcademicSeason());

const onSubmit = handleSubmit((values) => {
  sendAnnouncement({
    courseIdentifier: values.courseId,
    season: currentSeason.value,
    message: values.text,
  });
});
</script>

<style scoped>
.container {
  min-height: calc(100vh - 64px);
  min-height: calc(100svh - 64px);
  display: flex;
  flex-direction: column;
}
</style>
