<template lang="pug">
  .validation-alert
    el-alert(
      :title="message"
      :type="type"
      :closable="true"
      show-icon
      @close="$emit('close')"
    )
  </template>
  
  <script>
  export default {
    name: 'ValidationAlert',
    props: {
      type: {
        type: String,
        default: 'info',
        validator: value => ['success', 'warning', 'info', 'error'].includes(value)
      },
      message: {
        type: String,
        required: true
      }
    }
  };
  </script>
  
  <style>
  .validation-alert {
    margin-bottom: 10px;
  }
  </style>