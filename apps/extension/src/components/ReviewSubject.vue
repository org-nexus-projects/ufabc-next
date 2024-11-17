<template>
  <el-dialog
    :title="'Disciplina: ' + subject"
    @close="closeDialog()"
    :visible="subjectInfo.dialog"
    width="800px"
    top="2vh"
    class="ufabc-element-dialog mt-1">
    <div v-if='loading || (helpData && helpData.specific && helpData.specific.length)'
      style="min-height: 200px"
      v-loading="loading"
      element-loading="Carregando">
      <div class="samples" v-if='samplesCount >= 0'>
        Total de amostras <b>{{samplesCount}}</b>
      </div>

      <vue-highcharts
        class="ufabc-row ufabc-align-center ufabc-justify-middle"
          v-if='helpData && helpData.specific && helpData.specific.length'
          :options="chartOptions"
          :highcharts="highcharts"
          ref="pieChart"
      ></vue-highcharts>
      <SubjectTeachersList
        v-if='helpData && helpData.specific && helpData.specific.length'
        :teachers="helpData.specific"
      />

    </div>
    <div class="ufabc-row ufabc-align-center ufabc-justify-middle" style="min-height: 100px" v-else>
     {{ subjectInfo }}
      Nenhum dado encontrado
    </div>
    <span slot="footer" class="dialog-footer">
      <i class="information">* Dados baseados nos alunos que utilizam a extensão</i>
    </span>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import VueHighcharts from 'vue2-highcharts';
import Highcharts3D from 'highcharts/highcharts-3d';
import Highcharts from 'highcharts';

import _ from 'lodash';
import { NextAPI } from '../services/next';
import SubjectTeachersList from './SubjectTeachersList.vue';

Highcharts3D(Highcharts);

const data = {
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
};

const nextApi = NextAPI();

const props = defineProps({
  subjectInfo: {
    type: Object
  },
});

const chartOptions = ref(data);
const highcharts = ref(Highcharts)
const loading = ref(false);
const helpData = ref(null);
const filterSelected = ref(null);
const samplesCount = ref(null);
const pieChart = ref();

watch(props.subjectInfo.notifier, (val) => {
  if(val) {
    console.log('notify changes')
  }
})

watch(() => props.subjectInfo, (newVal) => {
  // biome-ignore lint/complexity/useOptionalChain: Babel version does not support it
  if(newVal && newVal.subject && newVal.subject.id) {
    setupSubjectStats()
  }
}, { immediate: true, deep: true })

// i miss optional chaining :(
const subject = computed(() => {
  // biome-ignore lint/complexity/useOptionalChain: Babel version does not support it
  return helpData.value && helpData.value.subject && helpData.value.subject.name
    ? helpData.value.subject.name
    : '';
});


const possibleComponents = computed(() => {
  const components = helpData.value.specific;
  const generalDefaults = {
    _id: {
      _id: 'all',
      name: 'Todas as matérias',
    },
  };
  const general = Object.assign(generalDefaults, helpData.value.general);
  components.push(general);

  return components.reverse();
});

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

function closeDialog() {
  props.subjectInfo.dialog = false;
  filterSelected.value = null;
  helpData.value = null;
  samplesCount.value = 0;
}

async function setupSubjectStats() {
  const subjectId = props.subjectInfo.subject.id;
  console.log(subjectId)
  if (!subjectId) {
    return;
  }

  loading.value = true;

  try {
    const { data: reviews } = await nextApi.get(`/entities/subjects/reviews/${subjectId}`)
    helpData.value = reviews;
    loading.value = false;
    filterSelected.value = possibleComponents.value[0]._id._id;
    if (reviews.general.count || 0) {
      setTimeout(() => {
        updateFilter()
      }, 500);
    }
  } catch(error) {
    loading.value = false;
    console.log('dialog error', error);
    closeDialog();
  }
}
function updateFilter() {
  pieChart.value.delegateMethod('showLoading', 'Carregando...');

  setTimeout(() => {
    pieChart.value.removeSeries();
    let filter;
    if (filterSelected.value === 'all') {
      filter = helpData.value.general;
    } else {
      filter = helpData.value.specific.find((specific) =>
        specific._id._id === filterSelected.value
      );
    }

    const filteredConcepts = [];
    const distributionConcepts = filter.distribution;

    for (const { conceito, count } of distributionConcepts) {
      filteredConcepts.push({
        name: conceito,
        y: count,
        color: resolveColorForConcept(conceito),
      });
    }

    samplesCount.value = filter.count;

    pieChart.value.addSeries({
      data: _.sortBy(filteredConcepts, 'name'),
    });

    pieChart.value.hideLoading();
  }, 500);
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

.conceito.A{
  background: #3fcf8c;
}
.conceito.B{
  background: #b8e986;
}
.conceito.C{
  background: #f8b74c;
}
.conceito.D{
  background: #ffa004;
}
.conceito.F{
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
