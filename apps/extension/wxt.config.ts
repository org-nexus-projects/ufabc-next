import AutoImport from 'unplugin-auto-import/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'wxt';

const extensionKey =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlg7ae7OuGQW9cQU3/qbuewZ6DdTjc1yDXtiwdwoOwgF/CByfjX+yf4addlXcxnLjXVBWwSvRj78mv03lLBjkeh63ia4t/BIzzzvciZyZAKEasC5rt0M6+MKVbkKQS9JGGVFsBiBQcQ6kUP8R4cpWX1G9uEhnshdF+u4Nrs7gq9uXIPZ4pf9PhI/IsPyAsv0m5uO4EHhIMtAp8pFyJfECWWSLchlBoGlaaCyf+fT6SYDsWaw53AcwT5jOJfxdQsoGRKGI5UW8V9+Mw+EDdpTpi7f8E5k604EMqZwmzhYLiXcuUqxeXbNZkyTsUNHXTQFcpNUdmisfjiT50kcxVZVc9wIDAQAB';

export default defineConfig({
  dev: {
    server: {
      port: 3002,
    },
  },
  manifest: {
    name: 'UFABC next',
    host_permissions: [
      'https://sig.ufabc.edu.br/*',
      'https://matricula.ufabc.edu.br/*',
      'https://moodle.ufabc.edu.br/*',
    ],
    key: extensionKey,
    permissions: ['storage', 'cookies'],
  },
  modules: ['@wxt-dev/module-vue'],
  srcDir: 'src',
  vite: () => ({
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver({ importStyle: 'css' })],
      }),
      Components({
        resolvers: [ElementPlusResolver({ importStyle: 'css' })],
      }),
    ],
    resolve: {
      dedupe: ['@vue/shared'],
    },
  }),
  webExt: {
    disabled: true,
  },
});
