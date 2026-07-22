## 1. Cadastro — lista completa de clubes
- Usar `allBrazilianClubs` (Séries A, B, C) no seletor de time em `Auth.tsx` (cadastro) e em `EditarPerfil.tsx`.
- Adicionar opção "Digitar meu time" com input livre — grava um texto customizado em `profiles.favorite_club_id` (ou campo `custom_club_name` se preferir separar; usarei o mesmo campo com prefixo `custom:` para não afetar temas).

## 2. Campo das Emoções — remover atalho da Resenha Fanática
- Localizar a página do "Campo das emoções" (provavelmente `EmotionTacticalBoard.tsx` ou a página que a hospeda) e remover o card inferior "Resenha fanática".

## 3. Página de notícias (Futebol) — filtro por clube
- Reduzir tamanho do botão "Filtrar por clube" em `ClubFilterDropdown.tsx`.
- Repadronizar o dropdown/sheet de escudos para o novo padrão claro (fundo branco, tipografia atual, sem amarelo/legado).

## 4. Meus Agendamentos — remover fluxo de pagamento antigo
- Remover badge/estado "Aguardando reembolso" e quaisquer referências a: comprovante, reembolso, chave PIX, envio de pagamento.
- Varrer `MeusAgendamentos.tsx`, `AppointmentDetailsDialog.tsx`, `RescheduleDialog.tsx`, `SessionInfoDialog.tsx`, componentes admin, e strings relacionadas.

## 5. Página Tabela — múltiplos campeonatos em cards minimizáveis
- Refatorar `BrasileiraoTable.tsx` para lista de campeonatos:
  - Brasileirão A / B / C (toggle interno)
  - Copa do Brasil
  - Libertadores
  - Sul-Americana
  - Brasileirão Feminino
  - Copa do Brasil Feminina
- Cada card mostra prévia (top 4 ou próximos jogos) e expande para tabela completa + próximos jogos, com toggle Tabela/Jogos dentro do card.
- Remover subtítulo "Fonte: SofaScore/Opta (via Fotmob)".
- Ampliar `scrape-brasileirao` para aceitar `leagueId` (parâmetro) e mapear IDs Fotmob:
  - Brasileirão A: 268, B: 269, C: 270
  - Copa do Brasil: 73, Libertadores: 44, Sul-Americana: 45
  - Brasileirão Feminino: 8965, Copa do Brasil Feminina: 10537
  (IDs verificados na edge; se algum divergir, ajustar em runtime.)
- Adaptar payload para copas (bracket) vs pontos corridos (standings) — para copas, mostrar próximos jogos apenas.
- Cache por leagueId.

## 6. Página inicial — NextMatchBar
- Selecionar próxima partida por **data** (mais próxima no futuro, entre todas as competições), não só Brasileirão. Consultar múltiplas ligas onde o clube joga.
- Para partidas ao vivo, exibir autores dos gols abaixo do placar (fonte Fotmob: `matchDetails` — requer chamada extra para `matchDetails?matchId=`). Adicionar campo `scorers` no payload de matches ao vivo apenas.

## 7. Comunidade — Ranking de Torcedores
- Reduzir tamanho da fonte do título "Ranking de Torcedores" para igualar "Brasileirão da Saúde Mental".
- Exibir apenas os 4 primeiros na tabela reduzida; resto acessível via "Ver todos".

## Técnico
- Nova edge function ampliada aceita `?league=<key>` e retorna `{ standings?, matches, next_round, live_scorers? }`.
- Frontend `useBrasileirao` vira `useLeague(key)` genérico; hooks separados por liga com cache localStorage por chave.
- Custom-team storage: adicionar coluna opcional `custom_team_name` em `profiles` via migração, para não poluir `favorite_club_id`.

Confirma que posso avançar com toda essa lista? É bastante mudança de uma vez — se preferir, posso quebrar em 2 entregas (1: itens 1–4 e 7; 2: reformulação da página Tabela e NextMatch por data com goleadores).
