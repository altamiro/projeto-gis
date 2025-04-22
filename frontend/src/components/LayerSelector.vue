<template lang="pug">
  .layer-selector-container
    .selection-row
      .selection-box(
        v-for="group in allGroups" 
        :key="group.id" 
        :class="{ 'disabled-group': !isGroupEnabled(group) }"
      )
        .box-title {{ group.title }}
        .box-image
          img(:src="group.image" :alt="group.title")
        .box-dropdown
          el-select(
            v-model="selectedLayerInGroup[group.id]" 
            placeholder="Selecione"
            @change="handleLayerChange($event, group.id)"
            :disabled="!isGroupEnabled(group)"
          )
            el-option(
              v-for="layer in getEditableLayersForGroup(group)" 
              :key="layer.id" 
              :label="layer.name" 
              :value="layer.id"
              :disabled="!isLayerSelectable(layer)"
            )
          .overlay-message(v-if="!isGroupEnabled(group)") 
            i.el-icon-lock
            span {{ getGroupDisabledMessage(group) }}
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
      layers: state => state.layers.layers,
      baseGroupLayers: state => state.layers.baseGroupLayers
    }),
    ...mapGetters({
      availableBaseGroupLayers: 'layers/availableBaseGroupLayers'
    }),
    // Retorna todos os grupos, não apenas os disponíveis
    allGroups() {
      return this.baseGroupLayers;
    },
    hasAreaImovel() {
      return this.layers.some(l => l.id === 'area_imovel');
    }
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
    // Retorna apenas camadas editáveis para um grupo
    getEditableLayersForGroup(group) {
      return group.options.filter(layer => layer.editable === true);
    },
    // Verifica se o grupo está habilitado
    isGroupEnabled(group) {
      // Se não houver camadas editáveis no grupo, desabilitar
      if (this.getEditableLayersForGroup(group).length === 0) {
        return false;
      }
      
      // Grupo Imóvel sempre habilitado se município selecionado
      if (group.id === 'imovel') {
        return this.isMunicipalitySelected;
      }
      
      // Outros grupos habilitados apenas se área do imóvel definida
      return this.isMunicipalitySelected && this.hasAreaImovel;
    },
    // Verifica se uma camada específica pode ser selecionada
    isLayerSelectable(layer) {
      // Verificar se a camada já foi desenhada
      if (layer.id === 'area_imovel' && this.hasAreaImovel) {
        return false;
      }
      
      // Adicionar mais regras de seleção conforme necessário
      return true;
    },
    // Retorna mensagem explicativa para grupos desabilitados
    getGroupDisabledMessage(group) {
      if (!this.isMunicipalitySelected) {
        return 'Selecione um município primeiro';
      }
      
      if (group.id !== 'imovel' && !this.hasAreaImovel) {
        return 'Define a área do imóvel primeiro';
      }
      
      return '';
    }
  },
  // Manter seleção sincronizada com o estado global
  watch: {
    selectedLayer(newValue) {
      if (newValue) {
        // Encontrar o grupo ao qual esta camada pertence
        for (const group of this.allGroups) {
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
  position: relative;
  transition: all 0.3s ease;
  
  &.disabled-group {
    opacity: 0.85;
    background-color: #e9e9e9;
    
    .box-title,
    .box-image img {
      filter: grayscale(60%);
    }
  }
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
  background-color: transparent;
  position: relative;
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

.overlay-message {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  text-align: center;
  
  i {
    font-size: 18px;
    margin-bottom: 5px;
    color: #909399;
  }
  
  span {
    font-size: 12px;
    color: #606266;
    padding: 0 10px;
  }
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