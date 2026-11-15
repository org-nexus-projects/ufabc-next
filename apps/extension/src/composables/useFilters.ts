import { ref } from 'vue'

export type Filter = {
  name: 'Santo André' | 'São Bernardo' | 'Noturno' | 'Matutino'
  val: boolean
  comparator: 'bernardo' | 'andr' | 'diurno' | 'noturno'
  class: 'notAndre' | 'notBernardo' | 'notNoturno' | 'notMatutino'
}

export function useFilters() {
  const campusFilters = ref<Filter[]>([
    {
      class: 'notBernardo',
      comparator: 'andr',
      name: 'São Bernardo',
      val: true,
    },
    {
      class: 'notAndre',
      comparator: 'bernardo',
      name: 'Santo André',
      val: true,
    },
  ])

  const shiftFilters = ref<Filter[]>([
    {
      class: 'notNoturno',
      comparator: 'diurno',
      name: 'Noturno',
      val: true,
    },
    {
      class: 'notMatutino',
      comparator: 'noturno',
      name: 'Matutino',
      val: true,
    },
  ])

  function applyFilter(params: Filter) {
    if (!params.val) {
      const tableData = document.querySelectorAll<HTMLTableElement>('#tabeladisciplinas tr td:nth-child(3)')
      for (const data of tableData) {
        const subject = data.textContent?.toLocaleLowerCase()
        if (!subject?.includes(params.comparator.toLocaleLowerCase()) && data.parentElement !== null) {
          data.parentElement.style.display = 'none'
        }
      }
      return
    }

    const allTr = document.querySelectorAll<HTMLTableRowElement>('#tabeladisciplinas tr')
    for (const tr of allTr) {
      tr.style.display = ''
    }
  }

  return {
    applyFilter,
    campusFilters,
    shiftFilters,
  }
}
