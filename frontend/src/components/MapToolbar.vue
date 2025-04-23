<template lang="pug">
  .map-toolbar-container
    .map-toolbar
      .toolbar-group.navigation-tools
        el-tooltip(content="Navegação (Pan)" placement="right")
          el-button(
            :class="{ active: currentTool === 'pan' }"
            @click="setTool('pan')"
            size="small"
            icon="el-icon-rank"
          )
        el-tooltip(:content="getPolygonTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'polygon' }"
            @click="setTool('polygon')"
            size="small"
            icon="el-icon-s-grid"
            :disabled="!canDrawPolygon"
          )
        el-tooltip(:content="getPointTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'point' }"
            @click="setTool('point')"
            size="small"
            icon="el-icon-location-information"
            :disabled="!canDrawPoint"
          )
        //- el-tooltip(:content="getLineTooltip()" placement="right")
        //-   el-button(
        //-     :class="{ active: currentTool === 'line' }"
        //-     @click="setTool('line')"
        //-     size="small"
        //-     icon="el-icon-minus"
        //-     :disabled="!canDrawLine"
        //-   )
        el-tooltip(:content="getEditTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'edit' }"
            @click="setTool('edit')"
            size="small"
            icon="el-icon-edit-outline"
            :disabled="!canEditGeometry"
          )
        el-tooltip(:content="getEraseTooltip()" placement="right")
          el-button(
            :class="{ active: currentTool === 'erase' }"
            @click="confirmDelete"
            size="small"
            icon="el-icon-delete"
            :disabled="!canDeleteGeometry"
          )
      .toolbar-group.measure-tools
        el-tooltip(content="Medir distância/área" placement="right")
          el-button(
            :class="{ active: currentTool === 'measure' }"
            @click="setTool('measure')"
            size="small"
            icon="el-icon-ruler"
          )
        //- el-tooltip(content="Importar shapefile/geojson" placement="right")
        //-   el-button(
        //-     :class="{ active: currentTool === 'upload' }"
        //-     @click="handleImportClick"
        //-     size="small"
        //-     icon="el-icon-upload2"
        //-     :disabled="!canImportData"
        //-   )

      .toolbar-group.zoom-tools
        el-tooltip(content="Aproximar (Zoom In)" placement="right")
          el-button(
            @click="zoomIn"
            size="small"
            icon="el-icon-zoom-in"
          )
        el-tooltip(content="Afastar (Zoom Out)" placement="right")
          el-button(
            @click="zoomOut"
            size="small"
            icon="el-icon-zoom-out"
          )
        el-tooltip(content="Ajustar à seleção" placement="right")
          el-button(
            @click="zoomToSelection"
            size="small"
            icon="el-icon-full-screen"
            :disabled="!hasSelectedLayer"
          )
        el-tooltip(content="Ajustar ao município" placement="right")
          el-button(
            @click="zoomToMunicipality"
            size="small"
            icon="el-icon-position"
            :disabled="!municipalitySelected"
          )
      
      //- .toolbar-group.other-tools
      //-   el-tooltip(content="Painel de camadas" placement="right")
      //-     el-button(
      //-       :class="{ active: showLayerPanel }"
      //-       @click="toggleLayerPanel"
      //-       size="small"
      //-       icon="el-icon-menu"
      //-     )
    
    // Input invisível para upload de arquivo
    input(
      type="file"
      ref="fileInput"
      style="display: none"
      @change="onFileSelected"
      accept=".shp,.json,.geojson,.kml,.zip"
    )
    
    // Modal de confirmação para exclusão
    el-dialog(
      title="Confirmar Exclusão"
      :visible.sync="deleteDialogVisible"
      width="30%"
    )
      span {{ deleteConfirmationMessage }}
      span(slot="footer")
        el-button(@click="deleteDialogVisible = false") Cancelar
        el-button(type="danger" @click="deleteLayer") Confirmar
    
    // Componente de medição
    .measurement-result(v-if="currentTool === 'measure' && measurementResult")
      el-card(shadow="always" class="measurement-card")
        .card-header(slot="header")
          span Resultado da Medição
        .measurement-content
          span(v-if="measurementResult.type === 'distance'") Distância: {{ formatDistance(measurementResult.value) }}
          span(v-else-if="measurementResult.type === 'area'") Área: {{ formatArea(measurementResult.value) }}
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
import arcgisService from '../services/arcgis';

export default {
  name: 'MapToolbar',
  data() {
    return {
      currentTool: 'pan',
      showLayerPanel: false,
      isDrawing: false,
      deleteDialogVisible: false,
      deleteConfirmationMessage: '',
      measurementResult: null,
      fileUploadInProgress: false
    };
  },
  computed: {
    ...mapState({
      selectedLayer: state => state.layers.selectedLayer,
      layers: state => state.layers.layers,
      layerTypes: state => state.layers.layerTypes,
      municipalityGeometry: state => state.property.municipalityGeometry,
      municipality: state => state.property.municipality
    }),
    ...mapGetters({
      municipalitySelected: 'property/hasMunicipalitySelected'
    }),
    hasSelectedLayer() {
      return !!this.selectedLayer;
    },
    selectedLayerType() {
      if (!this.selectedLayer) return null;
      return this.layerTypes.find(lt => lt.id === this.selectedLayer);
    },
    selectedLayerGeometryType() {
      if (!this.selectedLayerType) return null;
      return this.selectedLayerType.tipo_tema;
    },
    hasDrawnGeometry() {
      return this.layers.some(l => l.id === this.selectedLayer);
    },
    canDrawPolygon() {
      if (!this.selectedLayer) return false;
      if (this.hasDrawnGeometry && this.selectedLayer === 'area_imovel') return false;
      
      // Verificar se o tipo de camada selecionada aceita polígonos
      return this.selectedLayerGeometryType === 'mult';
    },
    canDrawPoint() {
      if (!this.selectedLayer) return false;
      if (this.hasDrawnGeometry && this.selectedLayer === 'area_imovel') return false;
      
      // Verificar se o tipo de camada selecionada aceita pontos
      return this.selectedLayerGeometryType === 'point';
    },
    canDrawLine() {
      if (!this.selectedLayer) return false;
      if (this.hasDrawnGeometry && this.selectedLayer === 'area_imovel') return false;
      
      // Verificar se o tipo de camada selecionada aceita linhas
      // No sistema atual, não há tipo "line" explícito, então assumimos false
      return false;
    },
    canEditGeometry() {
      // Pode editar geometria apenas se ela já existe
      return this.hasSelectedLayer && this.hasDrawnGeometry;
    },
    canDeleteGeometry() {
      // Pode excluir geometria apenas se ela já existe
      return this.hasSelectedLayer && this.hasDrawnGeometry;
    },
    canImportData() {
      // Pode importar dados apenas se uma camada estiver selecionada
      return this.hasSelectedLayer && !this.isDrawing;
    }
  },
  methods: {
    ...mapActions({
      addAlert: 'validation/addAlert',
      removeLayer: 'layers/removeLayer'
    }),
    ...mapMutations({
      setDrawingMode: 'layers/SET_DRAWING_MODE'
    }),
    setTool(tool) {
      // Se já estiver desenhando, não permitir mudar de ferramenta
      if (this.isDrawing && this.currentTool !== tool) {
        this.addAlert({
          type: 'warning',
          message: 'Finalize a operação atual antes de trocar de ferramenta.'
        });
        return;
      }
      
      // Desativa qualquer ferramenta ativa anterior
      this.deactivateCurrentTool();
      
      // Atualiza a ferramenta atual
      this.currentTool = tool;
      
      // Ativa a nova ferramenta
      this.activateTool(tool);
    },
    activateTool(tool) {
      switch(tool) {
        case 'pan':
          arcgisService.activatePanMode();
          break;
        case 'polygon':
          this.startDrawing('polygon');
          break;
        case 'point':
          this.startDrawing('point');
          break;
        case 'line':
          this.startDrawing('polyline');
          break;
        case 'edit':
          this.startEditing();
          break;
        case 'measure':
          this.startMeasurement();
          break;
        default:
          arcgisService.activatePanMode();
      }
    },
    deactivateCurrentTool() {
      // Cancelar qualquer ferramenta ativa
      switch(this.currentTool) {
        case 'measure':
          this.stopMeasurement();
          break;
        case 'polygon':
        case 'point':
        case 'line':
          if (this.isDrawing) {
            arcgisService.cancelDrawing();
            this.isDrawing = false;
            this.setDrawingMode(false);
          }
          break;
        case 'edit':
          arcgisService.stopEditing();
          break;
      }
    },
    async startDrawing(geometryType) {
      try {
        // Verificar pré-requisitos para desenho
        if (!this.selectedLayer) {
          this.addAlert({
            type: 'warning',
            message: 'Selecione uma camada antes de iniciar o desenho.'
          });
          return;
        }
        
        // Verificar se a camada "Área do imóvel" já foi definida para camadas que a requerem
        if (this.selectedLayer !== 'area_imovel') {
          const area_imovelDefined = this.layers.some(l => l.id === 'area_imovel');
          if (!area_imovelDefined) {
            this.addAlert({
              type: 'error',
              message: 'É necessário definir a Área do imóvel antes de desenhar outras camadas.'
            });
            return;
          }
        }
        
        // Verificar se a camada área do imóvel já foi desenhada
        if (this.selectedLayer === 'area_imovel' && this.hasDrawnGeometry) {
          this.addAlert({
            type: 'warning',
            message: 'A Área do imóvel já foi definida. Para modificá-la, exclua-a primeiro.'
          });
          return;
        }
        
        // Verificar se município foi selecionado para área do imóvel
        if (this.selectedLayer === 'area_imovel' && !this.municipalityGeometry) {
          this.addAlert({
            type: 'error',
            message: 'Por favor, selecione um município antes de desenhar a área do imóvel.'
          });
          return;
        }
        
        // Preparar para desenho
        this.isDrawing = true;
        this.setDrawingMode(true);
        
        // Determinar o tipo de geometria a ser desenhada
        const selectedLayerType = this.layerTypes.find(lt => lt.id === this.selectedLayer);
        const geometryToUse = geometryType || (selectedLayerType && selectedLayerType.tipo_tema === 'point' ? 'point' : 'polygon');
        
        // Recuperar geometria da área do imóvel para validações
        let propertyGeometry = null;
        if (this.selectedLayer !== 'area_imovel') {
          const propertyLayer = this.layers.find(l => l.id === 'area_imovel');
          if (propertyLayer) {
            propertyGeometry = propertyLayer.geometry;
          }
        }
        
        // Adicionar callback para validação em tempo real
        const onUpdateGeometry = (tempGeometry) => {
          // Validações específicas por tipo de camada
          if (this.selectedLayer === 'sede_imovel' && tempGeometry && propertyGeometry) {
            const isInside = arcgisService.isWithin(tempGeometry, propertyGeometry);
            arcgisService.updateTempGraphicSymbol(isInside ? 'valid' : 'warning');
          } else if (this.selectedLayer === 'area_imovel' && tempGeometry && this.municipalityGeometry) {
            const intersectsMunicipality = arcgisService.validateIntersectsWithMunicipality(
              tempGeometry,
              this.municipalityGeometry
            );
            
            const minimumAreaInMunicipality = intersectsMunicipality ?
              arcgisService.validateMinimumAreaInMunicipality(
                tempGeometry,
                this.municipalityGeometry,
                50
              ) : false;
            
            if (!intersectsMunicipality) {
              arcgisService.updateTempGraphicSymbol('warning');
            } else if (!minimumAreaInMunicipality) {
              arcgisService.updateTempGraphicSymbol('warning-medium');
            } else {
              arcgisService.updateTempGraphicSymbol('valid');
            }
          } else if (geometryToUse === 'polygon' && tempGeometry) {
            // Exibir área em tempo real se for polígono
            const tempArea = arcgisService.calculateArea(tempGeometry);
            this.measurementResult = {
              type: 'area',
              value: tempArea * 10000 // Converter para m²
            };
          }
        };
        
        // Função para validar geometria após conclusão do desenho
        const onDrawComplete = (geometry) => {
          // Validações específicas por tipo de camada
          if (this.selectedLayer === 'area_imovel' && this.municipalityGeometry) {
            const intersectsMunicipality = arcgisService.validateIntersectsWithMunicipality(
              geometry,
              this.municipalityGeometry
            );
            
            if (!intersectsMunicipality) {
              this.addAlert({
                type: 'error',
                message: 'A área do imóvel deve intersectar o município selecionado.'
              });
              return null;
            }
            
            const minimumAreaInMunicipality = arcgisService.validateMinimumAreaInMunicipality(
              geometry,
              this.municipalityGeometry,
              50
            );
            
            if (!minimumAreaInMunicipality) {
              this.addAlert({
                type: 'error',
                message: 'No mínimo 50% da área do imóvel deve estar dentro do município selecionado.'
              });
              return null;
            }
          }
          
          if (this.selectedLayer === 'sede_imovel' && propertyGeometry) {
            const isInside = arcgisService.isWithin(geometry, propertyGeometry);
            
            if (!isInside) {
              this.addAlert({
                type: 'error',
                message: 'A sede do imóvel deve estar dentro da área do imóvel.'
              });
              return null;
            }
          }
          
          // Verificações para outras camadas que exigem estar dentro da área do imóvel
          if (['vegetacao_nativa', 'area_consolidada', 'area_pousio'].includes(this.selectedLayer) && propertyGeometry) {
            const isInside = arcgisService.isWithin(geometry, propertyGeometry);
            
            if (!isInside) {
              this.addAlert({
                type: 'error',
                message: `A camada "${this.selectedLayerType?.name || this.selectedLayer}" deve estar completamente dentro da área do imóvel.`
              });
              
              return null;
            }
          }
          
          // Limpar resultado de medição após concluir
          this.measurementResult = null;
          
          return geometry;
        };
        
        // Ativar a ferramenta de desenho
        const geometry = await arcgisService.activateDrawTool(geometryToUse, onUpdateGeometry, onDrawComplete);
        
        // Se geometry for null, significa que foi cancelado ou falhou na validação
        if (!geometry) {
          this.isDrawing = false;
          this.setDrawingMode(false);
          this.currentTool = 'pan';
          return;
        }
        
        // Adicionar a camada com a geometria desenhada
        await this.$store.dispatch('layers/addLayer', {
          layerId: this.selectedLayer,
          geometry
        });
        
        // Mostrar mensagem de sucesso
        const layerName = this.selectedLayerType ? this.selectedLayerType.name : this.selectedLayer;
        this.addAlert({
          type: 'success',
          message: `${layerName} desenhada com sucesso.`
        });
        
        // Voltar para o modo de navegação
        this.currentTool = 'pan';
        arcgisService.activatePanMode();
      } catch (error) {
        console.error('Erro ao desenhar:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao desenhar. Por favor, tente novamente.'
        });
      } finally {
        this.isDrawing = false;
        this.setDrawingMode(false);
      }
    },
    startEditing() {
      // Verifica se tem camada selecionada e desenhada
      if (!this.selectedLayer || !this.hasDrawnGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione uma camada com geometria para editar.'
        });
        this.currentTool = 'pan';
        return;
      }
      
      try {
        // Implementar lógica de edição
        const layer = this.layers.find(l => l.id === this.selectedLayer);
        if (!layer || !layer.geometry) {
          throw new Error('Geometria não encontrada para edição.');
        }
        
        // Chamar método de edição do serviço ArcGIS
        arcgisService.startEditing(layer.geometry, this.selectedLayer, (editedGeometry) => {
          // Callback após edição concluída
          if (editedGeometry) {
            // Atualizar a geometria na store
            this.$store.dispatch('layers/updateLayerGeometry', {
              layerId: this.selectedLayer,
              geometry: editedGeometry
            });
            
            // Mostrar mensagem de sucesso
            const layerName = this.selectedLayerType ? this.selectedLayerType.name : this.selectedLayer;
            this.addAlert({
              type: 'success',
              message: `${layerName} editada com sucesso.`
            });
          }
          
          // Volta para o modo de navegação
          this.currentTool = 'pan';
          arcgisService.activatePanMode();
        });
      } catch (error) {
        console.error('Erro ao iniciar edição:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao iniciar o modo de edição.'
        });
        this.currentTool = 'pan';
      }
    },
    confirmDelete() {
      // Verifica se tem camada selecionada e desenhada
      if (!this.selectedLayer || !this.hasDrawnGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione uma camada com geometria para excluir.'
        });
        return;
      }
      
      const layerName = this.selectedLayerType ? this.selectedLayerType.name : this.selectedLayer;
      
      if (this.selectedLayer === 'area_imovel') {
        this.deleteConfirmationMessage = 'ATENÇÃO: Excluir a Área do Imóvel irá remover TODAS as camadas. Esta ação é irreversível. Deseja continuar?';
      } else {
        this.deleteConfirmationMessage = `Tem certeza que deseja excluir a camada "${layerName}"?`;
      }
      
      this.deleteDialogVisible = true;
    },
    async deleteLayer() {
      try {
        const result = await this.removeLayer(this.selectedLayer);
        
        // Limpar a camada no mapa
        arcgisService.clearLayer(this.selectedLayer);
        
        // Fechar o diálogo
        this.deleteDialogVisible = false;
        
        // Mostrar mensagem
        this.addAlert({
          type: 'info',
          message: result.message || `${this.selectedLayerType?.name || this.selectedLayer} excluída com sucesso.`
        });
        
        // Volta para o modo de navegação
        this.currentTool = 'pan';
      } catch (error) {
        console.error('Erro ao excluir camada:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao excluir a camada.'
        });
      }
    },
    startMeasurement() {
      try {
        // Ativar ferramenta de medição
        arcgisService.activateMeasurementTool((result) => {
          if (result) {
            this.measurementResult = result;
          }
        });
      } catch (error) {
        console.error('Erro ao iniciar medição:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao iniciar a ferramenta de medição.'
        });
        this.currentTool = 'pan';
      }
    },
    stopMeasurement() {
      arcgisService.deactivateMeasurementTool();
      this.measurementResult = null;
    },
    handleImportClick() {
      // Acionar o input de arquivo
      this.$refs.fileInput.click();
    },
    async onFileSelected(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        this.fileUploadInProgress = true;
        
        // Verificar extensão do arquivo
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['shp', 'json', 'geojson', 'kml', 'zip'];
        
        if (!validExtensions.includes(fileExtension)) {
          this.addAlert({
            type: 'error',
            message: `Formato de arquivo não suportado. Por favor, utilize: ${validExtensions.join(', ')}`
          });
          this.$refs.fileInput.value = '';
          this.fileUploadInProgress = false;
          return;
        }
        
        // Importar o arquivo usando o serviço ArcGIS
        const geometryResult = await arcgisService.importGeometryFromFile(file);
        
        if (!geometryResult || !geometryResult.geometry) {
          throw new Error('Não foi possível processar o arquivo.');
        }
        
        // Validar a geometria importada
        const validationResult = await this.$store.dispatch('layers/validateLayerGeometry', {
          layerId: this.selectedLayer,
          geometry: geometryResult.geometry
        });
        
        if (!validationResult.success) {
          this.addAlert({
            type: 'error',
            message: validationResult.message || 'A geometria importada não atende aos critérios de validação.'
          });
          this.$refs.fileInput.value = '';
          this.fileUploadInProgress = false;
          return;
        }
        
        // Adicionar a camada com a geometria importada
        await this.$store.dispatch('layers/addLayer', {
          layerId: this.selectedLayer,
          geometry: geometryResult.geometry
        });
        
        // Mostrar mensagem de sucesso
        const layerName = this.selectedLayerType ? this.selectedLayerType.name : this.selectedLayer;
        this.addAlert({
          type: 'success',
          message: `${layerName} importada com sucesso do arquivo ${file.name}.`
        });
        
        // Limpar o input de arquivo
        this.$refs.fileInput.value = '';
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        this.addAlert({
          type: 'error',
          message: `Ocorreu um erro ao importar o arquivo: ${error.message || 'Erro desconhecido'}`
        });
      } finally {
        this.fileUploadInProgress = false;
      }
    },
    zoomIn() {
      arcgisService.zoomIn();
    },
    zoomOut() {
      arcgisService.zoomOut();
    },
    zoomToSelection() {
      if (!this.selectedLayer || !this.hasDrawnGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione uma camada com geometria para aplicar zoom.'
        });
        return;
      }
      
      const layer = this.layers.find(l => l.id === this.selectedLayer);
      if (layer && layer.geometry) {
        arcgisService.zoomToGeometry(layer.geometry);
      }
    },
    zoomToMunicipality() {
      if (!this.municipalityGeometry) {
        this.addAlert({
          type: 'warning',
          message: 'Selecione um município primeiro.'
        });
        return;
      }
      
      arcgisService.zoomToGeometry(this.municipalityGeometry);
    },
    toggleLayerPanel() {
      this.showLayerPanel = !this.showLayerPanel;
      this.$emit('toggle-layer-panel', this.showLayerPanel);
    },
    formatDistance(meters) {
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
      }
      return `${meters.toFixed(2)} m`;
    },
    formatArea(squareMeters) {
      const hectares = squareMeters / 10000;
      if (hectares >= 1) {
        return `${hectares.toFixed(4)} ha`;
      }
      return `${squareMeters.toFixed(2)} m²`;
    },
    getPolygonTooltip() {
      if (!this.selectedLayer) return 'Selecione uma camada primeiro';
      if (!this.canDrawPolygon) return 'Esta camada não aceita polígonos';
      return 'Desenhar Polígono';
    },
    getPointTooltip() {
      if (!this.selectedLayer) return 'Selecione uma camada primeiro';
      if (!this.canDrawPoint) return 'Esta camada não aceita pontos';
      return 'Desenhar Ponto';
    },
    getLineTooltip() {
      if (!this.selectedLayer) return 'Selecione uma camada primeiro';
      if (!this.canDrawLine) return 'Esta camada não aceita linhas';
      return 'Desenhar Linha';
    },
    getEditTooltip() {
      if (!this.hasSelectedLayer) return 'Selecione uma camada primeiro';
      if (!this.hasDrawnGeometry) return 'Não há geometria para editar nesta camada';
      return 'Editar Geometria';
    },
    getEraseTooltip() {
      if (!this.hasSelectedLayer) return 'Selecione uma camada primeiro';
      if (!this.hasDrawnGeometry) return 'Não há geometria para excluir nesta camada';
      return 'Excluir Geometria';
    }
  }
};
</script>

<style lang="scss">
.map-toolbar-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2000; /* Valor alto para garantir que fique acima de outros elementos */
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.map-toolbar {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center; /* Centraliza tudo horizontalmente */
  gap: 10px;
  pointer-events: auto;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  width: 44px; /* Largura fixa para garantir consistência */
  
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  
  &:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  }
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  align-items: center; /* Centraliza os itens */
  width: 100%; /* Ocupa toda a largura do container pai */
  gap: 3px;
  
  &:not(:last-child) {
    padding-bottom: 10px;
    border-bottom: 1px solid #dcdfe6;
  }
}

.el-button {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto !important;
  padding: 8px !important;
  
  &.active {
    background-color: #409EFF;
    color: white;
    
    &:hover, &:focus {
      background-color: #337ecc;
      color: white;
    }
  }
  
  i {
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%; /* Garante que o ícone ocupe todo o espaço */
    height: 100%; /* Garante que o ícone ocupe todo o espaço */
  }
}

.measurement-result {
  position: absolute;
  top: 10px;
  left: 60px;
  z-index: 1500; /* Um pouco menor que a barra de ferramentas */
  pointer-events: auto;
}

.measurement-card {
  width: 200px;
  
  .measurement-content {
    padding: 10px;
    display: flex;
    justify-content: center;
    font-weight: bold;
  }
  
  .card-header {
    display: flex;
    justify-content: center;
    font-weight: bold;
  }
}

/* Responsividade - usando media queries diretamente em vez de mixins */
@media (max-width: 768px) {
  .map-toolbar-container {
    left: 5px;
  }
  
  .measurement-result {
    left: 50px;
  }
  
  .measurement-card {
    width: 180px;
  }
}

.map-toolbar .el-button {
  /* Reset de posicionamento */
  position: static !important;
  float: none !important;
  margin: 0 auto !important;
  left: auto !important;
  right: auto !important;
}
</style>