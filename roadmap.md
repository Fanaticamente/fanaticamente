# Fase 6 — Testes automatizados, monitoramento e auditoria contínua

- [x] Auditoria inicial: 9 funcionalidades verificadas operacionais na Fase 5 (aceite server-side, versão exata, IP confiável, anti-duplicata, relatórios servidor, Ed25519, verificação pública, carimbo RFC 3161, cadeia+âncoras)
- [ ] Refatorar núcleo da auditoria da cadeia para função pura testável (`auditChainRows` em legalChain.ts)
- [ ] Testes Deno: fluxo de aceite (validação, falsificação, 401/400/409), verificação pública (privacidade, formato), rfc3161 round-trip, cadeia (adulteração/exclusão/reordenação), builders de relatório
- [ ] Migration 0010: `legal_security_events` + `legal_audit_runs` (append-only, service_role), RPCs admin, retenção (1 ano eventos / 2 anos auditorias), cron diário via pg_net+vault
- [ ] Função `scheduled-legal-audit` (auth por segredo de cron): auditoria + retry de âncoras + registro de resultado + eventos críticos
- [ ] Instrumentar funções legais com log de eventos de segurança (sem PII)
- [ ] Painel admin: eventos de segurança + última auditoria
- [ ] Executar testes via supabase--test_edge_functions + relatório final
