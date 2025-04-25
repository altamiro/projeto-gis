<template lang="pug">
  .validation-alert
    el-alert(
      :title="message"
      :type="type"
      :closable="true"
      show-icon
      @close="handleClose"
    )
  </template>
  
  <script>
  export default {
    name: 'ValidationAlert',
    props: {
      id: {
        type: [String, Number],
        required: true
      },
      type: {
        type: String,
        default: 'info',
        validator: value => ['success', 'warning', 'info', 'error'].includes(value)
      },
      message: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        default: 5000 // 5 segundos por padrão
      }
    },
    mounted() {
      // Configurar o timer para autofechamento, somente se a duração for maior que zero
      if (this.duration > 0) {
        this.timer = setTimeout(() => {
          this.handleClose();
        }, this.duration);
      }
    },
    beforeDestroy() {
      // Limpar o timer quando o componente for destruído
      if (this.timer) {
        clearTimeout(this.timer);
      }
    },
    methods: {
      handleClose() {
        // Limpar o timer, caso ele ainda esteja ativo
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        
        // Emitir o evento de fechamento para o componente pai
        this.$emit('close', this.id);
      }
    }
  };
  </script>
  
  <style>
  .validation-alert {
    margin-bottom: 10px;
  }
  </style>