import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/pt-br';
import './assets/geo.css';


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
`;
document.head.appendChild(style);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');