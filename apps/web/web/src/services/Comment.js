import Axios from 'axios'
import Vue from 'vue'

class Comment {
  constructor(){}

  async get(id) {
    return await Axios.get('/comment/' + id)
  }
}

export default (new Comment)