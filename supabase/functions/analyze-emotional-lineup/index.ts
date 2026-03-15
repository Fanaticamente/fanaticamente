import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formation, lineup } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const lineupDescription = Object.entries(lineup)
      .map(([sector, emotions]) => `${sector}: ${(emotions as string[]).join(", ")}`)
      .join("\n");

    const systemPrompt = `Você é um assistente que ajuda usuários a refletirem sobre seu estado emocional usando a metáfora de um time de futebol.

O usuário escalou um 'time emocional' com uma formação tática e emoções em cada setor do campo.

Sua tarefa é:
1. Interpretar o estado emocional geral do usuário.
2. Fazer uma reflexão breve e acolhedora usando metáforas do futebol (defesa, meio-campo, ataque).
3. Sugerir uma pequena dica de autoconsciência emocional.
4. Finalizar com uma frase filosófica real de um autor conhecido, citando o autor.

Regras:
- máximo de 120 palavras
- linguagem simples e acolhedora
- não realizar diagnósticos psicológicos
- evitar termos clínicos ou patologizantes
- manter tom reflexivo
- jamais usar termos como "transtorno" ou "doença"`;

    const userPrompt = `Formação escolhida: ${formation}

Escalação emocional:
${lineupDescription}

Analise esta escalação emocional e forneça sua reflexão.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      throw new Error("Failed to get AI analysis");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
