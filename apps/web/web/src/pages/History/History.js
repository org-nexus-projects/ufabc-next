import Enrollment from '@/services/Enrollment'
import Comment from '@/services/Comment'
import Auth from '@/services/Auth'
import ErrorMessage from '@/helpers/ErrorMessage'
import PrettySeasonSimple from '@/helpers/PrettySeasonSimple'
import _ from 'lodash'
import CommentEditor from '@/components/Reviews/CommentEditor'
import moment from 'moment'
import Vue from 'vue'

export default {
  name: 'History',

  data(){
    return {
      history: null,
      loading: false,
      conceptsColor: {
        'A': 'rgb(63, 207, 140)',
        'B': 'rgb(184, 233, 134)',
        'C': 'rgb(248, 183, 76)',
        'D': 'rgb(255, 160, 4)',
        'F': 'rgb(249, 84, 105)',
        'O': 'rgb(169, 169, 169)',

        // exceptions
        'I': 'rgb(25, 118, 210)',
        'E': 'rgb(25, 118, 210)',
        'null': 'rgb(0, 0, 0)',
      }
    }
  },

  filters: {
    moment(date, format = 'DD/MM/YYYY') {
      return moment(date).format(format);
    }
  },

  created() {
    this.fetch()
  },

  computed: {
    historyBySeason() {
      if(this.history && this.history.length) {
        return _.groupBy(this.history, 'quad')
      }

      return []
    },

    historySeasons() {
      return _(this.historyBySeason).keys().sortBy().value()
    },

    subjectsCount() {
      return _.get(this.history, 'length', 0)
    },

    user() {
      return Auth.user
    },

    lastUpdate() {
      return _.get(this.history, '[0].updatedAt', null)
    }
  },

  methods: {
    hasSameTeacher(enrollment) {
      if(!enrollment.teoria || !enrollment.pratica) return false
      return enrollment.teoria._id == enrollment.pratica._id
    },

    includes(array, target) {
      return _.includes(array, target)
    },

    seasonLabel(season) {
      return PrettySeasonSimple(season)
    },

    async fetch() {
      this.loading = true

      try {
        let res = await Enrollment.list()

        this.loading = false
        if(res.data){
          this.history = res.data

          this.history.map((h) => {
            h.quad = h.year + ':' + h.quad
            return h
          })
        }
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    async comment(enrollmentId, teacher = null, teacherType) {
      let dialog = this.$dialog({
        width: '750px',
        top: '10vh',
        enrollmentId: enrollmentId,
        teacher: teacher,
        teacherType: teacherType,
      }, CommentEditor)

      try {
        let res = await dialog
        if(res) {
          if(res.action == 'create') this.createComment(res.enrollmentId, res.comment, res.type)
          if(res.action == 'update') this.updateComment(res.commentId, res.comment)
        }
      } catch(e) {} 
    },

    async createComment(enrollmentId, comment, type) {
      this.loading = true

      try {
        let res = await Comment.create({
          enrollment: enrollmentId,
          comment: comment,
          type: type,
        })

        this.loading = false
        this.$notify({
          title: 'Sucesso',
          message: 'Comentário criado',
          type: 'success'
        })

        this.fetch()
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    async updateComment(commentId, comment) {
      this.loading = true

      try {
        let res = await Comment.update(commentId, {
          comment: comment,
        })

        this.loading = false
        this.$notify({
          title: 'Sucesso',
          message: 'Comentário atualizado',
          type: 'success'
        });
        this.fetch()
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }
    },

    async updateHistory() {
      let dialog = this.$dialog({
        title: 'Atualizar histórico',
        html: `Para atualizar o seu histórico no UFABC Next, é preciso ter a <a href="https://chrome.google.com/webstore/detail/ufabc-matricula/gphjopenfpnlnffmhhhhdiecgdcopmhk">extensão</a> instalada.`,
        buttons: [
          {  name: 'Não tenho', class: 'grey--text'},
          {  name: 'Já tenho instalado', action: true, class: 'green--text'}
        ]
      })

      try {
        let res = await dialog
        window.open('https://aluno.ufabc.edu.br/fichas_individuais')
      } catch(e) {} 
    }

  }
}