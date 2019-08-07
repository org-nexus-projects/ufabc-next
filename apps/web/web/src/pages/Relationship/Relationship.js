import User from '@/services/User'
import ErrorMessage from '@/helpers/ErrorMessage'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
cytoscape.use(cola)

export default {
  name: 'Relationship',

  data() {
    return {
      loading: false,
      nodes: null,
    }
  },

  created() {
    this.fetch()
  },

  computed: {
   
  },

  methods: {
    graphSettings(nodes, edges){
      cytoscape({
        container: document.getElementById('cy'),
        autounselectify: true,
        boxSelectionEnabled: false,
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
      try {
        this.loading = true
        let res = await User.relationships()

        this.loading = false
        let nodes = res.data.nodes
        let edges = res.data.edges
        this.graphSettings(nodes, edges)
      } catch(err) {
        console.log(err)
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    }

  }
}