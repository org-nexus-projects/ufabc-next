import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import serveStatic from 'serve-static';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const webEnvKeys = ['API_BASE_URL', 'MIXPANEL_TOKEN'] as const;
const parserApiBaseUrl = 'https://ufabc-parser.com/v2';

const webTargetConfig = {
  dev: {
    appEnv: 'local',
  },
  prod: {
    appEnv: 'production',
  },
} as const;

// Serve the public site before Vite applies the portal's /app base path.
function staticSite(): Plugin {
  const serve = serveStatic(
    fileURLToPath(new URL('../static/', import.meta.url)),
    { extensions: ['html'], fallthrough: false }
  );
  return {
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const { pathname, search } = new URL(
          req.url ?? '/',
          'http://localhost'
        );
        if (pathname === '/app' || pathname.startsWith('/app/')) {
          next();
          return;
        }
        // The OAuth callback still returns local sessions to /login.
        if (pathname === '/login') {
          res.writeHead(302, { Location: `/app/login${search}` }).end();
          return;
        }
        serve(req, res, (error) => {
          if (error?.statusCode === 404) {
            res.writeHead(404).end('Not found');
            return;
          }
          next(error);
        });
      });
    },
    name: 'static-site',
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, '');
  const target =
    process.env.NEXT_WEB_TARGET ?? (mode === 'production' ? 'prod' : 'dev');

  if (!(target in webTargetConfig)) {
    throw new Error(`Unsupported web target: ${target}. Use dev or prod.`);
  }

  const targetConfig = webTargetConfig[target as keyof typeof webTargetConfig];
  const selectedProfileEnv = Object.fromEntries(
    webEnvKeys.map((key) => [
      `VITE_${key}`,
      env[`WEB_${targetConfig.appEnv.toUpperCase()}_${key}`] ?? '',
    ])
  );
  const selectedEnv = {
    ...selectedProfileEnv,
    VITE_APP_BASE_URL: '/app',
    VITE_APP_ENV: targetConfig.appEnv,
    VITE_PARSER_API_BASE_URL: parserApiBaseUrl,
  };

  Object.assign(process.env, selectedEnv);

  return {
    base: selectedEnv.VITE_APP_BASE_URL,
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    envDir: workspaceRoot,
    plugins: [staticSite(), vue()],
    preview: {
      host: true,
      port: 3000,
      strictPort: true,
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('src', import.meta.url)),
        },
      ],
      dedupe: ['@vue/shared'],
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true,
    },
  };
});
