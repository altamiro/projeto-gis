<template lang="pug">
  .layer-selector-container
    .selection-row
      .selection-box(v-for="group in availableBaseGroupLayers" :key="group.id")
        .box-title {{ group.title }}
        .box-image
          img(:src="group.image" :alt="group.title")
        .box-dropdown
          el-select(
            v-model="selectedLayerInGroup[group.id]" 
            :placeholder="'Selecione ' + group.title.toLowerCase()"
            @change="handleLayerChange($event, group.id)"
            :disabled="!isMunicipalitySelected || !hasPropertyLayerIfRequired(group)"
          )
            el-option(
              v-for="layer in group.options" 
              :key="layer.id" 
              :label="layer.name" 
              :value="layer.id"
              :disabled="!isLayerSelectable(layer)"
            )
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'LayerSelector',
  props: {
    isMunicipalitySelected: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedLayerInGroup: {}
    };
  },
  computed: {
    ...mapState({
      selectedLayer: state => state.layers.selectedLayer,
      layers: state => state.layers.layers
    }),
    ...mapGetters({
      availableBaseGroupLayers: 'layers/availableBaseGroupLayers'
    })
  },
  methods: {
    ...mapActions({
      selectLayer: 'layers/selectLayer'
    }),
    async handleLayerChange(layerId, groupId) {
      if (!layerId) return;
      
      // Atualizar o selectedLayer no Vuex
      const success = await this.selectLayer(layerId);
      
      if (!success) {
        // Se a seleção falhou, redefina para o valor anterior
        this.selectedLayerInGroup[groupId] = null;
      }
    },
    hasPropertyLayerIfRequired(group) {
      // Se não for o grupo "imovel", verificar se área do imóvel já foi definida
      if (group.id !== 'imovel') {
        return this.layers.some(l => l.id === 'area_imovel');
      }
      return true;
    },
    isLayerSelectable(layer) {
      // Verificar se a camada já foi desenhada
      if (layer.id === 'area_imovel' && this.layers.some(l => l.id === 'area_imovel')) {
        return false;
      }
      
      // Adicionar mais regras de seleção conforme necessário
      return true;
    }
  },
  // Manter seleção sincronizada com o estado global
  watch: {
    selectedLayer(newValue) {
      if (newValue) {
        // Encontrar o grupo ao qual esta camada pertence
        for (const group of this.availableBaseGroupLayers) {
          const belongsToThisGroup = group.options.some(option => option.id === newValue);
          if (belongsToThisGroup) {
            this.$set(this.selectedLayerInGroup, group.id, newValue);
          }
        }
      }
    }
  }
};
</script>

<style lang="scss">
.layer-selector-container {
  width: 100%;
  overflow: hidden;
}

.selection-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.selection-box {
  flex: 1;
  min-width: 200px;
  background-color: #F2F2F2;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.box-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.box-image {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.box-dropdown {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background-color: #F2F2F2;
}

.box-dropdown ::v-deep .el-input__inner {
  background-color: #F2F2F2 !important;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.box-image img {
  max-width: 100%;
  height: 40px;
  object-fit: contain;
}

/* Responsivo */
@media (max-width: 992px) {
  .selection-row {
    flex-wrap: wrap;
  }
  
  .selection-box {
    margin-bottom: 10px;
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .selection-row {
    flex-direction: column;
  }
  
  .selection-box {
    margin-bottom: 10px;
  }
}
</style>