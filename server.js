const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression')
const favicon = require('serve-favicon');
const template = require('lodash/template');
const { createBundleRenderer } = require('vue-bundle-renderer');

const resolve = file => path.resolve(__dirname, file);
const isProd = process.env.NODE_ENV = 'production';
const serverInfo =
  `express/${require('express/package.json').version} ` +
  `@vue/server-renderer/${require('@vue/server-renderer/package.json').version}`

const app = express();

function createRenderer (bundle, options) {
  return createBundleRenderer(
    bundle, 
    Object.assign(options, {
      runInNewContext: false,
      basedir: resolve('./dist'),
      renderToString: import('@vue/server-renderer').renderToString,
      publicPath: '/dist/'
    })
  );
}

let renderer, readyPromise;
const templatePath = resolve('./src/index.template.html');

if (isProd) {
  const bundle = require('./dist/vue-ssr-server-bundle.json');
  const clientManifest = require('./dist/vue-ssr-client-manifest.json');
  renderer = createRenderer(bundle, { clientManifest });
} else {
  readyPromise = require('./build/setup-dev-server')(
    app, 
    (bundle, options) => {
      renderer = createRenderer(bundle, options);
    }
  );
}

const serve = (path, cache) =>
  express.static(resolve(path), {
    maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0,
  });

app.use(compression({ threshold: 0 }))
app.use(favicon('./src/assets/logo-48.png'));
app.use('/dist', serve('./dist', true));
app.use('/public', serve('./public', true))
app.use('/manifest.json', serve('./manifest.json', true))
app.use('/service-worker.js', serve('./dist/service-worker.js'))

async function render(req, res) {
  const s = Date.now();

  res.setHeader("Content-Type", "text/html")
  res.setHeader("Server", serverInfo)

  const handleError = err => {
    if (err.url) {
      res.redirect(err.url);
    } else if (err.code === 404) {
      res.status(404).send('404 | Page Not Found');
    } else {
      res.status(500).send('500 | InternalServerError');
      console.error(`error during render : ${req.url}`);
      console.error(err.stack);
    }
  }

  const renderState = context => {
    const contextKey = 'state';
    const stateKey = '__INITIAL_STATE__';
    const state = serialize(context[contextKey]);
    const autoRemove =
    ';(function(){var s;(s=document.currentScript||document.scripts[document.scripts.length-1]).parentNode.removeChild(s);}());';
    const nonceAttr = context.nonce ? ' nonce="' + context.nonce + '"' : '';
    return context[contextKey]
      ? `<script${nonceAttr}>window.${stateKey}=${state}${autoRemove}</script>`
      : '';
  };

  const context = {
    title: 'Vue HN 2.0',
    url: req.url
  };

  const page = await renderer.renderToString(context).catch(err => {
    handleError(err);
  });

  const {
    renderStyles,
    renderResourceHints,
    renderScripts
  } = context;

  const html = template(fs.readFileSync(templatePath, 'utf-8'))({
    styles: renderStyles(),
    resources: renderResourceHints(),
    scripts: renderScripts(),
    state: renderState(context),
    content: page,
  });

  res.send(html);
  if (!isProd) {
    console.log(`whole request: ${Date.now() - s}ms`)
  }
}

app.get('*', isProd ? render : (req, res) =>
  readyPromise.then(() => render(req, res))
);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`server started at localhost:${port}`)
});