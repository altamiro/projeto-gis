export default {
  namespaced: true,
  state: {
    municipality: null,
    propertyArea: 0,
    netPropertyArea: 0,
    headquarters: null,
    anthropizedAfter2008: 0
  },
  mutations: {
    SET_MUNICIPALITY(state, municipality) {
      state.municipality = municipality;
    },
    SET_PROPERTY_AREA(state, area) {
      state.propertyArea = area;
    },
    SET_NET_PROPERTY_AREA(state, area) {
      state.netPropertyArea = area;
    },
    SET_HEADQUARTERS(state, headquarters) {
      state.headquarters = headquarters;
    },
    SET_ANTHROPIZED_AFTER_2008(state, area) {
      state.anthropizedAfter2008 = area;
    }
  },
  actions: {
    calculateNetPropertyArea({ commit, rootState }) {
      const propertyArea = rootState.layers.layers.find(l => l.id === 'propertyArea')?.area || 0;
      const administrativeServitudes = rootState.layers.layers
        .filter(l => l.type === 'administrativeServitude')
        .reduce((sum, layer) => sum + (layer.area || 0), 0);
      
      const netArea = propertyArea - administrativeServitudes;
      commit('SET_NET_PROPERTY_AREA', netArea);
      return netArea;
    },
    calculateAnthropizedAfter2008({ commit, rootState }) {
      const propertyArea = rootState.layers.layers.find(l => l.id === 'propertyArea')?.area || 0;
      const consolidatedArea = rootState.layers.layers.find(l => l.id === 'consolidatedArea')?.area || 0;
      const nativeVegetation = rootState.layers.layers.find(l => l.id === 'nativeVegetation')?.area || 0;
      const administrativeServitudes = rootState.layers.layers
        .filter(l => l.type === 'administrativeServitude')
        .reduce((sum, layer) => sum + (layer.area || 0), 0);
      const hydrography = rootState.layers.layers
        .filter(l => l.type === 'hydrography')
        .reduce((sum, layer) => sum + (layer.area || 0), 0);
      
      const anthropizedAfter2008 = propertyArea - (consolidatedArea + nativeVegetation + administrativeServitudes + hydrography);
      commit('SET_ANTHROPIZED_AFTER_2008', anthropizedAfter2008);
      return anthropizedAfter2008;
    }
  }
};