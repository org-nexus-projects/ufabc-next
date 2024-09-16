<template>
  <div>
    <v-radio-group v-model="sortButton" row>
      <v-radio :label="`Maior Aprovação`" :value="0"></v-radio>
      <v-radio :label="`Melhor média`" :value="3"></v-radio>
      <v-radio :label="`Maior Reprovação`" :value="1"></v-radio>
      <v-radio :label="`Maior nº de amostras`" :value="2"></v-radio>
    </v-radio-group>

    <el-table
      ref="teachersList"
      @row-click="openTeacher($event)"
      @sort-change="onSortChange"
      :data="teachersSorted"
      :class="{ 'teacher-table-mobile': $vuetify.breakpoint.xsOnly }"
      empty-text="Nenhum resultado encontrado"
      style="width: 100%"
    >
      <el-table-column
        fixed="left"
        prop="teacher.name"
        sortable
        label="Nome do professor"
        :min-width="$vuetify.breakpoint.xsOnly ? 220 : null"
        :width="$vuetify.breakpoint.xsOnly ? null : '180'"
      >
        <template slot-scope="scope">
          <div
            v-if="scope.row.teacher && scope.row.teacher.name"
            style="word-break: break-word"
          >
            {{ scope.row.teacher.name }}
          </div>
          <div v-else style="word-break: break-word">
            Professor desconhecido
          </div>

          <template v-if="$vuetify.breakpoint.xsOnly">
            <div class="grading">
              <el-tooltip
                v-for="concept in concepts"
                placement="top"
                :key="concept.code"
                :hide-after="0"
                :content="`${concept.code}: ${scope.row.concepts[concept.code][
                  'percentage'
                ].toFixed(0)}% (${
                  scope.row.concepts[concept.code]['count']
                } notas)`"
              >
                <span
                  class="grading-segment"
                  :class="
                    scope.row.count < unthrustableThreshold
                      ? 'unthrustable'
                      : ''
                  "
                  :style="{
                    background: concept.color,
                    width:
                      scope.row.concepts[concept.code]['percentage'].toFixed(
                        0
                      ) + '%',
                  }"
                >
                </span>
              </el-tooltip>

              <span
                v-if="scope.row.count < unthrustableThreshold"
                class="low-samples"
                >Dados sem muitas amostras</span
              >
            </div>
            <div>Amostras: {{ scope.row.count }}</div>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="Conceitos" v-if="!$vuetify.breakpoint.xsOnly">
        <template slot-scope="scope">
          <div class="grading">
            <el-tooltip
              v-for="concept in concepts"
              placement="top"
              :key="concept.code"
              :hide-after="0"
              :content="`${concept.code}: ${scope.row.concepts[concept.code][
                'percentage'
              ].toFixed(0)}% (${
                scope.row.concepts[concept.code]['count']
              } notas)`"
            >
              <span
                class="grading-segment"
                :class="
                  scope.row.count < unthrustableThreshold ? 'unthrustable' : ''
                "
                :style="{
                  background: concept.color,
                  width:
                    scope.row.concepts[concept.code]['percentage'].toFixed(0) +
                    '%',
                }"
              >
              </span>
            </el-tooltip>

            <span
              v-if="scope.row.count < unthrustableThreshold"
              class="low-samples"
              >Dados sem muitas amostras</span
            >
          </div>
        </template>
      </el-table-column>

      <el-table-column
        v-if="!$vuetify.breakpoint.xsOnly"
        sortable
        align="center"
        prop="count"
        label="Amostras"
        width="120"
      >
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router/composables';
import _ from 'lodash';

const props = defineProps({
  teachers: {
    type: Array,
    default: () => [],
  },
});

// we dont have vue-router, so i really dont know if this worked before
const router = useRouter();
const teachersList = ref(null)
const sortButton = ref(0)
const unthrustableThreshold = 10

const concepts = [
  { code: 'A', color: 'rgb(63, 207, 140)' },
  { code: 'B', color: 'rgb(184, 233, 134)' },
  { code: 'C', color: 'rgb(248, 183, 76)' },
  { code: 'D', color: 'rgb(255, 160, 4)' },
  { code: 'F', color: 'rgb(249, 84, 105)' },
  { code: 'O', color: 'rgb(169, 169, 169)' },
];

const findConceptCount = (distribution, concept) => {
  const conceptTarget = _.find(distribution, { conceito: concept });
  return _.get(conceptTarget, 'count', null);
};

const findConceptCountTotal = (distribution) => {
  return _.sumBy(distribution, 'count');
};

const calculateConceptPercentage = (distribution, concept) => {
  return (
    (100 * findConceptCount(distribution, concept)) /
    findConceptCountTotal(distribution)
  );
};


const onSortChange = () => {
  sortButton.value = null;
};

watch(sortButton, (val) => {
  if (val !== null && teachersList.value) {
    teachersList.value.clearSort();
  }
});

const openTeacher = (teacher) => {
  const teacherId = _.get(teacher, 'teacher._id', null);
  if (teacherId) {
    router.replace({ query: {} });
    router.push({
      name: 'reviews',
      query: { teacherId, subjectId: null },
    });
  }
};

const teachersSorted = computed(() => {
  let order = [['teacher.name'], ['desc']];
  if (sortButton.value === 0) {
    order = [
      ['approval', 'reproof', 'count'],
      ['desc', 'desc'],
    ];
  } else if (sortButton.value === 1) {
    order = [
      ['reproof', 'approval'],
      ['desc', 'desc'],
    ];
  } else if (sortButton.value === 2) {
    order = [['count'], ['desc']];
  } else if (sortButton.value === 3) {
    order = [['cr_professor'], ['desc']];
  }

  return _.orderBy([...teachersPopulated.value], ...order);
});

const teachersPopulated = computed(() => {
  return props.teachers.map((teacher) => {
    const concepts = ['A', 'B', 'C', 'D', 'F', 'O'].reduce((acc, c) => {
      acc[c] = {
        percentage: calculateConceptPercentage(teacher.distribution, c),
        count: findConceptCount(teacher.distribution, c),
      };
      return acc;
    }, {});

    const approval = ['A', 'B', 'C', 'D'].reduce(
      (sum, c) => sum + concepts[c].percentage,
      0
    );
    const reproof = ['F', 'O'].reduce(
      (sum, c) => sum + concepts[c].percentage,
      0
    );

    return Object.assign({}, teacher, {
      concepts,
      approval,
      reproof,
    });
  });
});

//   name: 'SubjectTeachersList',

//   data() {
//     return {
//       sortButton: 0,
//       concepts: [
//         { code: 'A', color: 'rgb(63, 207, 140)' },
//         { code: 'B', color: 'rgb(184, 233, 134)' },
//         { code: 'C', color: 'rgb(248, 183, 76)' },
//         { code: 'D', color: 'rgb(255, 160, 4)' },
//         { code: 'F', color: 'rgb(249, 84, 105)' },
//         { code: 'O', color: 'rgb(169, 169, 169)' },
//       ],
//       unthrustableThreshold: 10,
//     };
//   },

//   props: {
//     teachers: {
//       type: Array,
//     },
//   },

//   watch: {
//     sortButton(val) {
//       if (val !== null) {
//         // clear internal sort of table when external button clicked
//         this.$refs &&
//           this.$refs.teachersList &&
//           this.$refs.teachersList.clearSort();
//       }
//     },
//   },

//   computed: {
//     teachersSorted() {
//       let order = [['teacher.name'], ['desc']];
//       if (this.sortButton == 0) {
//         order = [
//           ['approval', 'reproof', 'count'],
//           ['desc', 'desc'],
//         ];
//       } else if (this.sortButton == 1) {
//         order = [
//           ['reproof', 'approval'],
//           ['desc', 'desc'],
//         ];
//       } else if (this.sortButton == 2) {
//         order = [['count'], ['desc']];
//       } else if (this.sortButton == 3) {
//         order = [['cr_professor'], ['desc']];
//       }

//       return _.orderBy([...this.teachersPopulated], ...order);
//     },

//     teachersPopulated() {
//       let teachers = [...(this.teachers || [])];
//       let possibleConcepts = ['A', 'B', 'C', 'D', 'F', 'O'];

//       for (let i = 0; i < teachers.length; i++) {
//         teachers[i].concepts = {};
//         possibleConcepts.forEach((c) => {
//           teachers[i].concepts[c] = {};
//           teachers[i].concepts[c]['percentage'] =
//             this.calculateConceptPercentage(teachers[i].distribution, c);
//           teachers[i].concepts[c]['count'] = this.findConceptCount(
//             teachers[i].distribution,
//             c,
//           );
//         });

//         let approvalConcepts = ['A', 'B', 'C', 'D'];
//         let reproofConcepts = ['F', 'O'];
//         let approval = [];
//         let reproof = [];
//         approvalConcepts.forEach((c, index) => {
//           approval.push(teachers[i].concepts[c]['percentage']);
//         });
//         reproofConcepts.forEach((c) => {
//           reproof.push(teachers[i].concepts[c]['percentage']);
//         });
//         teachers[i]['approval'] = _.sum(approval);
//         teachers[i]['reproof'] = _.sum(reproof);
//       }

//       return teachers;
//     },
//   },

//   methods: {
//     findConceptCount(distribution, concept) {
//       let conceptTarget = _.find(distribution, { conceito: concept });
//       return _.get(conceptTarget, 'count', null);
//     },

//     findConceptCountTotal(distribution) {
//       return _.sumBy(distribution, 'count');
//     },

//     calculateConceptPercentage(distribution, concept) {
//       return (
//         (100 * this.findConceptCount(distribution, concept)) /
//         this.findConceptCountTotal(distribution)
//       );
//     },

//     openTeacher(teacher) {
//       let teacherId = _.get(teacher, 'teacher._id', null);
//       if (teacherId) {
//         this.$router.replace({ query: {} });
//         this.$router.push({
//           name: 'reviews',
//           query: { teacherId, subjectId: null },
//         });
//       }
//     },
//   },
// };
</script>

<style type="text/css">
.unthrustable {
  opacity: 0.4;
}

.grading-segment {
  height: 100%;
  flex: 1 1 auto;
  transition: opacity 0.2s ease-in-out, width 0.9s ease-in-out;
}

.grading {
  width: 100%;
  border-radius: 4px;
  height: 28px;
  overflow: hidden;
  position: relative;
  display: flex;
  min-width: 200px;
}

.grading:hover .grading-segment {
  opacity: 0.7;
}

.grading-segment:hover {
  opacity: 1 !important;
}
.low-samples {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.26);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.4);
}
.grading:hover .low-samples {
  display: none;
}
</style>
