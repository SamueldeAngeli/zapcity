const storage = {
  apiBase: 'zapcity.panel.apiBase',
  adminUser: 'zapcity.panel.adminUser',
  adminPassword: 'zapcity.panel.adminPassword',
};

const defaultApiBase = window.location.protocol.startsWith('http')
  ? window.location.origin
  : 'http://127.0.0.1:3000';

const state = {
  apiBase: localStorage.getItem(storage.apiBase) || defaultApiBase,
  adminUser: localStorage.getItem(storage.adminUser) || '',
  adminPassword: localStorage.getItem(storage.adminPassword) || '',
  bots: [],
  tabs: [],
};

const elements = {
  connectionStatus: document.querySelector('#connectionStatus'),
  botSelect: document.querySelector('#botSelect'),
  tabSelect: document.querySelector('#tabSelect'),
  modeSelect: document.querySelector('#modeSelect'),
  colorSelect: document.querySelector('#colorSelect'),
  titleInput: document.querySelector('#titleInput'),
  messageInput: document.querySelector('#messageInput'),
  responseLog: document.querySelector('#responseLog'),
  apiBaseInput: document.querySelector('#apiBaseInput'),
  adminUserInput: document.querySelector('#adminUserInput'),
  adminPasswordInput: document.querySelector('#adminPasswordInput'),
  apiMetric: document.querySelector('#apiMetric'),
  databaseMetric: document.querySelector('#databaseMetric'),
  botMetric: document.querySelector('#botMetric'),
};

function normalizeApiBase(value) {
  return String(value || '').replace(/\/$/, '');
}

function setStatus(text, type = '') {
  elements.connectionStatus.textContent = text;
  elements.connectionStatus.classList.toggle('is-online', type === 'online');
  elements.connectionStatus.classList.toggle('is-error', type === 'error');
}

function writeLog(payload) {
  elements.responseLog.textContent = typeof payload === 'string'
    ? payload
    : JSON.stringify(payload, null, 2);
}

function getAuthHeaders() {
  return {
    'x-admin-user': state.adminUser,
    'x-admin-password': state.adminPassword,
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${state.apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : { ok: response.ok, message: await response.text() };

  if (!response.ok) {
    throw new Error(body.error || body.message || `HTTP ${response.status}`);
  }

  return body;
}

function saveSettings() {
  state.apiBase = normalizeApiBase(elements.apiBaseInput.value || defaultApiBase);
  state.adminUser = elements.adminUserInput.value.trim();
  state.adminPassword = elements.adminPasswordInput.value;

  localStorage.setItem(storage.apiBase, state.apiBase);
  localStorage.setItem(storage.adminUser, state.adminUser);
  localStorage.setItem(storage.adminPassword, state.adminPassword);
}

function hydrateSettings() {
  elements.apiBaseInput.value = state.apiBase;
  elements.adminUserInput.value = state.adminUser;
  elements.adminPasswordInput.value = state.adminPassword;
}

function renderBots() {
  elements.botSelect.innerHTML = '';

  state.bots.forEach((bot) => {
    const option = document.createElement('option');
    option.value = bot.id;
    option.textContent = `${bot.name} ${bot.status?.connected ? '(online)' : '(offline)'}`;
    elements.botSelect.appendChild(option);
  });
}

function renderTabs() {
  elements.tabSelect.innerHTML = '';

  const groups = new Map();
  state.tabs.forEach((tab) => {
    if (!groups.has(tab.group)) groups.set(tab.group, []);
    groups.get(tab.group).push(tab);
  });

  groups.forEach((tabs, groupName) => {
    const group = document.createElement('optgroup');
    group.label = groupName;

    tabs.forEach((tab) => {
      const option = document.createElement('option');
      option.value = tab.id;
      option.disabled = !tab.configured;
      option.textContent = tab.configured ? tab.label : `${tab.label} (sem ID no .env)`;
      group.appendChild(option);
    });

    elements.tabSelect.appendChild(group);
  });
}

async function loadOptions() {
  setStatus('Conectando...', '');

  const data = await apiRequest('/api/panel/options');
  state.bots = data.bots || [];
  state.tabs = data.tabs || [];

  renderBots();
  renderTabs();

  const activeBot = state.bots[0];
  setStatus(activeBot?.status?.connected ? 'Bot online' : 'Bot offline', activeBot?.status?.connected ? 'online' : 'error');
  elements.botMetric.textContent = activeBot?.status?.connected ? 'online' : 'offline';
  writeLog({
    ok: true,
    bots: state.bots.length,
    abas: state.tabs.length,
  });
}

async function loadHealth() {
  const data = await apiRequest('/api/health', { headers: {} });
  elements.apiMetric.textContent = data.ok ? 'online' : 'offline';
  elements.databaseMetric.textContent = data.databaseReady ? 'conectado' : 'offline';
  return data;
}

async function sendMessage(event) {
  event.preventDefault();

  const payload = {
    botId: elements.botSelect.value,
    tabId: elements.tabSelect.value,
    mode: elements.modeSelect.value,
    color: elements.colorSelect.value,
    title: elements.titleInput.value.trim(),
    message: elements.messageInput.value.trim(),
  };

  if (!payload.message) {
    writeLog('Escreva uma mensagem antes de enviar.');
    return;
  }

  writeLog('Enviando mensagem...');
  const result = await apiRequest('/api/panel/send-message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  writeLog(result);
}

function switchView(button) {
  document.querySelectorAll('[data-panel-tab]').forEach((item) => {
    item.classList.toggle('is-active', item === button);
  });

  document.querySelectorAll('.panel-view').forEach((view) => {
    view.classList.remove('is-active');
  });

  const target = document.querySelector(`#${button.dataset.panelTab}View`);
  target?.classList.add('is-active');
}

function bindEvents() {
  document.querySelector('#settingsForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    saveSettings();
    await initializePanel();
  });

  document.querySelector('#messageForm').addEventListener('submit', async (event) => {
    try {
      await sendMessage(event);
    } catch (error) {
      setStatus('Erro no envio', 'error');
      writeLog(error.message);
    }
  });

  document.querySelector('#reloadOptionsButton').addEventListener('click', async () => {
    try {
      await loadOptions();
    } catch (error) {
      setStatus('Erro na conexão', 'error');
      writeLog(error.message);
    }
  });

  document.querySelector('#healthButton').addEventListener('click', async () => {
    try {
      const data = await loadHealth();
      writeLog(data);
    } catch (error) {
      setStatus('API offline', 'error');
      writeLog(error.message);
    }
  });

  document.querySelector('#clearButton').addEventListener('click', () => {
    elements.titleInput.value = '';
    elements.messageInput.value = '';
    writeLog('Campos limpos.');
  });

  document.querySelector('#forgetButton').addEventListener('click', () => {
    Object.values(storage).forEach((key) => localStorage.removeItem(key));
    state.apiBase = defaultApiBase;
    state.adminUser = '';
    state.adminPassword = '';
    hydrateSettings();
    setStatus('Dados locais removidos', '');
  });

  document.querySelectorAll('[data-panel-tab]').forEach((button) => {
    button.addEventListener('click', () => switchView(button));
  });
}

async function initializePanel() {
  hydrateSettings();

  try {
    await loadHealth();
    await loadOptions();
  } catch (error) {
    setStatus('Configure a API', 'error');
    writeLog(error.message);
  }
}

bindEvents();
initializePanel();
