import Vue from 'vue'
import VueRouter from 'vue-router'

// Pages
import Reviews from '@/pages/Reviews'
import Stats from '@/pages/Stats'
import SignupForm from '@/pages/Signup/SignupForm'

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
  routes: [
    {
      path: '/signup',
      component: SignupForm,
      beforeEnter: RedirectIfLogged('/'),

      children: [
        // {
        //   name: 'register',
        //   path: 'Register',
        //   component: LoginRegister,
        //   meta: {
        //     title: 'login.register',
        //   },
        //   props: true,
        // },
      ],
    },

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
      name: 'reviews',
      path: '/stats',
      component: Stats,
      meta: {
        title: 'Stats',
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