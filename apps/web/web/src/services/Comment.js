import Axios from 'axios'
import Vue from 'vue'

class Comment {
  constructor(){}

  async get(teacherId, subjectId = '') {
    return await Axios.get('/comment/' + teacherId + '/' + subjectId)
  }

  async missing() {
    return await Axios.get('/comment/missing')
  }
}

export default (new Comment)