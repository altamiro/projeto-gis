<template lang="pug">
  .draw-tools
    el-card.draw-tools-card(shadow="always")
      .card-header(slot="header")
        span Ferramentas de Desenho
        .layer-info
          | {{ selectedLayerName }}
      .draw-buttons
        el-button(
          type="primary"
          icon="el-icon-edit"
          @click="startDrawing"
          :disabled="isDrawing"
        ) Desenhar
        el-button(
          type="danger"
          icon="el-icon-delete"
          @click="confirmDeleteLayer"
          :disabled="isDrawing || !hasLayerDrawn"
        ) Excluir
      
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
  </template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import arcgisService from '../services/arcgis';

export default {
  name: 'DrawTools',
  data() {
    return {
      isDrawing: false,
      deleteDialogVisible: false,
      deleteConfirmationMessage: ''
    };
  },
  computed: {
    ...mapState({
      selectedLayer: state => state.layers.selectedLayer,
      layers: state => state.layers.layers,
      layerTypes: state => state.layers.layerTypes,
      municipalityGeometry: state => state.property.municipalityGeometry
    }),
    selectedLayerName() {
      const layerType = this.layerTypes.find(lt => lt.id === this.selectedLayer);
      return layerType ? layerType.name : '';
    },
    hasLayerDrawn() {
      return this.layers.some(l => l.id === this.selectedLayer);
    }
  },
  methods: {
    ...mapActions({
      addLayer: 'layers/addLayer',
      removeLayer: 'layers/removeLayer',
      addAlert: 'validation/addAlert'
    }),
    async startDrawing() {
      try {
        // Verificar se um município foi selecionado
        if (!this.municipalityGeometry && this.selectedLayer === 'propertyArea') {
          this.addAlert({
            type: 'error',
            message: 'Por favor, selecione um município antes de desenhar a área do imóvel.'
          });
          return;
        }

        this.isDrawing = true;

        // Determinar o tipo de geometria a ser desenhada (ponto ou polígono)
        const geometryType = this.selectedLayer === 'headquarters' ? 'point' : 'polygon';

        // Se for sede do imóvel, precisamos recuperar a geometria da área do imóvel
        let propertyGeometry = null;
        if (this.selectedLayer === 'headquarters') {
          const propertyLayer = this.layers.find(l => l.id === 'propertyArea');
          if (!propertyLayer) {
            throw new Error('A área do imóvel precisa ser definida primeiro.');
          }
          propertyGeometry = propertyLayer.geometry;
        }

        // Adicionar callback para validação em tempo real para a sede
        const onUpdateGeometry = (tempGeometry) => {
          // Se estiver desenhando a sede, verificar se está dentro da área do imóvel
          if (this.selectedLayer === 'headquarters' && tempGeometry && propertyGeometry) {
            // Verificar se o ponto está dentro da área do imóvel
            const isInside = arcgisService.isWithin(tempGeometry, propertyGeometry);

            // Mostrar feedback visual temporário (cor diferente) se estiver fora
            if (!isInside) {
              // Atualizar a cor do ponto temporário para indicar que está inválido
              arcgisService.updateTempGraphicSymbol('warning');
            } else {
              arcgisService.updateTempGraphicSymbol('valid');
            }
          } else if (this.selectedLayer === 'propertyArea' && tempGeometry && this.municipalityGeometry) {
            // Validação em tempo real para área do imóvel
            const intersectsMunicipality = arcgisService.validateIntersectsWithMunicipality(
              tempGeometry, 
              this.municipalityGeometry
            );
            
            if (!intersectsMunicipality) {
              arcgisService.updateTempGraphicSymbol('warning');
            } else {
              arcgisService.updateTempGraphicSymbol('valid');
            }
          } else if (geometryType === 'polygon' && tempGeometry) {
            // Para outras camadas, podemos mostrar a área em tempo real
            const tempArea = arcgisService.calculateArea(tempGeometry);
            // Se desejar, pode atualizar o estado para mostrar a área em tempo real
          }
        };

        // Evento de conclusão do desenho personalizado para a sede
        const onDrawComplete = (geometry) => {
          // Para sede do imóvel, validar se está dentro da área do imóvel
          if (this.selectedLayer === 'headquarters' && propertyGeometry) {
            const isInside = arcgisService.isWithin(geometry, propertyGeometry);

            if (!isInside) {
              // Mostrar mensagem de erro
              this.addAlert({
                type: 'error',
                message: 'A sede do imóvel deve estar dentro da área do imóvel.'
              });

              // Cancelar a operação de desenho
              return null;
            }
          }
          
          // Para área do imóvel, validar se intersecta o município selecionado
          if (this.selectedLayer === 'propertyArea' && this.municipalityGeometry) {
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
          }

          // Retornar a geometria válida
          return geometry;
        };

        // Ativar a ferramenta de desenho com callbacks
        const geometry = await arcgisService.activateDrawTool(geometryType, onUpdateGeometry, onDrawComplete);

        // Se geometry for null, significa que foi cancelado por validação
        if (!geometry) {
          return;
        }

        // Adicionar a camada com a geometria desenhada
        const result = await this.addLayer({
          layerId: this.selectedLayer,
          geometry
        });

        if (result.success) {
          // Exibir a geometria no mapa
          arcgisService.clearLayer(this.selectedLayer);
          arcgisService.addGraphic(this.selectedLayer, geometry);

          // Mostrar mensagem de sucesso
          this.addAlert({
            type: 'success',
            message: `${this.selectedLayerName} desenhada com sucesso.`
          });
        }
      } catch (error) {
        console.error('Erro ao desenhar:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao desenhar. Por favor, tente novamente.'
        });
      } finally {
        this.isDrawing = false;
      }
    },

    confirmDeleteLayer() {
      if (this.selectedLayer === 'propertyArea') {
        this.deleteConfirmationMessage = 'ATENÇÃO: Excluir a Área do Imóvel irá remover TODAS as camadas. Esta ação é irreversível. Deseja continuar?';
      } else {
        this.deleteConfirmationMessage = `Tem certeza que deseja excluir a camada "${this.selectedLayerName}"?`;
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
          message: result.message || `${this.selectedLayerName} excluída com sucesso.`
        });
      } catch (error) {
        console.error('Erro ao excluir camada:', error);
        this.addAlert({
          type: 'error',
          message: 'Ocorreu um erro ao excluir a camada.'
        });
      }
    }
  }
};
</script>

<style lang="scss">
.draw-tools-card {
  width: $sidebar-width;
  margin-top: 10px;
  @include box-shadow(1);

  &:hover {
    @include box-shadow(2);
  }
}

.layer-info {
  font-weight: $font-weight-bold;
  color: $primary-color;
}

.draw-buttons {
  @include flex(row, nowrap, space-between, center);
  margin-top: 10px;
}
</style>