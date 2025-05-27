<template lang="pug">
  .area-calculator
    el-card.area-calculator-card(shadow="always")
      .card-header(slot="header")
        span Áreas Calculadas
      
      .card-content-wrapper
        // Gerar dinamicamente os grupos de camadas
        template(v-if="area_imovel > 0")
          .area-group(v-for="group in groupsWithLayers" :key="group.id")
            .group-title
              span {{ group.title }}
            el-descriptions(:column="1" border)
              el-descriptions-item(v-for="option in filterVisibleOptions(group.options)" 
                                  :key="option.id" 
                                  :label="option.name")
                span {{ formatArea(getLayerArea(option.id)) }} ha
        
        .no-property-info(v-else)
          span Vetorize a área do imóvel para visualizar os cálculos.
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { GROUP_LAYER, LAYER_TYPES } from "@/utils/constants_layers";

export default {
  name: 'AreaCalculator',
  data() {
    return {
      groupLayers: GROUP_LAYER
    };
  },
  computed: {
    ...mapState({
      area_imovel: state => {
        const propertyLayer = state.layers.layers.find(l => l.id === 'area_imovel');
        return propertyLayer ? propertyLayer.area : 0;
      },
      area_imovel_liquida: state => state.property.netarea_imovel,
      layers: state => state.layers.layers,
    }),
    ...mapGetters({
      isPropertyFullyCovered: 'layers/isPropertyFullyCovered'
    }),
    
    // Grupos com camadas disponíveis
    groupsWithLayers() {
      return this.groupLayers.filter(group => {
        // Verificar se o grupo tem pelo menos uma opção com view_calculation: true
        const visibleOptions = this.filterVisibleOptions(group.options);
        return visibleOptions.length > 0;
      });
    }
  },
  methods: {
    formatArea(area) {
      return area ? area.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0,0000';
    },
    getLayerArea(layerId) {
      // Verificar se a camada existe no state
      const layer = this.layers.find(l => l.id === layerId);
      if (layer && layer.area !== undefined) {
        return layer.area;
      }
      
      // Verificar se está no state.property (para compatibilidade com o código anterior)
      if (this.$store.state.property[layerId] !== undefined) {
        return this.$store.state.property[layerId];
      }
      
      return 0;
    },
    // Método para filtrar apenas as camadas que devem ser exibidas no cálculo
    filterVisibleOptions(options) {
      if (!options) return [];
      
      return options.filter(option => {
        // Encontrar a definição completa da camada no LAYER_TYPES
        const layerDefinition = LAYER_TYPES.find(layer => layer.id === option.id);
        
        // Verificar se a camada tem view_calculation: true
        return layerDefinition && layerDefinition.view_calculation === true;
      });
    }
  }
};
</script>

<style lang="scss" scoped>
/* Component-specific variables */
$font-size-base: 14px;

.area-calculator-card {
  width: 400px;
  margin-top: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 6px rgba(0, 0, 0, 0.08);
  }
}

.card-content-wrapper {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
  
  /* Estilizar a barra de rolagem para navegadores WebKit (Chrome, Safari) */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #909399;
  }
}

.area-group {
  margin-bottom: 15px;
}

.group-title {
  font-weight: bold;
  color: #409EFF;
  font-size: 14px;
  margin-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 5px;
}

.area-info {
  font-size: $font-size-base;
}

.no-property-info {
  color: #909399;
  font-style: italic;
  padding: 10px 0;
}

.validation-section {
  margin-top: 15px;
}
</style>