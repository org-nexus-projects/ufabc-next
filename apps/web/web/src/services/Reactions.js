import Axios from 'axios'
import Vue from 'vue'

class Reactions {
  constructor(){}

  async create(commentId, kind) {
    return await Axios.post('/reactions/' + commentId, { kind })
  }

  async delete(id) {
    return await Axios.delete('/reactions/' + id)
  }
}

export default (new Reactions)