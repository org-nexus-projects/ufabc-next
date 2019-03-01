import Vue from 'vue'
import VueRouter from 'vue-router'

// Pages
// import Login from '@/pages/Login'

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

    // {
    //   alias: '/',
    //   name: 'order-create',
    //   path: '/orders/new',
    //   component: OrderEditor,
    //   meta: {
    //     title: 'Criar novo Pedido',
    //     auth: true
    //   },
    // },

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