import Axios from 'axios'
import Vue from 'vue'

class User {
  constructor(){}

  async completeSignup(params = {}) {
    return await Axios.put('/users/complete', params)
  }

  async confirmSignup(params = {}) {
    return await Axios.post('/users/me/confirm', params)
  }

  async resendEmail() {
    return await Axios.post('/users/me/resend')
  }

  async delete() {
    return await Axios.delete('/users/me/')
  }

  async info() {
    return await Axios.get('/users/info')
  }
}

export default (new User)