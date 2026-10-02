# Gerenciador de textos do aplicativo torcedor

## Resultado esperado
- Na aba **Textos** do Gerenciador Mobile, mostrar somente páginas ativas e acessíveis aos torcedores, organizadas página por página. Páginas ocultas, exclusivas de profissionais e endereços que apenas redirecionam não entram na lista.
- Dentro de cada página, listar os textos da interface por seção, com nomes legíveis e busca; permitir mudar o conteúdo, aumentar/diminuir o tamanho da fonte e alinhar ou ajustar a posição do texto dentro do seu cartão, sem deslocamento livre que cause sobreposição no celular.
- O exemplo da página inicial — “Como você está hoje?” e “Cada dia é uma rodada!” — deve ser editável individualmente. Salvar, restaurar o texto/estilo original e conferir o resultado na prévia e no aplicativo torcedor.
- Incluir os textos fixos das páginas ativas e de suas telas internas acessíveis. Dados próprios de cada usuário, placares, nomes dos clubes/profissionais, notícias e outros conteúdos dinâmicos continuam sendo geridos por suas respectivas fontes, sem que a edição de um texto publique informações pessoais de um torcedor para todos.

## Implementação
1. Criar um catálogo de textos fixos com identificadores estáveis, vinculados às páginas visíveis. Usar a configuração de visibilidade das páginas e as rotas reais do torcedor para montar a seleção; excluir entradas legadas inativas mesmo se estiverem marcadas como visíveis.
2. Criar armazenamento de sobrescritas de conteúdo e estilo, com leitura pública e escrita restrita a administradores/desenvolvedores; manter os valores originais como fallback. Aplicar limites seguros de tamanho, alinhamento e espaçamento para preservar o layout em diferentes telas.
3. Integrar os textos fixos de todas as páginas ativas e suas seções acessíveis ao novo catálogo, começando pelos títulos e subtítulos do exemplo, passando por cartões, instruções e botões. Preservar o comportamento das partes dinâmicas, incluindo nome do torcedor e textos recebidos de outras áreas de gestão.
4. Substituir a lista atual de chaves da aba **Textos** por navegação por página, seções e campos de edição, com ajustes de tipografia/posição, salvar/restaurar e prévia da página selecionada.
5. Testar leitura, gravação, restauração, filtros de páginas e aparência no celular e computador, incluindo cartões com textos longos e sem acesso indevido a dados privados.

## Detalhes técnicos
- A tela atual lista registros de `app_content` que não são consumidos pela página inicial atual; editar uma chave ali pode não alterar a interface. O novo catálogo ligará cada campo à renderização real.
- Estilos serão configurados por texto com valores limitados e responsivos (fonte, alinhamento e espaçamento interno), evitando arrastar elementos por coordenadas absolutas.
- O editor existente de blocos serve a seções configuráveis, mas não cobre a maior parte dos textos fixos das páginas React; não será apresentado como se cobrisse esses textos sem integração explícita.