// =============================================
// DETRAN APROVADO — SISTEMA HIBRIDO DE CHAT
// Arquitetura: Banco de Dados + IA
// Placas: SEMPRE do banco. Nunca da IA.
// =============================================

// BANCO LOCAL DE PLACAS (espelho do Supabase para busca rapida)
const BANCO_PLACAS = [
  { codigo:'R-1', nome:'Parada Obrigatoria', categoria:'regulamentacao', formato:'octogonal', cores:'fundo vermelho, texto PARE em branco', significado:'O condutor deve parar completamente o veiculo antes de prosseguir, independentemente de haver outros veiculos ou pedestres.', orientacao:'PARE completamente. Nao apenas reduza a velocidade. E obrigatorio.', palavras:'pare parada obrigatoria stop octogono vermelho' },
  { codigo:'R-2', nome:'De a Preferencia', categoria:'regulamentacao', formato:'triangular invertido', cores:'fundo branco, borda vermelha', significado:'O condutor deve ceder a preferencia de passagem aos veiculos e pedestres na via para a qual se dirige.', orientacao:'Reduza a velocidade e ceda passagem. Somente prossiga quando for seguro.', palavras:'preferencia ceder passagem triangulo invertido' },
  { codigo:'R-3', nome:'Proibido Estacionar', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, 1 traco diagonal', significado:'Proibe o estacionamento no trecho. Permite parada breve para embarque e desembarque de passageiros.', orientacao:'Nao estacione. Pode parar brevemente para embarque/desembarque, mas nao abandone o veiculo.', palavras:'proibido estacionar estacionamento um traco' },
  { codigo:'R-4a', nome:'Proibido Virar a Esquerda', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, seta curvada para esquerda cortada', significado:'Proibe ao condutor virar o veiculo a esquerda no cruzamento indicado.', orientacao:'Nao vire a esquerda. Prossiga em frente ou encontre outro caminho.', palavras:'proibido virar esquerda conversao' },
  { codigo:'R-4b', nome:'Proibido Virar a Direita', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, seta curvada para direita cortada', significado:'Proibe ao condutor virar o veiculo a direita no cruzamento indicado.', orientacao:'Nao vire a direita. Prossiga em frente ou encontre outro caminho.', palavras:'proibido virar direita conversao' },
  { codigo:'R-5a', nome:'Proibido Retornar a Esquerda', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, seta de retorno cortada', significado:'Proibe fazer retorno a esquerda no local indicado.', orientacao:'Nao faca retorno a esquerda. Siga adiante e procure local permitido.', palavras:'proibido retornar retorno esquerda' },
  { codigo:'R-5b', nome:'Proibido Retornar a Direita', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, seta de retorno cortada', significado:'Proibe fazer retorno a direita no local indicado.', orientacao:'Nao faca retorno a direita. Siga adiante e procure local permitido.', palavras:'proibido retornar retorno direita' },
  { codigo:'R-6a', nome:'Proibido Ultrapassar', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, dois carros lado a lado cortados', significado:'Proibe a ultrapassagem de qualquer veiculo no trecho indicado.', orientacao:'Nao ultrapasse. Mantenha sua faixa ate o fim da sinalizacao.', palavras:'proibido ultrapassar ultrapassagem' },
  { codigo:'R-6b', nome:'Proibido Ultrapassar Caminhoes', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, caminhao cortado', significado:'Proibe especificamente a ultrapassagem de caminhoes e veiculos de carga.', orientacao:'Caminhoes nao podem ultrapassar neste trecho.', palavras:'proibido ultrapassar caminhao carga' },
  { codigo:'R-7', nome:'Proibido Parar e Estacionar', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, 2 tracos cruzados em X', significado:'Proibe qualquer parada ou estacionamento, inclusive para embarque e desembarque. E mais restritivo que R-3 (que tem apenas 1 traco).', orientacao:'Nao pare NEM estacione. Diferente de R-3: aqui nem parada rapida para embarque e permitida. Dois tracos em X = zero paradas.', palavras:'proibido parar estacionar dois tracos cruzados X' },
  { codigo:'R-8a', nome:'Sentido Proibido', categoria:'regulamentacao', formato:'circular', cores:'fundo vermelho, traco horizontal branco', significado:'Proibe a entrada de veiculos naquele sentido. Indica via de mao unica no sentido contrario.', orientacao:'Nao entre. Voce estaria em contramao.', palavras:'sentido proibido contramao mao unica entrada' },
  { codigo:'R-19', nome:'Velocidade Maxima Permitida', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, numero em preto', significado:'Indica a velocidade maxima permitida no trecho. O numero dentro do circulo (ex: 40, 60, 80, 100, 110) e o limite em km/h.', orientacao:'Nao exceda a velocidade indicada. Esta e a velocidade maxima legal.', palavras:'velocidade maxima limite 40 60 80 100 110 kmh numero circulo' },
  { codigo:'R-26', nome:'Velocidade Minima Obrigatoria', categoria:'regulamentacao', formato:'circular', cores:'FUNDO AZUL, numero em branco (diferente de R-19 que e branco/vermelho)', significado:'Indica a velocidade minima obrigatoria no trecho. ATENCAO: fundo AZUL, nao vermelho. Nao confundir com R-19.', orientacao:'Mantenha velocidade igual ou superior ao numero indicado.', palavras:'velocidade minima obrigatoria azul fundo azul numero' },
  { codigo:'R-25a', nome:'Uso Obrigatorio de Capacete', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, simbolo de capacete', significado:'Torna obrigatorio o uso de capacete de protecao para condutores e passageiros de motocicleta.', orientacao:'Use capacete obrigatoriamente. Infracao gravissima: multa R$195,23 e 5 pontos na CNH.', palavras:'capacete obrigatorio moto motocicleta' },
  { codigo:'R-27', nome:'Mantenha a Direita', categoria:'regulamentacao', formato:'circular', cores:'fundo branco, borda vermelha, seta para direita', significado:'Determina que o condutor deve manter o veiculo pelo lado direito da via.', orientacao:'Mantenha-se na faixa da direita.', palavras:'mantenha direita faixa' },
  { codigo:'A-1a', nome:'Curva Perigosa a Direita', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, seta curvando para direita', significado:'Adverte sobre curva perigosa a direita adiante.', orientacao:'Reduza a velocidade antes da curva. Nao ultrapasse neste trecho.', palavras:'curva perigosa direita losango amarelo' },
  { codigo:'A-1b', nome:'Curva Perigosa a Esquerda', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, seta curvando para esquerda', significado:'Adverte sobre curva perigosa a esquerda adiante.', orientacao:'Reduza a velocidade antes da curva. Nao ultrapasse neste trecho.', palavras:'curva perigosa esquerda losango amarelo' },
  { codigo:'A-2a', nome:'Curva Fechada a Direita', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta', significado:'Adverte sobre curva muito fechada a direita, mais acentuada que A-1a.', orientacao:'Reduza significativamente a velocidade. Curva mais perigosa que A-1a.', palavras:'curva fechada direita losango' },
  { codigo:'A-2b', nome:'Curva Fechada a Esquerda', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta', significado:'Adverte sobre curva muito fechada a esquerda, mais acentuada que A-1b.', orientacao:'Reduza significativamente a velocidade.', palavras:'curva fechada esquerda losango' },
  { codigo:'A-5a', nome:'Cruzamento', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, duas vias se cruzando em X', significado:'Adverte sobre cruzamento com outra via adiante.', orientacao:'Reduza a velocidade e prepare-se para ceder ou ter preferencia.', palavras:'cruzamento intersecao X vias losango' },
  { codigo:'A-11a', nome:'Semaforo a Frente', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, desenho de semaforo', significado:'Adverte sobre a existencia de semaforo logo a frente.', orientacao:'Reduza a velocidade e prepare-se para parar.', palavras:'semaforo sinal frente losango' },
  { codigo:'A-14', nome:'Obras', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, figura de trabalhador', significado:'Adverte sobre obras na via com trabalhadores ou maquinas na pista.', orientacao:'Reduza a velocidade e respeite os sinalizadores de obra.', palavras:'obras trabalhador construcao losango' },
  { codigo:'A-20', nome:'Pista Escorregadia', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, carro derrapando', significado:'Adverte sobre trecho com baixa aderencia, especialmente quando molhada.', orientacao:'Reduza a velocidade, evite freadas e aceleracoes bruscas.', palavras:'pista escorregadia derrapagem chuva losango' },
  { codigo:'A-24', nome:'Pedestres', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, figura de pessoa caminhando', significado:'Adverte sobre presenca frequente de pedestres na via.', orientacao:'Reduza a velocidade e prepare-se para parar.', palavras:'pedestre pessoa caminhando losango' },
  { codigo:'A-26a', nome:'Animais na Pista', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, figura de animal (boi ou cavalo)', significado:'Adverte sobre possibilidade de encontrar animais na pista.', orientacao:'Reduza a velocidade. Animais podem aparecer repentinamente.', palavras:'animais boi cavalo pista losango fauna' },
  { codigo:'A-28', nome:'Criancas', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, figura de criancas', significado:'Adverte sobre area com presenca de criancas (escola, parque).', orientacao:'Reduza a velocidade. Criancas podem entrar na pista inesperadamente.', palavras:'criancas escola parque losango' },
  { codigo:'A-29', nome:'Ciclistas', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, figura de ciclista', significado:'Adverte sobre presenca de ciclistas na via.', orientacao:'Mantenha distancia ao ultrapassar. Respeite os ciclistas.', palavras:'ciclista bicicleta losango' },
  { codigo:'A-32', nome:'Lombada', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, elevacao na pista', significado:'Adverte sobre lombada ou quebra-mola adiante.', orientacao:'Reduza a velocidade antes da lombada.', palavras:'lombada quebra mola elevacao reducao velocidade' },
  { codigo:'A-35', nome:'Altura Limitada', categoria:'advertencia', formato:'losangular', cores:'fundo amarelo, borda preta, veiculo passando por estrutura baixa', significado:'Adverte sobre restricao de altura em estrutura a frente (viaduto, tunel).', orientacao:'Veiculos altos devem verificar compatibilidade antes de prosseguir.', palavras:'altura limitada viaduto tunel galeria metros' },
];

// FUNCAO: Busca placa no banco local
function buscarPlaca(texto) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Busca por codigo exato primeiro (ex: "R-19", "R19", "A-1a")
  const codigoMatch = texto.match(/[RAIErai]-?\d+[ab]?/i);
  if (codigoMatch) {
    const cod = codigoMatch[0].toUpperCase().replace(/([RAI])(\d)/,'$1-$2');
    const exata = BANCO_PLACAS.find(p => p.codigo.toUpperCase() === cod);
    if (exata) return [exata];
  }
  
  // Busca por palavras-chave
  const resultados = BANCO_PLACAS.filter(p => {
    const palavras = p.palavras.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nome = p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sig = p.significado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return palavras.includes(t) || nome.includes(t) || sig.includes(t) ||
      t.split(' ').some(word => word.length > 3 && (palavras.includes(word) || nome.includes(word)));
  });
  
  return resultados.slice(0, 3);
}

// FUNCAO: Detecta se a pergunta e sobre placas
function esobrePlacas(texto) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const keywords = [
    'placa', 'sinal', 'sinalizacao', 'faixa', 'lombada',
    'octogono', 'losango', 'triangulo', 'circular', 'circulo',
    'pare', 'preferencia', 'proibido', 'velocidade maxima', 'velocidade minima',
    'ultrapassar', 'estacionar', 'parar', 'retornar', 'virar',
    'sentido proibido', 'obrigatorio', 'capacete',
    'r-1', 'r-2', 'r-3', 'r-4', 'r-5', 'r-6', 'r-7', 'r-8', 'r-19', 'r-26',
    'a-1', 'a-2', 'a-5', 'a-11', 'a-14', 'a-20', 'a-24', 'a-26', 'a-28', 'a-32',
    'amarela', 'vermelha', 'azul', 'verde', 'borda', 'fundo',
    'regulamentacao', 'advertencia', 'indicacao',
    'o que significa', 'o que quer dizer', 'identifique', 'identifica',
  ];
  return keywords.some(k => t.includes(k));
}

// FUNCAO: Formata resposta de placa
function formatarRespostaPlaca(placas) {
  if (placas.length === 0) {
    return 'Nao encontrei essa placa no sistema. Tente descrever a forma (circular, losangular, octogonal) e a cor, ou o codigo oficial (ex: R-1, A-14).';
  }
  
  if (placas.length === 1) {
    const p = placas[0];
    return `📍 **${p.nome} (${p.codigo})**\n\n📂 **Categoria:** ${p.categoria.charAt(0).toUpperCase() + p.categoria.slice(1)}\n\n🎨 **Caracteristicas:** ${p.formato}, ${p.cores}\n\n🧠 **Significado:** ${p.significado}\n\n⚠️ **O que fazer:** ${p.orientacao}`;
  }
  
  return `Encontrei ${placas.length} placas relacionadas:\n\n` + placas.map(p =>
    `**${p.codigo} — ${p.nome}**\n${p.significado}`
  ).join('\n\n');
}

// =============================================
// SYSTEM PROMPT PARA IA (SO PARA NAO-PLACAS)
// =============================================
const SYSTEM_IA = `Voce e o DetranBot, professor especialista em legislacao de transito brasileira.
IMPORTANTE: Voce NAO responde sobre placas de transito. Para placas, o sistema usa banco de dados separado.
Voce responde sobre: infracoes, penalidades, processo de habilitacao, direcao defensiva, primeiros socorros, semaforos, CTB geral.

REGRAS:
1. Seja direto. Para questao de multipla escolha, comece SEMPRE com a letra correta em negrito.
2. Maximo 4 paragrafos curtos.
3. NUNCA use # ou ## para titulos.
4. NUNCA invente informacoes. Se nao souber, diga claramente.
5. Cite o artigo do CTB quando relevante.
6. Use linguagem informal e amigavel.

CONHECIMENTOS:
- CONTRAN 1.020/2025: 30 questoes, 20 acertos minimos, 60 minutos
- Lei Seca: 0,05mg/L infracao | 0,34mg/L crime
- Gravissima: celular R$293,47 | sinal vermelho R$293,47 | embriaguez R$2.934,70
- Suspensao: 20 pontos/12 meses (menos de 1 ano CNH) | 40 pontos/12 meses (mais de 1 ano)
- Habilitacao: registro → 45h teorico → exame (20/30) → 20h pratico → exame pratico → PPD 1 ano → CNH
- Semaforo amarelo: prepare para PARAR, nunca acelerar (Art. 208 CTB)
- Cruzamento sem sinalizacao: preferencia para quem vem da DIREITA (Art. 29 CTB)
- Ultrapassagem: sempre pela ESQUERDA, proibida em curvas/lombadas/faixas continuas
- Primeiros socorros: chamar socorro PRIMEIRO, nao mover vitima presa, nao remover capacete`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Mensagens invalidas' });
    }

    // Pega a ultima mensagem do usuario
    const ultimaMensagem = messages[messages.length - 1];
    const textoUsuario = typeof ultimaMensagem.content === 'string'
      ? ultimaMensagem.content
      : Array.isArray(ultimaMensagem.content)
        ? ultimaMensagem.content.find(x => x.type === 'text')?.text || ''
        : '';

    // DECISAO: placa ou IA?
    const temImagem = Array.isArray(ultimaMensagem.content) &&
      ultimaMensagem.content.some(x => x.type === 'image');

    if (!temImagem && esobrePlacas(textoUsuario)) {
      // ROTA 1: Busca no banco de dados local
      const placas = buscarPlaca(textoUsuario);
      const resposta = formatarRespostaPlaca(placas);
      
      return res.status(200).json({
        content: [{ type: 'text', text: resposta }]
      });
    }

    // ROTA 2: IA para questoes gerais ou imagens
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
        system: SYSTEM_IA,
        messages: messages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(500).json({ error: 'Erro da API: ' + (data.error?.message || 'desconhecido') });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
