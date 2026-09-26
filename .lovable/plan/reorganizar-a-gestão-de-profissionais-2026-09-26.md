# Reorganizar a gestão de profissionais

## Objetivo
Transformar o menu Gestão em um painel claro e moderno, sem alterar os dados exibidos nos cartões públicos dos profissionais.

## Alterações
- Criar indicadores resumidos para profissionais ativos, inativos, aguardando aprovação e deletados.
- Substituir os blocos atuais por abas com busca, contagem, estado vazio e lista responsiva.
- Mostrar em cada linha foto, nome, CRP, clube, situação de aprovação e visibilidade no marketplace.
- Adicionar um botão de ativação/desativação da visibilidade no marketplace, com retorno visual durante a atualização.
- Manter o acesso aos detalhes, documentos, mensagens e ações de aprovação existentes.
- Transformar a exclusão em arquivamento seguro para que o profissional apareça na aba “Deletados”, preservando seus dados internos.

## Regras de classificação
- **Ativos:** aprovados e com conta ativa.
- **Inativos:** não deletados e com conta desativada, reprovada, em correção ou com outra situação não pendente.
- **Aguardando aprovação:** cadastro com aprovação pendente.
- **Deletados:** cadastro arquivado pelo administrador.

## Segurança e dados
- Adicionar campos próprios para visibilidade pública e arquivamento, sem remover colunas ou registros existentes.
- Permitir que somente administradores alterem visibilidade e arquivamento.
- Atualizar a listagem pública para exibir apenas profissionais aprovados, ativos, não arquivados e marcados como visíveis.
- Preservar todas as informações atuais dos cartões de visita.

## Validação
- Conferir as quatro abas, contagens, busca, alternância de visibilidade e abertura dos detalhes.
- Confirmar que perfis ocultos ou arquivados deixam o marketplace, enquanto os demais dados públicos permanecem iguais.
- Validar a compilação e o painel em telas desktop e mobile.
