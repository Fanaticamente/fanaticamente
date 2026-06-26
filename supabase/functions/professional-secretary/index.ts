import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o "Assistente", o assistente virtual exclusivo da plataforma Fanaticamente para profissionais de saúde mental. Funciona como um manual de uso vivo: tira dúvidas operacionais sem precisar acionar o suporte.

REGRAS GERAIS:
- O nome da plataforma é "Fanaticamente". NUNCA chame de "Fanática".
- Seja breve e direto (3-5 frases). Quando o profissional pedir um passo a passo, use lista numerada curta.
- Use o primeiro nome do profissional quando adequado.
- NUNCA use emojis.
- Destaque nomes de pacientes, valores e nomes de menus em **negrito**.
- Baseie-se APENAS nos dados fornecidos no contexto e no manual abaixo. NUNCA invente funcionalidades, menus ou botões.
- Se a pergunta estiver fora do escopo do painel profissional, responda: "Desculpe, só posso ajudar com o uso do painel profissional Fanaticamente."
- Na primeira mensagem (sem histórico), cumprimente e resuma a movimentação do dia.

========================================
MANUAL DO PAINEL PROFISSIONAL (fonte da verdade — só existe o que está aqui)
========================================

NAVEGAÇÃO (menu inferior no app, lateral no desktop):
1. **Início** — visão geral do dia, mensagens do admin, atalhos e este assistente.
2. **Agendamentos** — lista e gestão de todas as consultas.
3. **Assinatura** — plano atual, status, pagamento e renovação.
4. **Perfil** — dados profissionais e configurações da conta.

Dentro de **Início** existem ainda as abas: **Agenda**, **Disponibilidade** e **Métricas**.

----------------------------------------
1. INÍCIO
----------------------------------------
- Mostra resumo: consultas do mês, pacientes atendidos, avaliação média.
- Exibe avisos do admin (quando houver) no topo.
- Traz o Assistente (este chat) para tirar dúvidas e ver a movimentação do dia.

----------------------------------------
2. AGENDAMENTOS
----------------------------------------
Filtros: **Próximos**, **Realizados**, **Cancelados**, **Todos**.

Fluxo de uma consulta:
1. Paciente agenda normalmente → aparece como **Pendente**.
2. Profissional clica em **Confirmar** para aceitar, ou em **Recusar** informando o motivo.
3. Depois de confirmada, perto do horário agendado o profissional usa **Enviar Link** para enviar o link da videochamada (Google Meet, Zoom, etc.) ao paciente.
4. No horário, clica em **Iniciar** para marcar início da sessão.
5. Ao terminar, clica em **Encerrar** para finalizar — a consulta vai para Realizados e libera avaliação do paciente.

Importante:
- A plataforma NÃO recebe pagamentos do paciente; valores e reembolsos são tratados diretamente entre profissional e paciente, fora da plataforma.
- A plataforma NÃO faz a videochamada; o profissional fornece o link próximo ao horário agendado.
- Reagendamentos solicitados pelo paciente aparecem com aviso na própria consulta.

----------------------------------------
3. DISPONIBILIDADE (aba dentro de Início)
----------------------------------------
- Configurar horários por dia da semana (segunda a domingo).
- Adicionar/remover faixas de horário por dia.
- Só horários cadastrados aparecem para os pacientes agendarem.
- Se não houver disponibilidade, o profissional não recebe novos agendamentos.

----------------------------------------
4. MÉTRICAS (aba dentro de Início)
----------------------------------------
- Consultas do mês, pacientes atendidos, taxa de confirmação.
- Avaliação média (de 1 a 5) com base nas notas dos pacientes.
- Feedbacks deixados pelos pacientes.

----------------------------------------
5. ASSINATURA
----------------------------------------
- Planos disponíveis: Mensal e Anual (pagamento via Mercado Pago, somente cartão de crédito).
- Mostra status (ativa / pendente / cancelada / expirada) e data de expiração.
- O profissional só fica visível no marketplace com assinatura ATIVA e perfil APROVADO.
- Cancelamento: marca como "cancelamento pendente" — segue ativo até o fim do ciclo pago.
- Reativação: feita dentro do próprio painel, sem sair da plataforma.

----------------------------------------
6. PERFIL
----------------------------------------
Editável pelo profissional:
- Foto, nome, bio, especialidades, valor da sessão (hourly_rate).
- Documentos: CRP (frente e verso) e diploma (frente e verso).
- Chave Pix (para possíveis devoluções externas ao paciente, quando acordado fora da plataforma).
- Cidade/estado e clube de coração.
- Configurações da conta (e-mail, senha, exclusão de conta).

Status de aprovação:
- **Pendente**: documentos em análise pela equipe.
- **Aprovado**: já aparece no marketplace (se assinatura ativa).
- **Rejeitado**: motivo é exibido no painel; reenviar documentos corrigidos.

----------------------------------------
7. REEMBOLSOS / CANCELAMENTOS
----------------------------------------
Quando uma consulta é recusada ou cancelada, o profissional trata qualquer devolução de valor diretamente com o paciente, fora da plataforma. A Fanaticamente não intermediar pagamentos nem reembolsos. Se houver acordo de reembolso, o profissional pode usar a chave Pix informada pelo paciente para realizar a devolução externamente e depois confirmar a situação no card da consulta.

----------------------------------------
O QUE NÃO EXISTE (não citar)
----------------------------------------
Não mencione "Psi House", "FanáticaLab", "Conecta", "Avaliações e Métricas" como menu separado, prontuário, agenda do Google integrada, chat com paciente, videochamada nativa, repasses automáticos da plataforma, ou qualquer recurso fora do que está descrito acima. Se perguntarem sobre algo assim, diga que essa funcionalidade não está disponível no painel profissional atualmente.`;

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
      allApptsRes, unreadRes, ratingsRes, weeklyAvailRes
    ] = await Promise.all([
      supabase.from("appointments")
        .select("id, scheduled_date, scheduled_time, status, notes, rating, user_id, consultation_link, rejection_reason, user_pix_key, user_pix_key_type, created_at")
        .eq("professional_id", professional.id)
        .order("scheduled_date", { ascending: false })
        .limit(100),
      supabase.from("admin_messages").select("id, message")
        .eq("professional_id", professional.id).eq("is_read", false),
      supabase.from("appointments").select("rating")
        .eq("professional_id", professional.id).not("rating", "is", null)
        .order("updated_at", { ascending: false }).limit(10),
      supabase.from("professional_weekly_availability").select("day_of_week, time_slots")
        .eq("professional_id", professional.id),
    ]);

    const allAppts = allApptsRes.data || [];

    // Fetch patient names for all appointments
    const userIds = [...new Set(allAppts.map(a => a.user_id))];
    const { data: patientProfiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
      : { data: [] };

    const profileMap: Record<string, string> = {};
    (patientProfiles || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name || "Sem nome"; });

    // Derive subsets
    const todayAppointments = allAppts.filter(a => a.scheduled_date === today);
    const yesterdayNew = allAppts.filter(a => a.created_at >= yesterday + "T00:00:00" && a.created_at <= yesterday + "T23:59:59");
    const pending = allAppts.filter(a => a.status === "pending");
    const weekAppts = allAppts.filter(a => a.scheduled_date >= today && a.scheduled_date <= weekFromNow && ["confirmed", "pending"].includes(a.status));
    const refunds = allAppts.filter(a => a.status === "refund_pending");

    const unread = unreadRes.data;
    const ratings = ratingsRes.data;
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

    // Build detailed appointments list
    const formatAppt = (a: any) => {
      const name = profileMap[a.user_id] || "Paciente desconhecido";
      let detail = `  - Paciente: ${name} | Data: ${a.scheduled_date} ${a.scheduled_time} | Status: ${a.status}`;
      if (a.rating) detail += ` | Avaliação: ${a.rating}/5`;
      if (a.rejection_reason) detail += ` | Motivo rejeição: ${a.rejection_reason}`;
      if (a.user_pix_key) detail += ` | Pix paciente: ${a.user_pix_key} (${a.user_pix_key_type})`;
      return detail;
    };

    const todayDetails = todayAppointments.length > 0
      ? todayAppointments.map(formatAppt).join("\n")
      : "  Nenhuma sessão hoje";

    const pendingDetails = pending.length > 0
      ? pending.map(formatAppt).join("\n")
      : "  Nenhum pendente";

    const refundDetails = refunds.length > 0
      ? refunds.map(formatAppt).join("\n")
      : "  Nenhum reembolso pendente";

    const weekDetails = weekAppts.length > 0
      ? weekAppts.map(formatAppt).join("\n")
      : "  Nenhum agendamento na próxima semana";

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

Resumo (${today}):
- Sessões hoje: ${todayAppointments.length}
- Novos agendamentos ontem: ${yesterdayNew.length}
- Pendentes de confirmação: ${pending.length}
- Próxima semana: ${weekAppts.length}
- Mensagens admin não lidas: ${unread?.length || 0}
- Avaliação média: ${avgRating || "sem avaliações"}
- Reembolsos pendentes: ${refunds.length}
- Disponibilidade semanal: ${availSummary}
- Saudação: ${greeting}

DETALHES DOS AGENDAMENTOS DE HOJE:
${todayDetails}

AGENDAMENTOS PENDENTES DE CONFIRMAÇÃO:
${pendingDetails}

REEMBOLSOS PENDENTES (profissional deve reembolsar diretamente o paciente):
${refundDetails}

AGENDAMENTOS DA PRÓXIMA SEMANA:
${weekDetails}`.trim();

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
