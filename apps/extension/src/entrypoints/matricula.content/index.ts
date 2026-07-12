import './style.css';
import { VueQueryPlugin } from '@tanstack/vue-query';
import HighchartsVue from 'highcharts-vue';
import { type ContentScriptContext } from 'wxt/client';
import { storage } from 'wxt/storage';

import UFABCMatricula from '@/entrypoints/matricula.content/UFABC-Matricula.vue';
import { sendMessage } from '@/messaging';
import { authenticate } from '@/services/auth';
import { getStudent } from '@/services/next';
import { getUFEnrolled } from '@/services/ufabc-parser';
import { logger } from '@/utils/logger';

export type UFABCMatriculaStudent = {
  studentId: number;
  graduationId: string;
};

async function getToken() {
  try {
    const token = await sendMessage('getTokenMatricula', {
      action: 'getTokenMatricula',
      pageURL: document.URL,
    });
    if (!token) {
      logger.error('Could not retrieve token, please try again');
      return null;
    }
    return token.value;
  } catch (error) {
    logger.error(
      error,
      'Failed to get matricula_rails_session from background script'
    );
    return null;
  }
}

async function mountUFABCMatriculaFilters(
  ctx: ContentScriptContext,
  sessionId: string | null,
  login: string
) {
  return await createShadowRootUi(ctx, {
    anchor: '#meio',
    append: 'first',
    name: 'matriculas-filter',
    async onMount(container, _shadow, _shadowhost) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      const matriculas = await getUFEnrolled();
      window.matriculas = matriculas;
      window.sessionId = sessionId;

      const app = createApp(UFABCMatricula);
      app.provide('matriculas', window.matriculas);
      app.provide('sessionId', window.sessionId);
      app.provide('login', login);

      app.use(HighchartsVue);
      app.use(VueQueryPlugin);

      app.mount(wrapper);
      return { app, wrapper };
    },
    async onRemove(mounted) {
      const resolvedMounted = await mounted;
      resolvedMounted?.app.unmount();
      resolvedMounted?.wrapper.remove();
    },
    position: 'inline',
  });
}

export default defineContentScript({
  cssInjectionMode: 'ui',
  async main(ctx) {
    const sessionId = await getToken();
    const $topInfo = document.querySelector('#usuario_top > b');
    const pageLogin = $topInfo?.textContent?.trim().split(' ')[0];
    const storedStudent = await storage.getItem<{ login: string; ra: string }>(
      'local:student'
    );
    const login = storedStudent?.login ?? pageLogin;

    if (!login) {
      logger.warn('No login available for matricula content script');
      return;
    }

    const ui = await mountUFABCMatriculaFilters(ctx, sessionId, login);
    ui.mount();

    const $meio = document.querySelector<HTMLDivElement>('#meio');
    const $mountedUi = $meio?.firstChild;

    if (!$mountedUi) {
      logger.error('Failed to mount UFABC Matricula UI');
      return;
    }

    if ($mountedUi instanceof HTMLElement) {
      $mountedUi.style.position = 'sticky';
      $mountedUi.style.top = '0px';
      $mountedUi.style.zIndex = '999';
    }

    const URLS_TO_CHECK = [
      'http://localhost:3003',
      'https://ufabc-matricula-snapshot.vercel.app',
      'https://matricula.ufabc.edu.br',
    ];
    const MATRICULA_ORIGIN = 'https://matricula.ufabc.edu.br';
    const { origin } = new URL(document.location.href);
    if (URLS_TO_CHECK.includes(origin)) {
      try {
        let fullStudent = null;

        const jwt = await authenticate('matricula', {
          sessionId: sessionId ?? undefined,
        });

        if (jwt) {
          fullStudent = await getStudent(
            storedStudent?.login ?? login,
            undefined,
            jwt
          );
        }

        // Legacy fallback: no stored identity but has a matricula session (prod only)
        if (!jwt && origin === MATRICULA_ORIGIN && sessionId && login) {
          logger.warn(
            { login },
            'No stored student from SIGAA; using legacy session-based fetch'
          );
          fullStudent = await getStudent(login, sessionId);
        }

        if (fullStudent) {
          await storage.setItem('local:fullStudent', fullStudent);
          document.dispatchEvent(
            new CustomEvent('student-info', {
              detail: {
                hasStudent: true,
                login,
                ra: fullStudent.ra,
              },
            })
          );
        }

        if (!jwt && !fullStudent) {
          logger.warn('No matricula session or stored JWT available');
        }
      } catch (error) {
        logger.error(error, 'Failed to fetch full student info');
      }
    }
    return;
  },
  matches: [
    'http://localhost/*',
    'https://ufabc-matricula-snapshot.vercel.app/*',
    'https://matricula.ufabc.edu.br/matricula/*',
  ],
  runAt: 'document_end',
});
