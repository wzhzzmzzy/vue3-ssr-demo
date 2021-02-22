import { _createApp } from './app';

const { app, router, store } = _createApp();

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__);
}

(async (_router, _app) => {
  await _router.isReady();
  _app.mount('#app', true);
})(router, app);
