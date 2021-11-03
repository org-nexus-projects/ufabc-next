import Vue from 'vue'
import VueRouter from 'vue-router'

// Pages
import Reviews from '@/pages/Reviews'
import Performance from '@/pages/Performance'
import Register from '@/pages/Register'
import Planning from '@/pages/Planning'
import SignupForm from '@/pages/Signup/SignupForm'
import Confirmation from '@/pages/Signup/Confirmation'
import jsonwebtoken from 'jsonwebtoken'
import History from '@/pages/History'
import Settings from '@/pages/Settings'
import Stats from '@/pages/Stats'
import Admin from '@/pages/Admin'
import Relationship from '@/pages/Relationship'
import Recovery from '@/pages/Recovery'

import Auth from '@/services/Auth'

function RedirectIfLogged(params) {
  return function (to, from, next) {
    if(to.name == 'login') {
      let token = _.get(to, 'query.token', null)
      if(!token) {
        const inApp = !!window.cordova
          
        if(!inApp) {
          window.location = process.env.VUE_APP_HOME_URL

          return
        }

        return next('/register')
      }

      Auth.setToken(token)

      let decodedToken = jsonwebtoken.decode(token)
      if(!decodedToken || !decodedToken.confirmed || !decodedToken.active) {
        return next('/signup')
      }
    }
    
    // if((to.name == 'register' || to.name == 'reset-password' || to.name == 'forgot-password' || to.name == 'complete-account') && Auth.isLoggedIn()){
    //   Auth.logOut()
    //   return next(to.fullPath)
    // }

    if (Auth.isLoggedIn()) {
      return next(params)
    }
    next()
  }
}

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  base: '/app',
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
      name: 'login',
      path: '/login',
      beforeEnter: RedirectIfLogged('/'),
    },

    {
      name: 'signup',
      path: '/signup',
      component: SignupForm,
      meta: {
        title: 'Cadastro',
      },
      props: true,
    },

    {
      name: 'reviews',
      path: '/reviews',
      component: Reviews,
      meta: {
        title: 'Reviews',
        auth: true
      },
      props: true,
    },

    {
      name: 'performance',
      path: '/performance',
      component: Performance,
      meta: {
        title: 'Performance',
        auth: true
      },
    },

    {
      name: 'planejamento',
      path: '/planning',
      component: Planning,
      meta: {
        title: 'Planejamento',
        auth: true
      },
    },

    {
      name: 'confirm',
      path: '/confirm',
      component: Confirmation,
      meta: {
        title: 'Confirmação da conta',
      }
    },

    {
      name: 'history',
      path: '/history',
      component: History,
      meta: {
        title: 'Meu Histórico',
        auth: true
      },
    },

    {
      name: 'stats',
      path: '/stats',
      component: Stats,
      meta: {
        title: 'Dados da Matrícula',
        auth: true
      },
    },

    {
      name: 'recovery',
      path: '/recovery',
      component: Recovery,
      meta: {
        title: 'Recuperar conta'
      },
    },

    {
      name: 'settings',
      path: '/settings',
      component: Settings,
      meta: {
        title: 'Configurações',
        auth: true
      },
    },

    {
      name: 'admin',
      path: '/admin',
      component: Admin,
      meta: {
        title: 'Administrativo',
        auth: true
      },
    },

    {
      name: 'relationship',
      path: '/relationship',
      component: Relationship,
      meta: {
        title: 'Minhas conexões',
        auth: true
      },
    },
    {
      alias: '/',
      name: 'register',
      path: '/register',
      component: Register
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