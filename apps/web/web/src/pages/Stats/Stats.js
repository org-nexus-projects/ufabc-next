import _ from 'lodash'
import VueHighcharts from 'vue2-highcharts'
import Highcharts3D from "highcharts/highcharts-3d";
import Highcharts from "highcharts";

import Stats from '@/services/Stats'

export default {
  name: 'Stats',
  components: {
    VueHighcharts,
  },
  data() {
    this.crHistorySettings = {
      area: true,
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
      }
    }
    return {
      Highcharts,
      studentId: '11012014',
      crHistoryLoading: false,
      crDistributionLoading: false,
      crHistoryOptions: {
        columns: ['season', 'cr'],
        rows: [
          // { 'cr': 2.56, 'season': '01/01',},
          // { 'cr': 2.60, 'season': '01/02',},
          // { 'cr': 2.90, 'season': '01/03',},
          // { 'cr': 3.19, 'season': '01/04',},
          // { 'cr': 2.12, 'season': '01/05',},
          // { 'cr': 2.34, 'season': '01/06',}
        ]
      },
      crDistributionOptions: {
        chart: {
          type: 'area',
          zoomType: 'x',
          panning: true,
          panKey: 'shift',
          scrollablePlotArea: {
            minWidth: 600
          }
        },

        title: {
          text: 'Distribuição de CR'
        },

        subtitle: {
          text: 'An annotated chart in Highcharts'
        },

        annotations: [{
          labelOptions: {
            backgroundColor: 'rgba(255,255,255,0.5)',
            verticalAlign: 'top',
            y: 15
          },
          labels: [{
            point: {
              xAxis: 0,
              yAxis: 0,
              x: 3.0,
              y: 228
            },
            text: 'Você'
          },]
        },],

        xAxis: {
          labels: {
            format: '{value}'
          },
          minRange: 4,
          title: {
            text: 'CR'
          }
        },

        yAxis: {
          startOnTick: true,
          endOnTick: false,
          maxPadding: 0.35,
          title: {
            text: null
          },
          labels: {
            format: '{value}'
          }
        },

        tooltip: {
          headerFormat: '{point.x:.1f}<br>',
          shared: true
        },

        legend: {
          enabled: false
        },

        series: [{
          data: [],
          lineColor: Highcharts.getOptions().colors[1],
          color: Highcharts.getOptions().colors[2],
          fillOpacity: 0.5,
          name: 'Elevation',
          marker: {
            enabled: false
          },
          threshold: null
        }]
      }

    } 
  },

  created() {
    this.fetch()
  },

  computed: {
    //
  },

  methods: {
    fetch() {
      this.populateCrHistory()
      this.populateCrDistribution()    
    },

    async populateCrHistory() {
      this.crHistoryLoading = true
      try {
        let crHistoryData = await Stats.getCrHistory(this.studentId)
        if(!crHistoryData) return

        this.crHistoryOptions.rows = crHistoryData
        this.crHistoryLoading = false
      } catch(err) {
        this.statsLoading = false
      }
    },

    async populateCrDistribution() {
      this.crDistributionLoading = true
      try {
        let crDistributionData = await Stats.getCrDistribution()
        if(!crDistributionData) return

        crDistributionData.map((el) => {
          this.crDistributionOptions.series[0].data.push(el)  
        })

        this.crDistributionLoading = false
      } catch(err) {
        this.crDistributionLoading = false
      }
    },
  },

}
