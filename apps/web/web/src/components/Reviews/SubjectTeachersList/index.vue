<template>
  <div class="">
    <div class="title mb-2 pb-1">
      Ordenar por:
    </div>

    <v-btn-toggle v-model="sortButton" class="toggle-sort-teachers pb-2"> 
      <v-btn color="success" class="mr-2 mb-2" style="color: #fff; border-radius: 4px!important;">
        Maior Aprovação
      </v-btn>
      <v-btn color="red" class="mr-2 mb-2" style="color: #fff; border-radius: 4px!important;">
        Maior Reprovação
      </v-btn>
      <v-btn color="info" style="color: #fff; border-radius: 4px!important;">
        Maior nº de amostras
      </v-btn>
    </v-btn-toggle>

    <el-table
      ref="teachersList"
      @sort-change="sortButton = null"
      :data="teachersSorted"
      style="width: 100%">
      <el-table-column
        fixed="left"
        prop="teacher.name"
        sortable
        label="Nome do professor"
        width="180">
        <template slot-scope="scope">
          <div v-if='scope.row.teacher && scope.row.teacher.name' 
            style="word-break: break-word;">
            {{ scope.row.teacher.name }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        sortable
        prop="concepts.A"
        label="A"
        width="75">
        <template slot-scope="scope">
          {{ scope.row.concepts.A.toFixed(2) }}%
        </template>
      </el-table-column>
      <el-table-column
        sortable
        prop="concepts.B"
        label="B"
        width="75">
        <template slot-scope="scope">
          {{ scope.row.concepts.B.toFixed(2) }}%
        </template>
      </el-table-column>
      <el-table-column
        sortable
        prop="concepts.C"
        label="C"
        width="75">
        <template slot-scope="scope">
          {{ scope.row.concepts.C.toFixed(2) }}%
        </template>
      </el-table-column>
      <el-table-column
        sortable
        prop="concepts.D"
        label="D"
        width="75">
        <template slot-scope="scope">
          {{ scope.row.concepts.D.toFixed(2) }}%
        </template>
      </el-table-column>
      <el-table-column
        sortable
        prop="concepts.F"
        label="F"
        width="75">
        <template slot-scope="scope">
          {{ scope.row.concepts.F.toFixed(2) }}%
        </template>
      </el-table-column>

      <el-table-column
        sortable
        prop="concepts.O"
        label="O"
        width="75">
        <template slot-scope="scope">
          {{ scope.row.concepts.O.toFixed(2) }}%
        </template>
      </el-table-column>

      <el-table-column
        prop="count"
        sortable
        label="Amostras"
        width="120">
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
export default {
  name: 'SubjectTeachersList',

  data() {
    return {
      sortButton: 0
    }
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
      let key = 'teacher.name'
      if(this.sortButton == 0) {
        key = 'approval'
      } else if (this.sortButton == 1) {
        key = 'reproof'
      } else if(this.sortButton == 2) {
        key = 'count'
      }

      return _.orderBy([...this.teachersPopulated], [key, 'count'], ['desc', 'desc'])
    },

    teachersPopulated() {
      let teachers = [...this.teachers]
      let possibleConcepts = ['A', 'B', 'C', 'D', 'F', 'O']

      for (let i = 0; i < teachers.length; i++) { 
        teachers[i].concepts = {}
        possibleConcepts.forEach(c => {
          teachers[i].concepts[c] = this.calculateConceptPercentage(teachers[i].distribution, c)
        })

        let approvalConcepts = ['A', 'B', 'C', 'D']
        let reproofConcepts = ['F', 'O']
        let approval = []
        let reproof = []
        approvalConcepts.forEach(c => {
          approval.push(teachers[i].concepts[c])
        })
        reproofConcepts.forEach(c => {
          reproof.push(teachers[i].concepts[c])
        })
        teachers[i]['approval'] = _.sum(approval)
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

    sortPercent(a,b){
      console.log(arguments)
    },

    sortBySamples(a,b){
      return a.count > b.count;
    }
  }
}
</script>