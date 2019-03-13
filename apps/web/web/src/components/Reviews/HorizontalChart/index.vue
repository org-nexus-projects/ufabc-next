<template>
  <div
    class="grading">
    <el-tooltip
      v-for="concept in concepts"
      placement="top"
      :key="concept.code"
      :hide-after="0"
      :content="`${concept.code}: ${teacher.concepts[concept.code]['percentage'].toFixed(0)}% (${teacher.concepts[concept.code]['count']} notas)`">
      <span
        class="grading-segment"
        :class="teacher.count < unthrustableThreshold ? 'unthrustable' : ''"
        :style="{background: concept.color, width: teacher.concepts[concept.code]['percentage'].toFixed(0) + '%'}">
      </span>
    </el-tooltip>

    <span 
      v-if="teacher.count < unthrustableThreshold"
      class="low-samples">Dados sem muitas amostras</span>
  </div>
</template>
<script>
export default {
  name: 'HorizontalChart',

  data() {
    return {
      concepts: [
        {code: 'A', color: 'rgb(63, 207, 140)'},
        {code: 'B', color: 'rgb(184, 233, 134)'}, 
        {code: 'C', color: 'rgb(248, 183, 76)'}, 
        {code: 'D', color: 'rgb(255, 160, 4)'}, 
        {code: 'F', color: 'rgb(249, 84, 105)'}, 
        {code: 'O', color: 'rgb(169, 169, 169)'},
      ],
      unthrustableThreshold: 10,
    }
  },

  props: {
    teacher: {
      type: Object
    }
  }
}
</script>

<style>
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