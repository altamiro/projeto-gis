import arcgisService from '../../services/arcgis';
import municipalityData from '../../dados/geojs-35-mun.json';

export default {
  namespaced: true,
  state: {
    municipality: null,
    municipalityGeometry: null,
    area_imovel: 0,
    netarea_imovel: 0,
    sede_imovel: null,
    area_antropizada_apos_2008_vetorizada: 0
  },
  mutations: {
    SET_MUNICIPALITY(state, municipality) {
      state.municipality = municipality;
    },
    SET_MUNICIPALITY_GEOMETRY(state, geometry) {
      state.municipalityGeometry = geometry;
    },
    SET_PROPERTY_AREA(state, area) {
      state.area_imovel = area;
    },
    SET_NET_PROPERTY_AREA(state, area) {
      state.netarea_imovel = area;
    },
    SET_sede_imovel(state, sede_imovel) {
      state.sede_imovel = sede_imovel;
    },
    SET_ANTHROPIZED_AFTER_2008(state, area) {
      state.area_antropizada_apos_2008_vetorizada = area;
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
    
    /**
     * Carrega um município pelo ID
     * @param {Object} context - Contexto do Vuex
     * @param {Object} options - Objeto com as opções
     * @param {String} options.municipalityId - ID do município
     * @param {String} options.source - Fonte dos dados (default: 'local')
     * @returns {Promise} Uma promessa com o resultado da operação
     */
    async loadMunicipalityById({ dispatch }, { municipalityId, source = 'local' }) {
      try {
        let municipality = null;
        
        // Fonte local (arquivo JSON)
        if (source === 'local') {
          municipality = municipalityData.features.find(
            feature => feature.properties.id === municipalityId
          );
          
          if (!municipality) {
            throw new Error(`Município com ID "${municipalityId}" não encontrado no arquivo local.`);
          }
          
          // Formatar o objeto do município conforme esperado pelo setMunicipality
          municipality = {
            id: municipality.properties.id,
            name: municipality.properties.name,
            geometry: municipality.geometry
          };
        } 
        // Adicionar outras fontes (REST API, etc) aqui no futuro
        else if (source === 'api') {
          // Implementação futura para buscar dados da API
          // const response = await fetch(`/api/municipalities/${municipalityId}`);
          // municipality = await response.json();
          throw new Error('Fonte de dados "api" ainda não implementada.');
        } else {
          throw new Error(`Fonte de dados "${source}" não reconhecida.`);
        }
        
        // Chamar setMunicipality com o município encontrado
        return dispatch('setMunicipality', municipality);
      } catch (error) {
        console.error('Erro ao carregar município por ID:', error);
        
        // Adicionar alerta de erro
        dispatch('validation/addAlert', {
          type: 'error',
          message: `Erro ao carregar município: ${error.message || 'Erro desconhecido'}`
        }, { root: true });
        
        return { success: false };
      }
    },
    
    calculateNetarea_imovel({ commit, rootState }) {
      const area_imovel = rootState.layers.layers.find(l => l.id === 'area_imovel')?.area || 0;
      const area_servidao_administrativa_totals = rootState.layers.layers
        .filter(l => l.type === 'area_servidao_administrativa_total')
        .reduce((sum, layer) => sum + (layer.area || 0), 0);
      
      const netArea = area_imovel - area_servidao_administrativa_totals;
      commit('SET_NET_PROPERTY_AREA', netArea);
      return netArea;
    },
    calculatearea_antropizada_apos_2008_vetorizada({ commit, rootState }) {
      const area_imovel = rootState.layers.layers.find(l => l.id === 'area_imovel')?.area || 0;
      const area_consolidada = rootState.layers.layers.find(l => l.id === 'area_consolidada')?.area || 0;
      const vegetacao_nativa = rootState.layers.layers.find(l => l.id === 'vegetacao_nativa')?.area || 0;
      const area_servidao_administrativa_totals = rootState.layers.layers
        .filter(l => l.type === 'area_servidao_administrativa_total')
        .reduce((sum, layer) => sum + (layer.area || 0), 0);
      const hydrography = rootState.layers.layers
        .filter(l => l.type === 'hydrography')
        .reduce((sum, layer) => sum + (layer.area || 0), 0);
      
      const area_antropizada_apos_2008_vetorizada = area_imovel - (area_consolidada + vegetacao_nativa + area_servidao_administrativa_totals + hydrography);
      commit('SET_ANTHROPIZED_AFTER_2008', area_antropizada_apos_2008_vetorizada);
      return area_antropizada_apos_2008_vetorizada;
    }
  },
  getters: {
    hasMunicipalitySelected: state => !!state.municipality
  }
};