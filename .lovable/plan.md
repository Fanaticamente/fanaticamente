

## Adicionar 3 campos de imagem separados no gerenciador de cursos

Atualmente o curso possui apenas um campo `thumbnail_url` que e reutilizado em diferentes contextos (hero, cards, grid), sendo cortado conforme a proporcao de cada area. A proposta e criar 3 campos de upload independentes, cada um com suas dimensoes recomendadas.

### 1. Criar novas colunas no banco de dados

Adicionar 2 novas colunas na tabela `courses`:
- `hero_image_url` (text, nullable) -- imagem para o hero em destaque (proporcao ~4:5, 800x1000px)
- `grid_image_url` (text, nullable) -- imagem para o grid "Todos os cursos" (proporcao 16:9, 1280x720px)

A coluna `thumbnail_url` existente sera mantida como a imagem principal dos cards horizontais (800x1200px, proporcao 2:3).

### 2. Atualizar o formulario de curso (CourseManager.tsx)

Substituir o campo unico de thumbnail por 3 campos de upload separados:

- **Thumbnail do Curso** -- 800x1200px (2:3, retrato). Usada nos cards horizontais.
- **Imagem Hero** -- 800x1000px (~4:5). Usada na secao em destaque.
- **Imagem Grid** -- 1280x720px (16:9, paisagem). Usada no grid "Todos os cursos".

Cada campo tera seu proprio botao de upload e preview.

### 3. Atualizar as paginas de exibicao (Cursos.tsx e CursoDetalhe.tsx)

- **Hero em destaque**: usar `hero_image_url` (fallback para `thumbnail_url`)
- **Cards horizontais (2:3)**: continuar usando `thumbnail_url`
- **Grid "Todos os cursos" (16:9)**: usar `grid_image_url` (fallback para `thumbnail_url`)
- **Poster do video**: usar `grid_image_url` ou `thumbnail_url` como fallback

### 4. Atualizar tipos e hooks

Atualizar o hook `useCourses.ts` para incluir os novos campos `hero_image_url` e `grid_image_url` nas operacoes de criacao e atualizacao.

### Detalhes tecnicos

- Migration SQL: `ALTER TABLE courses ADD COLUMN hero_image_url text, ADD COLUMN grid_image_url text;`
- Upload usa o bucket `course-assets` existente na pasta `thumbnails/`
- Fallback chain garante compatibilidade com cursos existentes que so possuem `thumbnail_url`

