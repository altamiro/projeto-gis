import Vue from 'vue';
import Vuex from 'vuex';
import property from './modules/property';
import layers from './modules/layers';
import validation from './modules/validation';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    property,
    layers,
    validation
  }
});