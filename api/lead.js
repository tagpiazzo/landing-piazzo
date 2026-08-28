// Riceve il form della landing e inoltra il lead al webhook n8n
// (URL nel env var N8N_WEBHOOK_URL, impostata su Vercel), poi
// reindirizza l'utente alla thank you page.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  // Vercel effettua il parsing del body urlencoded in req.body;
  // fallback manuale nel caso arrivi come stream grezzo.
  let data = req.body;
  if (!data || typeof data !== 'object') {
    let raw = '';
    await new Promise((resolve) => {
      req.on('data', (c) => (raw += c));
      req.on('end', resolve);
    });
    data = Object.fromEntries(new URLSearchParams(raw));
  }

  const webhook = process.env.N8N_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.Nome || '',
          telefono: data.Telefono || '',
          email: data.Email || '',
          strumento: data.Strumento || '',
          source: 'landing-pianofacile',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Inoltro a n8n fallito:', err);
    }
  } else {
    console.error('N8N_WEBHOOK_URL non impostata: lead non inoltrato', data);
  }

  res.statusCode = 303;
  res.setHeader('Location', '/grazie.html');
  res.end();
};
