# Fase 5 — Carimbo do tempo confiável + cadeia de integridade

- [x] Auditar fases 2–4 (código + banco): OK — 12 aceites, 4 versões, 4 relatórios, chave ativa
- [x] Testar conectividade com TSA RFC 3161 (FreeTSA primária, DigiCert reserva) — ambas OK
- [x] Migration 0009: `legal_acceptance_chain` (advisory lock, trigger, backfill 12 registros, imutabilidade) + `legal_chain_anchors`
- [x] `_shared/rfc3161.ts` + `_shared/legalChain.ts`
- [x] Funções `anchor-legal-chain` e `verify-legal-chain` (admin)
- [x] Integrar carimbo/cadeia em `generate-legal-report` (manifesto v1.1) e `verify-public-report`
- [x] `record-legal-acceptance`: carimbo em background sem bloquear o aceite
- [x] Frontend: /verificar-documento exibe carimbo+cadeia; painel admin com "Ancorar agora" e "Auditar cadeia"
- [x] Testes: 10 cenários executados (ver relatório final)
- [x] Deploy das funções
- [x] Correção: tokens bytea gravados como hex `\x...` (14 âncoras de teste reparadas e recarimbadas)
