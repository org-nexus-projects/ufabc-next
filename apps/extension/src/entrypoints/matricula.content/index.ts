import './style.css';
import { getUFEnrolled } from '@/services/ufabc-parser';
import UFABCMatricula from '@/entrypoints/matricula.content/UFABC-Matricula.vue';
import HighchartsVue from 'highcharts-vue';
import Highcharts from 'highcharts';
import annotationsInit from "highcharts/modules/annotations";
import accessibility from "highcharts/modules/accessibility";
import Highcharts3D from 'highcharts/highcharts-3d';
import type { Student } from '@/scripts/sig/homepage';
import type { ContentScriptContext } from 'wxt/client';
import { VueQueryPlugin } from '@tanstack/vue-query';

export type UFABCMatriculaStudent = {
	studentId: number;
	graduationId: string;
};

export default defineContentScript({
	async main(ctx) {
		const student = await storage.getItem<Student>('local:student');
		const ufabcMatriculaStudent = await storage.getItem<UFABCMatriculaStudent>(
			`sync:${student?.ra}`,
		);
		const ui = await mountUFABCMatriculaFilters(ctx, ufabcMatriculaStudent);
		ui.mount();

		const $meio = document.querySelector<HTMLDivElement>('#meio');
		const $mountedUi = $meio?.firstChild as unknown as HTMLDivElement;

		$mountedUi.style.position = 'sticky';
		$mountedUi.style.top = '0px';
		$mountedUi.style.zIndex = '9';


    const URLS_TO_CHECK = ['http://localhost:3003', 'https://ufabc-matricula-snapshot.vercel.app']
    const origin = new URL(document.location.href).origin

    if (URLS_TO_CHECK.includes(origin)) {
      document.dispatchEvent(new CustomEvent('student-info', {
        detail: {
          ra: student?.ra,
          login: student?.login,
          hasStudent: !!student
        },
      }))
    }
	},
	runAt: 'document_end',
	cssInjectionMode: 'ui',
	matches: [
		'http://localhost:3003/*',
		'https://ufabc-matricula-snapshot.vercel.app/*',
		'https://api.ufabcnext.com/snapshot',
		'https://matricula.ufabc.edu.br/matricula',
	],
});

async function mountUFABCMatriculaFilters(
	ctx: ContentScriptContext,
	student: UFABCMatriculaStudent | null,
) {
	return createShadowRootUi(ctx, {
		name: 'matriculas-filter',
		position: 'inline',
		anchor: '#meio',
		append: 'first',
		async onMount(container, shadow, _shadowhost) {
			const wrapper = document.createElement('div');
			container.append(wrapper);

			// accessibility(Highcharts);
			// annotationsInit(Highcharts)
			// Highcharts3D(Highcharts);

			const matriculas = await getUFEnrolled();
			window.matriculas = matriculas;
			const app = createApp(UFABCMatricula);
			app.provide('matriculas', window.matriculas);
			app.provide('student', student);

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
