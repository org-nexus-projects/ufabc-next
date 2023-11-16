import Axios from 'axios'
import Vue from 'vue'
import Auth from './Auth'

class User {
  constructor(){}

  async completeSignup(params = {}) {
    return await Axios.put('/users/complete', params)
  }

  async confirmSignup(params = {}) {
    // return await Axios.post('/users/me/confirm', params)
    const token = await Axios.post('/account/confirm', params)

    if(window.device) {
      await Auth.addDevice()
    }

    return token
  }

  async resendEmail() {
    return await Axios.post('/users/me/resend')
  }

  async recovery(email) {
    return await Axios.post('/users/me/recover', { email })
  }

  async facebookAuth(userData) {
    return await Axios.post('/users/me/recover', userData)  // mudar essa rota
  }

  async delete() {
    return await Axios.delete('/users/me/delete')
  }

  async info() {
    return await Axios.get('/users/info')
  }

  async relationships(breadth, depth) {
    return await Axios.get('/users/me/relationships', { params: {
      breadth: breadth,
      depth: depth
    }})
  }
}

export default (new User)