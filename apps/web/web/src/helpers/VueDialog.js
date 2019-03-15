import Vue from 'vue'

import BaseDialog from '@/components/Dialogs/Base'
let BaseDialogComponent = null

import DefaultContentComponent from '@/components/Dialogs/MaterialDialog'

export default {
  beforeDestroy: function () {
    if (!this._dialogs) return;

    for (let dialog of this._dialogs) {
      dialog.$destroy()
    }

    delete this._dialogs
  },

  methods: {
    $dialog(props = {}, ContentComponent = DefaultContentComponent) {
      let self = this
      let resolved = false

      // Options
      let def = props.default
      let keepOpenOnInput = props.keepOpenOnInput || false

      // Defered promise
      let resolve, reject;
      let promise = new Promise((_resolve, _reject) => {
        resolve = _resolve
        reject = (val) => def === undefined ? _reject(val) : _resolve(def)
      })


      // Lazy load BaseDialog once required
      if (!BaseDialogComponent) {
        BaseDialogComponent = Vue.extend(BaseDialog);
      }

      // Set _dialogs if not yet set
      if (!this._dialogs) {
        this._dialogs = []
      }

      let dialog = new BaseDialogComponent({
        parent: this.$parent,
        el: document.createElement('div'),
        propsData: Object.assign({}, props, {
          appendToBody: true,
          visible: true,
          componentProps: props,
          component: ContentComponent,
        }),
        destroyed: () => {
          if (!resolved) {
            reject(new Error('Dialog destroyed'))
          }

          if(self._dialogs && self._dialogs.length){
            self._dialogs = self._dialogs.filter(d => d != dialog)
          }
        },
        mounted() {
          self._dialogs.push(this)
        },
      })

      dialog.$on('answer', (val) => {
        if (!resolved) {
          resolved = true
          resolve(val)
        }

        if (!keepOpenOnInput) {
          dialog.close()
        }
      })

      // Once a close event is received, make it invisible and start destroying
      dialog.$on('close', () => {
        if (!resolved) {
          resolved = true
          reject(new Error('Dialog closed'))
        }

        dialog.close()
      })

      // After component finishes animating closing, emit events and
      // destroy what is needed
      dialog.$on('closed', () => {
        dialog.$destroy()
      })

      // Add method to force closing
      promise.close = () => { dialog.close() }

      return promise
    },

  },

  
}