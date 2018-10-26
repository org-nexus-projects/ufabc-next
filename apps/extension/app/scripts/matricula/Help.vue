<template>
  <div class="text-xs-center">
    <v-dialog
      v-model="value.dialog"
      light
      max-width="750px"
    >
      <v-card>
        <v-card-title
          class="headline grey lighten-2"
          primary-title
        >
          Cortes

          <v-btn bottom left icon
            flat
            @click="value.dialog = false">
            <v-icon>close</v-icon>
          </v-btn>

        </v-card-title>
        {{ value }}
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
  import _ from 'lodash'

  export default {
    name: 'Help',
    props: ['value'],
    components: {

    },
    data() {
      return {
      
      } 
    },
    computed: {

    },
    methods: {

    },
    watch: {
      'value.notifier'(val) {
        if(val) this.$notify(val)
      }
    }
  }
</script>
<style></style>