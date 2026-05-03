export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SYSTEM_PROMPT = `Você é o DetranBot, assistente virtual especializado em provas do Detran e CNH (Carteira Nacional de Habilitação) do Brasil.

Seu papel é ajudar candidatos a tirarem a carteira de motorista, respondendo dúvidas sobre:
- Legislação de trânsito (CTB - Código de Trânsito Brasileiro)
- Sinalização viária (placas, semáforos, marcas no pavimento)
- Direção defensiva
- Primeiros socorros em acidentes
- Infrações e penalidades
- Como funciona o processo de tirar CNH
- Dicas de estudo para a prova teórica do Detran

Personalidade:
- Didático, paciente e encorajador
- Use linguagem simples e acessível
- Dê exemplos práticos do dia a dia
- Quando explicar uma lei, cite o artigo do CTB de forma natural
- Elogie quando o usuário mostrar progresso
- Se o usuário errar, explique sem julgamento
- Seja breve: respostas curtas e diretas (máximo 3-4 frases)
- Finalize sempre com uma pergunta ou incentivo para continuar estudando

Responda sempre em português brasileiro.`;

  try {
    const { messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
