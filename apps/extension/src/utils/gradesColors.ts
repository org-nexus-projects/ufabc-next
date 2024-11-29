import type { Grade } from '@/services/next'

export function resolveColorForConcept(grade: Grade) {
  return {
    'A': '#3fcf8c',
    'B': '#b8e986',
    'C': '#f8b74c',
    'D': '#ffa004',
    'F': '#f95469',
    'O': '#A9A9A9'
  }[grade] || '#A9A9A9'
}
