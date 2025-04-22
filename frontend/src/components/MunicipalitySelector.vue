<template lang="pug">
  .municipality-selector
    el-card.municipality-selector-card(shadow="always")
      el-select(
        v-model="selectedMunicipality"
        placeholder="Selecione um município"
        @change="handleMunicipalityChange"
        filterable
        size="small"
      )
        el-option(
          v-for="municipality in municipalities"
          :key="municipality.id"
          :label="municipality.name"
          :value="municipality.id"
        )
  </template>

<script>
import { mapState, mapActions } from 'vuex';
import municipalityData from '../dados/geojs-35-mun.json';

export default {
  name: 'MunicipalitySelector',
  data() {
    return {
      municipalities: municipalityData.features.map(feature => ({
        id: feature.properties.id,
        name: feature.properties.name,
        geometry: feature.geometry
      })).sort((a, b) => a.name.localeCompare(b.name))
    };
  },
  computed: {
    ...mapState({
      storeMunicipality: state => state.property.municipality
    }),
    selectedMunicipality: {
      get() {
        return this.storeMunicipality?.id;
      },
      set(value) {
        // Não fazer nada aqui, a mudança é tratada no método handleMunicipalityChange
      }
    }
  },
  methods: {
    ...mapActions({
      setMunicipality: 'property/setMunicipality'
    }),
    handleMunicipalityChange(municipalityId) {
      const selectedMunicipality = this.municipalities.find(m => m.id === municipalityId);
      if (selectedMunicipality) {
        this.setMunicipality(selectedMunicipality);
      }
    }
  }
};
</script>

<style lang="scss">
.municipality-selector-card {
  width: $sidebar-width;
  margin-bottom: 10px;
  @include box-shadow(1);

  &:hover {
    @include box-shadow(2);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    font-weight: bold;
    margin-right: 10px;
    white-space: nowrap;
  }
  
  .el-select {
    width: 180px;
  }
}

// Responsividade para telas pequenas
@include respond-to(xs) {
  .municipality-selector-card {
    width: auto;
    min-width: 280px;
  }
  
  .card-header {
    .el-select {
      width: 150px;
    }
  }
}
</style>