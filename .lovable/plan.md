# Ocultar agendamentos e sessões no aplicativo dos torcedores

## Objetivo
Remover temporariamente da experiência dos torcedores qualquer opção, indicador ou mensagem relacionada a consultas, sessões terapêuticas e agendamentos pelo aplicativo, mantendo apenas o contato direto com profissionais por WhatsApp nos perfis.

## Alterações
- Remover da tela **Perfil** o contador de consultas e o menu “Meus Agendamentos”.
- Remover da página inicial o atalho de consultas, inclusive quando ele vier da configuração do painel.
- Remover da **Minha temporada / jornada**:
  - consulta ao histórico de agendamentos;
  - pontos por sessão;
  - métricas de sessões concluídas ou agendadas;
  - eventos de sessão na atividade recente;
  - textos e atalhos para agendar ou consultar agendamentos.
- Remover “Meus Agendamentos” dos menus do torcedor no computador e da busca global.
- Desativar os avisos automáticos de sessão concluída para torcedores enquanto os agendamentos estiverem inativos.
- Bloquear os antigos endereços de agendamento, pagamento de sessão e histórico, redirecionando o torcedor para a lista de profissionais ou para o perfil.
- Preservar a área dos profissionais e o botão de conversa por WhatsApp.

## Regra técnica
Usar a configuração temporária existente `BOOKING_ENABLED = false` para manter tudo oculto de forma consistente e facilitar uma futura reativação.

## Validação
- Conferir Perfil, Início, Minha temporada, busca e menu do computador.
- Testar que endereços antigos não abrem telas de consultas ou pagamentos.
- Confirmar que os perfis dos profissionais continuam direcionando ao WhatsApp.
