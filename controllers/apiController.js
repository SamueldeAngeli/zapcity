const appConfig = require('../../config/app');
const discordConfig = require('../../config/discord');
const fivemConfig = require('../../config/fivem');
const storeService = require('../../database/storeService');
const { checkAllowlistEligibility, createRequest, releaseAllowlistDirect } = require('../../fivem/services/allowlistService');
const { registerLog, createKillLogMessage } = require('../../fivem/services/logsService');
const { getServerStatus } = require('../../fivem/services/serverStatusService');
const { isPoolReady } = require('../../database/mysql');
const { getDiscordStatus, sendMessage } = require('../../utils/discordBridge');
const { baseEmbed, COLORS } = require('../../utils/embeds');
const { parsePassport, sanitizeText } = require('../../utils/validators');
const { formatCurrency } = require('../../utils/formatters');

const PANEL_COLOR_MAP = {
  orange: COLORS.primary,
  blue: COLORS.info,
  green: COLORS.success,
  yellow: COLORS.warning,
  red: COLORS.danger,
  neutral: COLORS.neutral,
};

const PANEL_TABS = [
  { id: 'boasVindas', label: 'Boas-vindas', group: 'Canais', channelId: discordConfig.channels.boasVindas },
  { id: 'whitelist', label: 'Whitelist / Allowlist', group: 'Canais', channelId: discordConfig.channels.whitelist },
  { id: 'vendas', label: 'Vendas', group: 'Canais', channelId: discordConfig.channels.vendas },
  { id: 'anuncios', label: 'Anúncios', group: 'Canais', channelId: discordConfig.channels.anuncios },
  { id: 'logs.gerais', label: 'Logs gerais', group: 'Logs', channelId: discordConfig.channels.logs.gerais },
  { id: 'logs.allowlist', label: 'Logs de allowlist', group: 'Logs', channelId: discordConfig.channels.logs.allowlist },
  { id: 'logs.kills', label: 'Logs de kills', group: 'Logs', channelId: discordConfig.channels.logs.kills },
  { id: 'logs.players', label: 'Logs de entrada/saída', group: 'Logs', channelId: discordConfig.channels.logs.players },
  { id: 'logs.punicoes', label: 'Logs de punições', group: 'Logs', channelId: discordConfig.channels.logs.punicoes },
  { id: 'logs.admin', label: 'Logs administrativos', group: 'Logs', channelId: discordConfig.channels.logs.admin },
  { id: 'logs.dinheiro', label: 'Logs de dinheiro', group: 'Logs', channelId: discordConfig.channels.logs.dinheiro },
  { id: 'logs.inventario', label: 'Logs de inventário', group: 'Logs', channelId: discordConfig.channels.logs.inventario },
  { id: 'logs.garagem', label: 'Logs de garagem', group: 'Logs', channelId: discordConfig.channels.logs.garagem },
  { id: 'logs.erros', label: 'Logs de erros', group: 'Logs', channelId: discordConfig.channels.logs.erros },
];

const WHITELIST_QUESTIONS = [
  {
    id: 'powergaming',
    question: 'O que é Powergaming?',
    options: [
      { value: 'a', label: 'Forçar ações impossíveis ou sem chance de reação dentro do RP.' },
      { value: 'b', label: 'Dirigir rápido durante uma fuga autorizada pela situação.' },
      { value: 'c', label: 'Criar uma história detalhada para o personagem.' },
    ],
    correct: 'a',
  },
  {
    id: 'metagaming',
    question: 'O que é Metagaming?',
    options: [
      { value: 'a', label: 'Usar informações de fora do RP dentro da cidade.' },
      { value: 'b', label: 'Conversar pelo rádio da facção.' },
      { value: 'c', label: 'Anotar informações que seu personagem descobriu em RP.' },
    ],
    correct: 'a',
  },
  {
    id: 'rdm',
    question: 'O que significa RDM?',
    options: [
      { value: 'a', label: 'Matar ou atacar alguém sem motivo, contexto ou construção de RP.' },
      { value: 'b', label: 'Roubar um veículo durante uma ação planejada.' },
      { value: 'c', label: 'Reagir a uma abordagem com risco calculado.' },
    ],
    correct: 'a',
  },
  {
    id: 'vdm',
    question: 'O que significa VDM?',
    options: [
      { value: 'a', label: 'Usar veículo como arma sem contexto ou de forma abusiva.' },
      { value: 'b', label: 'Trabalhar como motorista legalizado.' },
      { value: 'c', label: 'Perder o controle do carro por acidente em uma curva.' },
    ],
    correct: 'a',
  },
  {
    id: 'combat_logging',
    question: 'O que é Combat Logging?',
    options: [
      { value: 'a', label: 'Sair do servidor para evitar prisão, morte, abordagem ou consequência.' },
      { value: 'b', label: 'Fechar o jogo depois de encerrar uma cena.' },
      { value: 'c', label: 'Relogar após autorização da staff.' },
    ],
    correct: 'a',
  },
  {
    id: 'amor_a_vida',
    question: 'Em uma abordagem armada, o que representa amor à vida?',
    options: [
      { value: 'a', label: 'Valorizar a vida do personagem e reagir apenas quando houver condição real.' },
      { value: 'b', label: 'Correr contra cinco armas porque o personagem é corajoso.' },
      { value: 'c', label: 'Ignorar ameaças porque o jogador conhece o mapa.' },
    ],
    correct: 'a',
  },
  {
    id: 'safe_zone',
    question: 'Como agir em uma área segura?',
    options: [
      { value: 'a', label: 'Respeitar as regras locais e evitar iniciar ações agressivas proibidas.' },
      { value: 'b', label: 'Usar a área para fugir de qualquer consequência já iniciada.' },
      { value: 'c', label: 'Provocar outros jogadores para gerar perseguição.' },
    ],
    correct: 'a',
  },
  {
    id: 'dark_rp',
    question: 'Sobre Dark RP, qual conduta é correta?',
    options: [
      { value: 'a', label: 'Evitar temas extremos/proibidos e seguir os limites definidos pela cidade.' },
      { value: 'b', label: 'Fazer qualquer cena pesada se todos estiverem em call.' },
      { value: 'c', label: 'Usar choque como argumento principal de qualquer personagem.' },
    ],
    correct: 'a',
  },
  {
    id: 'cop_bait',
    question: 'O que é cop baiting?',
    options: [
      { value: 'a', label: 'Provocar polícia sem motivo só para iniciar perseguição ou ação.' },
      { value: 'b', label: 'Chamar a polícia por uma denúncia real em RP.' },
      { value: 'c', label: 'Ser abordado após cometer crime com contexto.' },
    ],
    correct: 'a',
  },
  {
    id: 'denuncia',
    question: 'Se você sofrer uma quebra de regra, o melhor caminho é:',
    options: [
      { value: 'a', label: 'Coletar provas, manter o RP possível e procurar a staff pelos canais corretos.' },
      { value: 'b', label: 'Quebrar RP imediatamente e discutir no meio da cena.' },
      { value: 'c', label: 'Revidar quebrando regra para equilibrar a situação.' },
    ],
    correct: 'a',
  },
];

function applyCors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', appConfig.panel.allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key,x-admin-user,x-admin-password');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
}

function isAdminRequest(req) {
  if (req.session?.adminUser) return true;

  const username = req.headers['x-admin-user'];
  const password = req.headers['x-admin-password'];
  return username === appConfig.admin.username && password === appConfig.admin.password;
}

function getPanelBots() {
  return [
    {
      id: 'zapcity',
      name: appConfig.city.name,
      description: 'Bot principal conectado neste sistema.',
      status: getDiscordStatus(),
    },
  ];
}

function getPanelTabs() {
  return PANEL_TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    group: tab.group,
    configured: Boolean(tab.channelId),
  }));
}

function findPanelTab(tabId) {
  return PANEL_TABS.find((tab) => tab.id === tabId);
}

function health(req, res) {
  res.json({
    ok: true,
    databaseReady: isPoolReady(),
    timestamp: Date.now(),
  });
}

function publicWhitelistQuestions() {
  return WHITELIST_QUESTIONS.map(({ correct, ...question }) => question);
}

function scoreWhitelistAnswers(answers = {}) {
  let score = 0;
  const details = WHITELIST_QUESTIONS.map((question) => {
    const selected = sanitizeText(answers[question.id], 10);
    const correct = selected === question.correct;
    if (correct) score += 1;
    return {
      id: question.id,
      selected,
      correct,
    };
  });

  return {
    score,
    total: WHITELIST_QUESTIONS.length,
    details,
  };
}

function serializeProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    name: product.name,
    description: product.description,
    price: Number(product.price || 0),
    priceLabel: formatCurrency(product.price),
    image: product.image,
    available: Number(product.is_available) === 1,
    featured: Number(product.is_featured) === 1,
    deliveryAction: product.delivery_action || 'manual_review',
  };
}

async function siteBootstrap(req, res) {
  const [statusData, products] = await Promise.all([
    getServerStatus(),
    storeService.listCatalogProducts(),
  ]);

  return res.json({
    ok: true,
    city: {
      name: appConfig.city.name,
      shortName: appConfig.city.shortName,
      discordInviteUrl: appConfig.city.discordInviteUrl,
    },
    databaseReady: isPoolReady(),
    fivem: {
      connectEndpoint: fivemConfig.connectEndpoint,
      connectCommand: fivemConfig.connectCommand,
      status: statusData,
    },
    store: {
      products: products.map(serializeProduct),
      categories: ['VIP', 'Veiculos', 'Itens', 'Coins', 'Casas', 'Pacotes'],
    },
    whitelist: {
      passScore: 8,
      questions: publicWhitelistQuestions(),
    },
  });
}

async function siteStoreProducts(req, res) {
  const category = sanitizeText(req.query.category, 60) || null;
  const featuredOnly = String(req.query.featured || '').toLowerCase() === 'true';
  const products = await storeService.listCatalogProducts({ category, featuredOnly });

  return res.json({
    ok: true,
    databaseReady: isPoolReady(),
    products: products.map(serializeProduct),
  });
}

async function siteCreateOrder(req, res) {
  const productId = Number.parseInt(req.body.productId, 10);
  const passport = parsePassport(req.body.passport);

  if (!productId || !passport) {
    return res.status(400).json({ ok: false, error: 'Produto e passaporte são obrigatórios.' });
  }

  const result = await storeService.createCatalogOrder({
    productId,
    passport,
    customerName: sanitizeText(req.body.customerName, 120) || 'Cliente Zap City',
    discordId: sanitizeText(req.body.discordId, 50),
    discordTag: sanitizeText(req.body.discordTag, 120),
    notes: sanitizeText(req.body.notes, 500),
  });

  await registerLog({
    category: 'order',
    action: 'store_order_created',
    title: 'Novo pedido da loja',
    passport,
    discordId: result.order.discord_id,
    message: `Pedido #${result.order.id} criado para ${result.product.name}.`,
    fields: [
      { name: 'Pedido', value: `#${result.order.id}`, inline: true },
      { name: 'Produto', value: result.product.name, inline: true },
      { name: 'Valor', value: formatCurrency(result.product.price), inline: true },
      { name: 'Passaporte', value: `\`${passport}\``, inline: true },
      { name: 'Status', value: result.order.status, inline: true },
    ],
    payload: result,
  }).catch(() => null);

  return res.json({
    ok: true,
    offline: Boolean(result.offline),
    order: result.order,
    product: serializeProduct(result.product),
    message: result.offline
      ? 'Pedido gerado em modo de teste. Conecte o MySQL para produção.'
      : 'Pedido gerado e enviado para acompanhamento da staff.',
  });
}

async function siteCitizenCheck(req, res) {
  const passport = parsePassport(req.body.passport);
  if (!passport) {
    return res.status(400).json({ ok: false, error: 'Informe um passaporte válido.' });
  }

  if (!isPoolReady()) {
    return res.json({
      ok: true,
      databaseReady: false,
      status: 'database_unavailable',
      passport,
      message: 'A base vRP ainda não está conectada.',
    });
  }

  const result = await checkAllowlistEligibility(passport);

  if (!result.player) {
    return res.json({
      ok: true,
      databaseReady: true,
      status: 'not_found',
      passport,
      message: 'Esse passaporte ainda não existe na base.',
    });
  }

  return res.json({
    ok: true,
    databaseReady: true,
    status: result.alreadyReleased ? 'released' : 'needs_whitelist',
    passport,
    player: {
      passport: result.player.passport,
      firstName: result.player.first_name,
      lastName: result.player.last_name,
      whitelisted: Number(result.player.whitelisted) === 1,
      banned: Number(result.player.banned) === 1,
      lastLogin: result.player.last_login,
    },
    latestRequest: result.latestRequest,
    connectEndpoint: fivemConfig.connectEndpoint,
    connectCommand: fivemConfig.connectCommand,
  });
}

async function siteWhitelistSubmit(req, res) {
  if (!isPoolReady()) {
    return res.status(503).json({ ok: false, error: 'A allowlist precisa do banco vRP conectado.' });
  }

  const passport = parsePassport(req.body.passport);
  if (!passport) {
    return res.status(400).json({ ok: false, error: 'Informe um passaporte válido.' });
  }

  const eligibility = await checkAllowlistEligibility(passport);
  if (!eligibility.player) {
    return res.status(404).json({ ok: false, error: 'Passaporte não encontrado na base vRP.' });
  }

  if (eligibility.alreadyReleased) {
    return res.json({
      ok: true,
      status: 'already_released',
      message: 'Esse passaporte já possui allowlist.',
      connectEndpoint: fivemConfig.connectEndpoint,
      connectCommand: fivemConfig.connectCommand,
    });
  }

  const result = scoreWhitelistAnswers(req.body.answers || {});
  const fullName = sanitizeText(req.body.fullName, 120) || `${eligibility.player.first_name || ''} ${eligibility.player.last_name || ''}`.trim() || 'Cidadão Zap City';
  const age = sanitizeText(req.body.age, 10) || 'N/D';
  const discordId = sanitizeText(req.body.discordId, 50);
  const discordTag = sanitizeText(req.body.discordTag, 120);
  const reviewReason = [
    `Pontuação WL: ${result.score}/${result.total}.`,
    `Nome: ${fullName}.`,
    `Resumo das respostas: ${result.details.map((item) => `${item.id}=${item.selected || '-'}`).join(', ')}`,
  ].join('\n');

  if (result.score >= 8) {
    const request = await createRequest({
      passport,
      fullName,
      age,
      recruiter: 'Site oficial',
      reason: reviewReason,
      discordId,
      discordTag,
      source: 'web',
      status: 'approved',
    });

    const releaseResult = await releaseAllowlistDirect({
      passport,
      discordId,
      discordTag,
      actor: 'Quiz automático do site',
      source: 'web',
    });

    return res.json({
      ok: true,
      status: releaseResult.alreadyReleased ? 'already_released' : 'released',
      score: result.score,
      total: result.total,
      requestId: request.id,
      message: 'WL aprovada. Você já pode conectar na cidade.',
      connectEndpoint: fivemConfig.connectEndpoint,
      connectCommand: fivemConfig.connectCommand,
    });
  }

  const pendingStatus = result.score >= 5 ? 'needs_review' : 'rejected';
  const request = await createRequest({
    passport,
    fullName,
    age,
    recruiter: 'Site oficial',
    reason: reviewReason,
    discordId,
    discordTag,
    source: 'web',
    status: pendingStatus,
  });

  return res.json({
    ok: true,
    status: pendingStatus,
    score: result.score,
    total: result.total,
    requestId: request.id,
    message: pendingStatus === 'needs_review'
      ? 'Sua WL foi enviada para revisão da staff.'
      : 'Sua WL não atingiu a pontuação mínima. Revise as regras e tente novamente com a staff.',
  });
}

function panelOptions(req, res) {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: 'Acesso administrativo inválido.' });
  }

  return res.json({
    ok: true,
    bots: getPanelBots(),
    tabs: getPanelTabs(),
  });
}

async function sendPanelMessage(req, res) {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: 'Acesso administrativo inválido.' });
  }

  const botId = sanitizeText(req.body.botId, 40);
  const tabId = sanitizeText(req.body.tabId, 80);
  const mode = sanitizeText(req.body.mode, 20) || 'simple';
  const title = sanitizeText(req.body.title, 180);
  const message = sanitizeText(req.body.message, 1800);
  const colorKey = sanitizeText(req.body.color, 20) || 'orange';

  if (botId !== 'zapcity') {
    return res.status(400).json({ ok: false, error: 'Bot não configurado neste painel.' });
  }

  const tab = findPanelTab(tabId);
  if (!tab) {
    return res.status(400).json({ ok: false, error: 'Aba/canal não encontrada.' });
  }

  if (!tab.channelId) {
    return res.status(400).json({ ok: false, error: 'Essa aba ainda não possui ID de canal configurado no .env.' });
  }

  if (!message) {
    return res.status(400).json({ ok: false, error: 'Informe a mensagem para enviar.' });
  }

  const payload = mode === 'embed'
    ? {
        embeds: [
          baseEmbed({
            title: title || `Mensagem da ${appConfig.city.name}`,
            description: message,
            color: PANEL_COLOR_MAP[colorKey] || COLORS.primary,
          }),
        ],
      }
    : { content: message };

  const sent = await sendMessage(tab.channelId, payload);
  if (!sent) {
    return res.status(503).json({
      ok: false,
      error: 'Não consegui enviar. Verifique se o bot está online e se o canal está configurado.',
    });
  }

  await registerLog({
    category: 'admin_command',
    action: 'panel_message_sent',
    title: 'Mensagem enviada pelo painel',
    message: `Mensagem enviada para a aba ${tab.label}.`,
    fields: [
      { name: 'Bot', value: appConfig.city.name, inline: true },
      { name: 'Aba', value: tab.label, inline: true },
      { name: 'Modo', value: mode, inline: true },
    ],
    payload: { botId, tabId, mode, title },
  }).catch(() => null);

  return res.json({
    ok: true,
    message: 'Mensagem enviada com sucesso.',
    target: {
      bot: appConfig.city.name,
      tab: tab.label,
    },
  });
}

async function receiveFiveMLog(req, res) {
  if (!isPoolReady()) {
    return res.status(503).json({ ok: false, error: 'Banco indisponível.' });
  }

  const token = req.headers['x-api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token !== fivemConfig.apiSharedToken) {
    return res.status(401).json({ ok: false, error: 'Não autorizado.' });
  }

  const payload = req.body || {};
  const category = payload.type || 'general';

  if (category === 'kill') {
    await registerLog({
      category: 'kill',
      action: 'player_kill',
      title: 'Log de kill',
      actorPassport: payload.killerPassport || null,
      targetPassport: payload.victimPassport || null,
      passport: payload.victimPassport || null,
      message: createKillLogMessage(payload),
      fields: [
        { name: 'Vítima', value: `${payload.victimName || 'Desconhecido'} | ID ${payload.victimPassport || '-'}`, inline: true },
        { name: 'Assassino', value: `${payload.killerName || 'Desconhecido'} | ID ${payload.killerPassport || '-'}`, inline: true },
        { name: 'Arma', value: payload.weapon || 'N/D', inline: true },
        { name: 'Local', value: payload.location || 'N/D', inline: false },
      ],
      payload,
    });
  } else {
    await registerLog({
      category,
      action: payload.action || category,
      title: payload.title || `Log ${category}`,
      passport: payload.passport || null,
      actorPassport: payload.actorPassport || null,
      targetPassport: payload.targetPassport || null,
      discordId: payload.discordId || null,
      message: payload.message || `Evento ${category} recebido da base FiveM.`,
      payload,
    });
  }

  return res.json({ ok: true });
}

module.exports = {
  applyCors,
  health,
  siteBootstrap,
  siteStoreProducts,
  siteCreateOrder,
  siteCitizenCheck,
  siteWhitelistSubmit,
  panelOptions,
  sendPanelMessage,
  receiveFiveMLog,
};
