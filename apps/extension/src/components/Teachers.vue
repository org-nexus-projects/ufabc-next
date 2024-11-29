<template>
  <div v-if="teoria" class="mt-1.5 text-xs font-bold uppercase">
    Teoria:
    <a
      :data="teoriaId"
      :teacherName="teoria"
      class="cursor-pointer text-amber-500 hover:text-amber-600 ReviewTeacher Help"
    >
      {{ teoria }}
    </a>
  </div>
  <div v-if="pratica" class="mt-1.5 text-xs font-bold uppercase">
    Prática:
    <a
      :data="praticaId"
      :teacherName="pratica"
      class="cursor-pointer text-amber-500 hover:text-amber-600 ReviewTeacher Help"
    >
      {{ pratica }}
    </a>
  </div>
</template>

<script setup lang="ts">
type TeacherProps = {
  teoria: string | undefined;
  teoriaId: string | undefined;
  pratica: string | undefined;
  praticaId: string | undefined;
}

defineProps<TeacherProps>();
</script>
