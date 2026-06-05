import { Auth } from '@ufabc-next/services';
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

import { isUserTokenExpired, isValidJwtFormat } from '@/helpers/utils/jwt';
import {
  AUTHENTICATED_REDIRECT_PATH,
  getUnauthenticatedRedirectPath,
  LANDING_PAGE_PATH,
  LOCAL_DEV_LOGIN_PATH,
  shouldUseLocalLogin,
} from '@/router/auth/authConfig';
import { useAuthStore } from '@/stores/auth';

const ReviewsPage = () => import('@/pages/Reviews/ReviewsPage.vue');
const PerformancePage = () => import('@/pages/Performance/PerformancePage.vue');
const PlanningPage = () => import('@/pages/Planning/PlanningPage.vue');
const HistoryPage = () => import('@/pages/History/HistoryPage.vue');
const StatsPage = () => import('@/pages/Stats/StatsPage.vue');
const SettingsPage = () => import('@/pages/Settings/SettingsPage.vue');
const DonatePage = () => import('@/pages/Donate/DonatePage.vue');
const SignUpPage = () => import('@/pages/SignUp/SignUpPage.vue');
const ConfirmationPage = () =>
  import('@/pages/Confirmation/ConfirmationPage.vue');
const RecoveryPage = () => import('@/pages/Recovery/RecoveryPage.vue');
const LoginPage = () => import('@/pages/Login/LoginPage.vue');
const CalengradePage = () => import('@/pages/Calengrade/CalengradePage.vue');
const WhatsappGroupsPage = () =>
  import('@/pages/WhatsappGroups/WhatsappGroupsPage.vue');
const HelpPage = () => import('@/pages/Help/HelpPage.vue');

const routes: Array<RouteRecordRaw> = [
  {
    path: '/reviews',
    name: 'reviews',
    component: ReviewsPage,
    meta: {
      title: 'Reviews',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/performance',
    name: 'performance',
    component: PerformancePage,
    meta: {
      title: 'Performance',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/planning',
    name: 'planning',
    component: PlanningPage,
    meta: {
      title: 'Planejamento',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryPage,
    meta: {
      title: 'Meu Histórico',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/stats',
    name: 'stats',
    component: StatsPage,
    meta: {
      title: 'Dados da Matrícula',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    meta: {
      title: 'Configurações',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/donate',
    name: 'donate',
    component: DonatePage,
    meta: {
      title: 'Ajude o Next',
      layout: 'include-sidebar',
    },
  },
  {
    name: 'signup',
    path: '/signup',
    component: SignUpPage,
    meta: {
      title: 'Cadastro',
      unconfirmedOnly: true,
    },
    props: true,
  },
  {
    name: 'confirm',
    path: '/confirm',
    component: ConfirmationPage,
    meta: {
      title: 'Confirmação da conta',
      unconfirmedOnly: true,
    },
  },
  {
    path: '/recovery',
    name: 'recovery',
    component: RecoveryPage,
    meta: {
      title: 'Recuperar conta',
      guestOnly: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      title: 'Entrar no Next',
      guestOnly: true,
    },
  },
  {
    path: '/grupos-whatsapp',
    name: 'whatsapp',
    component: WhatsappGroupsPage,
    meta: {
      title: 'Grupos do Whatsapp',
      layout: 'include-sidebar',
    },
  },
  {
    path: '/calengrade',
    name: 'calengrade',
    component: CalengradePage,
    meta: {
      title: 'Calengrade',
      layout: 'include-sidebar',
    },
  },

  {
    path: '/help',
    name: 'help',
    component: HelpPage,
    meta: {
      title: 'Ajuda',
      layout: 'include-sidebar',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      if (to.hash) {
        return {
          path: to.hash.replace('#', ''),
          hash: '',
          query: to.query,
        };
      }

      return {
        path: '/reviews',
        hash: '',
        query: to.query,
      };
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  updateDocumentTitle(to.meta.title as string | undefined);

  handleSignupAdviceIfNeeded(to);

  const tokenRedirect = await handleAuthValidationIfNeeded(to);
  if (tokenRedirect) return tokenRedirect;

  const authStatusRedirect = handleAuthStatus();
  if (authStatusRedirect) return authStatusRedirect;

  return resolveRouteAccess(to);
});

function updateDocumentTitle(title: string | undefined) {
  document.title = title || 'UFABC Next';
}

function handleSignupAdviceIfNeeded(to: RouteLocationNormalized) {
  const authStore = useAuthStore();

  // Edge case: /signup?advice=true enquanto logado
  // TODO: esse caso ainda é necessário?
  if (
    to.name === 'signup' &&
    to.query.advice === 'true' &&
    authStore.isLoggedIn
  ) {
    authStore.logOut();
  }
}

async function handleAuthValidationIfNeeded(to: RouteLocationNormalized) {
  const token = to.query.token as string | undefined;
  const component = to.query.component as string | undefined;

  if (!token) return;

  if (isValidJwtFormat(token)) {
    validateJwtAuth(token);
    return { path: AUTHENTICATED_REDIRECT_PATH };
  }

  return validateWhatsappAuth({ token, component });
}

// TODO: melhorar esse guard, talvez seja algo só pra rota de grupos do whatsapp mesmo, e não um guard global
async function validateWhatsappAuth({
  token,
  component,
}: {
  token: string;
  component?: string;
}) {
  const authStore = useAuthStore();

  try {
    const response = await Auth.getWhatsappToken(token, component);
    authStore.authenticate(response.token);
  } catch (error) {
    console.error('Failed to authenticate with WhatsApp token', error);
    return { name: 'signup' };
  }

  return {
    path: '/grupos-whatsapp',
    query: { component },
  };
}

function validateJwtAuth(token: string) {
  const authStore = useAuthStore();
  authStore.authenticate(token);
}

function handleAuthStatus() {
  const authStore = useAuthStore();

  if (!authStore.isLoggedIn || !authStore.user) {
    return;
  }

  if (!isUserTokenExpired(authStore.user)) {
    return;
  }

  authStore.logOut();
  return {
    path: getUnauthenticatedRedirectPath(window.location.hostname),
  };
}

// todo: não gosto dessa quantidade de condicionais, ver melhor depois
function resolveRouteAccess(to: RouteLocationNormalized) {
  const authStore = useAuthStore();
  const isLoggedIn = authStore.isLoggedIn;
  const isConfirmed = authStore.user?.confirmed ?? false;
  const authenticatedRedirectPath = AUTHENTICATED_REDIRECT_PATH;

  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth === true,
  );
  const requiresConfirmed = to.matched.some(
    (record) => record.meta.requiresConfirmed === true,
  );
  const guestOnly = to.matched.some((record) => record.meta.guestOnly === true);
  const unconfirmedOnly = to.matched.some(
    (record) => record.meta.unconfirmedOnly === true,
  );

  if (requiresConfirmed) {
    if (!isLoggedIn) return redirectToStaticRootIfProduction();
    if (!isConfirmed) return { name: 'signup' };
    return;
  }

  if (requiresAuth) {
    if (!isLoggedIn) return redirectToStaticRootIfProduction();
    return;
  }

  if (guestOnly) {
    if (isLoggedIn) return { name: authenticatedRedirectPath };
    return;
  }

  if (unconfirmedOnly) {
    if (isConfirmed) return { name: authenticatedRedirectPath };
    return;
  }
}

function redirectToStaticRootIfProduction() {
  const hostname = window.location.hostname;

  if (shouldUseLocalLogin(hostname)) {
    return { path: LOCAL_DEV_LOGIN_PATH };
  }

  // In production, force a full-page reload to the static site root.
  // Returning false cancels Vue Router navigation; the browser reload takes over.
  const landingPageUrl = new URL(LANDING_PAGE_PATH, window.location.origin);
  window.location.assign(landingPageUrl.toString());
  return false;
}

export default router;
