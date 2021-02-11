const controllers = require('./controllers');
// const mid = require('./middleware');

const router = (app) => {
  // app.get('/', mid.requiresSecure, controllers.indexPage);
  // app.get('*', mid.requiresSecure, controllers.errPage);
  app.get('/', controllers.indexPage);
  app.get('*', controllers.errPage);
};

module.exports = router;
