

## Prancheta Emocional — Posições Fixas + Bancos de Reserva

### O que muda

**1. Posições fixas no campo (formação 1-2-3-2-3 = 11 slots)**
- 11 círculos brancos vazios fixos no campo, dispostos numa formação tática como na imagem de referência
- Cada slot tem posição fixa (percentual x/y) — o usuário não toca livremente no campo, apenas clica num slot vazio para preencher com a emoção selecionada
- Ao clicar num slot vazio com uma emoção selecionada, ela "encaixa" ali; clicar num slot preenchido remove a emoção

**2. Dois "bancos de reserva" — Positivas e Negativas**
- Substituir a lista de emoções atual por dois ícones lado a lado representando bancos de estádio (usando SVG inline de bancos/assentos)
- Cada ícone é clicável e abre um dropdown/popover com as emoções do grupo
- **Positivas (11):** Alegre 😄, Eufórico 🤩, Feliz 🙂, Confiante 💪, Empolgado 🎉, Orgulhoso 🏆, Esperançoso ⭐, Grato 🙏, Aliviado 😮‍💨, Inspirado ✨, Motivado 🔥
- **Negativas (11):** Triste 😢, Raiva 😡, Ansioso 😰, Decepcionado 😞, Medo 😨, Irritado 😤, Desanimado 😔, Impaciente ⏳, Frustrado 😤, Inseguro 😟, Envergonhado 😳

**3. Fluxo de uso**
1. Usuário clica num banco (positivo ou negativo) → abre popover com emoções
2. Seleciona uma emoção → popover fecha, emoção fica "na mão"
3. Clica num círculo vazio do campo → emoção encaixa ali
4. Repete até preencher quantos slots quiser (máx 11)

### Detalhes técnicos

- **Formação dos slots** (coordenadas % no viewBox 300x400):
  - GK: (50%, 90%)
  - DEF: (25%, 75%), (75%, 75%)  
  - MID: (20%, 55%), (50%, 50%), (80%, 55%)
  - MID2: (30%, 35%), (70%, 35%)
  - ATK: (20%, 18%), (50%, 12%), (80%, 18%)

- **Componente**: Reescrever `EmotionTacticalBoard.tsx` — remover lógica de click livre, adicionar slots fixos e popovers dos bancos
- **UI dos bancos**: Dois botões lado a lado com ícone SVG de banco de estádio (3 assentos), labels "Positivas" e "Negativas", usando `Popover` do shadcn

### Arquivo editado
- `src/components/diario/EmotionTacticalBoard.tsx` — reescrita completa

