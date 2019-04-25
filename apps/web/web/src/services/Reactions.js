import Axios from 'axios'
import Vue from 'vue'

class Reactions {
  constructor(){}

  async create(commentId, kind) {
    return await Axios.post('/reactions/' + commentId, { kind })
  }

  async delete(commentId, kind) {
    return await Axios.delete('/reactions/' + commentId + '/' + kind)
  }
}

export default (new Reactions)