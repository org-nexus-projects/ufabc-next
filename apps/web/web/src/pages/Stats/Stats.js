import _ from 'lodash'
import Stats from '@/services/Stats'

export default {
  name: 'Stats',

  data() {
    this.chartSettings = {
      area: true
    }
    return {
      studentId: '11012014',
      statsLoading: false,
      chartData: {
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

      chartData2: {
          columns: ['crInterval', 'count',],
          rows: [
            { 'count': 300, 'crInterval': '0.0 <= cr < 1.0', },
            { 'count': 600, 'crInterval': '1.0 <= cr < 2.0', },
            { 'count': 2000, 'crInterval': '2.0 <= cr < 3.0', },
            { 'count': 200, 'crInterval': '3.0 <= cr <= 4.0', },
          ]
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

    async fetch() {
      this.statsLoading = true
      try {
        let res = await Stats.getCrHistory(this.studentId)
        if(!res) return

        this.chartData.rows = res
        this.statsLoading = false
        
      } catch(err) {
        this.statsLoading = false
        // this.$message({
        //   type: 'error',
        //   message: ErrorMessage(err),
        // })
      }
    }
  },

}
