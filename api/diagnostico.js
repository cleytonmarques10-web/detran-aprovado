export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  // Testar conexao com Supabase
  let supabaseStatus = 'erro';
  let supabaseErro = '';
  try {
    const r = await fetch(supabaseUrl + '/rest/v1/webhook_logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey
      },
      body: JSON.stringify({ payload: { teste: 'diagnostico', ts: new Date().toISOString() } })
    });
    const txt = await r.text();
    supabaseStatus = r.status + ' ' + (r.ok ? 'OK' : 'ERRO');
    supabaseErro = txt;
  } catch(e) {
    supabaseErro = e.message;
  }

  return res.status(200).json({
    variaveis: {
      SUPABASE_URL: supabaseUrl ? supabaseUrl.substring(0,30)+'...' : 'NAO DEFINIDA',
      SUPABASE_SECRET_KEY: supabaseKey ? 'DEFINIDA ('+supabaseKey.length+' chars)' : 'NAO DEFINIDA'
    },
    supabase: {
      status: supabaseStatus,
      resposta: supabaseErro
    }
  });
}
