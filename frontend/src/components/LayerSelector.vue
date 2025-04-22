<template lang="pug">
  .layer-selector
    .layer-boxes-container
      .layer-box(v-for="(temas, key) in temasGrupos" :key="key")
        .layer-box-title {{ getGroupTitle(key) }}
        el-select(
          v-model="selectedLayers[key]"
          placeholder="Selecione"
          @change="(value) => handleLayerChange(value, key)"
          size="small"
        )
          el-option(
            v-for="tema in temas.filter(t => t.flVisivelMapa)"
            :key="tema.idtTema"
            :label="tema.nomTema"
            :value="tema.codTema"
          )
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import temaGrupoService from '../services/temaGrupoService';

export default {
  name: 'LayerSelector',
  data() {
    return {
      temasGrupos: {},
      selectedLayers: {},
      loading: false
    }
  },
  computed: {
    ...mapState({
      storeSelectedLayer: state => state.layers.selectedLayer
    }),
    ...mapGetters({
      availableLayers: 'layers/availableLayers'
    })
  },
  methods: {
    ...mapActions({
      selectLayer: 'layers/selectLayer'
    }),
    getGroupTitle(key) {
      // Extract the group description from the first item in the group
      const temas = this.temasGrupos[key];
      return temas && temas.length > 0 ? temas[0].desGrupo : '';
    },
    async handleLayerChange(codTema, groupKey) {
      // Map codTema to the layer ID expected by the store
      const layerMapping = {
        'AREA_IMOVEL': 'propertyArea',
        'AREA_CONSOLIDADA': 'consolidatedArea',
        'VEGETACAO_NATIVA': 'nativeVegetation',
        'AREA_POUSIO': 'fallow',
        'AREA_SERVIDAO_ADMINISTRATIVA': 'administrativeServitude',
        'HIDROGRAFIA': 'hydrography'
        // Add more mappings as needed
      };

      const layerId = layerMapping[codTema] || codTema;
      
      // Clear other selections
      Object.keys(this.selectedLayers).forEach(key => {
        if (key !== groupKey) {
          this.selectedLayers[key] = '';
        }
      });
      
      const success = await this.selectLayer(layerId);

      if (!success) {
        // If the selection failed, reset to the previous value
        this.updateSelectedLayersFromStore();
      }
    },
    async fetchTemasGrupos() {
      try {
        this.loading = true;
        const data = await temaGrupoService.getAllTemasGruposAgrupados();
        this.temasGrupos = data;
        this.loading = false;
        this.updateSelectedLayersFromStore();
      } catch (error) {
        console.error('Erro ao carregar temas e grupos:', error);
        this.loading = false;
      }
    },
    updateSelectedLayersFromStore() {
      // Update the selected layers based on the current store state
      if (!this.storeSelectedLayer) return;
      
      // Reverse mapping from store layerId to codTema
      const reverseMapping = {
        'propertyArea': 'AREA_IMOVEL',
        'consolidatedArea': 'AREA_CONSOLIDADA',
        'nativeVegetation': 'VEGETACAO_NATIVA',
        'fallow': 'AREA_POUSIO',
        'administrativeServitude': 'AREA_SERVIDAO_ADMINISTRATIVA',
        'hydrography': 'HIDROGRAFIA'
        // Add more mappings as needed
      };
      
      const selectedCodTema = reverseMapping[this.storeSelectedLayer] || this.storeSelectedLayer;
      
      // Find which group contains this layer
      Object.keys(this.temasGrupos).forEach(key => {
        const found = this.temasGrupos[key].some(tema => tema.codTema === selectedCodTema);
        if (found) {
          this.selectedLayers[key] = selectedCodTema;
        } else {
          this.selectedLayers[key] = '';
        }
      });
    }
  },
  created() {
    this.fetchTemasGrupos();
  },
  watch: {
    storeSelectedLayer() {
      this.updateSelectedLayersFromStore();
    }
  }
};
</script>

<style lang="scss">
.layer-selector {
  width: 100%;
}

.layer-boxes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.layer-box {
  width: 200px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  &-title {
    font-weight: bold;
    margin-bottom: 10px;
    color: #303133;
    font-size: 14px;
  }
  
  .el-select {
    width: 100%;
  }
}
</style>