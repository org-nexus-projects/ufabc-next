import './style.css';
import 'element-plus/theme-chalk/index.css'
import { getUFEnrolled } from '@/services/ufabc-parser';
import UFABCMatricula from '@/entrypoints/matricula.content/UFABC-Matricula.vue';
import HighchartsVue from 'highcharts-vue';
import Highcharts from 'highcharts';
import annotationsInit from "highcharts/modules/annotations";
import accessibility from "highcharts/modules/accessibility";
import Highcharts3D from 'highcharts/highcharts-3d';
import type { Student } from '@/scripts/sig/homepage';
import type { ContentScriptContext } from 'wxt/client';

export type UFABCMatriculaStudent = {
	studentId: number;
	graduationId: string;
};

export default defineContentScript({
	async main(ctx) {
		const student = await storage.getItem<Student>('local:student');
    await storage.setItem(`sync:${student?.ra}`, {
      studentId: 557736,
      graduationId: 74,
    })
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

		// TODO(Joabesv): create student here
		console.log(student, ufabcMatriculaStudent);
	},
	runAt: 'document_end',
	cssInjectionMode: 'ui',
	matches: [
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

			await storage.setItem('sync:11202231117', {
				studentId: 551100,
				graduationId: 74,
			});


      if (!student) {
        return;
      }

			const matriculas = await getUFEnrolled();
			window.matriculas = matriculas;

			const app = createApp(UFABCMatricula);
			app.provide('matriculas', window.matriculas);
			app.provide('student', student);

			app.use(HighchartsVue);

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
