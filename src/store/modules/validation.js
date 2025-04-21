export default {
  namespaced: true,
  state: {
    alerts: [],
    validationErrors: []
  },
  mutations: {
    ADD_ALERT(state, alert) {
      state.alerts.push({
        ...alert,
        id: Date.now(),
        timestamp: new Date().toISOString()
      });
    },
    REMOVE_ALERT(state, alertId) {
      state.alerts = state.alerts.filter(a => a.id !== alertId);
    },
    CLEAR_ALERTS(state) {
      state.alerts = [];
    },
    SET_VALIDATION_ERRORS(state, errors) {
      state.validationErrors = errors;
    },
    CLEAR_VALIDATION_ERRORS(state) {
      state.validationErrors = [];
    }
  },
  actions: {
    addAlert({ commit }, alert) {
      commit('ADD_ALERT', alert);
      
      // Auto-remover o alerta após 5 segundos
      setTimeout(() => {
        commit('REMOVE_ALERT', alert.id);
      }, 5000);
    },
    validatePropertyCoverage({ commit, rootState, rootGetters }) {
      const isFullyCovered = rootGetters['layers/isPropertyFullyCovered'];
      
      if (!isFullyCovered) {
        commit('SET_VALIDATION_ERRORS', [{
          code: 'INCOMPLETE_COVERAGE',
          message: 'Toda a área do imóvel deve ser coberta por pelo menos uma camada de cobertura do solo.'
        }]);
        return false;
      }
      
      commit('CLEAR_VALIDATION_ERRORS');
      return true;
    }
  }
};