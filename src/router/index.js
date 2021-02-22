'use strict';

const {
  createRouter,
  createWebHistory,
  createMemoryHistory
} = require('vue-router');

const isServer = typeof window === 'undefined';
const history = isServer 
  ? createMemoryHistory()
  : createWebHistory();

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: 'home' */ '@/pages/home.vue')
  }
];

export function _createRouter() {
  return createRouter({ routes, history });
}