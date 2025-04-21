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
      layerTypes: state => state.layers.layerTypes
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
        this.isDrawing = true;

        // Determinar o tipo de geometria a ser desenhada (ponto ou polígono)
        const geometryType = this.selectedLayer === 'headquarters' ? 'point' : 'polygon';

        // Ativar a ferramenta de desenho e aguardar a conclusão
        const geometry = await arcgisService.activateDrawTool(geometryType);

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