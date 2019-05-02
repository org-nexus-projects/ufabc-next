import Axios from 'axios'
import Vue from 'vue'

class Enrollment {
  constructor(){}

  async list() {
    return await Axios.get('/enrollments')
  }

  async get(id) {
    return await Axios.get('/enrollments/' + id)
  }

}

export default (new Enrollment)