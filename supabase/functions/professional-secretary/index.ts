import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch professional record
    const { data: professional } = await supabase
      .from("professionals")
      .select("id, crp, bio, specialties, hourly_rate, is_active, approval_status, subscription_type")
      .eq("user_id", user.id)
      .single();

    if (!professional) {
      return new Response(JSON.stringify({ error: "Profissional não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    // Fetch today's appointments
    const { data: todayAppointments } = await supabase
      .from("appointments")
      .select("id, scheduled_date, scheduled_time, status")
      .eq("professional_id", professional.id)
      .eq("scheduled_date", today);

    // Fetch yesterday's new appointments (created yesterday)
    const yesterdayStart = yesterday + "T00:00:00.000Z";
    const yesterdayEnd = yesterday + "T23:59:59.999Z";
    const { data: yesterdayNewAppointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("professional_id", professional.id)
      .gte("created_at", yesterdayStart)
      .lte("created_at", yesterdayEnd);

    // Fetch pending appointments
    const { data: pendingAppointments } = await supabase
      .from("appointments")
      .select("id")
      .eq("professional_id", professional.id)
      .eq("status", "pending");

    // Fetch upcoming week appointments
    const { data: weekAppointments } = await supabase
      .from("appointments")
      .select("id, scheduled_date, status")
      .eq("professional_id", professional.id)
      .gte("scheduled_date", today)
      .lte("scheduled_date", weekFromNow)
      .in("status", ["confirmed", "pending"]);

    // Fetch unread admin messages
    const { data: unreadMessages } = await supabase
      .from("admin_messages")
      .select("id")
      .eq("professional_id", professional.id)
      .eq("is_read", false);

    // Fetch recent ratings
    const { data: recentRatings } = await supabase
      .from("appointments")
      .select("rating")
      .eq("professional_id", professional.id)
      .not("rating", "is", null)
      .order("updated_at", { ascending: false })
      .limit(10);

    const avgRating = recentRatings && recentRatings.length > 0
      ? (recentRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / recentRatings.length).toFixed(1)
      : null;

    // Fetch refund pending
    const { data: refundPending } = await supabase
      .from("appointments")
      .select("id")
      .eq("professional_id", professional.id)
      .eq("status", "refund_pending");

    // Build context
    const now = new Date();
    const hour = now.getUTCHours() - 3; // BRT approximation
    let greeting = "Bom dia";
    if (hour >= 12 && hour < 18) greeting = "Boa tarde";
    else if (hour >= 18 || hour < 5) greeting = "Boa noite";

    const firstName = profile?.full_name?.split(" ")[0] || "Profissional";

    const context = `
Dados do profissional:
- Nome: ${firstName}
- CRP: ${professional.crp}
- Status do perfil: ${professional.approval_status || "pendente"}
- Ativo no marketplace: ${professional.is_active ? "Sim" : "Não"}
- Especialidades: ${professional.specialties?.join(", ") || "não definidas"}
- Valor da sessão: R$ ${professional.hourly_rate || "não definido"}

Dados de hoje (${today}):
- Agendamentos para hoje: ${todayAppointments?.length || 0} ${todayAppointments && todayAppointments.length > 0 ? `(${todayAppointments.filter(a => a.status === "confirmed").length} confirmados, ${todayAppointments.filter(a => a.status === "pending").length} pendentes)` : ""}
- Agendamentos recebidos ontem: ${yesterdayNewAppointments?.length || 0}
- Agendamentos pendentes de confirmação: ${pendingAppointments?.length || 0}
- Agendamentos na próxima semana: ${weekAppointments?.length || 0}
- Mensagens não lidas do admin: ${unreadMessages?.length || 0}
- Avaliação média recente: ${avgRating || "sem avaliações ainda"}
- Reembolsos pendentes: ${refundPending?.length || 0}
- Saudação adequada: ${greeting}
    `.trim();

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é o secretário eletrônico virtual da plataforma Fanática. Seu papel é cumprimentar o profissional de saúde mental de forma acolhedora e informá-lo sobre a movimentação do painel dele.

Regras:
- Use a saudação adequada (bom dia/boa tarde/boa noite) e o primeiro nome do profissional
- Seja breve, acolhedor e profissional (máximo 4-5 frases)
- Destaque informações importantes como agendamentos pendentes, sessões de hoje, mensagens não lidas
- Se houver reembolsos pendentes, mencione com prioridade
- Se não houver movimentação significativa, dê uma mensagem motivacional breve
- Use emojis com moderação (1-2 no máximo)
- Não invente dados, use apenas o que foi fornecido
- Responda apenas com a mensagem, sem prefixos como "Mensagem:" ou similar`
          },
          {
            role: "user",
            content: context,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
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
