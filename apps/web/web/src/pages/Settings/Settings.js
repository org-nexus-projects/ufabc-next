import AliasInitials from '@/helpers/AliasInitials'
import Auth from '@/services/Auth'
import moment from 'moment'
export default {
  name: 'Settings',

  data() {
    return {
      activeName: 'first',
      deleteMyReviews: false,
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
  },

  filters: {
    moment(date, format = 'DD/MM/YYYY') {
      return moment(date).format(format);
    }
  }
}