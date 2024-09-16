<template>
  <el-dialog
    :title="'Professor: ' + professor"
    @close="closeDialog()"
    :visible="value.dialog"
    width="460px"
    top="2vh"
    class="ufabc-element-dialog mt-1"
  >
    <div
      v-if="loading || (review && review.specific && review.specific.length)"
      style="min-height: 200px"
      v-loading="loading"
      element-loading="Carregando"
    >
      <el-select
        class="ufabc-flex ufabc-row mb-2"
        placeholder="Selecione a matéria"
        @change="updateFilter()"
        v-model="filterSelected"
        v-if="review && review.specific && review.specific.length"
      >
        <el-option
          v-for="option in possibleComponents"
          :key="option._id._id"
          :label="option._id.name"
          :value="option._id._id"
        >
        </el-option>
      </el-select>

      <div class="samples" v-if="samplesCount >= 0">
        Total de amostras <b>{{ samplesCount }}</b>
      </div>

      <vue-highcharts
        class="ufabc-row ufabc-align-center ufabc-justify-middle"
        v-if="review && review.specific && review.specific.length"
        :options="chartData"
        :highcharts="Highcharts"
        ref="pieChart"
      ></vue-highcharts>

      <div class="mt-2" style="text-align: center">
        <b>* {{ trackAttendance }}</b>
      </div>

      <div class="ufabc-column ufabc-align-center mt-3 ufabc-flex-wrap">
        <div
          class="ufabc-row ufabc-align-center ufabc-justify-middle my-cr"
          v-if="studentCr"
        >
          Seu CR é <b class="ml-1">{{ croppedCR(studentCr) }}</b>
        </div>
        <div
          class="conceitos"
          v-if="conceptsDistribution && conceptsDistribution.length && studentCr"
        >
          <div class="conceitos-title">
            Com seu CR {{ croppedCR(studentCr) }}, seu conceito com este
            professor <b>provavelmente</b> será:
          </div>
          <div class="all-conceitos">
            <div class="conceito-target" :class="targetStudentConcept">
              <div class="arrow">
                <div class="arrow-text">você</div>
              </div>
              <div class="square"></div>
            </div>
            <div
              class="conceitos-cr ufabc-row"
              v-for="(conceito, index) in concepts"
              :key="index"
            >
              <div class="conceito" :class="conceito.conceito">
                {{ conceito.conceito }}
              </div>
              <div class="cr">
                {{ findConcept(conceito.conceito) }}
              </div>
              <!--               <div class="cr">{{ findCount(conceito.conceito) }}</div> -->
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="ufabc-row ufabc-align-center ufabc-justify-middle"
      style="min-height: 100px"
      v-else
    >
      Nenhum dado encontrado
    </div>
    <span slot="footer" class="dialog-footer">
      <i class="information"
        >* Dados baseados nos alunos que utilizam a extensão</i
      >
    </span>
  </el-dialog>
</template>

<script setup>
import VueHighcharts from 'vue2-highcharts';
import Highcharts3D from 'highcharts/highcharts-3d';
import Highcharts from 'highcharts';
import { ref, computed, watch, onMounted } from 'vue'

import _ from 'lodash';
import { NextAPI } from '../services/NextAPI';
import Utils from '../utils/extensionUtils';
import matriculaUtils from '../utils/Matricula';

Highcharts3D(Highcharts);

const chartData = ref({
  chart: {
    type: 'pie',
    options3d: {
      enabled: true,
      alpha: 45,
    },
    width: 380,
    height: 240,
  },
  title: {
    text: '',
  },
  tooltip: {
    pointFormat: 'Porcentagem: <b>{point.percentage:.1f}%</b>',
  },
  plotOptions: {
    pie: {
      // innerSize: 100,
      animation: {
        duration: 200,
      },
      depth: 20,
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        format: '{key}: <b>{point.percentage:.1f}%</b>',
        enabled: true,
      },
      showInLegend: true,
    },
  },
  series: [],
});
const nextApi = NextAPI();

const props = defineProps({
  value: Object,
})

const loading = ref(false);
const review = ref(null);
const filterSelected = ref(null);
const samplesCount = ref(null);
const studentCr = ref(null);
const concepts = ref([
  { conceito: 'A' },
  { conceito: 'B' },
  { conceito: 'C' },
  { conceito: 'D' },
  { conceito: 'F' },
]);
const pieChart = ref();

const professor = computed(() => {
  return props.value.professor && props.value.professor.name ? props.value.professor.name : '';
});

const possibleComponents = computed(() => {
  if(review.value) {
    return []
  }
  const components = review.value.specific
  const generalDefaults = {
    _id: {
      _id: 'all',
      name: 'Todas as matérias',
    },
  };
  const general = Object.assign(generalDefaults, review.value.general);
  components.push(general);
  return components.reverse();
})

const conceptsDistribution = computed(() => {
  if(!filterSelected.value) {
    return []
  }

  let filter;
  if (filterSelected.value === 'all') {
      filter = helpData.value.general;
    } else {
      filter = helpData.value.specific.find((specific) =>
        specific._id._id === filterSelected.value
      );
    }

  return (
    // biome-ignore lint/complexity/useOptionalChain: Babel does not support it
    filter && filter.distribution && _.sortBy(filter.distribution, 'conceito')
  )
})

const trackAttendance = (() => {
  if(!review.value.general.distribution.length > 0) {
    return
  }

  console.log('debug', review.value.general)
  const hasAbsence = review.value.general.distribution.some(concept => concept === '0')
  if(!hasAbsence) {
    return 'Provavelmente esse professor NÃO cobra presença 👍';
  }

  return 'Provavelmente esse professor cobra presença 👎';
})

const targetStudentConcept = computed(() => {
  if(!studentCr.value || conceptsDistribution.value || conceptsDistribution.value.length) {
    return
  }

  const allCrs = []
  for(const { conceito } of conceptsDistribution.value) {
    if (conceito !== 'O' && conceito !== 'E') {
      allCrs.push(conceito && conceito.cr_medio)
    }
  }
  const [closest]  = allCrs.sort((a, b) => Math.abs(studentCr.value - a) - Math.abs(studentCr.value - b))
  const target = conceptsDistribution.value.find(c => c.cr_medio === closest)

  return target && target.conceito
})

function resolveColorForConcept(concept) {
  return (
    {
      A: '#3fcf8c',
      B: '#b8e986',
      C: '#f8b74c',
      D: '#ffa004',
      F: '#f95469',
      O: '#A9A9A9',
    }[concept] || '#A9A9A9'
  );
}

const croppedCR = (cr) => cr.toFixed(2)

function closeDialog() {
  props.value.dialog = false;
  filterSelected.value = null;
  review.value = null;
  samplesCount.value = 0;
}


function findConcept(concept) {
  const conceito = conceptsDistribution.value.find(item => item.conceito === concept)
  return conceito ? crCropped(conceito.cr_medio) : '-';
}

async function fetch() {
  console.log(props.value)
  const teacherId = props.value.professor.id
  if(!teacherId) {
    return
  }

  fetchStudent()

  loading.value = true

  try {
    const {data: reviews} = await nextApi.get(`/teachers/reviews/${teacherId}`)
    review.value = reviews
    loading.value = false

    if(reviews.general.count) {
      filterSelected.value =  possibleComponents.value[0]._id._id
      setTimeout(() => {
        updateFilter()
      }, 500)
    }
  } catch(error) {
    loading.value = false
    closeDialog()
  }

}

function fetchStudent() {
  const storageUser = `ufabc-extension-${matriculaUtils.currentUser()}`;
  Utils.storage.getItem(storageUser).then((item) => {
    if (item == null) {
      return;
    }
    studentCr.value = _.get(item, '[1].cr', 0) || _.get(item, '[0].cr', 0);
  });
}

function updateFilter() {
  pieChart.value.delegateMethod('showLoading', 'Carregando...');

  setTimeout(() => {
    pieChart.value.removeSeries();

    let filter;
    if (filterSelected.value === 'all') {
      filter = review.value.general;
    } else {
      filter = review.value.specific.find(
        (item) => item._id._id === filterSelected.value
      );
    }

    const conceitosFiltered = [];
    const conceitos = filter.distribution;
    for (const conceito of conceitos) {
      conceitosFiltered.push({
        name: conceito.conceito,
        y: conceito.count,
        color: resolveColorForConcept(conceito.conceito),
      });
    }
    samplesCount.value = filter.count;

    pieChart.value.addSeries({
      data: conceitosFiltered.sort((a, b) => a.name.localeCompare(b.name)),
    });
    pieChart.value.hideLoading();
  }, 500);
}

watch(() => props.value.notifier, (val) => {
  if (val) {
    // Handle notification logic here
  }
});

watch(() => props.value.professor, (newVal) => {
  if (newVal && newVal.id) {
    fetch();
  }
}, { immediate: true, deep: true });

onMounted(() => {
  fetch();
});
</script>

<style scoped>
.information {
  color: rgba(0, 0, 0, 0.6);
  display: inline-flex;
  font-size: 11px;
  flex-direction: row;
  margin-right: 16px;
}

.samples {
  font-family: Ubuntu;
  text-align: center;
  margin-top: 18px;
}

.my-cr {
  height: 40px;
  border-radius: 4px;
  border: 2px solid #4a90e2;
  color: #4a90e2;
  font-size: 15px;
  font-family: Ubuntu;
  width: 300px;
}
.conceitos-cr {
  margin-bottom: 4px;
  font-size: 14px;
  color: #f95469;
  font-family: Ubuntu;
  flex-wrap: wrap;
  width: 42px;
  margin-right: 2px;
}
.conceitos {
  width: 300px;
  border: 2px solid #e6e6e6;
  border-radius: 4px;
  margin-top: 6px;
}

.all-conceitos {
  display: flex;
  margin-top: 24px;
  margin-left: 38px;
  margin-right: 38px;
  margin-bottom: 20px;
  position: relative;
}
.conceitos-title {
  text-align: center;
  margin-left: 20px;
  margin-right: 20px;
  margin-top: 10px;
  font-size: 14px;
  font-family: Ubuntu;
}

.conceito {
  width: 42px;
  height: 42px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-family: Ubuntu;
  color: #fff;
}

.cr {
  background: #e6e6e6;
  display: flex;
  width: 100%;
  font-size: 12px;
  font-family: Ubuntu;
  margin-top: 2px;
  justify-content: center;
  height: 20px;
  align-items: center;
  color: rgba(0, 0, 0, 0.35);
}

.conceito.A {
  background: #3fcf8c;
}
.conceito.B {
  background: #b8e986;
}
.conceito.C {
  background: #f8b74c;
}
.conceito.D {
  background: #ffa004;
}
.conceito.F {
  background: #f95469;
}

.arrow {
  color: #4a90e2;
  margin-top: -18px;
  margin-bottom: 17px;
}
.arrow-text {
  text-align: center;
  font-size: 11px;
}
.arrow:after {
  content: " ";
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 10px 10px 0 10px;
  border-color: #4a90e2 transparent transparent transparent;
  position: absolute;
  left: 12px;
}
.square {
  width: 46px;
  height: 68px;
  border: 4px solid #4a90e2;
  border-radius: 4px;
}
.conceito-target {
  position: absolute;
  /*  height: 90px;*/
  bottom: 0px;
  left: -2px;
}

.conceito-target.B {
  left: 42px;
}
.conceito-target.C {
  left: 86px;
}
.conceito-target.D {
  left: 130px;
}
.conceito-target.F {
  left: 174px;
}
</style>
