import Cortes from '@/components/Cortes.vue';
import Teachers from '@/components/Teachers.vue';
import { ref, render } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getComponents } from '@/services/next'

// this is probably more than a coomposable

function setupSubjectElement(subjectEl: HTMLSpanElement, subjectId: string) {
  subjectEl.style.cursor = 'pointer'

  subjectEl.addEventListener('mouseenter', () => {
    subjectEl.style.textDecoration = 'underline'
  })

  subjectEl.addEventListener('mouseleave', () => {
    subjectEl.style.textDecoration = 'none'
  })

  subjectEl.setAttribute('subjectId', subjectId)
}

function appendTeacherComponent(el: HTMLTableColElement | null, component: any) {
  if (!el) return

  const teacherContainer = document.createElement('div')
  el.appendChild(teacherContainer)

  render(h(Teachers, {
    teoria: component.teoria,
    teoriaId: component.teoriaId,
    pratica: component.pratica,
    praticaId: component.praticaId,
  }), teacherContainer)
}

function appendCortesComponent(corteEl: Element | null) {
  if (!corteEl) return

  const cortesContainer = document.createElement('div')
  corteEl.appendChild(cortesContainer)

  render(h(Cortes), cortesContainer)
}

export function useComponentsBuilder() {
  const teachers = ref(false)

  const { data: components, error } = useQuery({
    queryKey: ['components'],
    queryFn: async () => getComponents(),
    retry: 3,
    // staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: [], // Provide empty array as initial data
  })

  watch(components, (newComponents) => {
    if (newComponents?.length) {
      buildComponents()
    }
  })


  function buildComponents() {
    if (!teachers.value) {
      document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')
        .forEach($el => $el.style.display = 'none')
      return
    }

    const teacherReviews = document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')
    if (teacherReviews.length > 0) {
      teacherReviews.forEach($el => $el.style.display = '')
      return
    }

    const componentsMap = new Map(
      components.value?.map(component => [component.disciplina_id.toString(), component])
    )

    document.querySelectorAll('table tr').forEach(row => {
      const el = row.querySelector<HTMLTableColElement>('td:nth-child(3)')
      const subjectEl = row.querySelector<HTMLSpanElement>('td:nth-child(3) > span')
      const corteEl = row.querySelector('td:nth-child(5)')
      const componentId = row.getAttribute('value')

      if (!componentId) return
      const component = componentsMap.get(componentId)
      if (!component) return

      if (component.subject && subjectEl) {
        setupSubjectElement(subjectEl, component.subjectId)
      }

      appendTeacherComponent(el, component)
      appendCortesComponent(corteEl)
    })
  }

  return {
    teachers,
    buildComponents
  }
}
