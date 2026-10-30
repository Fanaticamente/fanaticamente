# Registro e comprovação de aceite eletrônico (Termos e Privacidade)

## Situação atual (analisada)
- Cadastro em `Auth.tsx` usa **uma única caixa** "aceito termos e política" (estado local, não gravado em lugar nenhum).
- Documentos ficam na tabela `legal_documents` (4 slugs: termos/privacidade × torcedor/profissional), editados no Admin (`AdminLegalManager`) **sobrescrevendo o conteúdo** — não há versões nem histórico.
- Cadastro é feito direto pelo auth do cliente (`signUp`) com trigger `handle_new_user`; profissionais seguem para `complete-professional-signup`.

## O que será construído
1. **Versões imutáveis dos documentos** — nova tabela `legal_document_versions` (slug, número de versão, conteúdo integral, hash SHA-256 calculado no banco, data de publicação, "exige novo aceite", quem publicou). `legal_documents` continua existindo e passa a espelhar a versão vigente (as páginas públicas atuais não mudam). A versão atual de cada documento vira a "versão 1" automaticamente.
2. **Registro de aceites** — nova tabela `legal_acceptances` (usuário, versão aceita, slug, hash, ação `accept`/`reaccept`, origem `signup`/`reaccept_prompt`, data do servidor, IP e user-agent). Somente inserção pelo servidor; ninguém altera ou apaga (nem admin pelo app). Bloqueio por trigger contra UPDATE/DELETE.
3. **Função de servidor `record-legal-acceptance`** — recebe apenas os *slugs* marcados; identifica o usuário pelo token de sessão, busca a versão vigente e o hash no banco e grava a data do servidor. O navegador não envia data, versão nem hash.
4. **Cadastro** — duas caixas separadas, desmarcadas, com links "ler na íntegra" (abrem em nova aba / modal). Botão bloqueado sem ambas. Como o e-mail precisa ser confirmado antes de haver sessão, a intenção fica pendente e o aceite é gravado no **primeiro login autenticado** (mesmo mecanismo já usado para dados de perfil pendentes); até registrar, o usuário vê a tela de aceite e não segue.
5. **Novo aceite em atualização** — ao entrar, se existir versão vigente com "exige novo aceite" ainda não aceita, aparece um quadro bloqueante com as caixas e links; ao confirmar, grava novo evento. Histórico anterior intacto.
6. **Admin → Documentos legais** — "Publicar nova versão" (com checkbox "exige novo aceite") em vez de sobrescrever; lista de versões com hash e visualização do conteúdo integral.
7. **Admin → Comprovação de aceites** (nova aba, só admin) — busca por nome/e-mail/ID, tabela com data/hora, documento, versão, hash, origem, IP/UA; detalhe com o texto exato aceito; exportação CSV e relatório (HTML imprimível/PDF) com hash do próprio relatório para conferência.

## Segurança
- RLS: usuário lê apenas os próprios aceites; admin lê todos; inserção apenas pela função de servidor (service role). Versões: leitura pública, publicação só admin via função com trigger que impede editar/apagar versões publicadas.
- Retenção/LGPD: IP e user-agent guardados com finalidade de prova do aceite, por 5 anos após o encerramento da conta (proposta — confirme o prazo); nenhum outro dado pessoal é copiado. A exclusão de conta existente **não apagará** os aceites (mantidos como prova); risco a confirmar abaixo.

## Componentes afetados
`Auth.tsx`, fluxo de signup profissional (`ProfessionalAuth`/onboarding, se tiver caixa própria), `AuthContext` (verificação de pendência), `AdminLegalManager`, `AdminDashboard` (nova aba), `useLegalDocument`, funções `delete-own-account`/`delete-user-completely` (manter aceites). Tabelas novas: `legal_document_versions`, `legal_acceptances`. Tabela alterada apenas no comportamento: `legal_documents` (sincronizada pela versão vigente).

## Riscos
- Usuários já cadastrados não têm aceite registrado: proposta é pedir aceite no próximo login (bloqueante). Alternativa: não pedir.
- Aceite no cadastro só é gravado após confirmação de e-mail + primeiro login (limitação de não haver sessão antes).
- Guardar aceites após exclusão de conta deve constar na Política de Privacidade.
- O sistema produz evidência técnica robusta, mas não garante validade jurídica absoluta.

## Testes
Testes automatizados da regra de pendência/versão; teste da função com usuário A tentando gravar por B (rejeitado), envio de versão/hash/data falsos (ignorados), UPDATE/DELETE em aceites (bloqueado); Playwright do cadastro com caixas desmarcadas. Validação do painel admin depende de conta com papel admin.
