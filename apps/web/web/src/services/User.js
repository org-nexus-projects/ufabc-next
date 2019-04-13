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
}

export default (new User)