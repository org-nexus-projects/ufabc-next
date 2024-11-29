import { getUFEnrolled } from "@/services/ufabc-parser";
import UFABCMatricula from "@/views/UFABC-Matricula.vue";
import './style.css'
import type { Student } from "@/scripts/sig/homepage";
import type { ContentScriptContext } from "wxt/client";



export default defineContentScript({
  async main(ctx) {
    const ui = await mountUFABCMatriculaFilters(ctx);
		ui.mount();

    const $meio =  document.querySelector<HTMLDivElement>("#meio");

    if (!$meio) {
      return;
    }

    const student = await storage.getItem<Student>('local:student')
    const ufabcMatriculaStudent = await storage.getItem(`sync:${student?.ra}`)
    console.log(student, ufabcMatriculaStudent)
    const $mountedUi = $meio.firstChild as unknown as HTMLDivElement;

    $mountedUi.style.position = "sticky";
		$mountedUi.style.top = "0px";
		$mountedUi.style.zIndex = "9";

    // TODO(Joabesv): create student here
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


      const matriculas = await getUFEnrolled();
      window.matriculas = matriculas;

      const app = createApp(UFABCMatricula);
      app.provide("matriculas", window.matriculas);


			app.mount(wrapper);
			return { app, wrapper };
		},
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		onRemove(mounted: any) {
			mounted?.app.unmount();
			mounted?.wrapper.remove();
		},
	});
}
