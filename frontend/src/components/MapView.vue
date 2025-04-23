<template lang="pug">
  .map-container-wrapper
    // Header
    .map-header
      .header-right
        municipality-selector
      .header-center(v-if="municipalitySelected")
        layer-selector(:isMunicipalitySelected="municipalitySelected")
    
    // Middle
    .map-container
      #mapViewDiv.map-view(
        v-loading="!mapLoaded" 
        element-loading-text="Carregando mapa..." 
        element-loading-background="rgba(0, 0, 0, 0.7)"
      )

      // Adicionar a barra de ferramentas
      map-toolbar(@toggle-layer-panel="toggleSidebar")
      
      .floating-tools(
        v-if="mapLoaded && selectedLayer && showSidebar"
        :class="{'floating-tools-left': sidebarPosition === 'left', 'floating-tools-right': sidebarPosition === 'right'}"
      )
        area-calculator
    
    // Footer
    .map-footer
      .map-alerts
        validation-alert(
          v-for="alert in alerts"
          :key="alert.id"
          :type="alert.type"
          :message="alert.message"
        )
      .map-info
        .map-info-text(v-if="mapLoaded") 
          | Sistema de Vetorização GIS - {{ municipalitySelected ? municipality.name : 'Selecione um município' }}
  </template>

<script>
import { mapState, mapGetters } from 'vuex';
import arcgisService from '../services/arcgis';
import MunicipalitySelector from './MunicipalitySelector.vue';
import LayerSelector from './LayerSelector.vue';
import AreaCalculator from './AreaCalculator.vue';
import ValidationAlert from './ValidationAlert.vue';
import MapToolbar from './MapToolbar.vue';

export default {
  name: 'MapView',
  components: {
    MunicipalitySelector,
    LayerSelector,
    AreaCalculator,
    ValidationAlert,
    MapToolbar
  },
  data() {
    return {
      mapLoaded: false,
      loadingError: null,
      showSidebar: true,    // Nova propriedade para controlar a visibilidade da barra lateral
      sidebarPosition: 'right'  // Posição da barra lateral (right ou left)
    };
  },
  computed: {
    ...mapState({
      selectedLayer: state => state.layers.selectedLayer,
      alerts: state => state.validation.alerts,
      municipality: state => state.property.municipality
    }),
    ...mapGetters({
      municipalitySelected: 'property/hasMunicipalitySelected'
    })
  },
  methods: {
    // Método para alternar a visibilidade da barra lateral
    toggleSidebar(value) {
      this.showSidebar = value !== undefined ? value : !this.showSidebar;
    },

    // Método para alternar a posição da barra lateral
    toggleSidebarPosition() {
      this.sidebarPosition = this.sidebarPosition === 'right' ? 'left' : 'right';
    }
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
.map-container-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-header {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px 0;
  z-index: $z-index-dropdown + 10;

  .header-right {
    display: flex;
    justify-content: flex-end;
    padding-right: 10px;
    margin-bottom: 10px;
  }

  .header-center {
    display: flex;
    justify-content: center;
    width: 100%;
  }
}

.map-container {
  flex: 1;
  position: relative;
  width: 100%;
}

.map-view {
  width: 100%;
  height: 100%;
}

.floating-tools {
  position: absolute;
  top: 20px;
  right: 10px;
  z-index: $z-index-dropdown;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-footer {
  width: 100%;
  position: relative;

  .map-alerts {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    max-width: 600px;
    z-index: $z-index-tooltip;
  }

  .map-info {
    width: 100%;
    height: 30px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
  }
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

@include respond-to(xs) {
  .map-header {
    .header-right {
      padding-right: 5px;
    }
  }
}

.floating-tools {
  position: absolute;
  top: 20px;
  z-index: $z-index-dropdown;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: right 0.3s ease, left 0.3s ease;
  
  &.floating-tools-right {
    right: 10px;
  }
  
  &.floating-tools-left {
    left: 60px; // Espaço para a barra de ferramentas vertical
  }
}
</style>