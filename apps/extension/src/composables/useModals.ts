import { ref } from 'vue'

export function useModals() {
  const subjectReview = ref({
    isOpen: false,
    subjectId: null as string | null,
  })

  const kicksModal = ref({
    corteId: null as string | null,
    isOpen: false,
  })

  const teacherReview = ref({
    isOpen: false,
    name: null as string | null,
    teacherId: null as string | null,
  })

  return {
    kicksModal,
    subjectReview,
    teacherReview,
  }
}

