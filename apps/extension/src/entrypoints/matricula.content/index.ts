import './style.css';
import { getUFEnrolled } from '@/services/ufabc-parser';
import UFABCMatricula from '@/entrypoints/matricula.content/UFABC-Matricula.vue';
import HighchartsVue from 'highcharts-vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { sendMessage } from '@/messaging';
import type { ContentScriptContext } from 'wxt/client';


export type UFABCMatriculaStudent = {
	studentId: number;
	graduationId: string;
};

export default defineContentScript({
	async main(ctx) {
		const student = await storage.getItem<{ ra: string; login: string }>('local:student');
    const sessionId = await getToken();

    if (!sessionId) {
      const URLS_TO_CHECK = ['http://localhost:3003', 'https://ufabc-matricula-snapshot.vercel.app']
      const origin = new URL(document.location.href).origin

      if (URLS_TO_CHECK.includes(origin)) {
        if (student) {
          document.dispatchEvent(new CustomEvent('student-info', {
            detail: {
              ra: student.ra,
              login: student.login,
              hasStudent: !!student
            },
          }))
        }
      }
      return;
    }

		const ui = await mountUFABCMatriculaFilters(ctx, sessionId);
		ui.mount();

		const $meio = document.querySelector<HTMLDivElement>('#meio');
		const $mountedUi = $meio?.firstChild as unknown as HTMLDivElement;

		$mountedUi.style.position = 'sticky';
		$mountedUi.style.top = '0px';
		$mountedUi.style.zIndex = '9';
	},
	runAt: 'document_end',
	cssInjectionMode: 'ui',
	matches: [
		'http://localhost/*',
		'https://ufabc-matricula-snapshot.vercel.app/*',
		'https://matricula.ufabc.edu.br/matricula/*',
	],
});

async function mountUFABCMatriculaFilters(
	ctx: ContentScriptContext,
  sessionId: string
) {
	return createShadowRootUi(ctx, {
		name: 'matriculas-filter',
		position: 'inline',
		anchor: '#meio',
		append: 'first',
		async onMount(container, _shadow, _shadowhost) {
			const wrapper = document.createElement('div');
			container.append(wrapper);

			const matriculas = await getUFEnrolled();
			window.matriculas = matriculas;
      window.sessionId = sessionId

			const app = createApp(UFABCMatricula);
			app.provide('matriculas', window.matriculas);
      app.provide('sessionId', window.sessionId)

			app.use(HighchartsVue);
      app.use(VueQueryPlugin)

			app.mount(wrapper);
			return { app, wrapper };
		},
		async onRemove(mounted) {
			const resolvedMounted = await mounted;
			resolvedMounted?.app.unmount();
			resolvedMounted?.wrapper.remove();
		},
	});
}

async function getToken() {
  try {
    const token = await sendMessage('getTokenMatricula', {
      action: 'getTokenMatricula',
      pageURL: document.URL
    })
    if (!token) {
      console.error('Could not retrieve token, please try again')
      return null
    }
    return token.value;
  } catch (error) {
    console.error("Failed to get matricula_rails_session from background script:", error);
    return null;
  }
}
