<template>
  <div>
   <v-radio-group v-model="sortButton" row>
      <v-radio
        :label="`Maior Aprovação`"
        :value="0"
      ></v-radio>
      <v-radio
        :label="`Maior Reprovação`"
        :value="1"
      ></v-radio>
      <v-radio
        :label="`Maior nº de amostras`"
        :value="2"
      ></v-radio>
    </v-radio-group>

    <el-table
      ref="teachersList"
      @row-click="openTeacher($event)"
      @sort-change="sortButton = null"
      :data="teachersSorted"
      :class="{ 'teacher-table-mobile': $vuetify.breakpoint.xsOnly }"
      empty-text="Nenhum resultado encontrado"
      style="width: 100%">
      <el-table-column
        fixed="left"
        prop="teacher.name"
        sortable
        label="Nome do professor"
        :min-width="$vuetify.breakpoint.xsOnly ? 220 : null"
        :width="$vuetify.breakpoint.xsOnly ? null : '180'">
        <template slot-scope="scope">
          <div v-if='scope.row.teacher && scope.row.teacher.name' 
            style="word-break: break-word;">
            {{ scope.row.teacher.name || '(professor desconhecido)' }}
          </div>

          <template v-if='$vuetify.breakpoint.xsOnly'>
            <HorizontalChart
              :teacher="scope.row"
            />
            <div>
              Amostras: {{ scope.row.count }}
            </div>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="Conceitos" v-if='!$vuetify.breakpoint.xsOnly'>
        <template slot-scope="scope">
          <HorizontalChart
            :teacher="scope.row"
          />
        </template>
      </el-table-column>

      <el-table-column
        v-if='!$vuetify.breakpoint.xsOnly'
        sortable
        align="center"
        prop="count"
        label="Amostras"
        width="120">
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
import HorizontalChart from '@/components/Reviews/HorizontalChart'

export default {
  name: 'SubjectTeachersList',

  data() {
    return {
      sortButton: 0,
    }
  },

  components: {
    HorizontalChart
  },

  props: {
    teachers: {
      type: Array
    },

    totalConcepts: {
      type: Number
    }
  },

  watch: {
    sortButton(val) {
      if(val !== null){
        // clear internal sort of table when external button clicked
        this.$refs && this.$refs.teachersList && this.$refs.teachersList.clearSort();
      }
    }
  },

  computed: {
    teachersSorted() {
      let order = [['teacher.name'], ['desc']]
      if(this.sortButton == 0) {
        order = [['approval', 'reproof', 'count'], ['desc', 'desc']]
      } else if (this.sortButton == 1) {
        order = [['reproof', 'approval'], ['desc', 'desc']]
      } else if(this.sortButton == 2) {
        order = [['count'], ['desc']]
      }

      return _.orderBy([...this.teachersPopulated], ...order)
    },

    teachersPopulated() {
      let teachers = [...this.teachers||[]]
      let possibleConcepts = ['A', 'B', 'C', 'D', 'F', 'O']

      for (let i = 0; i < teachers.length; i++) { 
        teachers[i].concepts = {}
        possibleConcepts.forEach(c => {
          teachers[i].concepts[c] = {}
          teachers[i].concepts[c]['percentage'] = this.calculateConceptPercentage(teachers[i].distribution, c)
          teachers[i].concepts[c]['count'] = this.findConceptCount(teachers[i].distribution, c)
        })
        4
        let approvalConcepts = ['A', 'B', 'C', 'D']
        let reproofConcepts = ['F', 'O']
        let approval = []
        let reproof = []
        approvalConcepts.forEach((c, index) => {
          approval.push(teachers[i].concepts[c]['percentage'] * (approvalConcepts.length - index))
        })
        reproofConcepts.forEach(c => {
          reproof.push(teachers[i].concepts[c]['percentage'])
        })
        teachers[i]['approval'] = _.sum(approval) / 10
        teachers[i]['reproof'] = _.sum(reproof)
      }

      return teachers
    }
  },

  methods: {
    findConceptCount(distribution, concept){
      let conceptTarget = _.find(distribution, { conceito: concept })
      return _.get(conceptTarget, 'count', null)
    },

    findConceptCountTotal(distribution) {
      return _.sumBy(distribution, 'count')
    },

    calculateConceptPercentage(distribution, concept){
      return ((100 * this.findConceptCount(distribution, concept))/this.findConceptCountTotal(distribution))
    },

    openTeacher(teacher){
      let teacherId = _.get(teacher, 'teacher._id', null)
      if(teacherId){
        this.$router.replace({query: {}})
        this.$router.push({ name: 'reviews', query: { teacherId, subjectId: null }})
      }
    }
  }
}
</script>

<style type="text/css">

</style>