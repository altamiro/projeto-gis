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

      .save-button-container(v-if="mapLoaded && municipalitySelected")
        el-button(
          type="primary"
          icon="el-icon-upload2"
          @click="saveAllLayers"
          :loading="isSaving"
        ) Salvar Camadas
    
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
      defaultMunicipalitySource: 'local',
      isSaving: false,
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
    },

    /**
   * Salva todas as camadas no servidor
   */
    async saveAllLayers() {
      try {
        this.isSaving = true;

        // Verificar se há camadas para salvar
        if (!this.$store.state.layers.layers.length) {
          this.$store.dispatch('validation/addAlert', {
            type: 'warning',
            message: 'Não há camadas para salvar.'
          });
          return;
        }

        // Converter camadas para GeoJSON
        const geoJsonData = await this.convertLayersToGeoJSON();

        // Verificar se a conversão foi bem-sucedida
        if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
          this.$store.dispatch('validation/addAlert', {
            type: 'warning',
            message: 'Não foi possível converter as camadas para o formato adequado.'
          });
          return;
        }

        // Preparar payload com dados adicionais
        const payload = {
          geoJson: geoJsonData,
          municipalityId: this.municipality?.id,
          timestamp: new Date().toISOString()
        };

        console.log('Payload formatado para o backend:', payload);

        // Enviar dados para o servidor
        // const response = await layersService.saveAllLayers(payload);

        // Notificar sucesso ao usuário
        this.$store.dispatch('validation/addAlert', {
          type: 'success',
          message: 'Camadas salvas com sucesso!'
        });

        // console.log('Resposta do servidor:', response);
      } catch (error) {
        console.error('Erro ao salvar camadas:', error);
        this.$store.dispatch('validation/addAlert', {
          type: 'error',
          message: 'Erro ao salvar camadas: ' + (error.message || 'Erro desconhecido')
        });
      } finally {
        this.isSaving = false;
      }
    },

    /**
     * Converte todas as camadas para formato GeoJSON
     * @returns {Object} Objeto GeoJSON com todas as features
     */
    async convertLayersToGeoJSON() {
      const layers = this.$store.state.layers.layers;
      const layerTypes = this.$store.state.layers.layerTypes;

      // Criar estrutura básica do GeoJSON
      const geoJson = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: 'EPSG:4326'  // WGS84, padrão para GeoJSON
          }
        },
        features: []
      };

      // Processar cada camada
      for (const layer of layers) {
        if (!layer.geometry) continue;

        // Obter informações do tipo de camada
        const layerType = layerTypes.find(lt => lt.id === layer.id);

        try {
          // Converter geometria ArcGIS para GeoJSON
          const geoJsonGeometry = arcgisService.toGeoJSON(layer.geometry);

          if (!geoJsonGeometry) continue;

          // Criar feature GeoJSON com propriedades usando o novo formato de payload
          const feature = {
            type: 'Feature',
            geometry: geoJsonGeometry,
            properties: {
              nomTema: layerType?.name || layer.id,
              codTema: layer.id,
              numArea: layer.area,
              theGeom: JSON.stringify(geoJsonGeometry),
              dataCriacao: layer.timestamp || new Date().toISOString(),
              dataUltimaAtualizacao: new Date().toISOString()
            }
          };

          // Adicionar à coleção
          geoJson.features.push(feature);
        } catch (error) {
          console.error(`Erro ao converter camada ${layer.id} para GeoJSON:`, error);
          // Continuar com as próximas camadas
        }
      }

      return geoJson;
    },

    /**
     * Carrega camadas salvas do servidor
     */
    async loadSavedLayers() {
      if (!this.municipalitySelected || !this.municipality?.id) {
        this.$store.dispatch('validation/addAlert', {
          type: 'warning',
          message: 'Selecione um município para carregar camadas salvas.'
        });
        return;
      }

      try {
        this.loading = true;
        this.loadingText = 'Carregando camadas salvas...';

        // Carregar camadas do servidor
        const response = await layersService.loadLayers(this.municipality.id);

        if (!response || !response.geoJson || !response.geoJson.features) {
          this.$store.dispatch('validation/addAlert', {
            type: 'info',
            message: 'Não foram encontradas camadas salvas para este município.'
          });
          return;
        }

        // Processar camadas carregadas e adicioná-las ao estado
        const features = response.geoJson.features;
        let layersAdded = 0;

        // Limpar camadas existentes se necessário
        await this.$store.dispatch('layers/removeAllLayers');

        // Adicionar cada feature como uma camada
        for (const feature of features) {
          const properties = feature.properties;

          // Converter geometria GeoJSON para ArcGIS
          const arcgisGeometry = this.convertGeoJSONToArcGIS(feature.geometry);

          if (!arcgisGeometry) continue;

          // Adicionar camada ao estado
          await this.$store.dispatch('layers/addLayer', {
            layerId: properties.id,
            geometry: arcgisGeometry
          });

          layersAdded++;
        }

        // Notificar o usuário
        this.$store.dispatch('validation/addAlert', {
          type: 'success',
          message: `${layersAdded} camadas carregadas com sucesso.`
        });
      } catch (error) {
        console.error('Erro ao carregar camadas:', error);

        this.$store.dispatch('validation/addAlert', {
          type: 'error',
          message: `Erro ao carregar camadas: ${error.message || 'Erro desconhecido'}`
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * Converter geometria GeoJSON para formato ArcGIS
     * @param {Object} geoJsonGeometry - Geometria no formato GeoJSON
     * @returns {Object} Geometria no formato ArcGIS
     */
    convertGeoJSONToArcGIS(geoJsonGeometry) {
      if (!geoJsonGeometry) return null;

      try {
        let arcgisGeometry = null;

        // Obter sistema de referência do GeoJSON
        const wkid = geoJsonGeometry.crs && geoJsonGeometry.crs.properties &&
          geoJsonGeometry.crs.properties.name ?
          parseInt(geoJsonGeometry.crs.properties.name.replace('EPSG:', '')) :
          4326; // WGS84 padrão

        const spatialReference = { wkid };

        // Converter com base no tipo
        switch (geoJsonGeometry.type) {
          case 'Point':
            arcgisGeometry = new arcgisService.Point({
              x: geoJsonGeometry.coordinates[0],
              y: geoJsonGeometry.coordinates[1],
              spatialReference
            });
            break;

          case 'LineString':
            arcgisGeometry = new arcgisService.Polyline({
              paths: [geoJsonGeometry.coordinates],
              spatialReference
            });
            break;

          case 'MultiLineString':
            arcgisGeometry = new arcgisService.Polyline({
              paths: geoJsonGeometry.coordinates,
              spatialReference
            });
            break;

          case 'Polygon':
            arcgisGeometry = new arcgisService.Polygon({
              rings: geoJsonGeometry.coordinates,
              spatialReference
            });
            break;

          case 'MultiPolygon':
            // Flatten MultiPolygon para Polygon
            const rings = geoJsonGeometry.coordinates.flat();
            arcgisGeometry = new arcgisService.Polygon({
              rings,
              spatialReference
            });
            break;

          default:
            console.warn(`Tipo de geometria GeoJSON não suportado: ${geoJsonGeometry.type}`);
            return null;
        }

        return arcgisGeometry;
      } catch (error) {
        console.error('Erro ao converter GeoJSON para geometria ArcGIS:', error);
        return null;
      }
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

/* Estilo para o botão de salvar flutuante */
.save-button-container {
  position: absolute;
  bottom: 40px;
  right: 20px;
  z-index: 1000;
}

.save-button-container .el-button {
  padding: 12px 20px;
  border-radius: 4px;
  font-weight: bold;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.save-button-container .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.2);
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

  .save-button-container {
    bottom: 60px;
    right: 15px;
  }

  .save-button-container .el-button {
    padding: 10px 15px;
    font-size: 14px;
  }
}
</style>