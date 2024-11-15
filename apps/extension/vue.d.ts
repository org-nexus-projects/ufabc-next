declare module "*.vue" {
	import type { DefineComponent } from "vue";
	// biome-ignore lint/suspicious/noExplicitAny: allow import of vue files
	// biome-ignore lint/complexity/noBannedTypes: allow import of vue files
	const component: DefineComponent<{}, {}, any>;
	export default component;
}
