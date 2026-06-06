<template>
  <div v-if="teoria" class="mt-1.5 min-h-5 text-[13px] font-bold uppercase cursor-pointer">
    Teoria:
    <a
      :data="teoriaId"
      :teacherName="teoria"
      class="ReviewTeacher text-amber-500 hover:text-amber-600 text-[13px]"
    >
      {{ teoria }}
    </a>
  </div>
  <div v-if="pratica" class="mt-1.5 min-h-5 text-[13px] font-bold uppercase cursor-pointer">
    Prática:
    <a
      :data="praticaId"
      :teacherName="pratica"
      class="ReviewTeacher text-amber-500 hover:text-amber-600 text-[13px]"
    >
      {{ pratica }}
    </a>
  </div>
  <div v-else-if="!teoria && !pratica" class="mt-1.5 min-h-5 text-[13px] font-bold uppercase">
    <a
      class="text-amber-500 hover:text-amber-600 text-[13px]"
    >
      Professor não registrado pela UFABC
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
