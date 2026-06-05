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
      name: 'São Bernardo',
      class: 'notBernardo',
      val: true,
      comparator: 'andr',
    },
    {
      name: 'Santo André',
      class: 'notAndre',
      val: true,
      comparator: 'bernardo',
    },
  ])

  const shiftFilters = ref<Filter[]>([
    {
      name: 'Noturno',
      class: 'notNoturno',
      val: true,
      comparator: 'diurno',
    },
    {
      name: 'Matutino',
      class: 'notMatutino',
      val: true,
      comparator: 'noturno',
    },
  ])

  function applyFilter(params: Filter) {
    if (!params.val) {
      const tableData = document.querySelectorAll<HTMLTableElement>('#tabeladisciplinas tr td:nth-child(3)')
      for (const data of tableData) {
        const subject = data.textContent?.toLocaleLowerCase()
        if (!subject?.includes(params.comparator.toLocaleLowerCase())) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          data.parentElement!.style.display = 'none'
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
    campusFilters,
    shiftFilters,
    applyFilter,
  }
}
