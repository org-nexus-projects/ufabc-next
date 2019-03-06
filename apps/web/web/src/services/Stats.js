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

  
}

export default (new Stats)