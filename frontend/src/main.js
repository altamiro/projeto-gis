import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/pt-br';
import './assets/geo.css';


// Importar serviços
import httpService from './utils/httpService';
import arcgisService from './services/arcgis';
import layersService from './services/layersService'; // Adicionar esta linha

// Configurar serviços como plugins globais
Vue.prototype.$http = httpService;
Vue.prototype.$arcgisService = arcgisService;
Vue.prototype.$layersService = layersService; // Adicionar esta linha

window.arcgisService = arcgisService;

Vue.prototype.$arcgisService = arcgisService;


Vue.use(ElementUI, { locale });
Vue.config.productionTip = false;

// Adicionar estilo para o popup do centroide
const style = document.createElement('style');
style.textContent = `
  /* Estilo para o popup do centroide */
  .esri-popup--centroid .esri-popup__main-container {
    max-width: 200px;
  }
  
  .esri-popup--centroid .esri-popup__header {
    background-color: #409EFF;
  }
  
  .esri-popup--centroid .esri-popup__header-title {
    font-weight: bold;
    color: white;
  }
  
  /* Estilo para o botão de salvar flutuante */
  .save-button-container {
    position: fixed;
    bottom: 40px;
    right: 20px;
    z-index: 1000;
  }
  
  .save-button-container .el-button {
    padding: 10px 20px;
    font-weight: bold;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .save-button-container .el-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.2);
  }
`;
document.head.appendChild(style);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');