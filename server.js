const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const methodOverride = require('method-override');
const appConfig = require('../config/app');
const fivemConfig = require('../config/fivem');
const logger = require('../utils/logger');
const { formatCurrency, formatDateTime } = require('../utils/formatters');

async function startWebServer({ databaseReady }) {
  const app = express();
  app.locals.databaseReady = databaseReady;
  const publicDir = path.join(__dirname, 'public');
  const siteDir = path.join(publicDir, 'site');
  const painelDir = path.join(publicDir, 'painel');

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(morgan('dev'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(methodOverride('_method'));
  app.use(session({
    secret: appConfig.admin.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  }));
  app.use('/assets', express.static(publicDir));
  app.use('/site', express.static(siteDir));
  app.use('/painel', express.static(painelDir));
  app.get('/painel', (req, res) => {
    res.sendFile(path.join(painelDir, 'index.html'));
  });

  app.use((req, res, next) => {
    res.locals.app = appConfig;
    res.locals.databaseReady = databaseReady;
    res.locals.fivem = fivemConfig;
    res.locals.currentPath = req.path;
    res.locals.adminUser = req.session.adminUser || null;
    res.locals.formatCurrency = formatCurrency;
    res.locals.formatDateTime = formatDateTime;
    next();
  });

  app.get([
    '/',
    '/loja',
    '/loja/vips',
    '/loja/veiculos',
    '/loja/outros',
    '/vip',
    '/pacote-inicial',
    '/noticias',
    '/como-jogar',
    '/contato',
    '/allowlist',
    '/conectar',
  ], (req, res) => {
    res.sendFile(path.join(siteDir, 'index.html'));
  });

  app.use('/', require('./routes/public'));
  app.use('/admin', require('./routes/admin'));
  app.use('/api', require('./routes/api'));

  app.use((req, res) => {
    res.status(404).render('status', {
      pageTitle: 'Página não encontrada',
      statusData: {
        online: false,
        endpoint: fivemConfig.connectEndpoint,
        playerCount: 0,
        maxClients: 0,
        error: 'Página não encontrada.',
      },
      flash: {
        type: 'error',
        title: '404',
        message: 'A página solicitada não existe.',
      },
    });
  });

  app.listen(appConfig.port, () => {
    logger.info('Site público da Zap City online.', {
      port: appConfig.port,
      publicUrl: appConfig.publicUrl,
    });
  });

  return app;
}

module.exports = {
  startWebServer,
};
