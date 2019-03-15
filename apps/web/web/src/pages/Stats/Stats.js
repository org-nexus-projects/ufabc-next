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
        rows: []
      },
      crDistributionOptions: {
        chart: {
          type: 'area',
          zoomType: 'x',
          panning: true,
          panKey: 'shift',
          
        },

        responsive: {
          rules: [{
            condition: {
              maxWidth: 1200
            },
            chartOptions: {
              legend: {
                  layout: 'horizontal',
                  align: 'center',
                  verticalAlign: 'bottom'
              }
            }
          }]
        },

        title: {
          text: ''
        },

        subtitle: {
          text: ''
        },

        annotations: [{
        labelOptions: {
          backgroundColor: 'rgba(255,255,255,1)',
          verticalAlign: 'top',
          y: 15
        },
        labels: [{
          point: {
              xAxis: 0,
              yAxis: 0,
              x: 27.98,
              y: 50
          },
          text: 'Arbois'
        }]
      }],

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
          name: 'Número de alunos',
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

      let maxWidth = 420
      let maxHeight = 280
      let onlyXs = this.$vuetify.breakpoint.xsOnly
      let screenWidth = this.$vuetify.breakpoint.width
      let width  =  onlyXs ? (screenWidth - 40) > maxWidth ? maxWidth : (screenWidth - 40) : maxWidth
      let height =  onlyXs ? (screenWidth - 140) > maxHeight ? maxHeight : (screenWidth - 140) : maxHeight

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
