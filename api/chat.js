// =============================================
// DETRAN APROVADO — PROFESSOR IA v2
// IA responde TUDO com contexto do CTB
// Banco de placas apenas para identificacao visual
// =============================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { messages } = req.body || {};
  if (!messages?.length) return res.status(400).json({ error: 'Sem mensagens' });

  const SYSTEM = `Você é o Professor de CNH do app "Detran Aprovado" — um especialista completo em legislação de trânsito brasileira.

Seu objetivo é ajudar candidatos a passar na prova do DETRAN com respostas precisas, didáticas e confiáveis.

SUAS ESPECIALIDADES:
- Código de Trânsito Brasileiro (CTB) — todos os artigos
- Placas de sinalização (regulamentação, advertência, indicação, obras)
- Semáforos e gestos de agentes de trânsito
- Infrações, penalidades e pontuação na CNH
- Documentos obrigatórios do veículo
- Primeiros socorros em acidentes
- Direção defensiva e segurança no trânsito
- Habilitação: categorias A, B, C, D, E
- Simulados e questões mais cobradas nas provas

PLACAS MAIS COBRADAS NAS PROVAS DO DETRAN:
Regulamentação: R-1 (Parada Obrigatória), R-2 (Dê a Preferência), R-3 (Proibido Estacionar), R-4a/R-4b (Proibido Virar), R-6a (Proibido Ultrapassar), R-7 (Proibido Parar e Estacionar), R-8a (Sentido Proibido), R-19 (Velocidade Máxima), R-26 (Velocidade Mínima — fundo AZUL), R-25a (Capacete Obrigatório)
Advertência: A-1a/A-1b (Curvas), A-5a (Cruzamento), A-11a (Semáforo à frente), A-14 (Obras), A-20 (Pista Escorregadia), A-24 (Pedestres), A-26a (Animais), A-28 (Crianças), A-29 (Ciclistas), A-32 (Lombada)
Indicação: Azul = serviços (hospital, posto, telefone). Verde = rodovias. Amarelo = obras.

REGRAS DE RESPOSTA:
- Seja direto e didático
- Use emojis para facilitar leitura
- Cite artigos do CTB quando relevante
- Para listas de placas, liste TODAS as relevantes — não apenas 2
- Se perguntarem sobre infrações, informe a classificação (leve/média/grave/gravíssima) sem citar valores de multa
- Responda em português brasileiro
- Seja encorajador — o aluno está estudando para passar na prova

IMPORTANTE: Você tem conhecimento COMPLETO do CTB. Nunca diga que não sabe algo relacionado ao trânsito brasileiro. Sempre dê uma resposta completa e útil.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM,
        messages: messages
      })
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text || 'Desculpe, tente novamente.';
    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Erro chat:', error);
    return res.status(500).json({ error: error.message });
  }
}
