import Axios from 'axios'
import Vue from 'vue'

class Review {
  constructor(){}

  async getTeacherConcepts(tearchId) {
    return await Axios.get('/reviews/teachers/' + tearchId)
  }

  async getSubjectConcepts(subjectId) {
    return await Axios.get('/reviews/subjects/' + subjectId)
  }
  
}

export default (new Review)