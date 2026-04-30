const storeService = require('../../database/storeService');
const { registerLog } = require('../../fivem/services/logsService');
const { parsePassport, sanitizeText } = require('../../utils/validators');
const { formatCurrency } = require('../../utils/formatters');

function emptyStoreState() {
  return {
    featuredProducts: [],
    vipProducts: [],
    vehicleProducts: [],
    miscProducts: [],
  };
}

async function loadStoreState(databaseReady) {
  if (!databaseReady) {
    return emptyStoreState();
  }

  const [featuredProducts, vipProducts, vehicleProducts, miscProducts] = await Promise.all([
    storeService.listProducts({ featuredOnly: true }),
    storeService.listProducts({ category: 'VIP' }),
    storeService.listProducts({ category: 'Veiculos' }),
    Promise.all([
      storeService.listProducts({ category: 'Casas' }),
      storeService.listProducts({ category: 'Coins' }),
      storeService.listProducts({ category: 'Itens' }),
      storeService.listProducts({ category: 'Pacotes' }),
    ]).then((groups) => groups.flat()),
  ]);

  return {
    featuredProducts,
    vipProducts,
    vehicleProducts,
    miscProducts,
  };
}

async function renderStore(res, payload = {}) {
  const state = await loadStoreState(res.locals.databaseReady);

  return res.render('store', {
    pageTitle: 'Loja Oficial',
    ...state,
    flash: null,
    ...payload,
  });
}

async function home(req, res) {
  return renderStore(res);
}

async function vips(req, res) {
  const products = res.locals.databaseReady
    ? await storeService.listProducts({ category: 'VIP' })
    : [];
  return res.render('store-category', {
    pageTitle: 'VIPs',
    categoryTitle: 'VIPs da Zap City',
    products,
    flash: null,
  });
}

async function vehicles(req, res) {
  const products = res.locals.databaseReady
    ? await storeService.listProducts({ category: 'Veiculos' })
    : [];
  return res.render('store-category', {
    pageTitle: 'Veículos',
    categoryTitle: 'Veículos da Zap City',
    products,
    flash: null,
  });
}

async function others(req, res) {
  const products = res.locals.databaseReady
    ? (await Promise.all([
        storeService.listProducts({ category: 'Casas' }),
        storeService.listProducts({ category: 'Coins' }),
        storeService.listProducts({ category: 'Itens' }),
        storeService.listProducts({ category: 'Pacotes' }),
      ])).flat()
    : [];

  return res.render('store-category', {
    pageTitle: 'Outros Produtos',
    categoryTitle: 'Casas, coins, itens e pacotes',
    products,
    flash: null,
  });
}

async function createOrder(req, res) {
  if (!res.locals.databaseReady) {
    return renderStore(res, {
      flash: {
        type: 'error',
        title: 'Loja indisponível',
        message: 'A loja precisa do banco conectado para registrar pedidos.',
      },
    });
  }

  const productId = Number.parseInt(req.body.productId, 10);
  const passport = parsePassport(req.body.passport);

  if (!productId || !passport) {
    return renderStore(res, {
      flash: {
        type: 'error',
        title: 'Dados inválidos',
        message: 'Informe um passaporte válido e selecione um produto.',
      },
    });
  }

  const result = await storeService.createOrder({
    productId,
    passport,
    customerName: sanitizeText(req.body.customerName, 120),
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
      { name: 'Discord', value: result.order.discord_tag || result.order.discord_id || 'N/D', inline: true },
      { name: 'Status', value: result.order.status, inline: true },
    ],
    payload: result,
  });

  return renderStore(res, {
    flash: {
      type: 'success',
      title: 'Pedido gerado',
      message: `Pedido #${result.order.id} criado com sucesso. A staff vai acompanhar pelo Discord.`,
    },
  });
}

module.exports = {
  home,
  vips,
  vehicles,
  others,
  createOrder,
};
