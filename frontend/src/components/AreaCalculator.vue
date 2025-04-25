<template lang="pug">
  .area-calculator
    el-card.area-calculator-card(shadow="always")
      .card-header(slot="header")
        span Áreas Calculadas
      
      // Grupo de Imóvel
      .area-group(v-if="area_imovel > 0")
        .group-title
          span Imóvel
        el-descriptions(:column="1" border)
          el-descriptions-item(label="Área do Imóvel")
            span {{ formatArea(area_imovel) }} ha
          el-descriptions-item(label="Área Líquida do Imóvel")
            span {{ formatArea(netarea_imovel) }} ha
      
      // Grupo de Cobertura do Solo
      .area-group(v-if="area_imovel > 0")
        .group-title
          span Cobertura do Solo
        el-descriptions(:column="1" border)
          el-descriptions-item(label="Área Consolidada")
            span {{ formatArea(area_consolidada) }} ha
          el-descriptions-item(label="Remanescente de Vegetação Nativa")
            span {{ formatArea(vegetacao_nativa) }} ha
          el-descriptions-item(label="Área de Pousio")
            span {{ formatArea(area_pousio) }} ha
          el-descriptions-item(label="Área Antropizada após 2008")
            span {{ formatArea(area_antropizada_apos_2008_vetorizada) }} ha
      
      .no-property-info(v-else)
        span Vetorize a área do imóvel para visualizar os cálculos.
      
      // Verificação de cobertura completa
      //- .validation-section(v-if="area_imovel > 0")
      //-   el-alert(
      //-     v-if="!isPropertyFullyCovered"
      //-     title="A área do imóvel não está completamente coberta."
      //-     type="warning"
      //-     show-icon
      //-     :closable="false"
      //-   )
      //-   el-alert(
      //-     v-else
      //-     title="Cobertura completa verificada com sucesso."
      //-     type="success"
      //-     show-icon
      //-     :closable="false"
      //-   )
  </template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'AreaCalculator',
  computed: {
    ...mapState({
      area_imovel: state => {
        const propertyLayer = state.layers.layers.find(l => l.id === 'area_imovel');
        return propertyLayer ? propertyLayer.area : 0;
      },
      netarea_imovel: state => state.property.netarea_imovel,
      area_antropizada_apos_2008_vetorizada: state => state.property.area_antropizada_apos_2008_vetorizada,
      // Novas propriedades computadas para áreas de cobertura do solo
      area_consolidada: state => {
        const layer = state.layers.layers.find(l => l.id === 'area_consolidada');
        return layer ? layer.area : 0;
      },
      vegetacao_nativa: state => {
        const layer = state.layers.layers.find(l => l.id === 'vegetacao_nativa');
        return layer ? layer.area : 0;
      },
      area_pousio: state => {
        const layer = state.layers.layers.find(l => l.id === 'area_pousio');
        return layer ? layer.area : 0;
      }
    }),
    ...mapGetters({
      isPropertyFullyCovered: 'layers/isPropertyFullyCovered'
    })
  },
  methods: {
    formatArea(area) {
      return area ? area.toFixed(4) : '0.0000';
    }
  }
};
</script>

<style lang="scss">
.area-calculator-card {
  width: 300px;
  margin-top: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 6px rgba(0, 0, 0, 0.08);
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