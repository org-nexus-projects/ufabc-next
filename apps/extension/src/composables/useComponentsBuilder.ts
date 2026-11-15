import Cortes from '@/components/Cortes.vue';
import Teachers from '@/components/Teachers.vue';
import { ref, render } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getComponents } from '@/services/next'
import type { Component } from '@/services/next'

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

function appendTeacherComponent(el: HTMLTableColElement | null, component: Component) {
  if (!el) {return}

  const teacherContainer = document.createElement('div')
  el.append(teacherContainer)

  render(h(Teachers, {
    pratica: component.pratica,
    praticaId: component.praticaId,
    teoria: component.teoria,
    teoriaId: component.teoriaId,
  }), teacherContainer)
}

function appendCortesComponent(corteEl: Element | null) {
  if (!corteEl) {return}

  const cortesContainer = document.createElement('div')
  corteEl.append(cortesContainer)

  render(h(Cortes), cortesContainer)
}

export function useComponentsBuilder() {
  const teachers = ref(false)

  const { data: components } = useQuery({
    initialData: [],
    queryFn: async () => await getComponents(),
    queryKey: ['components'],
    retry: 3,
  })

  watch(components, (newComponents) => {
    if (newComponents?.length) {
      buildComponents()
    }
  })


  function buildComponents() {
    if (!teachers.value) {
      for (const $el of document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')) {
        $el.style.display = 'none'
      }
      return
    }

    const teacherReviews = document.querySelectorAll<HTMLTableCaptionElement>('.isTeacherReview')
    if (teacherReviews.length > 0) {
      for (const $el of teacherReviews) {
        $el.style.display = ''
      }
      return
    }

    const componentsMap = new Map(
      components.value?.map(component => [component.disciplina_id.toString(), component])
    )

    for (const row of document.querySelectorAll('table tr')) {
      const el = row.querySelector<HTMLTableColElement>('td:nth-child(3)')
      const subjectEl = row.querySelector<HTMLSpanElement>('td:nth-child(3) > span')
      const corteEl = row.querySelector('td:nth-child(5)')
      const componentId = row.getAttribute('value')

      if (componentId === null || componentId === '') {continue}
      const component = componentsMap.get(componentId)
      if (!component) {continue}

      if (component.subject && subjectEl) {
        setupSubjectElement(subjectEl, component.subjectId)
      }

      appendTeacherComponent(el, component)
      appendCortesComponent(corteEl)
    }
  }

  return {
    buildComponents,
    teachers
  }
}
