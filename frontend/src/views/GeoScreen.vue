<template lang="pug">
  .geo-screen
    .map-container
      map-view
  </template>

<script>
import MapView from '../components/MapView.vue';

export default {
  name: 'GeoScreen',
  components: {
    MapView
  }
};
</script>

<style lang="scss" scoped>
.geo-screen {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* Media query for responsiveness */
@media (max-width: 576px) {
  .map-container {
    height: calc(100vh - 60px);
  }
}
</style>