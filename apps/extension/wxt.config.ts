import { defineConfig } from "wxt";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
	modules: ["@wxt-dev/module-vue"],
	manifest: {
		permissions: ["storage"],
	},
	vite: () => ({
		plugins: [
			AutoImport({
				resolvers: [ElementPlusResolver()],
			}),
			Components({
				resolvers: [ElementPlusResolver()],
			}),
		],
	}),
});
