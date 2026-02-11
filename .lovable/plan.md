
## Atualizar pontuação no card informativo do Ranking

Alterar o texto do card "Como funciona o Ranking?" para refletir que sessões de terapia valem **3 pontos**, enquanto as demais atividades continuam valendo 1 ponto.

### Alterações no arquivo `src/components/ranking/RankingInfoCard.tsx`:

1. Mudar o parágrafo introdutório: trocar "Cada atividade abaixo gera **1 ponto**" por uma redação que explique que as atividades geram pontos conforme descrito abaixo.
2. No item "Sessão de terapia", adicionar que cada consulta concluída gera **3 pontos**.
3. Nos itens "Termômetro Emocional" e "FanatiClass", explicitar que cada ação gera **1 ponto**.
