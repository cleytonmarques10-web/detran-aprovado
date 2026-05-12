export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, msg: 'Webhook ativo' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const resendKey  = process.env.RESEND_API_KEY;

  // Salvar log imediatamente
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
  } catch(e) {
    console.error('Erro log:', e.message);
  }

  try {
    const data = req.body || {};

    // Extrair dados
    const email = data?.Customer?.email || data?.customer?.email ||
                  data?.buyer?.email || data?.subscription?.customer?.email || '';

    const nome = data?.Customer?.full_name || data?.Customer?.name ||
                 data?.customer?.name || email.split('@')[0] || '';

    const tel = data?.Customer?.mobile || data?.Customer?.mobile_phone ||
                data?.customer?.mobile_phone || '';

    const evento = data?.webhook_event_type || data?.event || data?.type || '';

    // Data de expiração — pegar do payload da Kiwify
    const acesso_ate = data?.Subscription?.customer_access?.access_until ||
                       data?.Subscription?.next_payment ||
                       data?.subscription?.next_payment ||
                       null;

    if (!email) return res.status(200).json({ ok: true, msg: 'Sem email' });

    // Definir plano pelo evento
    let novoPlano = 'premium';
    if (evento === 'order_approved' || evento === 'subscription_renewed') {
      novoPlano = 'premium';
    } else if (evento === 'subscription_delayed') {
      novoPlano = 'atrasado';
    } else if (evento === 'subscription_canceled' || evento === 'order_refunded' || evento === 'chargedback') {
      novoPlano = 'cancelado';
    }

    // Verificar se usuario existe
    const checkRes = await fetch(
      supabaseUrl + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(email), {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey
      }
    });
    const existentes = await checkRes.json();

    const dadosUpdate = {
      plano: novoPlano,
      acesso_ate: acesso_ate
    };

    if (existentes && existentes.length > 0) {
      // Atualizar usuario existente
      await fetch(
        supabaseUrl + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(email), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey
        },
        body: JSON.stringify(dadosUpdate)
      });
    } else {
      // Criar usuario novo
      await fetch(supabaseUrl + '/rest/v1/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey
        },
        body: JSON.stringify({
          email: email,
          nome: nome,
          telefone: tel,
          plano: novoPlano,
          acesso_ate: acesso_ate,
          erros_ids: [],
          cat_stats: {}
        })
      });
    }

    // Enviar email apenas em compra aprovada ou renovacao
    if (resendKey && (evento === 'order_approved' || evento === 'subscription_renewed')) {
      const primeiroNome = (nome || email).split(' ')[0];
      const dataExpiracao = acesso_ate
        ? new Date(acesso_ate).toLocaleDateString('pt-BR')
        : '';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#FF6B00;padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">🚗 DETRAN Aprovado</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Seu app de simulado para CNH</p>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px;">Olá, ${primeiroNome}! 👋</h2>
      <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Seu acesso ao <strong>DETRAN Aprovado</strong> já está liberado!
      </p>
      ${dataExpiracao ? `<p style="color:#888;font-size:13px;margin:0 0 24px;">Válido até: <strong>${dataExpiracao}</strong></p>` : ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="https://app.detranaprovado.com.br"
           style="background:#FF6B00;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;display:inline-block;">
          👉 Acessar o app agora
        </a>
      </div>
      <div style="background:#FFF4EE;border-left:4px solid #FF6B00;border-radius:8px;padding:16px;margin:24px 0;">
        <p style="margin:0 0 8px;font-weight:700;color:#FF6B00;">⚠️ IMPORTANTE</p>
        <p style="margin:0;color:#444;font-size:14px;">Instale o app no seu celular para ter acesso mais rápido e não perder seu progresso.</p>
      </div>
      <h3 style="color:#1a1a1a;font-size:16px;margin:24px 0 12px;">📲 Como instalar no celular:</h3>
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:12px;">
        <p style="margin:0 0 10px;font-weight:700;color:#333;">👉 ANDROID (Google Chrome)</p>
        <ol style="margin:0;padding-left:20px;color:#444;font-size:14px;line-height:1.8;">
          <li>Toque nos três pontinhos (⋮) no canto superior direito</li>
          <li>Toque em <strong>"Adicionar à tela inicial"</strong></li>
          <li>Confirme tocando em <strong>"Adicionar"</strong></li>
        </ol>
      </div>
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:700;color:#333;">👉 IPHONE (Safari)</p>
        <ol style="margin:0;padding-left:20px;color:#444;font-size:14px;line-height:1.8;">
          <li>Toque no ícone de compartilhar (⬆️) na parte de baixo</li>
          <li>Role e toque em <strong>"Adicionar à Tela de Início"</strong></li>
          <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
        </ol>
      </div>
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:700;color:#15803d;">💡 Com o app você pode:</p>
        <ul style="margin:0;padding-left:20px;color:#444;font-size:14px;line-height:1.8;">
          <li>Treinar com questões reais do DETRAN</li>
          <li>Fazer simulados completos de 30 questões</li>
          <li>Acompanhar seu desempenho</li>
          <li>Tirar dúvidas com o Professor IA</li>
        </ul>
      </div>
      <p style="color:#444;font-size:14px;line-height:1.6;">
        Se tiver qualquer dúvida, pode responder este email ou me chamar no WhatsApp.<br><br>
        Bons estudos! 🚀
      </p>
    </div>
    <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#888;font-size:12px;">DETRAN Aprovado · app.detranaprovado.com.br</p>
    </div>
  </div>
</body>
</html>`;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + resendKey
          },
          body: JSON.stringify({
            from: 'DETRAN Aprovado <noreply@detranaprovado.com.br>',
            to: [email],
            subject: 'Seu acesso ao DETRAN Aprovado está liberado 🚗',
            html: emailHtml
          })
        });
        console.log('Email enviado para:', email);
      } catch(emailErr) {
        console.error('Erro email:', emailErr.message);
      }
    }

    return res.status(200).json({ success: true, email, plano: novoPlano, acesso_ate });

  } catch (error) {
    console.error('Erro webhook:', error);
    return res.status(200).json({ ok: true, error: error.message });
  }
}
