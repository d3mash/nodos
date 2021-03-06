const path = require('path');
const fastifyCookie = require('fastify-cookie');
const fastifyFormbody = require('fastify-formbody');
const buildRouter = require('./builders/routes');
const buildFastify = require('./builders/fastify');
const log = require('./logger');
const { requireDefaultFunction } = require('./utils.js');

class Application {
  addCommandBuilder(buildComand) {
    this.commandBuilders.push(buildComand);
  }

  addPlugin(plugin, options = {}) {
    this.plugins.push([plugin, options]);
  }

  addDependency(name, value) {
    this.container[name] = value;
  }

  addExtension(extension, options = {}) {
    this.extensions.push([extension, options]);
  }

  addHook(name, value) {
    this.hooks[name].push(value);
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isProduction() {
    return this.env === 'production';
  }

  constructor(projectRoot, env = 'development') {
    this.env = env;
    this.defaultRequestOptions = { headers: {}, params: null };
    this.commandBuilders = [];
    this.extensions = [];
    this.generators = [];
    this.container = {};
    this.plugins = [];
    this.hooks = {
      onStop: [],
    };

    const join = path.join.bind(null, projectRoot);
    this.config = {
      env,
      projectRoot,
      errorHandler: false,
      paths: {
        publicPath: join('public'),
        routesPath: join('config', 'routes.yml'),
        applicationPath: join('config', 'application.js'),
        configPath: join('config'),
        environmentPath: join(`config/environments/${env}.js`),
        templatesPath: join('app', 'templates'),
        controllersPath: join('app', 'controllers'),
        middlewaresPath: join('app', 'middlewares'),
      },
    };

    this.addPlugin(fastifyCookie);
    this.addPlugin(fastifyFormbody);
  }

  async start() {
    const fillByApp = requireDefaultFunction(this.config.paths.applicationPath);
    const fillByEnv = requireDefaultFunction(this.config.paths.environmentPath);

    fillByApp(this);
    fillByEnv(this);

    this.router = await buildRouter(this.config.paths.routesPath, { host: this.config.host });
    this.addDependency('router', this.router);
    await Promise.all(this.extensions.map(([f, options]) => f(this, options)));
    // TODO: pass only data, not application
    this.fastify = await buildFastify(this);
    log('CONFIG', this.config);
  }

  listen(...args) {
    return this.fastify.listen(...args);
  }

  stop() {
    this.hooks.onStop.forEach((h) => h());
  }

  get(url) {
    return this.request('GET', url);
  }

  post(url, options = {}) {
    return this.request('POST', url, options);
  }

  put(url, options = {}) {
    this.request('PUT', url, options);
  }

  patch(url, options = {}) {
    this.request('PATCH', url, options);
  }

  delete(url) {
    return this.request('DELETE', url);
  }

  request(method, url, options) {
    const { params, headers } = { ...this.defaultRequestOptions, ...options };

    return this.fastify.inject({
      method,
      url,
      headers,
      payload: params,
    });
  }
}

module.exports = Application;
