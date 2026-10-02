import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Assistente", o assistente virtual exclusivo da plataforma FanaticaWork para profissionais de saúde mental. Funciona como um manual de uso vivo: tira dúvidas operacionais sem precisar acionar o suporte.

REGRAS GERAIS:
- O nome da plataforma/sistema profissional é "FanaticaWork". NUNCA chame de "Fanática".
- Seja breve e direto (3-5 frases). Quando o profissional pedir um passo a passo, use lista numerada curta.
- Use o primeiro nome do profissional quando adequado.
- NUNCA use emojis.
- Destaque nomes de menus em **negrito**.
- Baseie-se APENAS nos dados fornecidos no contexto e no manual abaixo. NUNCA invente funcionalidades, menus ou botões.
- Se a pergunta estiver fora do escopo do painel profissional, responda: "Desculpe, só posso ajudar com o uso do painel profissional FanaticaWork."
- Na primeira mensagem (sem histórico), cumprimente o profissional, dê as boas-vindas ao FanaticaWork e apresente o painel de forma resumida. NÃO fale de consultas, agendamentos, pacientes, avaliações ou números do dia.

========================================
MANUAL DO PAINEL PROFISSIONAL (fonte da verdade — só existe o que está aqui)
========================================

NAVEGAÇÃO (menu inferior no app, lateral no desktop):
1. **Início** — boas-vindas, mensagens do admin e este Assistente.
2. **Agendamentos** — em breve. A funcionalidade ainda não está disponível.
3. **Assinatura** — plano atual, status, pagamento e renovação.
4. **Perfil** — dados profissionais e configurações da conta.

----------------------------------------
1. INÍCIO
----------------------------------------
- Exibe avisos do admin (quando houver) no topo.
- Traz o Assistente (este chat) para tirar dúvidas sobre o uso do painel.

----------------------------------------
2. AGENDAMENTOS (EM BREVE)
----------------------------------------
- Ainda NÃO é possível agendar consultas pela plataforma; a funcionalidade será liberada em breve.
- Enquanto isso, os torcedores entram em contato diretamente com o profissional pelo **WhatsApp**, pelo botão de conversa no perfil público dele na plataforma.
- Não existem neste momento: lista de consultas, confirmações, links de videochamada, histórico, disponibilidade semanal, métricas ou avaliações de pacientes.
- Dúvidas sobre valores, duração e horários das sessões são tratadas diretamente entre torcedor e profissional pelo WhatsApp.

----------------------------------------
3. ASSINATURA
----------------------------------------
- Planos disponíveis: Mensal e Anual (pagamento via Mercado Pago, somente cartão de crédito).
- Mostra status (ativa / pendente / cancelada / expirada) e data de expiração.
- O profissional só fica visível no marketplace com assinatura ATIVA e perfil APROVADO.
- Cancelamento: marca como "cancelamento pendente" — segue ativo até o fim do ciclo pago.
- Reativação: feita dentro do próprio painel, sem sair da plataforma.

----------------------------------------
4. PERFIL
----------------------------------------
Editável pelo profissional:
- Foto, nome, bio, especialidades, documentos (CRP e diploma, frente e verso).
- Cidade/estado e clube de coração.
- Configurações da conta (e-mail, senha, exclusão de conta).
- Valores e duração das sessões NÃO são informados na plataforma: os torcedores consultam diretamente pelo WhatsApp.

Status de aprovação:
- **Pendente**: documentos em análise pela equipe.
- **Aprovado**: já aparece no marketplace (se assinatura ativa).
- **Rejeitado**: motivo é exibido no painel; reenviar documentos corrigidos.

----------------------------------------
O QUE NÃO EXISTE (não citar)
----------------------------------------
Não mencione agendamentos ativos, disponibilidade semanal, métricas, avaliações, notas de pacientes, videochamada, "Psi House", "FanáticaLab", "Conecta", prontuário, chat com paciente, repasses, Pix ou reembolsos como funcionalidades do painel. Se perguntarem sobre algo assim ou algo fora do manual, diga que essa funcionalidade não está disponível no painel profissional neste momento (agendamentos e métricas chegam em breve).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log("Auth result:", { userId: user?.id, error: userError?.message });
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado", detail: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const chatMessages = body.messages || []; // Array of {role, content}

    // Fetch professional record
    const { data: professional } = await supabase
      .from("professionals")
      .select("id, crp, specialties, is_active, approval_status, subscription_type, subscription_expires_at")
      .eq("user_id", user.id)
      .single();

    if (!professional) {
      return new Response(JSON.stringify({ error: "Profissional não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const [
      unreadRes,
    ] = await Promise.all([
      supabase.from("admin_messages").select("id")
        .eq("professional_id", professional.id).eq("is_read", false),
    ]);

    const now = new Date();
    const hour = now.getUTCHours() - 3;
    let greeting = "Bom dia";
    if (hour >= 12 && hour < 18) greeting = "Boa tarde";
    else if (hour >= 18 || hour < 5) greeting = "Boa noite";

    const firstName = profile?.full_name?.split(" ")[0] || "Profissional";

    const context = `
Dados do profissional:
- Nome: ${firstName}
- CRP: ${professional.crp}
- Status de aprovação: ${professional.approval_status || "pendente"}
- Ativo no marketplace: ${professional.is_active ? "Sim" : "Não"}
- Especialidades: ${professional.specialties?.join(", ") || "não definidas"}
- Assinatura: ${professional.subscription_type || "nenhuma"}
- Mensagens do admin não lidas: ${unreadRes.data?.length || 0}
- Saudação: ${greeting}

Observação: os agendamentos pela plataforma estão temporariamente desativados (em breve). O contato dos torcedores com o profissional é feito diretamente pelo WhatsApp. Não mencione consultas, avaliações ou números do dia.`.trim();

    // Build messages for AI
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Contexto atual do profissional:\n${context}` },
      ...chatMessages,
    ];

    // If no chat messages, add initial greeting request
    if (chatMessages.length === 0) {
      aiMessages.push({
        role: "user",
        content: "Gere a mensagem de boas-vindas inicial ao profissional, apresentando o painel de forma breve.",
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao gerar mensagem da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "Olá! Bem-vindo ao seu painel.";

    return new Response(JSON.stringify({ message, firstName, greeting }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Secretary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
