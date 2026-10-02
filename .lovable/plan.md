# Abrir páginas sempre no topo

## Resultado
- Toda mudança de página ou endereço interno abrirá no topo, sem herdar a rolagem anterior.
- A seleção de clubes aguardará a lista de profissionais antes de mostrar os times.
- Os clubes com profissionais aparecerão primeiro, em ordem alfabética, e os demais virão depois, também em ordem alfabética.
- Enquanto os dados são preparados, a grade exibirá um carregamento estável; o usuário não verá os clubes mudando de posição.

## Implementação
- Adicionar um controlador global de rolagem aos dois modos de navegação do aplicativo.
- Desativar a restauração automática de rolagem do navegador e reposicionar a janela no topo em cada mudança de rota/endereço.
- Na página de terapeutas, distinguir “dados ainda não carregados” de “nenhum profissional encontrado” e só montar a lista final após a consulta.
- Validar a abertura da seleção de times e a navegação entre páginas no celular.
