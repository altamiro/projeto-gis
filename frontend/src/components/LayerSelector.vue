<template lang="pug">
  .layer-selector
    el-card.layer-selector-card(shadow="always")
      .card-header(slot="header")
        span Camadas
      el-select(
        v-model="selectedLayer"
        placeholder="Selecione uma camada"
        @change="handleLayerChange"
      )
        el-option(
          v-for="layer in availableLayers"
          :key="layer.id"
          :label="layer.name"
          :value="layer.id"
        )
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
      availableLayers: 'layers/availableLayers'
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
.layer-selector-card {
  width: $sidebar-width;
  @include box-shadow(1);

  &:hover {
    @include box-shadow(2);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>