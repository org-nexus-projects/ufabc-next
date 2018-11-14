<template>
  <el-dialog
    :title="professorName"
    @close="closeDialog()"
    :visible="value.dialog"
    width="32%">
    <div v-if='loading || help_data' style="min-height: 200px" v-loading="loading" element-loading="Carregando">

    </div>
    <div class="ufabc-row ufabc-align-center ufabc-justify-middle" style="min-height: 100px" v-else>
      Nenhum dado carregado
    </div>
    <span slot="footer" class="dialog-footer">
      <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
      <el-button @click="closeDialog()">Fechar</el-button>
    </span>
  </el-dialog>
</template>
<script>
  import _ from 'lodash'
  import Axios from 'axios'
  export default {
    name: 'Help',
    props: ['value'],
    components: {

    },

    data() {
      return {
        loading: false,

        help_data: null,
      } 
    },

    created() {
      this.fetch()
    },

    watch: {
      'value.notifier'(val) {
        if(val) this.$notify(val)
      },

      'value.professor'(val){
        this.fetch()
      },
    },

    computed: {
      professorName() {
        return _.get(this.value, 'professor.name', '')
      }
    },

    methods: {
      closeDialog(){
        this.value.dialog = false
        this.help_data = null
      },

      fetch() {
        console.log('fetch', this.value)
        let professorId = _.get(this.value, 'professor.id', '')
        if(!professorId) return

        this.loading = true

        Axios.get('https://ufabc-matricula-test.cdd.naoseiprogramar.com.br/v1/help/teachers/' + professorId).then((res) => {
          this.loading = false
          this.help_data = res.data
        }).catch((e) => {
          this.loading = false

          // Show dialog with error
          console.log(e)
          this.closeDialog()
        })

      }

    },

  }
</script>
<style scoped>
.information {
  color: rgba(0, 0, 0, 0.6);
  display: inline-flex;
  font-size: 11px;
  flex-direction: row;
  margin-right: 16px;
}
</style>