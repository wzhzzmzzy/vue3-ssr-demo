import { createSSRApp, createApp } from 'vue';
import { sync } from 'vuex-router-sync';
import { _createRouter } from './router';
import { _createStore } from './store';
import App from './App.vue';

export function _createApp() {
  const isServer = typeof window === 'undefined';
  const app = (isServer ? createSSRApp : createApp)(App);
  const router = _createRouter();
  const store = _createStore();

  sync(store, router);

  app.use(router).use(store);

  return { app, router, store };
}
