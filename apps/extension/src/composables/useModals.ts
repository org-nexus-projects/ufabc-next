import { ref } from 'vue'

export function useModals() {
  const subjectReview = ref({
    isOpen: false,
    subjectId: null as string | null,
  })

  const kicksModal = ref({
    isOpen: false,
    corteId: null as string | null,
  })

  const teacherReview = ref({
    isOpen: false,
    teacherId: null as string | null,
    name: null as string | null,
  })

  return {
    subjectReview,
    kicksModal,
    teacherReview,
  }
}

