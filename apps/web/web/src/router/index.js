import Vue from 'vue'
import VueRouter from 'vue-router'

// Pages
import Reviews from '@/pages/Reviews'
import Stats from '@/pages/Stats'
import History from '@/pages/History'
import Settings from '@/pages/Settings'
import Admin from '@/pages/Admin'

import Auth from '@/services/Auth'
// import UsersService from '@/services/Users'

function RedirectIfLogged(params) {
  return function (to, from, next) {
    // if((to.name == 'register' || to.name == 'reset-password' || to.name == 'forgot-password' || to.name == 'complete-account') && Auth.isLoggedIn()){
    //   Auth.logOut()
    //   return next(to.fullPath)
    // }

    // if (Auth.isLoggedIn()) {
    //   return next(params)
    // }
    next()
  }
}

Vue.use(VueRouter)
const router = new VueRouter({
  mode: 'history',
  scrollBehavior (to, from, savedPosition) {
    return { x: 0, y: 0 }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition)
        } else {
          resolve({ x: 0, y: 0 })
        }
      }, 1000)
    })
  },
  routes: [

    {
      alias: '/',
      name: 'reviews',
      path: '/reviews',
      component: Reviews,
      meta: {
        title: 'Reviews',
        // auth: true
      },
      props: true,
    },
    
    {
      name: 'stats',
      path: '/stats',
      component: Stats,
      meta: {
        title: 'Stats',
        // auth: true
      },
    },

    {
      name: 'history',
      path: '/history',
      component: History,
      meta: {
        title: 'Meu Histórico',
        // auth: true
      },
    },

    {
      name: 'settings',
      path: '/settings',
      component: Settings,
      meta: {
        title: 'Configurações',
        // auth: true
      },
    },

    {
      name: 'admin',
      path: '/admin',
      component: Admin,
      meta: {
        title: 'Administrativo',
        // auth: true
      },
    },

    // { path: '*', redirect: '/login' }
  ]
})

router.beforeEach(function (to, from, next) {

  if (!to.meta.dontUpdateTitle) {
    document.title = to.meta.title || 'UFABC Next'
  }
  
  next()
})


// Redirect on logout/login
Auth.onAuthStateChanged(function (user) {
  if (!user && router.currentRoute.meta.auth) {
    // User Logged out
    router.push({
      path: '/login'
    })
  }
})


export default router