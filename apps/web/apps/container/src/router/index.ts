import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { authStore } from 'stores';
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
const FacebookView = () => import('@/views/Facebook/FacebookView.vue');
const CalengradeView = () => import('@/views/Calengrade/CalengradeView.vue');

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
    path: '/calengrade',
    name: 'calengrade',
    component: CalengradeView,
    meta: {
      title: 'Calengrade',
      auth: true,
    },
  },
  {
    path: '/autenticar-facebook',
    name: 'Autenticar Facebook',
    component: FacebookView,
    meta: {
      title: 'Autenticar Facebook',
      auth: false,
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
  history: createWebHistory(process.env.VUE_APP_BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  document.title = (to.meta.title as string) || 'UFABC Next';

  const tokenParam = to.query.token;

  const { authenticate } = authStore.getState();

  if (isJWT(tokenParam as string)) {
    authenticate(tokenParam as string);
    return next({ query: { token: undefined } });
  }

  const requireAuth = to.matched.some((record) => record.meta.auth === true);
  const requireConfirmed = to.matched.some(
    (record) => record.meta.confirmed === true,
  );
  const notAllowAuth = to.matched.some((record) => record.meta.auth === false);
  const notAllowConfirmed = to.matched.some(
    (record) => record.meta.confirmed === false,
  );

  const { isLoggedIn, user } = authStore.getState();

  const userConfirmed = user?.confirmed;

  const isLocal = process.env.VUE_APP_MF_ENV === 'local';

  const notConfirmedRedirectPath = '/signup';
  const authenticatedRedirectPath = '/reviews';
  const notAuthenticatedRedirect = () =>
    isLocal ? next(notConfirmedRedirectPath) : (window.location.pathname = '/');

  if (requireAuth) {
    if (isLoggedIn()) return next();
    return notAuthenticatedRedirect();
  }
  if (requireConfirmed) {
    if (isLoggedIn()) {
      if (userConfirmed) return next();
      return next(notConfirmedRedirectPath);
    }
    return notAuthenticatedRedirect();
  }
  if (notAllowAuth) {
    if (isLoggedIn()) return next(authenticatedRedirectPath);
    return next();
  }
  if (notAllowConfirmed) {
    if (userConfirmed) return next(authenticatedRedirectPath);
    return next();
  }
  return next();
});

export default router;
