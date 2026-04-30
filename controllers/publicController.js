const storeService = require('../../database/storeService');
const { getServerStatus } = require('../../fivem/services/serverStatusService');

async function home(req, res) {
  const [featuredProducts, statusData] = await Promise.all([
    res.locals.databaseReady ? storeService.listProducts({ featuredOnly: true }) : Promise.resolve([]),
    getServerStatus(),
  ]);

  res.render('home', {
    pageTitle: 'Zap City RP',
    featuredProducts,
    statusData,
  });
}

function rules(req, res) {
  res.render('rules', {
    pageTitle: 'Regras da Cidade',
  });
}

function connect(req, res) {
  res.render('connect', {
    pageTitle: 'Conectar na Cidade',
  });
}

async function status(req, res) {
  const statusData = await getServerStatus();
  res.render('status', {
    pageTitle: 'Status da Cidade',
    statusData,
    flash: null,
  });
}

module.exports = {
  home,
  rules,
  connect,
  status,
};
