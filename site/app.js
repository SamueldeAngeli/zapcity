const appRoot = document.querySelector('#app');
const toastRoot = document.querySelector('#toast');
const orderDialog = document.querySelector('#orderDialog');
const orderForm = document.querySelector('#orderForm');

const state = {
  boot: null,
  route: window.location.pathname,
  selectedProduct: null,
  lastCitizen: null,
};

const apiBaseUrl = String(window.ZAPCITY_CONFIG?.apiBaseUrl || localStorage.getItem('zapcity.apiBaseUrl') || '')
  .replace(/\/$/, '');

const categoryLabels = {
  VIP: 'VIP',
  Veiculos: 'Veículos',
  Itens: 'Itens',
  Coins: 'Coins',
  Casas: 'Casas',
  Pacotes: 'Pacotes',
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toast(message, type = 'success') {
  const item = document.createElement('div');
  item.className = `toast-message ${type}`;
  item.textContent = message;
  toastRoot.appendChild(item);
  setTimeout(() => item.remove(), 5200);
}

async function api(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({ ok: response.ok }));
  if (!response.ok) {
    throw new Error(body.error || body.message || `HTTP ${response.status}`);
  }

  return body;
}

function demoProducts() {
  return [
    {
      id: 1,
      slug: 'vip-platinum',
      category: 'VIP',
      name: 'VIP Platinum',
      description: 'Prioridade na fila, tag exclusiva e benefícios premium da cidade.',
      price: 79.9,
      priceLabel: money(79.9),
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      available: true,
      featured: true,
    },
    {
      id: 2,
      slug: 'vip-diamond',
      category: 'VIP',
      name: 'VIP Diamond',
      description: 'Benefícios de economia, prioridade reforçada e recompensas sazonais.',
      price: 129.9,
      priceLabel: money(129.9),
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      available: true,
      featured: true,
    },
    {
      id: 3,
      slug: 'bmw-m4',
      category: 'Veiculos',
      name: 'BMW M4 Coupe',
      description: 'Esportivo premium pronto para entrega futura via integração de garagem.',
      price: 249.9,
      priceLabel: money(249.9),
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
      available: true,
      featured: true,
    },
    {
      id: 4,
      slug: 'coin-pack-500',
      category: 'Coins',
      name: 'Pacote 500 Coins',
      description: 'Moeda premium da Zap City para upgrades e benefícios exclusivos.',
      price: 49.9,
      priceLabel: money(49.9),
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
      available: true,
      featured: false,
    },
    {
      id: 5,
      slug: 'kit-premium',
      category: 'Itens',
      name: 'Kit Premium',
      description: 'Pacote inicial de itens especiais para entrega manual ou automação futura.',
      price: 89.9,
      priceLabel: money(89.9),
      image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
      available: true,
      featured: false,
    },
    {
      id: 6,
      slug: 'casa-luxo',
      category: 'Casas',
      name: 'Casa de Luxo',
      description: 'Entrega manual inicial preparada para automação futura na base.',
      price: 199.9,
      priceLabel: money(199.9),
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
      available: true,
      featured: false,
    },
  ];
}

function demoQuestions() {
  return [
    {
      id: 'powergaming',
      question: 'O que é Powergaming?',
      options: [
        { value: 'a', label: 'Forçar ações impossíveis ou sem chance de reação dentro do RP.' },
        { value: 'b', label: 'Dirigir rápido durante uma fuga autorizada pela situação.' },
        { value: 'c', label: 'Criar uma história detalhada para o personagem.' },
      ],
    },
    {
      id: 'metagaming',
      question: 'O que é Metagaming?',
      options: [
        { value: 'a', label: 'Usar informações de fora do RP dentro da cidade.' },
        { value: 'b', label: 'Conversar pelo rádio da facção.' },
        { value: 'c', label: 'Anotar informações que seu personagem descobriu em RP.' },
      ],
    },
    {
      id: 'rdm',
      question: 'O que significa RDM?',
      options: [
        { value: 'a', label: 'Matar ou atacar alguém sem motivo, contexto ou construção de RP.' },
        { value: 'b', label: 'Roubar um veículo durante uma ação planejada.' },
        { value: 'c', label: 'Reagir a uma abordagem com risco calculado.' },
      ],
    },
    {
      id: 'vdm',
      question: 'O que significa VDM?',
      options: [
        { value: 'a', label: 'Usar veículo como arma sem contexto ou de forma abusiva.' },
        { value: 'b', label: 'Trabalhar como motorista legalizado.' },
        { value: 'c', label: 'Perder o controle do carro por acidente em uma curva.' },
      ],
    },
  ];
}

function demoBootstrap() {
  return {
    ok: true,
    demo: true,
    city: {
      name: 'Zap City RP',
      shortName: 'Zap City',
      discordInviteUrl: '#',
    },
    databaseReady: false,
    fivem: {
      connectEndpoint: '#',
      connectCommand: 'connect IP_DA_CIDADE:30120',
      status: {
        online: false,
        playerCount: 0,
        maxClients: null,
      },
    },
    store: {
      products: demoProducts(),
      categories: ['VIP', 'Veiculos', 'Itens', 'Coins', 'Casas', 'Pacotes'],
    },
    whitelist: {
      passScore: 8,
      questions: demoQuestions(),
    },
  };
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function productImage(product) {
  return product.image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80';
}

function getProducts(category = null) {
  const products = state.boot?.store?.products || [];
  if (!category || category === 'Todos') return products;
  return products.filter((product) => product.category === category);
}

function activeRouteGroup(path = state.route) {
  if (path.startsWith('/loja')) return '/loja';
  if (path === '/vip') return '/vip';
  if (path === '/pacote-inicial') return '/pacote-inicial';
  return path;
}

function updateActiveNav() {
  document.querySelectorAll('[data-link]').forEach((link) => {
    const href = link.getAttribute('href');
    link.classList.toggle('is-active', href === activeRouteGroup());
  });
}

function navigate(path) {
  state.route = path;
  window.history.pushState({}, '', path);
  render();
  updateActiveNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function heroTemplate({ kicker, title, subtitle, primaryLabel = 'Conectar', primaryRoute = '/conectar', secondaryLabel = 'Liberar WL', secondaryRoute = '/allowlist' }) {
  return `
    <section class="hero">
      <div class="hero-content">
        <span class="hero-kicker">${escapeHtml(kicker)}</span>
        <h1 class="hero-title">${title}</h1>
        <p class="hero-subtitle">${escapeHtml(subtitle)}</p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-route="${primaryRoute}">${escapeHtml(primaryLabel)}</button>
          <button class="secondary-button" type="button" data-route="${secondaryRoute}">${escapeHtml(secondaryLabel)}</button>
        </div>
        <div class="social-bar">
          <a href="${escapeHtml(state.boot?.city?.discordInviteUrl || '#')}" target="_blank" rel="noreferrer">DC</a>
          <a href="/loja" data-link>VIP</a>
          <a href="/allowlist" data-link>WL</a>
          <a href="/como-jogar" data-link>RP</a>
        </div>
      </div>
    </section>
  `;
}

function productCard(product) {
  return `
    <article class="product-card">
      <div class="product-media">
        <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.name)}">
        <div class="tag-row">
          <span class="tag">${escapeHtml(categoryLabels[product.category] || product.category)}</span>
          ${product.featured ? '<span class="tag blue">Destaque</span>' : ''}
        </div>
      </div>
      <div class="product-body">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="price-row">
          <strong>${escapeHtml(product.priceLabel || money(product.price))}</strong>
          <button class="mini-button primary-button" type="button" data-buy-product="${product.id}">Comprar</button>
        </div>
      </div>
    </article>
  `;
}

function storeSection({ title = 'Loja oficial', subtitle = 'VIPs, carros, itens, coins, casas e pacotes da Zap City.', category = 'Todos', showTabs = true } = {}) {
  const categories = ['Todos', ...(state.boot?.store?.categories || [])];
  const products = getProducts(category);

  return `
    <section class="section alt" id="loja">
      <div class="shell">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Loja</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(subtitle)}</p>
          </div>
          <div class="section-actions">
            <button class="ghost-button" type="button" data-route="/conectar">Ver minha WL</button>
          </div>
        </div>

        ${showTabs ? `
          <div class="category-tabs">
            ${categories.map((item) => `
              <button type="button" class="${item === category ? 'is-active' : ''}" data-store-category="${escapeHtml(item)}">
                ${escapeHtml(categoryLabels[item] || item)}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <div class="product-grid">
          ${products.length
            ? products.map(productCard).join('')
            : '<article class="product-card"><div class="product-body"><h3>Nenhum produto nesta categoria</h3><p>O catálogo pode ser ajustado no banco da Zap City.</p></div></article>'}
        </div>
      </div>
    </section>
  `;
}

function featuresSection() {
  const items = [
    ['Cidade viva', 'Economia, facções, corporações, staff ativa e trilhas de evolução para seu personagem.'],
    ['Loja integrada', 'Pedidos de VIP, veículos, itens e vantagens registrados para acompanhamento da staff.'],
    ['WL por regras', 'Quiz de RP com Powergaming, Metagaming, RDM, VDM e condutas essenciais.'],
    ['Conexão rápida', 'Consulta de passaporte e botão direto para entrar quando a WL estiver liberada.'],
  ];

  return `
    <section class="section">
      <div class="shell feature-grid">
        ${items.map(([title, text]) => `
          <article class="feature-card">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(text)}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function homePage() {
  const featured = (state.boot?.store?.products || []).filter((product) => product.featured).slice(0, 3);
  return `
    ${heroTemplate({
      kicker: 'Zap City RP',
      title: 'O servidor referência <strong>em GTA RP</strong>',
      subtitle: 'Entre na cidade, confira sua WL, monte seu pacote inicial e acesse a loja oficial para VIPs, veículos e vantagens.',
    })}
    ${featuresSection()}
    ${storeSection({
      title: 'Destaques da loja',
      subtitle: 'Produtos mais procurados por quem quer começar forte na cidade.',
      category: 'Todos',
      showTabs: false,
    }).replace(
      /<div class="product-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
      `<div class="product-grid">${featured.map(productCard).join('')}</div></div></section>`
    )}
    ${connectPreviewSection()}
  `;
}

function storePage(category = 'Todos') {
  return `
    ${innerHero('Loja oficial', 'VIPs, veículos e itens', 'Escolha seu produto, informe passaporte e Discord, e gere um pedido para acompanhamento da staff.')}
    ${storeSection({ category })}
  `;
}

function vipPage() {
  return `
    ${innerHero('VIP Zap City', 'Benefícios premium', 'Prioridade, tags, pacotes e vantagens preparadas para entrega manual ou automação futura.')}
    ${storeSection({
      title: 'Planos VIP',
      subtitle: 'Escolha o pacote que combina com seu momento na cidade.',
      category: 'VIP',
      showTabs: false,
    })}
  `;
}

function starterPage() {
  return `
    ${innerHero('Pacote inicial', 'Comece pronto para a cidade', 'Pacotes de entrada com coins, itens e vantagens para acelerar sua primeira semana.')}
    ${storeSection({
      title: 'Pacotes iniciais',
      subtitle: 'Kits e produtos úteis para começar sua história.',
      category: 'Pacotes',
      showTabs: false,
    })}
  `;
}

function newsPage() {
  const news = [
    ['Temporada de inauguração', 'Eventos semanais, corridas, ações legais e calendário para novas organizações.'],
    ['Vagas para staff', 'A cidade está estruturando suporte, denúncias, WL e atendimento aos novos moradores.'],
    ['Loja oficial online', 'Pedidos de VIPs, carros, itens e coins agora podem ser feitos direto pelo site.'],
  ];

  return `
    ${innerHero('Notícias', 'Atualizações da Zap City', 'Acompanhe comunicados, novidades, eventos e mudanças importantes da cidade.')}
    <section class="section alt">
      <div class="shell news-grid">
        ${news.map(([title, text]) => `
          <article class="news-card">
            <span class="eyebrow">Zap News</span>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(text)}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function howToPlayPage() {
  return `
    ${innerHero('Como jogar', 'Entre na cidade em poucos passos', 'Crie seu personagem, consulte a WL, responda o quiz de regras e conecte pelo FiveM.')}
    <section class="section">
      <div class="shell feature-grid">
        ${[
          ['1. Abra o FiveM', 'Use o botão conectar ou o comando manual da página de conexão.'],
          ['2. Crie seu personagem', 'Entre pelo menos uma vez para gerar o passaporte na base.'],
          ['3. Faça a WL', 'Responda o quiz de RP e aguarde a aprovação automática ou revisão.'],
          ['4. Viva o RP', 'Respeite as regras e construa uma história coerente.'],
        ].map(([title, text]) => `<article class="feature-card"><h3>${title}</h3><p>${text}</p></article>`).join('')}
      </div>
    </section>
  `;
}

function contactPage() {
  return `
    ${innerHero('Contato', 'Fale com a equipe', 'Use o Discord oficial para suporte, denúncias, parcerias, compras e atendimento da cidade.')}
    <section class="section alt">
      <div class="shell access-layout">
        <article class="access-card">
          <span class="eyebrow">Discord</span>
          <h2>Atendimento oficial</h2>
          <p>Suporte, WL, compras, denúncias e acompanhamento de pedidos ficam centralizados no Discord da Zap City.</p>
          <div class="button-row">
            <a class="primary-button" href="${escapeHtml(state.boot?.city?.discordInviteUrl || '#')}" target="_blank" rel="noreferrer">Abrir Discord</a>
            <button class="secondary-button" type="button" data-route="/loja">Ver loja</button>
          </div>
        </article>
        <article class="status-card">
          <h3>Status rápido</h3>
          <p>Players online: <strong>${state.boot?.fivem?.status?.playerCount || 0}</strong></p>
          <p>Banco: <strong>${state.boot?.databaseReady ? 'conectado' : 'aguardando configuração'}</strong></p>
        </article>
      </div>
    </section>
  `;
}

function innerHero(kicker, title, subtitle) {
  return `
    <section class="hero" style="min-height: 560px;">
      <div class="hero-content" style="margin-top: 120px;">
        <span class="hero-kicker">${escapeHtml(kicker)}</span>
        <h1 class="hero-title">${escapeHtml(title)}</h1>
        <p class="hero-subtitle">${escapeHtml(subtitle)}</p>
      </div>
    </section>
  `;
}

function connectPreviewSection() {
  const status = state.boot?.fivem?.status;
  return `
    <section class="section">
      <div class="shell access-layout">
        <article class="access-card">
          <span class="eyebrow">Conexão</span>
          <h2>Verifique sua WL</h2>
          <p>Informe seu passaporte para saber se você já pode entrar na cidade. Se ainda não tiver WL, o quiz aparece na sequência.</p>
          <form data-citizen-check>
            <label>
              <span>Passaporte / ID</span>
              <input name="passport" type="text" inputmode="numeric" required>
            </label>
            <button class="primary-button" type="submit">Consultar</button>
          </form>
          <div id="citizenResult" class="result-box" hidden></div>
        </article>
        <article class="status-card">
          <span class="eyebrow">Servidor</span>
          <h2>${status?.online ? 'Online' : 'Status indisponível'}</h2>
          <p>Players online: <strong>${status?.playerCount || 0}</strong></p>
          <p>Comando: <code>${escapeHtml(state.boot?.fivem?.connectCommand || 'connect IP:PORTA')}</code></p>
          <button class="secondary-button" type="button" data-copy-command>Copiar comando</button>
        </article>
      </div>
    </section>
  `;
}

function connectPage() {
  return `
    ${innerHero('Login na cidade', 'Consultar acesso', 'Veja se seu passaporte tem WL. Se estiver liberado, o botão de conexão aparece direto.')}
    ${connectPreviewSection()}
  `;
}

function allowlistPage() {
  return `
    ${innerHero('Whitelist', 'Quiz de regras RP', 'A liberação avalia conceitos reais de RP como Powergaming, Metagaming, VDM, RDM e amor à vida.')}
    <section class="section alt">
      <div class="shell access-layout">
        <article class="access-card">
          <span class="eyebrow">Primeiro passo</span>
          <h2>Informe seu passaporte</h2>
          <p>Vamos consultar sua situação na base da cidade antes de abrir o quiz.</p>
          <form data-citizen-check>
            <label>
              <span>Passaporte / ID</span>
              <input name="passport" type="text" inputmode="numeric" required>
            </label>
            <button class="primary-button" type="submit">Verificar WL</button>
          </form>
          <div id="citizenResult" class="result-box" hidden></div>
        </article>
        <article class="quiz-card" id="quizHost">
          <span class="eyebrow">Quiz</span>
          <h2>Regras fundamentais</h2>
          <p>Consulte seu passaporte para liberar o questionário. A pontuação mínima para aprovação automática é 8/10.</p>
        </article>
      </div>
    </section>
  `;
}

function quizTemplate(passport) {
  const questions = state.boot?.whitelist?.questions || [];
  return `
    <span class="eyebrow">Quiz WL</span>
    <h2>Questionário de RP</h2>
    <p>Passaporte consultado: <strong>#${escapeHtml(passport)}</strong></p>
    <form data-whitelist-form>
      <input type="hidden" name="passport" value="${escapeHtml(passport)}">
      <div class="field-row">
        <label>
          <span>Nome do personagem</span>
          <input name="fullName" type="text" required>
        </label>
        <label>
          <span>Idade</span>
          <input name="age" type="text" required>
        </label>
      </div>
      <div class="field-row">
        <label>
          <span>Discord</span>
          <input name="discordTag" type="text" placeholder="usuario#0001">
        </label>
        <label>
          <span>ID Discord</span>
          <input name="discordId" type="text" placeholder="Opcional">
        </label>
      </div>
      <div class="quiz-list">
        ${questions.map((question, index) => `
          <fieldset class="quiz-question">
            <strong>${index + 1}. ${escapeHtml(question.question)}</strong>
            <div class="quiz-options">
              ${question.options.map((option) => `
                <label>
                  <input type="radio" name="answer_${escapeHtml(question.id)}" value="${escapeHtml(option.value)}" required>
                  <span>${escapeHtml(option.label)}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>
        `).join('')}
      </div>
      <button class="primary-button" type="submit">Enviar WL</button>
    </form>
  `;
}

async function handleCitizenCheck(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const resultBox = document.querySelector('#citizenResult');
  const formData = new FormData(form);
  const passport = formData.get('passport');

  resultBox.hidden = false;
  resultBox.className = 'result-box warning';
  resultBox.textContent = 'Consultando passaporte...';

  try {
    const result = await api('/api/site/citizen/check', {
      method: 'POST',
      body: JSON.stringify({ passport }),
    });

    if (result.status === 'released') {
      resultBox.className = 'result-box success';
      resultBox.innerHTML = `
        <strong>WL liberada.</strong>
        <p>Você já pode conectar na cidade.</p>
        <div class="button-row">
          <a class="primary-button" href="${escapeHtml(result.connectEndpoint)}">Conectar</a>
          <button class="secondary-button" type="button" data-copy-command>Copiar comando</button>
        </div>
      `;
      return;
    }

    if (result.status === 'needs_whitelist') {
      resultBox.className = 'result-box warning';
      resultBox.innerHTML = '<strong>WL pendente.</strong><p>Responda o quiz para solicitar a liberação.</p>';
      const quizHost = document.querySelector('#quizHost');
      if (quizHost) quizHost.innerHTML = quizTemplate(passport);
      return;
    }

    resultBox.className = 'result-box error';
    resultBox.innerHTML = `<strong>Não liberado.</strong><p>${escapeHtml(result.message || 'Não foi possível consultar sua WL.')}</p>`;
  } catch (error) {
    if (state.boot?.demo) {
      resultBox.className = 'result-box warning';
      resultBox.innerHTML = '<strong>Modo demonstração.</strong><p>No Vercel sem API, a consulta real de WL fica indisponível. O quiz foi liberado para visualização.</p>';
      const quizHost = document.querySelector('#quizHost');
      if (quizHost) quizHost.innerHTML = quizTemplate(passport);
      return;
    }

    resultBox.className = 'result-box error';
    resultBox.innerHTML = `<strong>Erro na consulta.</strong><p>${escapeHtml(error.message)}</p>`;
  }
}

async function handleWhitelistSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  const answers = {};

  (state.boot?.whitelist?.questions || []).forEach((question) => {
    answers[question.id] = payload[`answer_${question.id}`] || '';
  });

  try {
    const result = await api('/api/site/whitelist/submit', {
      method: 'POST',
      body: JSON.stringify({
        passport: payload.passport,
        fullName: payload.fullName,
        age: payload.age,
        discordTag: payload.discordTag,
        discordId: payload.discordId,
        answers,
      }),
    });

    toast(result.message || 'WL enviada.', result.status === 'released' ? 'success' : 'success');
    const quizHost = document.querySelector('#quizHost');
    if (quizHost) {
      quizHost.innerHTML = `
        <span class="eyebrow">Resultado</span>
        <h2>${escapeHtml(result.score ? `${result.score}/${result.total}` : 'WL')}</h2>
        <p>${escapeHtml(result.message || 'Solicitação processada.')}</p>
        ${result.connectEndpoint ? `<a class="primary-button" href="${escapeHtml(result.connectEndpoint)}">Conectar na cidade</a>` : ''}
      `;
    }
  } catch (error) {
    if (state.boot?.demo) {
      toast('WL simulada no modo Vercel. Conecte a API da VPS para liberar de verdade.');
      const quizHost = document.querySelector('#quizHost');
      if (quizHost) {
        quizHost.innerHTML = `
          <span class="eyebrow">Demonstração</span>
          <h2>Quiz recebido</h2>
          <p>Esse resultado é apenas visual. A liberação real depende do backend conectado à base vRP.</p>
        `;
      }
      return;
    }

    toast(error.message, 'error');
  }
}

function openOrder(productId) {
  const product = (state.boot?.store?.products || []).find((item) => Number(item.id) === Number(productId));
  if (!product) return;

  state.selectedProduct = product;
  document.querySelector('#orderProductId').value = product.id;
  document.querySelector('#orderProductTitle').textContent = product.name;
  document.querySelector('#orderProductDescription').textContent = `${product.description} • ${product.priceLabel || money(product.price)}`;

  if (typeof orderDialog.showModal === 'function') {
    orderDialog.showModal();
  } else {
    orderDialog.setAttribute('open', '');
  }
}

async function handleOrder(event) {
  event.preventDefault();
  const formData = new FormData(orderForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const result = await api('/api/site/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    toast(result.message || `Pedido #${result.order?.id} criado.`);
    orderForm.reset();
    orderDialog.close();
  } catch (error) {
    if (state.boot?.demo) {
      toast('Pedido simulado no modo Vercel. Conecte a API da VPS para gravar de verdade.');
      orderForm.reset();
      orderDialog.close();
      return;
    }

    toast(error.message, 'error');
  }
}

function bindDynamicEvents() {
  appRoot.querySelectorAll('[data-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      event.preventDefault();
      navigate(href);
    });
  });

  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.route));
  });

  document.querySelectorAll('[data-buy-product]').forEach((button) => {
    button.addEventListener('click', () => openOrder(button.dataset.buyProduct));
  });

  document.querySelectorAll('[data-store-category]').forEach((button) => {
    button.addEventListener('click', () => {
      appRoot.innerHTML = storePage(button.dataset.storeCategory);
      bindDynamicEvents();
      updateActiveNav();
      document.querySelector('#loja')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-citizen-check]').forEach((form) => {
    form.addEventListener('submit', handleCitizenCheck);
  });

  document.querySelectorAll('[data-whitelist-form]').forEach((form) => {
    form.addEventListener('submit', handleWhitelistSubmit);
  });

  document.querySelectorAll('[data-copy-command]').forEach((button) => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(state.boot?.fivem?.connectCommand || '');
      toast('Comando copiado.');
    });
  });
}

function render() {
  const route = state.route;

  if (route === '/loja/vips') appRoot.innerHTML = storePage('VIP');
  else if (route === '/loja/veiculos') appRoot.innerHTML = storePage('Veiculos');
  else if (route === '/loja/outros') appRoot.innerHTML = storePage('Itens');
  else if (route === '/loja') appRoot.innerHTML = storePage('Todos');
  else if (route === '/vip') appRoot.innerHTML = vipPage();
  else if (route === '/pacote-inicial') appRoot.innerHTML = starterPage();
  else if (route === '/noticias') appRoot.innerHTML = newsPage();
  else if (route === '/como-jogar') appRoot.innerHTML = howToPlayPage();
  else if (route === '/contato') appRoot.innerHTML = contactPage();
  else if (route === '/allowlist') appRoot.innerHTML = allowlistPage();
  else if (route === '/conectar') appRoot.innerHTML = connectPage();
  else appRoot.innerHTML = homePage();

  bindDynamicEvents();
  updateActiveNav();
}

async function bootstrap() {
  try {
    state.boot = await api('/api/site/bootstrap');
    render();
  } catch (error) {
    state.boot = demoBootstrap();
    render();
    toast('Site em modo demonstração. Configure a API da VPS para loja e WL reais.', 'error');
  }
}

function bindShellEvents() {
  document.querySelectorAll('[data-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      event.preventDefault();
      navigate(href);
    });
  });

  document.querySelector('[data-menu-toggle]')?.addEventListener('click', () => {
    document.querySelector('[data-menu]')?.classList.toggle('is-open');
  });

  document.querySelectorAll('[data-close-order]').forEach((button) => {
    button.addEventListener('click', () => orderDialog.close());
  });

  orderForm.addEventListener('submit', handleOrder);
  window.addEventListener('popstate', () => {
    state.route = window.location.pathname;
    render();
  });
}

bindShellEvents();
bootstrap();
