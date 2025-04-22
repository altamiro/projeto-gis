<template lang="pug">
  .header-container
    .selection-row
      .selection-box(v-for="baseGroups in availableBaseGroupLayers" :key="baseGroups.id")
        .box-title {{ baseGroups.title }}
        .box-image
          img(:src="baseGroups.image")
        .box-dropdown
          el-select(v-model="selectedLayer" placeholder="Selecione uma camada" @change="handleLayerChange")
            el-option(v-for="layer in baseGroups.options" :key="layer.id" :label="layer.name" :value="layer.id")
  </template>
<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'LayerSelector',
  computed: {
    ...mapState({
      storeSelectedLayer: state => state.layers.selectedLayer
    }),
    ...mapGetters({
      availableBaseGroupLayers: 'layers/availableBaseGroupLayers'
    }),
    selectedLayer: {
      get() {
        return this.storeSelectedLayer;
      },
      set(value) {
        // Não fazer nada aqui, a mudança é tratada no método handleLayerChange
      }
    }
  },
  methods: {
    ...mapActions({
      selectLayer: 'layers/selectLayer'
    }),
    async handleLayerChange(layerId) {
      const success = await this.selectLayer(layerId);

      if (!success) {
        // Se a seleção falhou, redefinir para o valor anterior
        this.selectedLayer = this.storeSelectedLayer;
      }
    }
  }
};
</script>

<style lang="scss">
.header-container {
  background-color: #f5f5f5;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.selection-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.selection-box {
  flex: 1;
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
@media (max-width: 768px) {
  .selection-row {
    flex-direction: column;
  }

  .selection-box {
    margin-bottom: 10px;
  }
}
</style>