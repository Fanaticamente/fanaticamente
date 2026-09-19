# Compartilhamento seguro para download do app

## Resultado
- Trocar o endereço técnico por `https://www.fanaticamente.com/baixar` em Copiar e Compartilhar.
- Compartilhar a foto da notícia como anexo, junto do título e da chamada para baixar o aplicativo.
- Criar a página pública `/baixar`, que identifica iPhone ou Android e encaminha à loja correta.
- Manter uma alternativa compatível quando o celular não permitir compartilhar a imagem.

## Detalhes técnicos
- Usar o compartilhamento nativo com arquivo de imagem quando o navegador aceitar `files`.
- Não expor o endereço do banco ou da função na mensagem.
- Em computadores, a página de download exibirá as duas lojas.
- Validar o fluxo e o estado da compilação após as alterações.
