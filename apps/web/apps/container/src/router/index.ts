import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import {
  AUTHENTICATED_REDIRECT_PATH,
  LANDING_PAGE_PATH,
  LOCAL_DEV_LOGIN_PATH,
  shouldUseLocalLogin,
  SIGN_UP_PATH,
} from '@/router/auth/authConfig';
import { useAuthStore } from '@/stores/auth';

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

const isJWT = (token: string) =>
  /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/.test(token);

const routes: Array<RouteRecordRaw> = [
  {
    path: '/reviews',
    name: 'reviews',
    component: ReviewsView,
    meta: {
      title: 'Reviews',
      confirmed: true,
    },
  },
  {
    path: '/performance',
    name: 'performance',
    component: PerformanceView,
    meta: {
      title: 'Performance',
      confirmed: true,
    },
  },
  {
    path: '/planning',
    name: 'planning',
    component: PlanningView,
    meta: {
      title: 'Planejamento',
      confirmed: true,
    },
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView,
    meta: {
      title: 'Meu Histórico',
      confirmed: true,
    },
  },
  {
    path: '/stats',
    name: 'stats',
    component: StatsView,
    meta: {
      title: 'Dados da Matrícula',
      confirmed: true,
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: {
      title: 'Configurações',
      confirmed: true,
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
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: 'Entrar no Next',
      auth: false,
    },
  },
  {
    name: 'signup',
    path: '/signup',
    component: SignUpView,
    meta: {
      title: 'Cadastro',
      confirmed: false,
    },
    props: true,
  },
  {
    name: 'confirm',
    path: '/confirm',
    component: ConfirmationView,
    meta: {
      title: 'Confirmação da conta',
      confirmed: false,
    },
  },
  {
    path: '/recovery',
    name: 'recovery',
    component: RecoveryView,
    meta: {
      title: 'Recuperar conta',
      auth: false,
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

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  document.title = (to.meta.title as string) || 'UFABC Next';
  const hostname = window.location.hostname;

  const redirectToLandingPage = () => {
    const landingPageUrl = new URL(LANDING_PAGE_PATH, window.location.origin);
    window.location.assign(landingPageUrl.toString());
  };

  const redirectUnauthenticatedUser = () => {
    if (shouldUseLocalLogin(hostname)) {
      next(LOCAL_DEV_LOGIN_PATH);
      return;
    }

    redirectToLandingPage();
  };

  //EDGE CASE: /signup?advice=true enquanto logado
  if (
    to.name === 'signup' &&
    to.query.advice === 'true' &&
    authStore.isLoggedIn
  ) {
    authStore.logOut(false);
    return next();
  }

  const tokenParam = to.query.token;

  if (isJWT(tokenParam as string)) {
    authStore.authenticate(tokenParam as string);
    return next({
      hash: to.hash,
      path: to.path,
      query: {
        ...to.query,
        token: undefined,
      },
    });
  }

  const requireAuth = to.matched.some((record) => record.meta.auth === true);
  const requireConfirmed = to.matched.some(
    (record) => record.meta.confirmed === true,
  );
  const notAllowAuth = to.matched.some((record) => record.meta.auth === false);
  const notAllowConfirmed = to.matched.some(
    (record) => record.meta.confirmed === false,
  );

  if (authStore.isLoggedIn && authStore.user) {
    const expirationPeriod = 1 * 24 * 60 * 60; // 1 day
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = authStore.user.iat + expirationPeriod;

    if (expirationTime < currentTime) {
      authStore.logOut(false);
      return redirectUnauthenticatedUser();
    }
  }

  const userConfirmed = authStore.user?.confirmed;
  const notConfirmedRedirectPath = SIGN_UP_PATH;
  const authenticatedRedirectPath = AUTHENTICATED_REDIRECT_PATH;

  if (to.name === 'login' && !shouldUseLocalLogin(hostname)) {
    redirectToLandingPage();
    return;
  }

  if (requireAuth) {
    if (authStore.isLoggedIn) return next();
    return redirectUnauthenticatedUser();
  }
  if (requireConfirmed) {
    if (authStore.isLoggedIn) {
      if (userConfirmed) return next();
      return next(notConfirmedRedirectPath);
    }
    return redirectUnauthenticatedUser();
  }
  if (notAllowAuth) {
    if (authStore.isLoggedIn) return next(authenticatedRedirectPath);
    return next();
  }
  if (notAllowConfirmed) {
    if (userConfirmed) return next(authenticatedRedirectPath);
    return next();
  }
  return next();
});

export default router;
