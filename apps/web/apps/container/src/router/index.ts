import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { ReviewsView } from '@/views/Reviews';
import { PerformanceView } from '@/views/Performance';
import { PlanningView } from '@/views/Planning';
import { HistoryView } from '@/views/History';
import { StatsView } from '@/views/Stats';
import { SettingsView } from '@/views/Settings';
import { DonateView } from '@/views/Donate';
import { authStore } from 'stores';
import { SignUpView } from '@/views/SignUp';
import { ConfirmationView } from '@/views/Confirmation';
import { RecoveryView } from '@/views/Recovery';
import { CalengradeView } from '@/views/Calengrade';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/reviews',
    name: 'reviews',
    component: ReviewsView,
    meta: {
      title: 'Reviews',
      auth: true,
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

  const params = new URLSearchParams(window.location.search);

  if (params.get('token')) {
    return next();
  }

  const requireAuth = to.matched.some((record) => record.meta.auth === true);
  const requireConfirmed = to.matched.some(
    (record) => record.meta.confirmed === true,
  );
  const notAllowAuth = to.matched.some((record) => record.meta.auth === false);
  const notAllowConfirmed = to.matched.some(
    (record) => record.meta.confirmed === false,
  );

  const userToken = authStore.getState().token;
  const userConfirmed = authStore.getState().user?.confirmed;

  if (requireAuth) {
    if (userToken) return next();
    else if (process.env.VUE_APP_MF_ENV !== 'local') {
      return (window.location.pathname = '/');
    }
    return next();
  }
  if (requireConfirmed) {
    if (userToken) {
      if (userConfirmed) return next();
      return next('/signup');
    } else if (process.env.VUE_APP_MF_ENV !== 'local') {
      return (window.location.pathname = '/');
    }
    next('/reviews');
  }
  if (notAllowAuth) {
    if (userToken) return next('/reviews');
    return next();
  }
  if (notAllowConfirmed) {
    if (userConfirmed) return next('/reviews');
    return next();
  }
  return next();
});

export default router;
