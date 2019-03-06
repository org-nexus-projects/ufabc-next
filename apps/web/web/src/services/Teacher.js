import Axios from 'axios'
import Vue from 'vue'

class Teacher {
  constructor(){}

  async search(q) {
    return await Axios.get('/teachers/search?q=' + q)
  }
}

export default (new Teacher)