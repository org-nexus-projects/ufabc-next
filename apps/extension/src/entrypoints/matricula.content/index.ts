import { getUFEnrolled } from "@/services/ufabc-parser";
import UFABCMatricula from "@/entrypoints/matricula.content/UFABC-Matricula.vue";
import HighchartsVue from "highcharts-vue";
import Highcharts from "highcharts";
// import annotationsInit from "highcharts/modules/annotations";
// import accessibility from "highcharts/modules/accessibility";
import Highcharts3D from 'highcharts/highcharts-3d'
import type { Student } from "@/scripts/sig/homepage";
import type { ContentScriptContext } from "wxt/client";
import './style.css'



export default defineContentScript({
  async main(ctx) {
    const ui = await mountUFABCMatriculaFilters(ctx);
		ui.mount();

    const $meio =  document.querySelector<HTMLDivElement>("#meio");
    const $mountedUi = $meio?.firstChild as unknown as HTMLDivElement;

    $mountedUi.style.position = "sticky";
		$mountedUi.style.top = "0px";
		$mountedUi.style.zIndex = "9";

    // TODO(Joabesv): create student here
    const student = await storage.getItem<Student>('local:student')
    const ufabcMatriculaStudent = await storage.getItem(`sync:${student?.ra}`)
    console.log(student, ufabcMatriculaStudent)

  },
  runAt: "document_end",
  cssInjectionMode: 'ui',
	matches: ["https://ufabc-matricula-snapshot.vercel.app/*", 'https://api.ufabcnext.com/snapshot', 'https://matricula.ufabc.edu.br/matricula'],
})

async function mountUFABCMatriculaFilters(ctx: ContentScriptContext) {
	return createShadowRootUi(ctx, {
		name: "matriculas-filter",
		position: "inline",
		anchor: "#meio",
		append: "first",
		async onMount(container, shadow, _shadowhost) {
			const wrapper = document.createElement("div");
      container.append(wrapper);

      // accessibility(Highcharts);
			// annotationsInit(Highcharts)
      // Highcharts3D(Highcharts);


      const matriculas = await getUFEnrolled();
      window.matriculas = matriculas;

      const app = createApp(UFABCMatricula);
      app.provide("matriculas", window.matriculas);

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
