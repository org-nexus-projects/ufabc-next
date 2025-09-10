<template>
  <div id="table-component">
    <v-table hover density="comfortable" class="rounded-lg">
      <thead class="table-head bg-ufabcnext-green">
        <slot name="head" />
      </thead>
      <tbody class="table-body bg-secondary">
        <slot name="body" style="" />
      </tbody>
    </v-table>
  </div>
</template>

<script setup lang="ts" />

<style lang="scss">
#table-component .fixed-column {
  position: sticky;
  left: 0;
  min-width: 200px;
  @media screen and (max-width: 500px) {
    min-width: 150px;
  }
}

#table-component .v-table .v-table__wrapper > table {
  thead.table-head {
    & > tr > th {
      &:first-of-type {
        @extend .fixed-column;
        background-color: #37bba3;
      }
    }
  }

  tbody.table-body {
    & > tr:not(:last-child) > td {
      border-bottom: none;
    }
    & > tr > td {
      &:first-of-type {
        @extend .fixed-column;
      }
      outline: 1px solid white;
      text-align: center;
    }
  }
}
</style>
