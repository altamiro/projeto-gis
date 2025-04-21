import arcgisService from '../../services/arcgis';

export default {
  namespaced: true,
  state: {
    municipality: null,
    municipalityGeometry: null,
    propertyArea: 0,
    netPropertyArea: 0,
    headquarters: null,
    anthropizedAfter2008: 0
  },
  mutations: {
    SET_MUNICIPALITY(state, municipality) {
      state.municipality = municipality;
    },
    SET_MUNICIPALITY_GEOMETRY(state, geometry) {
      state.municipalityGeometry = geometry;
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
    setMunicipality({ commit, dispatch }, municipality) {
      try {
        // Primeiro, definir o município no estado
        commit('SET_MUNICIPALITY', municipality);
        
        // Exibir o município no mapa e obter a geometria processada
        const municipalityGeometry = arcgisService.displayMunicipality(municipality);
        
        // Verificar se a geometria foi processada corretamente
        if (!municipalityGeometry) {
          // Adicionar alerta de erro se a exibição falhou
          dispatch('validation/addAlert', {
            type: 'error',
            message: `Erro ao exibir a geometria do município "${municipality.name}".`
          }, { root: true });
          
          return { success: false };
        }
        
        // Armazenar a geometria no estado
        commit('SET_MUNICIPALITY_GEOMETRY', municipalityGeometry);
        
        // Limpar camadas existentes quando trocar de município
        dispatch('layers/removeAllLayers', null, { root: true });
        
        // Adicionar alerta informativo
        dispatch('validation/addAlert', {
          type: 'success',
          message: `Município "${municipality.name}" selecionado com sucesso.`
        }, { root: true });
        
        return { success: true };
      } catch (error) {
        console.error('Erro ao definir município:', error);
        
        // Adicionar alerta de erro
        dispatch('validation/addAlert', {
          type: 'error',
          message: `Erro ao selecionar o município: ${error.message || 'Erro desconhecido'}`
        }, { root: true });
        
        return { success: false };
      }
    },
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
  },
  getters: {
    hasMunicipalitySelected: state => !!state.municipality
  }
};