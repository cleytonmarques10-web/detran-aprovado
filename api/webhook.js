// =============================================
// DETRAN APROVADO — WEBHOOK KIWIFY
// Arquivo: api/webhook.js (coloca na pasta api/ do GitHub)
// Atualiza plano do usuario automaticamente apos compra
// =============================================

const { createClient } = require('@supabase/supabase-js');

const SBU = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SBK = process.env.SUPABASE_SERVICE_ROLE_KEY; // chave service_role (não a anon!)

// Planos Kiwify → plano no banco
// Ajuste os IDs conforme seus produtos na Kiwify
const PLANOS = {
  // ID do produto Kiwify : plano no banco
  'xY8BNrG': 'premium', // Mensal R$19,90
  'JdZ4969': 'premium', // Trimestral R$49,90
  'jHVTVCR': 'premium', // Semestral R$79,90
};

module.exports = async (req, res) => {
  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Webhook Kiwify recebido:', JSON.stringify(body));

    // Verificar evento — só processar compras aprovadas
    const evento = body?.webhook_event_type;
    if (!['order_approved', 'order_refunded', 'subscription_active', 'subscription_canceled', 'subscription_overdue'].includes(evento)) {
      return res.status(200).json({ ok: true, msg: 'Evento ignorado: ' + evento });
    }

    // Extrair dados do comprador
    const email = body?.Customer?.email || body?.customer?.email;
    const nome  = body?.Customer?.name  || body?.customer?.name || '';
    const tel   = body?.Customer?.mobile_phone || body?.customer?.mobile_phone || '';
    const produtoId = body?.Product?.id || body?.product?.id || '';

    if (!email) {
      console.error('Email não encontrado no webhook');
      return res.status(400).json({ error: 'Email não encontrado' });
    }

    // Determinar novo plano
    let novoPlano = 'gratuito';
    if (['order_approved', 'subscription_active'].includes(evento)) {
      novoPlano = PLANOS[produtoId] || 'premium';
    } else if (evento === 'order_refunded' || evento === 'subscription_canceled') {
      novoPlano = 'cancelado';
    } else if (evento === 'subscription_overdue') {
      novoPlano = 'atrasado';
    }

    console.log(`Atualizando ${email} → plano: ${novoPlano} (evento: ${evento})`);

    // Conectar Supabase com service_role (ignora RLS)
    const sb = createClient(SBU, SBK);

    // Verificar se usuário existe
    const { data: userExiste } = await sb
      .from('usuarios')
      .select('id, email, plano')
      .eq('email', email)
      .single();

    if (userExiste) {
      // Usuário existe → atualizar plano
      const { error } = await sb
        .from('usuarios')
        .update({ plano: novoPlano })
        .eq('email', email);

      if (error) throw error;
      console.log(`✅ Plano atualizado: ${email} → ${novoPlano}`);
    } else {
      // Usuário não existe ainda → criar registro (vai completar ao fazer login)
      const { error } = await sb
        .from('usuarios')
        .insert({
          email:    email,
          nome:     nome,
          telefone: tel,
          plano:    novoPlano,
          erros_ids: [],
          cat_stats: {}
        });

      if (error && error.code !== '23505') throw error; // ignorar duplicata
      console.log(`✅ Usuário criado: ${email} → ${novoPlano}`);
    }

    return res.status(200).json({
      ok: true,
      email: email,
      plano: novoPlano,
      evento: evento
    });

  } catch (err) {
    console.error('Erro no webhook:', err);
    return res.status(500).json({ error: err.message });
  }
};
