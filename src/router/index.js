import Vue from 'vue';
import VueRouter from 'vue-router';
import GeoScreen from '../views/GeoScreen.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'geo',
    component: GeoScreen
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;