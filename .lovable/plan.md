# Integração Google Calendar — Profissionais

Integração bidirecional em tempo real entre a agenda interna do FanatiCamente e o Google Calendar pessoal de cada profissional, com sincronização via webhooks.

## Pré-requisitos (você precisa fazer)

1. Acessar [Google Cloud Console](https://console.cloud.google.com) e criar um projeto (ex.: "FanatiCamente Calendar")
2. **Ativar APIs**: Google Calendar API
3. **Tela de consentimento OAuth**:
   - Tipo: Externo
   - Domínios autorizados: `fanaticamente.com`, `lovable.app`
   - Escopos: `calendar.events`, `calendar.readonly`, `userinfo.email`
4. **Credenciais → OAuth Client ID** (tipo Web application):
   - Authorized redirect URIs: `https://jehgvrskdyijirecznii.supabase.co/functions/v1/google-calendar-oauth-callback`
5. Copiar **Client ID** e **Client Secret** — eu vou te pedir como secrets
6. Publicar o app (modo Production) — leva ~1-2 semanas de revisão. Enquanto isso, em modo Test, só funciona para até 100 e-mails que você cadastrar como testers

## Etapas de implementação

### Etapa 1 — Backend (Database)

Nova tabela `professional_google_calendar`:
- `professional_id`, `google_email`, `access_token` (criptografado), `refresh_token` (criptografado)
- `token_expires_at`, `calendar_id` (default `primary`)
- `sync_token` (para sync incremental Google), `webhook_channel_id`, `webhook_resource_id`, `webhook_expires_at`
- `is_active`, timestamps
- RLS: profissional só vê/edita o próprio registro

Adicionar coluna `google_event_id` em `appointments` (para mapear evento ↔ agendamento).

Nova tabela `google_calendar_blocks`:
- Eventos pessoais do Google que bloqueiam horários no app (cache local atualizado por webhook)
- `professional_id`, `google_event_id`, `start_time`, `end_time`, `summary`

### Etapa 2 — Edge Functions

1. **`google-calendar-oauth-start`** — gera URL de autorização Google com `state` assinado
2. **`google-calendar-oauth-callback`** — recebe code, troca por tokens, salva, registra webhook channel, faz primeiro sync
3. **`google-calendar-webhook`** (verify_jwt=false) — recebe push notifications do Google, faz sync incremental usando `sync_token`, atualiza `google_calendar_blocks`
4. **`google-calendar-sync`** — refresh manual + renovação de webhook channel (chamada por cron)
5. **`google-calendar-disconnect`** — revoga tokens, deleta webhook channel
6. **Hook em criação de appointment**: ao confirmar agendamento, criar evento no Google Calendar do profissional (com link Meet opcional)
7. **Hook em cancelamento**: deletar evento do Google

### Etapa 3 — Cron job (renovação webhooks)

Webhooks do Google expiram em **7 dias** (máx). Cron diário roda `google-calendar-sync` para todos profissionais com `webhook_expires_at < now() + 2 days` e renova o canal.

### Etapa 4 — UI (frontend)

Em `WeeklyAvailabilityManager.tsx` adicionar card no topo:
- Estado **desconectado**: botão "Conectar Google Calendar" (logo Google) + texto explicativo
- Estado **conectado**: badge verde "Sincronizado com `email@gmail.com`", última sync, botão "Desconectar"
- Tooltip explicando: eventos do Google bloqueiam horários, agendamentos novos aparecem na sua agenda Google

Indicador visual nos slots da grade semanal: horários bloqueados pelo Google aparecem com ícone de calendário Google e cor diferenciada (não editável).

Hook `useGoogleCalendar(professionalId)` para ler estado da conexão + bloqueios, com realtime subscription na tabela `google_calendar_blocks`.

### Etapa 5 — Verificação de disponibilidade

Atualizar a lógica que calcula slots disponíveis (consumida pelo `BookingDrawer` etc.) para considerar `google_calendar_blocks` além das regras semanais e dos `appointments`. Slot fica indisponível se há overlap com qualquer bloco Google.

## Detalhes técnicos

- **Tokens**: armazenados em colunas `text` na tabela com RLS estrita (apenas service_role pode ler em edge functions). Sem necessidade de criptografia adicional pois RLS bloqueia acesso client-side.
- **Refresh token**: usado automaticamente pelas edge functions quando `access_token` expira (1h)
- **Sync incremental**: usar `syncToken` da Google Calendar API — só traz mudanças desde última sync, muito eficiente
- **Webhook validation**: validar header `X-Goog-Channel-Token` (segredo aleatório guardado por canal) para garantir que o webhook é legítimo
- **Rate limits Google**: 1.000.000 queries/dia/projeto, mais que suficiente
- **Time zone**: usar `America/Sao_Paulo` em todos eventos criados pelo app
- **Tipo de evento criado**: usar `summary` "FanatiCamente — Sessão" e `description` com link da sessão; se cliente quiser privacidade, esconder nome do paciente

## Secrets necessários

- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_WEBHOOK_TOKEN` (gerado por mim, validação extra dos webhooks)

## Ordem de execução proposta

1. Você cria credenciais no Google Cloud (aviso quando estiver pronto)
2. Me passa Client ID + Secret via secrets
3. Implemento DB + edge functions OAuth + UI de conectar/desconectar
4. Testamos OAuth com sua conta primeiro
5. Implemento webhooks + sync incremental + bloqueios na disponibilidade
6. Implemento criação automática de evento ao confirmar agendamento
7. Configuramos cron de renovação de canais
8. Publicação do app no Google (você submete para revisão)

Posso começar agora pela parte que **não depende** das credenciais do Google (DB schema + UI placeholder + estrutura das edge functions). Aí quando você tiver Client ID/Secret, plugamos e testamos.

**Quer que eu comece já pela parte independente?**
