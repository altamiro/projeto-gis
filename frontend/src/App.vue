<template lang="pug">
  #app
    router-view
  </template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

/* Basic essential styles - these need to be global to ensure proper map display */
body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
</style>