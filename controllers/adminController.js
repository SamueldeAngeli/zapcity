const appConfig = require('../../config/app');
const adminService = require('../../database/adminService');
const storeService = require('../../database/storeService');
const playerService = require('../../fivem/services/playerService');
const { reviewRequest } = require('../../fivem/services/allowlistService');

function loginPage(req, res) {
  res.render('admin-login', {
    pageTitle: 'Admin Login',
    flash: null,
  });
}

function login(req, res) {
  const { username, password } = req.body;

  if (username === appConfig.admin.username && password === appConfig.admin.password) {
    req.session.adminUser = username;
    return res.redirect('/admin');
  }

  return res.status(401).render('admin-login', {
    pageTitle: 'Admin Login',
    flash: {
      type: 'error',
      title: 'Acesso negado',
      message: 'Credenciais inválidas.',
    },
  });
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/admin/login'));
}

async function dashboard(req, res) {
  const summary = res.locals.databaseReady
    ? await adminService.getDashboardSummary()
    : { orders: 0, pendingAllowlist: 0, logs24h: 0 };
  res.render('admin-dashboard', {
    pageTitle: 'Painel Admin',
    summary,
    flash: res.locals.databaseReady ? null : {
      type: 'warning',
      title: 'Banco indisponível',
      message: 'Conecte o MySQL da base vRP para liberar consultas e gestão completa.',
    },
  });
}

async function players(req, res) {
  const passport = Number.parseInt(req.query.passport, 10);
  const snapshot = res.locals.databaseReady && passport ? await playerService.getPlayerSnapshot(passport) : null;
  res.render('admin-players', {
    pageTitle: 'Players',
    passport: req.query.passport || '',
    snapshot,
    flash: res.locals.databaseReady ? null : {
      type: 'warning',
      title: 'Banco indisponível',
      message: 'A consulta de players precisa de conexão ativa com o MySQL.',
    },
  });
}

async function logs(req, res) {
  const logs = res.locals.databaseReady ? await adminService.listGeneralLogs() : [];
  res.render('admin-logs', {
    pageTitle: 'Logs Gerais',
    logs,
    flash: res.locals.databaseReady ? null : {
      type: 'warning',
      title: 'Sem dados',
      message: 'Os logs ficarão disponíveis assim que a API conseguir gravar no banco.',
    },
  });
}

async function kills(req, res) {
  const logs = res.locals.databaseReady ? await adminService.listKillLogs() : [];
  res.render('admin-kills', {
    pageTitle: 'Logs de Kill',
    logs,
    flash: res.locals.databaseReady ? null : {
      type: 'warning',
      title: 'Sem dados',
      message: 'Conecte a base e o resource zapcity_logs para preencher esta tela.',
    },
  });
}

async function orders(req, res) {
  const orders = res.locals.databaseReady ? await storeService.listOrders() : [];
  res.render('admin-orders', {
    pageTitle: 'Pedidos',
    orders,
    flash: res.locals.databaseReady ? null : {
      type: 'warning',
      title: 'Sem pedidos',
      message: 'A loja precisa do banco conectado para registrar novas compras.',
    },
  });
}

async function updateOrderStatus(req, res) {
  if (!res.locals.databaseReady) {
    return res.redirect('/admin/pedidos');
  }

  await storeService.updateOrderStatus(Number.parseInt(req.params.id, 10), req.body.status);
  res.redirect('/admin/pedidos');
}

async function allowlist(req, res) {
  const requests = res.locals.databaseReady ? await adminService.listAllowlistRequests() : [];
  res.render('admin-allowlist', {
    pageTitle: 'Allowlist',
    requests,
    flash: res.locals.databaseReady ? null : {
      type: 'warning',
      title: 'Sem solicitações',
      message: 'A allowlist será listada aqui quando o banco estiver ativo.',
    },
  });
}

async function reviewAllowlist(req, res) {
  if (!res.locals.databaseReady) {
    return res.redirect('/admin/allowlist');
  }

  await reviewRequest({
    requestId: Number.parseInt(req.params.id, 10),
    status: req.body.status,
    reviewedBy: req.session.adminUser,
    notes: req.body.notes || '',
  });

  res.redirect('/admin/allowlist');
}

module.exports = {
  loginPage,
  login,
  logout,
  dashboard,
  players,
  logs,
  kills,
  orders,
  updateOrderStatus,
  allowlist,
  reviewAllowlist,
};
