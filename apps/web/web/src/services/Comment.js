import Axios from 'axios'
import Vue from 'vue'

class Comment {
  constructor(){}

  async get(teacherId, subjectId = '', params) {
    return await Axios.get('/comments/' + teacherId + '/' + subjectId, { params })
  }

  async create(body) {
    return await Axios.post('/comments/', body)
  }

  async update(id, body) {
    return await Axios.put('/comments/' + id, body)
  }
}

export default (new Comment)