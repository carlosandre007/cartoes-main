declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = request.headers.get('Authorization');
    if (!auth) return new Response(JSON.stringify({ error: 'Não autorizado.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { summary } = await request.json();
    if (!summary || typeof summary !== 'object') throw new Error('Resumo financeiro inválido.');
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada na Edge Function.');
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const systemInstruction = `Você é a Central de Inteligência Financeira Aureum. Analise exclusivamente o JSON fornecido. Nunca invente dados, taxas, juros, datas ou tendências. Quando um cálculo não for possível, diga explicitamente que faltam dados. Responda em português do Brasil, em Markdown, exatamente com as seções: Diagnóstico Financeiro (inclua Nota Financeira de 0 a 100), Prioridade de Pagamentos, Economia, Cartões, Fluxo de Caixa, Antecipações, Projeções (30, 90, 180 e 365 dias), Alertas, Metas e Plano de Ação. Simulações de juros só podem usar taxas presentes nos dados; caso contrário, explique a limitação.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: `Resumo financeiro estruturado:\n${JSON.stringify(summary)}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    });
    if (!response.ok) throw new Error(`Falha no provedor de IA (${response.status}).`);
    const result = await response.json();
    const analysis = result.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('').trim();
    if (!analysis) throw new Error('Resposta vazia do provedor de IA.');
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro inesperado.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
