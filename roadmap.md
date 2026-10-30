# Fase 5 — Carimbo do tempo confiável + cadeia de integridade

- [x] Auditar fases 2–4 (código + banco): OK — 12 aceites, 4 versões, 4 relatórios, chave ativa
- [ ] Testar conectividade com TSA RFC 3161 (FreeTSA / DigiCert)
- [ ] Migration: tabela `legal_acceptance_chain` (hash chain, advisory lock, trigger, backfill dos 12 registros, proteção update/delete)
- [ ] Migration: tabela `legal_chain_anchors` (âncoras TSA da cabeça da cadeia)
- [ ] `_shared/rfc3161.ts`: construir TimeStampReq, parsear TimeStampResp (genTime, messageImprint)
- [ ] `_shared/legalChain.ts`: helpers de cadeia/carimbo
- [ ] Função `anchor-legal-chain` (admin): carimbar cabeça da cadeia + retry de pendentes
- [ ] Função `verify-legal-chain` (admin): auditoria — recalcular hashes, continuidade, tokens, âncoras
- [ ] Integrar carimbo/cadeia em `generate-legal-report` (manifesto assinado)
- [ ] Integrar status de carimbo/cadeia em `verify-public-report` (sem dados pessoais)
- [ ] Frontend: página pública /verificar-documento exibe carimbo+cadeia; painel admin com auditoria da cadeia
- [ ] Testes: 10 cenários obrigatórios do escopo
- [ ] Deploy das funções + relatório final
