import Vue from 'vue'
import VueRouter from 'vue-router'

// Pages
import Reviews from '@/pages/Reviews'
import Stats from '@/pages/Stats'
import SignupForm from '@/pages/Signup/SignupForm'
import Confirmation from '@/pages/Signup/Confirmation'
import jsonwebtoken from 'jsonwebtoken'

import Auth from '@/services/Auth'
// import UsersService from '@/services/Users'

function RedirectIfLogged(params) {
  return function (to, from, next) {
    console.log("TO AQUI tchela", to)
    if(to.name == 'login' && !Auth.isLoggedIn()) {
      let token = _.get(to, 'query.token', null)
      Auth.setToken(token)

      let decodedToken = jsonwebtoken.decode(token)

      if(!decodedToken.confirmed) {
        return next('/signup')
      }
    }
    if((to.name == 'register' || to.name == 'reset-password' || to.name == 'forgot-password' || to.name == 'complete-account') && Auth.isLoggedIn()){
      Auth.logOut()
      return next(to.fullPath)
    }

    if (Auth.isLoggedIn()) {
      return next(params)
    }
    next()
  }
}

function confirmAccount(params) {
  return function (to, from, next) {
    console.log("Confirm account", to)
    if(to.name == 'login' && !Auth.isLoggedIn()) {
      let token = _.get(to, 'query.token', null)
      Auth.setToken(token)

      let decodedToken = jsonwebtoken.decode(token)

      if(!decodedToken.confirmed) {
        return next('/signup')
      }
    }
    if((to.name == 'register' || to.name == 'reset-password' || to.name == 'forgot-password' || to.name == 'complete-account') && Auth.isLoggedIn()){
      Auth.logOut()
      return next(to.fullPath)
    }

    if (Auth.isLoggedIn()) {
      return next(params)
    }
    next()
  }
}

Vue.use(VueRouter)
const router = new VueRouter({
  mode: 'history',
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
        title: 'Signup',
      },
      props: true,
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

    {
      name: 'confirm',
      path: '/confirm',
      component: Confirmation,
      meta: {
        title: 'Confirmation',
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