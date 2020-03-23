import AliasInitials from '@/helpers/AliasInitials'
import Auth from '@/services/Auth'
import User from '@/services/User'
import moment from 'moment'
import ErrorMessage from '@/helpers/ErrorMessage'
import environment from '@/environment'
export default {
  name: 'Settings',

  data() {
    return {
      loading: false,
    }
  },

  computed: {
    user() {
      return Auth.user
    },
    userLogin() {
      return _.get(this.user, 'email', '').replace('@aluno.ufabc.edu.br', '')
    },

    userInitials() {
      return AliasInitials(this.userLogin)
    },
    addGoogleAccount() {
      const apiPath = environment.API_URL.replace('/v1', '')
      return apiPath + '/connect/google?userId=' + this.user._id
    },
    addFacebookAccount() {
      const apiPath = environment.API_URL.replace('/v1', '')
      return apiPath + '/connect/facebook?userId=' + this.user._id
    }
  },

  methods: {
    async removeAccount() {
      let dialog = this.$dialog({
        title: 'Excluir conta',
        html: 'Tem certeza que deseja excluir seu usuário? <br /><br />Caso deseje voltar, tudo estará aqui 😀',
        top: '10vh',
        buttons: [
          {name: 'Agora não', class: 'grey--text'},
          {name: 'Excluir conta', action: true, class: 'red--text'}
        ]
      })

      try {
        let res = await dialog
        if(res) {
          this.removeUser()
        }
      } catch(e) {} 
    },

    async removeUser() {
      try {
        this.loading = true
        let res = await User.delete()

        this.loading = false
        if(res.data){
          Auth.logOut()
        } 
      } catch(err) {
        this.loading = false
        this.$message({
          type: 'error',
          message: ErrorMessage(err),
        }) 
      }

    }
  },

  filters: {
    moment(date, format = 'DD/MM/YYYY') {
      return moment(date).format(format);
    }
  }
}