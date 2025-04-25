<template lang="pug">
  .area-calculator
    el-card.area-calculator-card(shadow="always")
      .card-header(slot="header")
        span Áreas Calculadas
      .area-info(v-if="area_imovel > 0")
        el-descriptions(:column="1" border)
          el-descriptions-item(label="Área do Imóvel")
            span {{ formatArea(area_imovel) }} ha
          el-descriptions-item(label="Área Líquida do Imóvel")
            span {{ formatArea(netarea_imovel) }} ha
          el-descriptions-item(label="Área Antropizada após 2008")
            span {{ formatArea(area_antropizada_apos_2008_vetorizada) }} ha
      .no-property-info(v-else)
        span Vetorize a área do imóvel para visualizar os cálculos.
      
      // Verificação de cobertura completa
      .validation-section(v-if="area_imovel > 0")
        el-alert(
          v-if="!isPropertyFullyCovered"
          title="A área do imóvel não está completamente coberta."
          type="warning"
          show-icon
          :closable="false"
        )
        el-alert(
          v-else
          title="Cobertura completa verificada com sucesso."
          type="success"
          show-icon
          :closable="false"
        )
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
      area_antropizada_apos_2008_vetorizada: state => state.property.area_antropizada_apos_2008_vetorizada
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
  width: $sidebar-width;
  margin-top: 10px;
  @include box-shadow(1);

  &:hover {
    @include box-shadow(2);
  }
}

.area-info {
  font-size: $font-size-base;
}

.no-property-info {
  color: $info-color;
  font-style: italic;
  padding: 10px 0;
}

.validation-section {
  margin-top: 15px;
}
</style>