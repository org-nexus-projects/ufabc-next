import Axios from 'axios'
import Vue from 'vue'
import JwtDecode from 'jwt-decode'

class Auth {
  constructor(){ 
    Vue.util.defineReactive(this, 'user', null)
    Vue.util.defineReactive(this, 'token', null)
    this.loadFromLocalStorage()

    this._listeners = []
  }

  async login(email, password) {
    return await Axios.post('/auth/login', {
      email: email,
      password: password
    })
  }

  logOut() {
    this.setToken(null)
  }

  isLoggedIn() {
    return !!this.user
  }

  setToken(token) {
    if (this.token == token) {
      return
    }

    try {
      localStorage.setItem('token', token)
      this.user = JwtDecode(token)
      this.token = token
    } catch (e) {
      localStorage.removeItem('token')
      this.token = null
      this.user = null
    }

    for (var k in this._listeners) {
      var listener = this._listeners[k]
      listener(this.user)
    }
  }

  onAuthStateChanged(callback) {
    if (! (callback in this._listeners) )
      this._listeners.push(callback)

    if(this.user !== undefined)
      setTimeout(() => callback(this.user), 0)
  }

  loadFromLocalStorage() {
    const token = localStorage.getItem('token') || null
    this.setToken(token)
  }

  async forgot(email) {
    return await Axios.get('/auth/reset', {
      params: {
        email: email
      }
    })
  }

  async reset(user) {
    return await Axios.post('/auth/reset', user)
  }

  async register(form) {
    return await Axios.post('/auth/register', form)
  }

  async confirm(token) {
    return await Axios.post('/auth/confirm', { token })
  }

  async complete(user) {
    return await Axios.post('/auth/complete', user)
  }
}

export default (new Auth)