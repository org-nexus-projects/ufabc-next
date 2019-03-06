import Axios from 'axios'
import Vue from 'vue'

class Review {
  constructor(){}

  async getTeacherConcepts(tearchId) {
    return await Axios.get('/help/teachers/' + tearchId)
  }

  
}

export default (new Review)