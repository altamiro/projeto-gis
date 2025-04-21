<template lang="pug">
  .map-container
    #mapViewDiv.map-view(v-loading="!mapLoaded" element-loading-text="Carregando mapa..." element-loading-background="rgba(0, 0, 0, 0.7)")
    .map-tools(v-if="mapLoaded")
      municipality-selector
      layer-selector(v-if="municipalitySelected")
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
import MunicipalitySelector from './MunicipalitySelector.vue';
import LayerSelector from './LayerSelector.vue';
import DrawTools from './DrawTools.vue';
import AreaCalculator from './AreaCalculator.vue';
import ValidationAlert from './ValidationAlert.vue';

export default {
  name: 'MapView',
  components: {
    MunicipalitySelector,
    LayerSelector,
    DrawTools,
    AreaCalculator,
    ValidationAlert
  },
  data() {
    return {
      mapLoaded: false,
      loadingError: null
    };
  },
  computed: {
    ...mapState({
      selectedLayer: state => state.layers.selectedLayer,
      alerts: state => state.validation.alerts
    }),
    ...mapGetters({
      municipalitySelected: 'property/hasMunicipalitySelected'
    })
  },
  async mounted() {
    try {
      // Inicializar o mapa
      await arcgisService.initializeMap('mapViewDiv');
      this.mapLoaded = true;
      
      // Adicionar feedback de sucesso
      this.$store.dispatch('validation/addAlert', {
        type: 'info',
        message: 'Mapa carregado com sucesso. Selecione um município para começar.'
      });
    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
      this.loadingError = error.message || 'Erro desconhecido';
      
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

// Estilo personalizado para o indicador de carregamento
.el-loading-mask {
  z-index: $z-index-modal;
}

.el-loading-text {
  color: white;
  font-size: 16px;
  margin-top: 10px;
}
</style>