<template lang="pug">
  .map-container
    #mapViewDiv.map-view
    .map-tools(v-if="mapLoaded")
      layer-selector
      draw-tools(v-if="selectedLayer")
      area-calculator
    .map-alerts
      validation-alert(
        v-for="alert in alerts"
        :key="alert.id"
        :type="alert.type"
        :message="alert.message"
      )
  </template>

<script>
import { mapState, mapGetters } from 'vuex';
import arcgisService from '../services/arcgis';
import LayerSelector from './LayerSelector.vue';
import DrawTools from './DrawTools.vue';
import AreaCalculator from './AreaCalculator.vue';
import ValidationAlert from './ValidationAlert.vue';

export default {
  name: 'MapView',
  components: {
    LayerSelector,
    DrawTools,
    AreaCalculator,
    ValidationAlert
  },
  data() {
    return {
      mapLoaded: false
    };
  },
  computed: {
    ...mapState({
      selectedLayer: state => state.layers.selectedLayer,
      alerts: state => state.validation.alerts
    })
  },
  async mounted() {
    try {
      // Inicializar o mapa
      await arcgisService.initializeMap('mapViewDiv');
      this.mapLoaded = true;

      // Inicializar município (simulação)
      this.$store.commit('property/SET_MUNICIPALITY', 'São Paulo');
    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
      this.$store.dispatch('validation/addAlert', {
        type: 'error',
        message: 'Falha ao carregar o mapa. Por favor, recarregue a página.'
      });
    }
  },
  beforeDestroy() {
    // Limpar recursos do mapa ao destruir o componente
    arcgisService.destroy();
  }
};
</script>

<style lang="scss">
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-view {
  width: 100%;
  height: 100%;
}

.map-tools {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: $z-index-dropdown;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-alerts {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-index-tooltip;
  width: 80%;
  max-width: 600px;
}
</style>