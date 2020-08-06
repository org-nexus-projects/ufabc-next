import Axios from 'axios'

class Performance {
  constructor(){}

  async getCrHistory() {
    return await Axios.get('/users/me/grades')
  }

  async getCrDistribution() {
    return await Axios.get('/stats/grades')
  }

  async getCpHistory() {
    return Axios.get('/historiesGraduations')
  }
}

export default (new Performance)