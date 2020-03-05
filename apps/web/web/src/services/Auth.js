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

  loadFromLocalStorage() {
    const token = localStorage.getItem('token') || null
    this.setToken(token)
  }

  onAuthStateChanged(callback) {
    if (! (callback in this._listeners) )
      this._listeners.push(callback)

    if(this.user !== undefined)
      setTimeout(() => callback(this.user), 0)
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

  async addDevice() {
    const firebaseToken = localStorage.getItem('firebaseToken') || null
    const deviceId = window.device.uuid

    if(this.isLoggedIn() && firebaseToken && deviceId) {
       await Axios.post('/users/me/devices', { token: firebaseToken, deviceId: deviceId })
    }
 }

  async removeDevice() {
    const deviceId = window.device.uuid

    if(deviceId) {
      return await Axios.delete(`/users/me/devices/${deviceId}`)
    }

  }
}

export default (new Auth)