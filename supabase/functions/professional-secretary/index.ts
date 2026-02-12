import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Assistente", o assistente virtual exclusivo da plataforma Fanaticamente para profissionais de saúde mental.

ESCOPO RESTRITO - Você SÓ pode responder sobre:
1. Agendamentos: consultas de hoje, pendentes, confirmados, realizados, cancelados, reagendamentos
2. Disponibilidade: horários configurados, como alterar disponibilidade
3. Assinatura e pagamentos: status da assinatura, planos disponíveis, pagamentos recebidos
4. Perfil profissional: como atualizar bio, especialidades, foto, CRP
5. Avaliações e métricas: nota média, feedbacks recebidos
6. Reembolsos: status de reembolsos pendentes, como processar
7. Mensagens do admin: avisos importantes, notificações
8. Funcionamento da plataforma Fanaticamente: como funciona o marketplace, fluxo de agendamento, Psi House, FanáticaLab, Conecta
9. Psi House: espaço de coworking virtual para profissionais
10. FanáticaLab: ferramentas clínicas (notas clínicas, revisão de caso, mapa de observação, plano terapêutico, biblioteca de referências)
11. Conecta: networking entre profissionais

REGRAS:
- O nome da plataforma é "Fanaticamente". NUNCA chame de "Fanática", sempre use "Fanaticamente".
- Se a pergunta estiver FORA do escopo acima, responda educadamente: "Desculpe, só posso ajudar com assuntos relacionados à plataforma Fanaticamente. Posso te ajudar com seus agendamentos, perfil, assinatura ou outras funcionalidades da plataforma!"
- Seja breve e direto (máximo 3-4 frases por resposta)
- Use o primeiro nome do profissional quando adequado
- Use emojis com moderação (0-2)
- Baseie-se APENAS nos dados fornecidos, nunca invente informações
- Quando for a primeira mensagem (saudação inicial), cumprimente e informe sobre a movimentação do dia`;

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
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const chatMessages = body.messages || []; // Array of {role, content}

    // Fetch professional record
    const { data: professional } = await supabase
      .from("professionals")
      .select("id, crp, bio, specialties, hourly_rate, is_active, approval_status, subscription_type, subscription_expires_at, pix_key, pix_key_type")
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

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    // Fetch data in parallel
    const [
      todayRes, yesterdayRes, pendingRes, weekRes, unreadRes, ratingsRes, refundRes, weeklyAvailRes
    ] = await Promise.all([
      supabase.from("appointments").select("id, scheduled_date, scheduled_time, status")
        .eq("professional_id", professional.id).eq("scheduled_date", today),
      supabase.from("appointments").select("id")
        .eq("professional_id", professional.id)
        .gte("created_at", yesterday + "T00:00:00.000Z")
        .lte("created_at", yesterday + "T23:59:59.999Z"),
      supabase.from("appointments").select("id")
        .eq("professional_id", professional.id).eq("status", "pending"),
      supabase.from("appointments").select("id, scheduled_date, status")
        .eq("professional_id", professional.id)
        .gte("scheduled_date", today).lte("scheduled_date", weekFromNow)
        .in("status", ["confirmed", "pending"]),
      supabase.from("admin_messages").select("id, message")
        .eq("professional_id", professional.id).eq("is_read", false),
      supabase.from("appointments").select("rating")
        .eq("professional_id", professional.id).not("rating", "is", null)
        .order("updated_at", { ascending: false }).limit(10),
      supabase.from("appointments").select("id")
        .eq("professional_id", professional.id).eq("status", "refund_pending"),
      supabase.from("professional_weekly_availability").select("day_of_week, time_slots")
        .eq("professional_id", professional.id),
    ]);

    const todayAppointments = todayRes.data;
    const yesterdayNew = yesterdayRes.data;
    const pending = pendingRes.data;
    const weekAppts = weekRes.data;
    const unread = unreadRes.data;
    const ratings = ratingsRes.data;
    const refunds = refundRes.data;
    const weeklyAvail = weeklyAvailRes.data;

    const avgRating = ratings && ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
      : null;

    const now = new Date();
    const hour = now.getUTCHours() - 3;
    let greeting = "Bom dia";
    if (hour >= 12 && hour < 18) greeting = "Boa tarde";
    else if (hour >= 18 || hour < 5) greeting = "Boa noite";

    const firstName = profile?.full_name?.split(" ")[0] || "Profissional";

    const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const availSummary = weeklyAvail && weeklyAvail.length > 0
      ? weeklyAvail.map(a => `${daysOfWeek[a.day_of_week]}: ${a.time_slots.length} horários`).join(", ")
      : "nenhuma disponibilidade configurada";

    const context = `
Dados do profissional:
- Nome: ${firstName}
- CRP: ${professional.crp}
- Status: ${professional.approval_status || "pendente"}
- Ativo no marketplace: ${professional.is_active ? "Sim" : "Não"}
- Especialidades: ${professional.specialties?.join(", ") || "não definidas"}
- Valor da sessão: R$ ${professional.hourly_rate || "não definido"}
- Assinatura: ${professional.subscription_type || "nenhuma"}
- Chave Pix: ${professional.pix_key ? "configurada" : "não configurada"}

Movimentação (${today}):
- Sessões hoje: ${todayAppointments?.length || 0} ${todayAppointments && todayAppointments.length > 0 ? `(${todayAppointments.filter(a => a.status === "confirmed").length} confirmados, ${todayAppointments.filter(a => a.status === "pending").length} pendentes)` : ""}
- Novos agendamentos ontem: ${yesterdayNew?.length || 0}
- Pendentes de confirmação: ${pending?.length || 0}
- Próxima semana: ${weekAppts?.length || 0}
- Mensagens admin não lidas: ${unread?.length || 0}
- Avaliação média: ${avgRating || "sem avaliações"}
- Reembolsos pendentes: ${refunds?.length || 0}
- Disponibilidade semanal: ${availSummary}
- Saudação: ${greeting}`.trim();

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
        content: "Gere a saudação inicial com o resumo da movimentação do dia.",
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        max_tokens: 400,
        temperature: 0.7,
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
