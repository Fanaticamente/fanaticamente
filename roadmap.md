# Fase 6 — Testes automatizados, monitoramento e auditoria contínua

- [x] Auditoria inicial: 9 funcionalidades verificadas operacionais (Fase 5, ao vivo)
- [x] Núcleo de auditoria testável: `auditChainRows`/`buildAcceptancePayload` puros em legalChain.ts; `runFullAudit` em _shared/legalAudit.ts
- [x] Testes Deno: 26/26 passando (cadeia 9, relatório 5, rfc3161 5, aceite 4, verificação pública 3)
- [x] Migration 0010: legal_security_events + legal_audit_runs + legal_cron_config (append-only), RPCs admin, retenção 1 ano/2 anos, cron diário 6h UTC
- [x] scheduled-legal-audit: auth por segredo (SHA-256, fonte única em legal_cron_config); testado 401 sem segredo e execução real via cron (cron|true|12 registros|19 âncoras|0 inválidas)
- [x] Instrumentação: eventos em record-legal-acceptance, verify-legal-report, verify-public-report, scheduled-legal-audit
- [x] Painel admin: auditorias recentes + eventos de segurança
- [x] Build OK; segredo LEGAL_AUDIT_CRON_SECRET_SHA256 mantido (usuário recusou exclusão; não é mais usado)

# PDF de comprovação organizado

- [x] Recriar quadros legíveis no PDF mantendo a geração e assinatura no servidor.
- [x] Incluir código público, referência da cadeia e orientação sobre assinatura/carimbo sem alterar evidências anteriores.
- [x] Testar integridade, paginação e apresentação; disponibilizar a atualização (29 testes aprovados; quadros fracionados corrigidos; função implantada).
- [ ] Conferir download autenticado no painel admin: a sessão disponível é redirecionada e não permite acessar esse painel.
