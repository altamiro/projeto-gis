<template lang="pug">
  .map-container-wrapper
    // Header
    .map-header
      .header-center(v-if="municipalitySelected")
        layer-selector(:isMunicipalitySelected="municipalitySelected")
    
    // Middle
    .map-container
      #mapViewDiv.map-view(
        v-loading="!mapLoaded || loading" 
        :element-loading-text="loadingText" 
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
          :id="alert.id"
          :type="alert.type"
          :message="alert.message"
          :duration="alert.duration"
          @close="removeAlert"
        )
      .map-info
        .map-info-text(v-if="mapLoaded") 
          | Sistema de Vetorização GIS - {{ municipalitySelected ? municipality.name : 'Carregando município...' }}
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import arcgisService from '../services/arcgis';
import LayerSelector from './LayerSelector.vue';
import AreaCalculator from './AreaCalculator.vue';
import ValidationAlert from './ValidationAlert.vue';
import MapToolbar from './MapToolbar.vue';

export default {
  name: 'MapView',
  components: {
    LayerSelector,
    AreaCalculator,
    ValidationAlert,
    MapToolbar
  },
  data() {
    return {
      mapLoaded: false,
      loading: false,
      loadingText: 'Carregando mapa...',
      loadingError: null,
      showSidebar: true,    // Propriedade para controlar a visibilidade da barra lateral
      sidebarPosition: 'right',  // Posição da barra lateral (right ou left)
      // Configuração do município padrão - poderia vir de config externa
      defaultMunicipalityId: '3556909', // Vista Alegre do Alto
      defaultMunicipalitySource: 'local'
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
    ...mapActions({
      loadMunicipalityById: 'property/loadMunicipalityById',
      removeAlert: 'validation/removeAlert'
    }),
    
    // Método para alternar a visibilidade da barra lateral
    toggleSidebar(value) {
      this.showSidebar = value !== undefined ? value : !this.showSidebar;
    },

    // Método para alternar a posição da barra lateral
    toggleSidebarPosition() {
      this.sidebarPosition = this.sidebarPosition === 'right' ? 'left' : 'right';
    },
    
    // Método para carregar um município
    async loadMunicipality(municipalityId, source = 'local') {
      try {
        this.loading = true;
        this.loadingText = `Carregando município...`;
        
        const result = await this.loadMunicipalityById({ 
          municipalityId, 
          source 
        });
        
        if (!result.success) {
          throw new Error(`Falha ao carregar o município com ID ${municipalityId}`);
        }
        
        return true;
      } catch (error) {
        console.error('Erro ao carregar município:', error);
        this.$store.dispatch('validation/addAlert', {
          type: 'error',
          message: `Erro ao carregar município: ${error.message || 'Erro desconhecido'}`
        });
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    // Para futuras implementações - permitir mudar o município
    async changeMunicipality() {
      // Aqui você poderia abrir um diálogo para selecionar outro município
      // ou implementar outra lógica de seleção
      
      // Por enquanto, apenas recarrega o município padrão
      await this.loadMunicipality(this.defaultMunicipalityId, this.defaultMunicipalitySource);
    }
  },
  async mounted() {
    try {
      // Inicializar o mapa
      this.loadingText = 'Inicializando mapa...';
      await arcgisService.initializeMap('mapViewDiv');
      this.mapLoaded = true;

      // Adicionar feedback de sucesso
      this.$store.dispatch('validation/addAlert', {
        type: 'info',
        message: 'Mapa carregado com sucesso. Carregando município...'
      });
      
      // Carregar automaticamente o município padrão
      await this.loadMunicipality(this.defaultMunicipalityId, this.defaultMunicipalitySource);
      
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

<style lang="scss" scoped>
// Z-index variables
$z-index-dropdown: 1000;
$z-index-modal: 1050;
$z-index-tooltip: 1100;

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
  
  .municipality-info {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-tag {
      font-size: 14px;
      padding: 6px 12px;
    }
  }
}

.map-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
}

.map-view {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

#mapViewDiv {
  width: 100%;
  height: 100%;
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

// Aplicar estilo ao componente de carregamento do Element UI
.el-loading-mask {
  z-index: $z-index-modal;
}

.el-loading-text {
  color: white;
  font-size: 16px;
  margin-top: 10px;
}

// Media queries
@media (max-width: 576px) {
  .map-header {
    .header-right {
      padding-right: 5px;
    }
  }
}
</style>