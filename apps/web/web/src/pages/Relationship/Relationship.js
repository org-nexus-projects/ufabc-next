import User from '@/services/User'
import Enrollment from '@/services/Enrollment'
import ErrorMessage from '@/helpers/ErrorMessage'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
cytoscape.use(cola)

export default {
  name: 'Relationship',

  data() {
    return {
      loading: false,
      loadedHistory: false,
      history: null,
      nodes: null,
      edges: null,
      filters: [{
        value: "best-friends",
        label: "Melhores amigos",
      }, {
        value: "near-friends",
        label: "Pessoas próximas",
      }, {
        value: "all",
        label: "Todos em minha volta",
      }],
      filter: "best-friends",
      legends: [{
        label: "Você",
        color: "#007bff"
      }, {
        label: "Seus melhores amigos",
        color: "#ea3453"
      }, {
        label: "Amigos dos seus melhores amigos",
        color: "#e47184",
      }]
    }
  },

  created() {
    this.fetch()
    this.fetchHistory()
  },

  methods: {
    graphSettings(nodes, edges){
      cytoscape({
        container: document.getElementById('cy'),
        autounselectify: true,
        boxSelectionEnabled: false,
        fit: false,
        infinite: true,
        padding: 1000,
        layout: {
          name: 'cola',
          maxSimulationTime: 30000,
          edgeLength: function(edge) { return 350 },
        },
        style: [
          {
            selector: 'node',
            css: {
              'background-color': 'data(color)',
              'label': "data(id)",
              'font-weight': 'bold',
              'font-size': '45px',
              'width': 80,
              'height': 80,
            }
          },
          {
            selector: 'edge',
            css: {
              'label': "data(recurrence)",
              'width': 'data(width)',
              'line-color': '#4267b2',
              'opacity': 0.4,
              'font-size': '60px',
              'font-weight': 'bold'
            }
          }
        ],
        elements: {
          nodes: nodes,
          edges: edges
        }
      })
    },

    async fetch(){
      let breadth
      let depth
      if(this.filter == 'best-friends') {breadth = 3; depth = 1} // best friends
      if(this.filter == 'near-friends') {breadth = 4; depth = 2} // near friends
      if(this.filter == 'all') {breadth = 5; depth = 4} // all relationship

      try {
        this.loading = true
        let res = await User.relationships(breadth, depth)

        this.loading = false
        let nodes = res.data.nodes
        let edges = res.data.edges
        this.edges = edges
        this.nodes = nodes
        this.graphSettings(nodes, edges)
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        })
      }
    },

    async fetchHistory() {
      try {
        let res = await Enrollment.list()

        this.history = res.data
        this.loadedHistory = true
      } catch(err) {
        this.loadedHistory = true
      }
    },

  }
}