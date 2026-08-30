import { Auth } from '@next/services';
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { logger } from '@/utils/logger';
import { createRouter, createWebHistory } from 'vue-router';

import {
  AUTHENTICATED_REDIRECT_PATH,
  getUnauthenticatedRedirectPath,
  LANDING_PAGE_PATH,
  LOCAL_DEV_LOGIN_PATH,
  shouldUseLocalLogin,
} from '@/router/auth/authConfig';
import { useAuthStore } from '@/stores/auth';
import { isUserTokenExpired, isValidJwtFormat } from '@/utils/jwt';

const ReviewsView = () => import('@/views/Reviews/ReviewsView.vue');
const PerformanceView = () => import('@/views/Performance/PerformanceView.vue');
const PlanningView = () => import('@/views/Planning/PlanningView.vue');
const HistoryView = () => import('@/views/History/HistoryView.vue');
const StatsView = () => import('@/views/Stats/StatsView.vue');
const SettingsView = () => import('@/views/Settings/SettingsView.vue');
const DonateView = () => import('@/views/Donate/DonateView.vue');
const SignUpView = () => import('@/views/SignUp/SignUpView.vue');
const ConfirmationView = () =>
  import('@/views/Confirmation/ConfirmationView.vue');
const RecoveryView = () => import('@/views/Recovery/RecoveryView.vue');
const LoginView = () => import('@/views/Login/LoginView.vue');
const CalengradeView = () => import('@/views/Calengrade/CalengradeView.vue');
const WhatsappGroupsView = () =>
  import('@/views/WhatsappGroups/WhatsappGroupsView.vue');
const HelpView = () => import('@/views/Help/HelpView.vue');

const routes: Array<RouteRecordRaw> = [
  {
    path: '/reviews',
    name: 'reviews',
    component: ReviewsView,
    meta: {
      title: 'Reviews',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/performance',
    name: 'performance',
    component: PerformanceView,
    meta: {
      title: 'Performance',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/planning',
    name: 'planning',
    component: PlanningView,
    meta: {
      title: 'Planejamento',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView,
    meta: {
      title: 'Meu Histórico',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/stats',
    name: 'stats',
    component: StatsView,
    meta: {
      title: 'Dados da Matrícula',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: {
      title: 'Configurações',
      requiresAuth: true,
      requiresConfirmed: true,
    },
  },
  {
    path: '/donate',
    name: 'donate',
    component: DonateView,
    meta: {
      title: 'Ajude o Next',
      layout: 'include-sidebar',
    },
  },
  {
    name: 'signup',
    path: '/signup',
    component: SignUpView,
    meta: {
      title: 'Cadastro',
      unconfirmedOnly: true,
    },
    props: true,
  },
  {
    name: 'confirm',
    path: '/confirm',
    component: ConfirmationView,
    meta: {
      title: 'Confirmação da conta',
      unconfirmedOnly: true,
    },
  },
  {
    path: '/recovery',
    name: 'recovery',
    component: RecoveryView,
    meta: {
      title: 'Recuperar conta',
      guestOnly: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: 'Entrar no Next',
      guestOnly: true,
    },
  },
  {
    path: '/grupos-whatsapp',
    name: 'whatsapp',
    component: WhatsappGroupsView,
    meta: {
      title: 'Grupos do Whatsapp',
      layout: 'include-sidebar',
    },
  },
  {
    path: '/calengrade',
    name: 'calengrade',
    component: CalengradeView,
    meta: {
      title: 'Calengrade',
      layout: 'include-sidebar',
    },
  },

  {
    path: '/help',
    name: 'help',
    component: HelpView,
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
    logger.error({ error }, 'Failed to authenticate with WhatsApp token');
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
