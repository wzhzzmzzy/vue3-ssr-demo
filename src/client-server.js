import { _createApp } from './app';

export default async context => {
  const { app, router, store } = _createApp();
  const { url } = context;

  router.push(url);

  await router.isReady();

  context.state = store.state;

  return app;
}
