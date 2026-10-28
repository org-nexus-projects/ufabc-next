<template>
  <div class="plan-text">
    <template v-for="(block, index) in blocks" :key="index">
      <p v-if="block.type === 'paragraph'" class="paragraph">
        <PlanTextInline :text="block.text" />
      </p>

      <h4 v-else-if="block.type === 'heading'" class="heading">
        {{ block.text }}
      </h4>

      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.type === 'list'"
        class="list"
      >
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
          <PlanTextInline :text="item" />
        </li>
      </component>

      <div v-else-if="block.type === 'table'" class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-for="(cell, cellIndex) in block.header" :key="cellIndex">
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                <PlanTextInline :text="cell" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { parsePlanText } from '../utils/parsePlanText';
import PlanTextInline from './PlanTextInline.vue';

const props = defineProps<{ text: string }>();

const blocks = computed(() => parsePlanText(props.text));
</script>

<style scoped lang="scss">
$reading-font: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;

.plan-text {
  font-family: $reading-font;
  font-size: 17px;
  line-height: 1.7;
  max-width: 62ch;
}

.plan-text p,
.plan-text ul,
.plan-text ol,
.plan-text li,
.plan-text h4,
.plan-text table,
.plan-text th,
.plan-text td {
  // the app sets font-family on * (App.vue), so children never inherit it
  font-family: $reading-font;
}

.plan-text p,
.plan-text li,
.plan-text h4 {
  font-size: 17px;
}

.paragraph {
  margin-bottom: 0.75em;
  white-space: pre-line;
}

.heading {
  font-size: 17px;
  font-weight: 600;
  margin: 1em 0 0.25em;
}

.list {
  margin: 0 0 0.75em;
  padding-left: 1.4em;

  li + li {
    margin-top: 0.2em;
  }
}

.table-wrapper {
  margin: 0.5em 0 1em;
  max-width: 100%;
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  line-height: 1.4;
  min-width: 60%;
}

.plan-text table :is(th, td) {
  font-size: 15px;
}

th,
td {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 6px 16px 6px 0;
  text-align: left;
  vertical-align: top;
}

th {
  font-weight: 600;
}
</style>
