import { updateStudent } from "@/services/next"
import { useMutation } from "@tanstack/vue-query"

export function useStudentSync() {
  return useMutation({
    mutationFn: ({ login, ra, studentId }: {
      login: string,
      ra: string,
      studentId: number | null
    }) => updateStudent(login, ra, studentId),
    onError: (error) => {
      console.error('Failed to sync student:', error)
    },
  })
}
