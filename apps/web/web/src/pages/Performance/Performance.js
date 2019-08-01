import _ from 'lodash'
import Performance from '@/services/Performance'

export default {
  name: 'Performance',
  data() {
    this.crHistorySettings = {
      area: true,
      labelMap: {
        season: 'Quadrimestre',
        cr_acumulado: 'Seu CR'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [{
              offset: 0, color: '#8E2DE2' // color at 0% position
          }, {
              offset: 1, color: '#4A00E0' // color at 100% position
          }],
          globa: false // false by default
        }
      },

      lineStyle: {
        color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
                offset: 0, color: '#8E2DE2' // color at 0% position
            }, {
                offset: 1, color: '#4A00E0' // color at 100% position
            }],
            globa: false // false by default
        }
      },

      itemStyle: {
        color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
                offset: 0, color: '#8E2DE2' // color at 0% position
            }, {
                offset: 1, color: '#4A00E0' // color at 100% position
            }],
            globa: false // false by default
        }
      },
    },
    this.crDistributionSettings = {
      area: true,
      labelMap: {
        _id: 'CR',
        total: 'Alunos'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [{
              offset: 0, color: '#8E2DE2' // color at 0% position
          }, {
              offset: 1, color: '#4A00E0' // color at 100% position
          }],
          globa: false // false by default
        }
      },

      lineStyle: {
        color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
                offset: 0, color: '#8E2DE2' // color at 0% position
            }, {
                offset: 1, color: '#4A00E0' // color at 100% position
            }],
            globa: false // false by default
        }
      },

      itemStyle: {
        color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
                offset: 0, color: '#8E2DE2' // color at 0% position
            }, {
                offset: 1, color: '#4A00E0' // color at 100% position
            }],
            globa: false // false by default
        }
      },
    }
    return {
      crHistoryxAxis: {
        name: 'Quadrimestre',
        nameLocation: 'center',
        nameGap: 30,
        type: 'category'
      },

      crHistoryyAxis: {
        name: 'CR',
        nameLocation: 'center',
        nameGap: 25,
        type: 'value'
      },
      
      crDistributionxAxis: {
        name: 'CR',
        nameLocation: 'center',
        nameGap: 30,
        splitNumber: 8,
      },
      crDistributionyAxis: {
        name: 'Quantidade de alunos',
        nameLocation: 'center',
        nameGap: 29,
      },
      crHistoryLoading: false,
      crDistributionLoading: false,
      crHistoryOptions: {
        columns: ['season', 'cr_acumulado'],
        rows: [],
      },

      crDistributionOptions: {
        columns: ['_id', 'total'],
        rows: [],
      },
    }
  },

  created() {
    this.fetch()
  },

  computed: {
    crSampleCount() {
      if(!this.getCurrentCr || !this.crDistributionOptions.rows.length) return

      return _.sumBy(this.crDistributionOptions.rows, 'total')
    },

    worstCrsCount() {
      if(!this.getCurrentCr || !this.crDistributionOptions.rows.length) return

      let filteredCrs = _.filter(this.crDistributionOptions.rows, (interval) => { return interval._id <= this.targetCrStudent._id })

      return _.sumBy(filteredCrs, 'total')
    },

    worstCrsPercentage() { 
      return ((this.worstCrsCount/this.crSampleCount) * 100).toFixed(2)
    },

    getUserMaxCr() {
      let maxCr = _.get(_.maxBy(this.crHistoryOptions.rows, 'cr_acumulado'),'cr_acumulado', 0) 
      return maxCr.toFixed(2)
    },

    getCurrentCr() {
      let currentCr = {
        cr_acumulado: 0,
      }
      
      if(this.crHistoryOptions.rows && this.crHistoryOptions.rows.length) {
        currentCr = this.crHistoryOptions.rows[this.crHistoryOptions.rows.length - 1]
      }
      
      return currentCr.cr_acumulado.toFixed(2)
    },

    targetCrStudent() {
      if(!this.getCurrentCr || !this.crDistributionOptions.rows.length) return
      
      let all_cr = []
      for(let interval of this.crDistributionOptions.rows) {
        all_cr.push(interval && interval._id)
      }

      let closest = all_cr.sort( (a, b) => Math.abs(this.getCurrentCr - a) - Math.abs(this.getCurrentCr - b) )[0]
      let target = _.find(this.crDistributionOptions.rows, { _id: closest })

      return target
    },

    bestQuad() {
      if(!this.crHistoryOptions.rows.length) return

      let best = _.maxBy(this.crHistoryOptions.rows, 'cr_quad');

      return best
    },

    maxCreditsQuad() {
      if(!this.crHistoryOptions.rows.length) return

      let maxCredits = _.maxBy(this.crHistoryOptions.rows, 'period_credits');

      return maxCredits
    },

    markPoint() {
      let point = {
        data: [
          {
            xAxis: this.targetCrStudent && this.targetCrStudent._id || "0",
            yAxis: this.targetCrStudent && this.targetCrStudent.total || '0',
            value: 'Vc',
            style: 'red',
            itemStyle: {
              color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 0,
                  colorStops: [{
                      offset: 0, color: '#409eff' // color at 0% position
                  }, {
                      offset: 1, color: '#409eff' // color at 100% position
                  }],
                  globa: false // false by default
              },
            },
            label: {
              textShadowBlur: 0,
              textShadowColor: 'transparent',
              textBorderColor: 'transparent',
            }
          }
        ]
      }

      return point
    }

  },

  methods: {
    fetch() {
      this.populateCrHistory()
      this.populateCrDistribution()    
    },

    async populateCrHistory() {
      this.crHistoryLoading = true
      try {
        let crHistoryData = await Performance.getCrHistory()
        this.crHistoryLoading = false
        if(!crHistoryData) return

        this.crHistoryOptions.rows = crHistoryData.data
      } catch(err) {
        this.crHistoryLoading = false
      }
    },

    async populateCrDistribution() {
      this.crDistributionLoading = true
      try {
        let crDistributionData = await Performance.getCrDistribution()
        this.crDistributionLoading = false
        if(!crDistributionData) return

        this.crDistributionOptions.rows = crDistributionData.data
      } catch(err) {
        this.crDistributionLoading = false
      }
    },
  },

}
