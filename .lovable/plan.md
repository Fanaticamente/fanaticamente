# Textos do aplicativo torcedor no Gerenciador Mobile

## Resultado
- A aba **Textos** passa a mostrar as páginas ativas e visíveis do aplicativo torcedor, uma por vez, com os textos da página organizados por seção. Páginas profissionais, administrativas, de desenvolvimento e telas ocultas não aparecem.
- Cada texto editável terá o conteúdo atual, campo para substituir a redação, controle de tamanho de fonte e ajustes de alinhamento/posição seguros dentro do próprio card ou bloco, com opção de restaurar o padrão.
- A prévia mobile acompanha a página selecionada. Após salvar, os ajustes aparecem na página real do torcedor sem alterar dados pessoais, notícias, placares ou conteúdo gerado pelos usuários.

## Implementação técnica
- Catalogar textos fixos das páginas visíveis, incluindo componentes compartilhados exibidos nelas e as configurações de módulos já existentes. Manter identificadores estáveis por página e texto, com valor padrão como fallback.
- Persistir sobrescritas de conteúdo e apresentação no CMS existente (`app_content`), respeitando as permissões de desenvolvedor já aplicadas no banco. Aplicar tamanho e alinhamento no elemento de texto, sem deslocamentos absolutos que quebrem a responsividade.
- Atualizar a aba Textos para navegação por página, pesquisa, edição, salvamento/restauração e prévia. Não transformar textos dinâmicos de banco, formulários sensíveis nem áreas desativadas em cópias independentes.
- Validar a experiência no celular e computador, incluindo o exemplo “Como você está hoje?”, persistência após atualizar a página e ausência de alterações em páginas profissionais/admin/dev.
