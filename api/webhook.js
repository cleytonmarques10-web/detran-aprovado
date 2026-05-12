export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, msg: 'Webhook ativo' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  // Salvar log IMEDIATAMENTE — antes de qualquer processamento
  try {
    await fetch(supabaseUrl + '/rest/v1/webhook_logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey
      },
      body: JSON.stringify({ payload: req.body || {} })
    });
  } catch (logErr) {
    console.error('Erro ao salvar log:', logErr.message);
  }

  try {
    const data = req.body || {};

    const email = data?.Customer?.email || data?.customer?.email ||
                  data?.buyer?.email || data?.subscription?.customer?.email || '';

    const evento = data?.webhook_event_type || data?.event ||
                   data?.type || data?.status || '';

    if (!email) return res.status(200).json({ ok: true, msg: 'Sem email — log salvo' });

    let novoPlano = 'premium';
    if (evento === 'order_approved' || evento === 'subscription_renewed') {
      novoPlano = 'premium';
    } else if (evento === 'subscription_delayed') {
      novoPlano = 'atrasado';
    } else if (evento === 'subscription_canceled' || evento === 'order_refunded' || evento === 'chargedback') {
      novoPlano = 'cancelado';
    }

    const checkRes = await fetch(
      supabaseUrl + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(email), {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey
      }
    });
    const existentes = await checkRes.json();

    if (existentes && existentes.length > 0) {
      await fetch(
        supabaseUrl + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(email), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey
        },
        body: JSON.stringify({ plano: novoPlano })
      });
    } else {
      await fetch(supabaseUrl + '/rest/v1/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey
        },
        body: JSON.stringify({
          email: email,
          nome: data?.Customer?.name || data?.customer?.name || '',
          telefone: data?.Customer?.mobile_phone || data?.customer?.mobile_phone || '',
          plano: novoPlano,
          erros_ids: [],
          cat_stats: {}
        })
      });
    }

    return res.status(200).json({ success: true, email: email, plano: novoPlano });

  } catch (error) {
    console.error('Erro webhook:', error);
    return res.status(200).json({ ok: true, error: error.message });
  }
}
