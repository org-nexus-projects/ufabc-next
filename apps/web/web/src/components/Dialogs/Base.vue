<template>
  <transition
    name="dialog-fade"
    @after-leave="afterLeave">
    <div class="el-dialog__wrapper" v-show="visible && opened" @click.self="handleWrapperClick">
      <div
        class="el-dialog"
        style="border-radius: 4px;"
        ref="dialog"
        :style="style">
        <component
          v-if="component"
          :is="component"
          v-bind="componentProps"
          @answer="$emit('answer', $event)"
          @close="$emit('close')"/>
      </div>
    </div>
  </transition>
</template>

<script>
  import Popup from 'element-ui/src/utils/popup';
  import Migrating from 'element-ui/src/mixins/migrating';
  import emitter from 'element-ui/src/mixins/emitter';
  export default {
    name: 'DefaultDialog',
    mixins: [Popup, emitter, Migrating],
    props: {
      /*
       * Proxyed dialog props to custom component
       */
      componentProps: {
        type: Object,
        default() { return {} }
      },

      /*
       * Modal props
       */
      modal: {
        type: Boolean,
        default: true
      },
      modalAppendToBody: {
        type: Boolean,
        default: true
      },
      appendToBody: {
        type: Boolean,
        default: false
      },
      lockScroll: {
        type: Boolean,
        default: true
      },
      closeOnClickModal: {
        type: Boolean,
        default: true
      },
      closeOnPressEscape: {
        type: Boolean,
        default: true
      },
      showClose: {
        type: Boolean,
        default: true
      },
      width: {
        type: String,
        default: '380px'
      },
      height: {
        type: String
      },
      maxHeight: {
        type: String
      },
      margin: {
        type: String
      },
      fullscreen: Boolean,
      customClass: {
        type: String,
        default: ''
      },
      top: {
        type: String,
        default: '30vh'
      },
      beforeClose: Function,
      center: {
        type: Boolean,
        default: false
      },
      component: {
        required: true,
      },
    },
    data() {
      return {
        closed: false
      };
    },
    watch: {
      visible(val) {
        if (val) {
          this.closed = false;
          this.$emit('open');
          this.$el.addEventListener('scroll', this.updatePopper);
          this.$nextTick(() => {
            this.$refs.dialog.scrollTop = 0;
          });
          if (this.appendToBody) {
            document.body.appendChild(this.$el);
          }
        } else {
          this.$el.removeEventListener('scroll', this.updatePopper);
          if (!this.closed) this.$emit('close');
        }
      }
    },
    computed: {
      style() {
        let style = {};
        if (this.width) {
          style.width = this.width;
        }
        if (!this.fullscreen) {
          style.marginTop = this.top;
        }
        if(this.height) {
          style.height = this.height
        }
        if(this.maxHeight){
          style.maxHeight = this.maxHeight
        }
        if(this.margin){
          style.margin = this.margin
        }
        return style;
      }
    },
    methods: {
      getMigratingConfig() {
        return {
          props: {
            'size': 'size is removed.'
          }
        };
      },
      handleWrapperClick() {
        if (!this.closeOnClickModal) return;
        this.handleClose();
      },
      handleClose() {
        if (typeof this.beforeClose === 'function') {
          this.beforeClose(this.hide);
        } else {
          this.hide();
        }
      },
      hide(cancel) {
        if (cancel !== false) {
          this.$emit('update:visible', false);
          this.$emit('close');
          this.closed = true;
        }
      },
      updatePopper() {
        this.broadcast('ElSelectDropdown', 'updatePopper');
        this.broadcast('ElDropdownMenu', 'updatePopper');
      },
      afterLeave() {
        this.$emit('closed');
      }
    },
    mounted() {
      if (this.visible) {
        this.rendered = true;
        this.open();
        if (this.appendToBody) {
          document.body.appendChild(this.$el);
        }
      }
    },
    destroyed() {
      // if appendToBody is true, remove DOM node after destroy
      if (this.appendToBody && this.$el && this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el);
      }
    }
  };
</script>