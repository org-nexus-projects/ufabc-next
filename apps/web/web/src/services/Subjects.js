import Axios from 'axios'
import Vue from 'vue'

class Subjects {
  constructor(){}

  async search(q) {
    return await Axios.get('/subjects/search?q=' + q)
  }
}

export default (new Subjects)