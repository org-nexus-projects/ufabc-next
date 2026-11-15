import { Auth } from '@next/services';
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
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
import { logger } from '@/utils/logger';

async function ReviewsPage() {
  return await import('@/pages/Reviews/ReviewsPage.vue');
}
async function PerformancePage() {
  return await import('@/pages/Performance/PerformancePage.vue');
}
async function PlanningPage() {
  return await import('@/pages/Planning/PlanningPage.vue');
}
async function HistoryPage() {
  return await import('@/pages/History/HistoryPage.vue');
}
async function StatsPage() {
  return await import('@/pages/Stats/StatsPage.vue');
}
async function SettingsPage() {
  return await import('@/pages/Settings/SettingsPage.vue');
}
async function DonatePage() {
  return await import('@/pages/Donate/DonatePage.vue');
}
async function SignUpPage() {
  return await import('@/pages/SignUp/SignUpPage.vue');
}
async function ConfirmationPage() {
  return await import('@/pages/Confirmation/ConfirmationPage.vue');
}
async function RecoveryPage() {
  return await import('@/pages/Recovery/RecoveryPage.vue');
}
async function LoginPage() {
  return await import('@/pages/Login/LoginPage.vue');
}
async function CalengradePage() {
  return await import('@/pages/Calengrade/CalengradePage.vue');
}
async function WhatsappGroupsPage() {
  return await import('@/pages/WhatsappGroups/WhatsappGroupsPage.vue');
}
async function ArchivesPage() {
  return await import('@/pages/Archives/ArchivesPage.vue');
}
async function HelpPage() {
  return await import('@/pages/Help/HelpPage.vue');
}

const routes: RouteRecordRaw[] = [
  {
    component: ReviewsPage,
    meta: {
      requiresAuth: true,
      requiresConfirmed: true,
      title: 'Reviews',
    },
    name: 'reviews',
    path: '/reviews',
  },
  {
    component: PerformancePage,
    meta: {
      requiresAuth: true,
      requiresConfirmed: true,
      title: 'Performance',
    },
    name: 'performance',
    path: '/performance',
  },
  {
    component: PlanningPage,
    meta: {
      requiresAuth: true,
      requiresConfirmed: true,
      title: 'Planejamento',
    },
    name: 'planning',
    path: '/planning',
  },
  {
    component: HistoryPage,
    meta: {
      requiresAuth: true,
      requiresConfirmed: true,
      title: 'Meu Histórico',
    },
    name: 'history',
    path: '/history',
  },
  {
    component: StatsPage,
    meta: {
      requiresAuth: true,
      requiresConfirmed: true,
      title: 'Dados da Matrícula',
    },
    name: 'stats',
    path: '/stats',
  },
  {
    component: SettingsPage,
    meta: {
      requiresAuth: true,
      requiresConfirmed: true,
      title: 'Configurações',
    },
    name: 'settings',
    path: '/settings',
  },
  {
    component: DonatePage,
    meta: {
      layout: 'include-sidebar',
      title: 'Ajude o Next',
    },
    name: 'donate',
    path: '/donate',
  },
  {
    component: SignUpPage,
    meta: {
      title: 'Cadastro',
      unconfirmedOnly: true,
    },
    name: 'signup',
    path: '/signup',
    props: true,
  },
  {
    component: ConfirmationPage,
    meta: {
      title: 'Confirmação da conta',
      unconfirmedOnly: true,
    },
    name: 'confirm',
    path: '/confirm',
  },
  {
    component: RecoveryPage,
    meta: {
      guestOnly: true,
      title: 'Recuperar conta',
    },
    name: 'recovery',
    path: '/recovery',
  },
  {
    component: LoginPage,
    meta: {
      guestOnly: true,
      title: 'Entrar no Next',
    },
    name: 'login',
    path: '/login',
  },
  {
    component: WhatsappGroupsPage,
    meta: {
      layout: 'include-sidebar',
      title: 'Grupos do Whatsapp',
    },
    name: 'whatsapp',
    path: '/grupos-whatsapp',
  },
  {
    component: CalengradePage,
    meta: {
      layout: 'include-sidebar',
      title: 'Calengrade',
    },
    name: 'calengrade',
    path: '/calengrade',
  },

  {
    component: ArchivesPage,
    meta: {
      permissions: ['admin', 'archives'],
      requiresAuth: true,
      requiresConfirmed: true,
      title: 'Arquivos',
    },
    name: 'archives',
    path: '/archives',
  },
  {
    component: HelpPage,
    meta: {
      layout: 'include-sidebar',
      title: 'Ajuda',
    },
    name: 'help',
    path: '/help',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      if (to.hash) {
        return {
          hash: '',
          path: to.hash.replace('#', ''),
          query: to.query,
        };
      }

      return {
        hash: '',
        path: '/reviews',
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
  updateDocumentTitle(readQueryString(to.meta.title));

  handleSignupAdviceIfNeeded(to);

  const tokenRedirect = await handleAuthValidationIfNeeded(to);
  if (tokenRedirect) {
    return tokenRedirect;
  }

  const authStatusRedirect = handleAuthStatus();
  if (authStatusRedirect) {
    return authStatusRedirect;
  }

  return resolveRouteAccess(to);
});

function updateDocumentTitle(title: string | undefined) {
  document.title = title === undefined || title === '' ? 'UFABC Next' : title;
}

function readQueryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function handleSignupAdviceIfNeeded(to: RouteLocationNormalized) {
  const authStore = useAuthStore();

  // Edge case: /signup?advice=true enquanto logado
  if (
    to.name === 'signup' &&
    to.query.advice === 'true' &&
    authStore.isLoggedIn
  ) {
    authStore.logOut();
  }
}

async function handleAuthValidationIfNeeded(to: RouteLocationNormalized) {
  const token = readQueryString(to.query.token);
  const component = readQueryString(to.query.component);

  if (token === undefined || token === '') {
    return;
  }

  if (isValidJwtFormat(token)) {
    validateJwtAuth(token);
    return { path: AUTHENTICATED_REDIRECT_PATH };
  }

  return await validateWhatsappAuth({ component, token });
}

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

function resolveRouteAccess(to: RouteLocationNormalized) {
  const authStore = useAuthStore();
  const isLoggedIn = authStore.isLoggedIn;
  const isConfirmed = authStore.user?.confirmed ?? false;
  const authenticatedRedirectPath = AUTHENTICATED_REDIRECT_PATH;

  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth === true
  );
  const requiresConfirmed = to.matched.some(
    (record) => record.meta.requiresConfirmed === true
  );
  const guestOnly = to.matched.some((record) => record.meta.guestOnly === true);
  const unconfirmedOnly = to.matched.some(
    (record) => record.meta.unconfirmedOnly === true
  );

  if (requiresConfirmed) {
    if (!isLoggedIn) {
      return redirectToStaticRootIfProduction();
    }
    if (!isConfirmed) {
      return { name: 'signup' };
    }
    if (!hasRoutePermission(to)) {
      return { path: authenticatedRedirectPath };
    }
    return;
  }

  if (requiresAuth) {
    if (!isLoggedIn) {
      return redirectToStaticRootIfProduction();
    }
    return;
  }

  if (guestOnly) {
    if (isLoggedIn) {
      return { name: authenticatedRedirectPath };
    }
    return;
  }

  if (unconfirmedOnly && isConfirmed) {
    return { name: authenticatedRedirectPath };
  }
}

function hasRoutePermission(to: RouteLocationNormalized) {
  const requiredPermissions = to.meta.permissions;
  if (!Array.isArray(requiredPermissions)) {
    return true;
  }

  const userPermissions = useAuthStore().user?.permissions ?? [];
  return requiredPermissions.some(
    (permission) =>
      typeof permission === 'string' && userPermissions.includes(permission)
  );
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
