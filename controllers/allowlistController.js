const { parsePassport, sanitizeText } = require('../../utils/validators');
const { checkAllowlistEligibility, createRequest, releaseAllowlistDirect } = require('../../fivem/services/allowlistService');

function renderPage(res, payload = {}) {
  return res.render('allowlist', {
    pageTitle: 'Liberar Allowlist',
    result: null,
    flash: null,
    formData: {},
    ...payload,
  });
}

function show(req, res) {
  renderPage(res);
}

async function check(req, res) {
  if (!res.locals.databaseReady) {
    return renderPage(res, {
      formData: req.body || {},
      flash: {
        type: 'error',
        title: 'Banco indisponível',
        message: 'A conexão com a base vRP ainda não está ativa. Configure o MySQL e tente novamente.',
      },
    });
  }

  const passport = parsePassport(req.body.passport);
  const formData = {
    passport: req.body.passport || '',
    fullName: sanitizeText(req.body.fullName, 120),
    age: sanitizeText(req.body.age, 10),
    recruiter: sanitizeText(req.body.recruiter, 120),
    reason: sanitizeText(req.body.reason, 500),
    discordTag: sanitizeText(req.body.discordTag, 120),
    discordId: sanitizeText(req.body.discordId, 50),
  };

  if (!passport) {
    return renderPage(res, {
      formData,
      flash: { type: 'error', title: 'Passaporte inválido', message: 'Informe um passaporte válido para consultar a allowlist.' },
    });
  }

  const result = await checkAllowlistEligibility(passport);
  return renderPage(res, {
    formData,
    result: {
      passport,
      player: result.player,
      canRelease: result.canRelease,
      alreadyReleased: result.alreadyReleased,
      latestRequest: result.latestRequest,
    },
    flash: result.player
      ? null
      : { type: 'error', title: 'Jogador não encontrado', message: 'Esse passaporte ainda não existe na base vRP.' },
  });
}

async function release(req, res) {
  if (!res.locals.databaseReady) {
    return renderPage(res, {
      formData: req.body || {},
      flash: {
        type: 'error',
        title: 'Banco indisponível',
        message: 'A allowlist automática depende da conexão com o banco vRP.',
      },
    });
  }

  const passport = parsePassport(req.body.passport);
  const formData = {
    passport: req.body.passport || '',
    fullName: sanitizeText(req.body.fullName, 120),
    age: sanitizeText(req.body.age, 10),
    recruiter: sanitizeText(req.body.recruiter, 120),
    reason: sanitizeText(req.body.reason, 500),
    discordTag: sanitizeText(req.body.discordTag, 120),
    discordId: sanitizeText(req.body.discordId, 50),
  };

  if (!passport) {
    return renderPage(res, {
      formData,
      flash: { type: 'error', title: 'Passaporte inválido', message: 'Não foi possível liberar a allowlist sem um passaporte válido.' },
    });
  }

  await createRequest({
    passport,
    fullName: formData.fullName || 'Solicitante Web',
    age: formData.age || 'N/D',
    recruiter: formData.recruiter || 'Não informado',
    reason: formData.reason || 'Liberação via página pública.',
    discordId: formData.discordId || null,
    discordTag: formData.discordTag || null,
    source: 'web',
    status: 'approved',
  });

  const releaseResult = await releaseAllowlistDirect({
    passport,
    discordId: formData.discordId || null,
    discordTag: formData.discordTag || null,
    actor: 'Página oficial Zap City',
    source: 'web',
  });

  return renderPage(res, {
    formData,
    result: {
      passport,
      player: releaseResult.player,
      canRelease: false,
      alreadyReleased: true,
      latestRequest: null,
    },
    flash: {
      type: 'success',
      title: releaseResult.alreadyReleased ? 'Já liberado' : 'Allowlist liberada',
      message: releaseResult.alreadyReleased
        ? 'Esse passaporte já estava liberado anteriormente.'
        : 'Allowlist liberada com sucesso. Agora você já pode conectar na cidade.',
    },
  });
}

module.exports = {
  show,
  check,
  release,
};
