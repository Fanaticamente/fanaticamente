## Objetivo

Fazer o app do torcedor ganhar a identidade visual do clube favorito do usuário logado — o verde emerald atual é substituído pelas cores do clube em toda a interface do torcedor. Fallback pro verde da marca quando o usuário ainda não escolheu clube.

## Como vai funcionar

1. **`ClubThemeProvider` global** — lê `favorite_club_id` do perfil do usuário logado e injeta as cores do clube como variáveis CSS no `<html>`:
   - `--club-primary` (cor principal do clube)
   - `--club-primary-soft` (mesma cor com 88% branco, para fundos de destaque)
   - `--club-primary-tint-15` / `--club-primary-tint-40` (translúcidos para tags/bordas)
   - `--club-on-primary` (branco ou preto, escolhido por contraste automático)
   - Atualiza sozinho quando o usuário troca de clube no perfil.

2. **Aplicação nas superfícies do torcedor:**
   - **BottomNav** — ícone/label ativo, indicador
   - **Home minimalista** — carrossel de atalhos, saudação, botões primários
   - **Comunidade** — abas ativas, cards do ranking
   - **Bem-Estar / Atividades / Minha Temporada** — títulos de seção, ícones, acentos
   - **FanatiClass (Cursos + Detalhe)** — pílulas de categoria ativa, botões, ícones "sobre o curso"
   - **Meus Agendamentos** — abas, status ativo, botões
   - **Perfil do torcedor** — botões de ação
   - **Auth (login/cadastro)** — botão primário e links (quando já em fluxo torcedor)
   - **Cabeçalhos das páginas principais** — mantém fundo branco, mas título/ícones de ação ganham a cor do clube em elementos-chave (não faz faixa colorida cheia como em Equipes Terapêuticas — mantém o estilo minimalista atual, só troca o accent).

3. **O que NÃO muda:**
   - Sistema profissional, admin e dev (mantêm verde/paleta atual).
   - Cabeçalho das Equipes Terapêuticas (continua usando cor do clube do profissional exibido, não do usuário).
   - Neutros (branco, cinzas, preto) e cores de status (vermelho cancelado, âmbar pendente, azul info).
   - Cores dos clubes nas telas específicas de clube (marketplace, cards etc.).

4. **Fallback:**
   - Sem usuário logado ou sem clube escolhido → verde da marca `#237B0E` (mesmo verde que já é usado hoje).

## Detalhes técnicos

- Novo arquivo: `src/contexts/ClubThemeContext.tsx` — provider + hook `useClubTheme()`.
- Wrap dentro de `AuthProvider` em `src/App.tsx` (só nas rotas do app torcedor — não afeta rotas `/professional`, `/admin`, `/developer`).
- Cores injetadas via `document.documentElement.style.setProperty`.
- Componentes atualizados trocam classes `bg-emerald-500 text-white` por `bg-[var(--club-primary)] text-[var(--club-on-primary)]` (e equivalentes para 50/100/600/700).
- Cálculo de contraste (luminância) pra decidir texto branco ou preto sobre a cor primária — clubes com cores claras (Cuiabá dourado, por exemplo) recebem texto preto automaticamente.
- Persistência: o clube já vem do `profiles.favorite_club_id` — nada novo em banco.

## Escopo em arquivos

~15 arquivos editados (páginas e componentes fan-only listados acima) + 1 arquivo novo (provider) + 1 edição em `App.tsx`.

Pronto pra implementar?