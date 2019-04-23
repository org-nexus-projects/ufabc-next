import Axios from 'axios'

class Stats {
  constructor(){}

  async getCrHistory(studentId) {
    let mockedData = [
      {
        season: '2016-1',
        cr: 2.45
      },
      {
        season: '2016-2',
        cr: 2.67
      },
      {
        season: '2016-3',
        cr: 2.89
      },
      {
        season: '2017-1',
        cr: 2.21
      },
      {
        season: '2017-2',
        cr: 1.56
      },
      {
        season: '2017-3',
        cr: 1.20
      }
    ]
    // return await Axios.get('/help/teachers/' + studentId)
    return mockedData
  }

  async getCrDistribution() {
    let mockedData = [
      [1.05, 100],
      [1.55, 130],
      [2.05, 400],
      [2.65, 600],
      [2.95, 400],
      [3.35, 100],
      [3.05, 50],
      [3.45, 10],
      [3.45, 10],
      [4.00, 1],
    ]
    // return await Axios.get('/help/teachers/' + studentId)
    return mockedData
  }

  async matricula(action, params) {
    return await Axios.get('/stats/disciplinas/' + action, { params })
  }

  async matriculaUsage(params) {
    return await Axios.get('/stats/usage/', { params })
  }
  
}

export default (new Stats)