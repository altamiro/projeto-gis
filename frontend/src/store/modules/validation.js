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
        id: alert.id || Date.now(),
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
    addAlert({ commit, dispatch }, alert) {
      // Configurar a duração padrão de acordo com o tipo de alerta
      const alertWithDuration = {
        ...alert,
        duration: alert.duration !== undefined ? alert.duration : getDefaultDuration(alert.type)
      };
      
      commit('ADD_ALERT', alertWithDuration);
      
      // Se a duração for especificada e maior que zero, configurar o auto-fechamento
      if (alertWithDuration.duration > 0) {
        setTimeout(() => {
          dispatch('removeAlert', alertWithDuration.id);
        }, alertWithDuration.duration);
      }
    },
    
    removeAlert({ commit }, alertId) {
      commit('REMOVE_ALERT', alertId);
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

// Função auxiliar para determinar a duração padrão com base no tipo de alerta
function getDefaultDuration(type) {
  switch (type) {
    case 'success':
      return 3000; // 3 segundos
    case 'info':
      return 5000; // 5 segundos
    case 'warning':
      return 7000; // 7 segundos
    case 'error':
      return 10000; // 10 segundos (erros ficam mais tempo)
    default:
      return 5000; // Padrão
  }
}