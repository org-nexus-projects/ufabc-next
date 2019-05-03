import Axios from 'axios'

class Stats {
  constructor(){}
  
  async matricula(action, params) {
    return await Axios.get('/stats/disciplinas/' + action, { params })
  }

  async matriculaUsage(params) {
    return await Axios.get('/stats/usage/', { params })
  }
  
}

export default (new Stats)