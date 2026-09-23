# Sistema visual do painel da Mestra — regras pra não decidir de novo toda vez

> Pedido do Yuri, 23/09/2026: ele viu a tela funcionando e reparou numa bagunça visual —
> rótulo colado no campo, 19 botões coloridos sem hierarquia, cards de tamanhos
> diferentes, e depois (numa segunda rodada, mesmo dia) cards ainda "ligeiramente"
> diferentes, um botão que não precisava mais existir, e um grid que sobrava espaço
> vazio. Ele não é designer e não quer ter que tomar essa decisão de novo a cada tela
> nova. Este documento é a resposta: um punhado de regras pequenas, com o porquê, pra
> qualquer um (humano ou modelo) aplicar sem reabrir essa conversa.

**Antes de escrever CSS novo no painel da Mestra, confira se o problema já tem regra
aqui.** Se tiver, siga-a. Se não tiver e for um padrão novo (não um ajuste de uma tela
só), registre a regra aqui depois.

## O que causou a bagunça — bugs reais, não "gosto pessoal"

Achados lendo o código, não adivinhados pelo print:

1. **Cards de NPC de tamanhos diferentes:** `styles/library.css` tinha DUAS regras pra
   `.sy-npc-tags` (a faixa de selos embaixo do nome). A primeira (commit `4febd86`,
   11/09) limitava a 2 linhas ("mesmo tamanho pra todo card"); a segunda (commit
   `00472be`, um dia depois, sem querer) tirava esse limite de novo. Corrigido:
   restaurado o limite (agora comentado, pra não se perder de novo). Regra geral:
   **numa lista de cards, a faixa que varia de conteúdo (selos, tags) tem altura máxima
   fixa e corta o resto** — nunca deixa o card crescer com o conteúdo.
2. **"Nível de" colado no campo:** o rótulo (`<label>`) é `display:block` por padrão no
   projeto inteiro; texto seguido de `<input>` sem nenhuma margem entre os dois fica
   colado quando cabem na mesma linha. Corrigido com `display:flex;gap:6px` no rótulo.
   Regra geral: **todo par rótulo+campo usa flex com gap explícito, nunca depende de
   espaço em branco no HTML.**
3. **Fileira de papel (Mercador, Ferreiro, Aliado...) misturada com "Filtrar por":**
   os 19 botões de papel + os seletores (Local, Vínculo, Legado...) + o campo de nível
   estavam todos dentro do mesmo bloco "Filtrar por", sem separação visual. Corrigido:
   a fileira de papel virou uma aba própria no topo do painel (mesmo lugar que
   Guildas/Monstros/Itens já usam), separada da grade de filtros propriamente dita.

## As regras, pra seguir daqui pra frente

### 1. Espaçamento — escala de 4/8px, nunca número solto

Baseado no padrão real de sistemas de design (Material, GitLab, etc — ver fontes no
fim). Todo `gap`, `margin`, `padding` novo usa um destes valores: **4, 8, 12, 16, 20,
24, 32px.** Nunca `7px`, `9px`, `13px` só porque "ficou bom". O arquivo já tem muito
número solto de antes — não precisa corrigir tudo de uma vez, mas **todo CSS novo segue
a escala.**

### 2. Rótulo + campo sempre com gap explícito

```css
.minha-secao label{display:flex;flex-direction:column;gap:5px}
/* ou, lado a lado: */
.minha-secao label{display:inline-flex;align-items:center;gap:6px}
```

Nunca `<label>Texto<input></label>` sem uma dessas duas regras — o texto cola no campo
(bug #2 acima).

### 3. Chip/etiqueta: neutro por padrão, cor plena só quando ativo

Um filtro com várias opções (papel do NPC, tipo de monstro, o que for) nunca mostra
todas as opções em cor forte ao mesmo tempo — isso é "19 gritos ao mesmo tempo", não
uma lista. Padrão confirmado pela pesquisa (Material Design 3, "Smart Interface Design
Patterns" — fontes no fim): **cor neutra (cinza) quando não selecionado, cor cheia só
quando selecionado.** Já implementado pra papel de NPC:

```css
.sy-npc-role-tabs button[aria-current="false"] .sy-npc-role{color:#aab8c4}
.sy-npc-role-tabs button[aria-current="page"] .sy-npc-role{color:var(--sy-role)}
```

**Isso só vale pro chip que É o filtro clicável.** O selo de papel que aparece *dentro*
do card do NPC (`npcRoleChip` no corpo do cartão) continua colorido sempre — ali é
informação sobre aquele NPC, não um controle de ligar/desligar. Confirmado com o Yuri
em 23/09/2026 depois de ver a tela: "não tira a cor das tags [do card]".

### 4. Card de lista: altura igual, sempre

Todo grid de cards (`sy-npc-grid`, `sy-guild-grid`, `sy-monster-grid`, `sy-item-grid`)
segue o mesmo desenho: **retrato de tamanho fixo, nome em uma linha só (corta com
"..."), faixa de selos com altura máxima fixa (corta o resto, sem indicador de "+N" por
enquanto).** Nunca deixe uma faixa de conteúdo variável (selos, descrição) crescer sem
limite — é o motivo #1 de "uns cards maiores que os outros" (bug #1 acima). Se o card
precisar mostrar mais informação que cabe, o lugar certo é abrir o editor/detalhe, não
esticar o card da lista.

**A galeria em si precisa esticar os cards, não só limitar o conteúdo interno.**
`.sy-library-grid` (base de todo grid de card) usa `align-items:start` — cada card fica
do tamanho do próprio conteúdo, então dois cards na mesma fileira podem ainda diferir
alguns pixels mesmo com a faixa de selos limitada. Onde altura igual importa de verdade
(hoje: `.sy-npc-grid`), acrescente `align-items:stretch` só naquele grid específico, e
`height:100%` na cadeia de divs até o conteúdo que precisa preencher (senão o grid
estica o card mas o conteúdo interno não acompanha, sobra vazio embaixo sem esticar
retrato/selos — ver `.sy-npc-card .sy-library-card-content`, `.sy-npc-card-grid` em
`styles/library.css`).

### 5. Filtro rápido (tipo aba) fica separado do filtro fino (seletor)

Um filtro clicável de poucas opções (papel, categoria) é uma **aba**, no topo do painel
(`panelHeader({tabs:...})`). Um filtro com muitas opções ou texto livre (local, legado,
faixa de nível) é um **seletor**, dentro de "Filtrar por" (`panelHeader({filters:...})`).
Não misture os dois no mesmo bloco visual — foi o bug #3 acima.

### 6. Contêiner não ocupa mais largura do que o conteúdo pede

Achado do Yuri em 23/09/2026 no painel "Liberar NPCs por localidade": um `display:grid`
sem `grid-template-columns` vira **uma coluna só, largura total** — cada região virava
uma faixa cheia com um bloco de vazio escuro à direita do pouco texto/poucos locais
dela. **"O módulo tá cheio disso"** — provavelmente existe em outras telas ainda não
revistas. Regra: uma lista de blocos curtos (região, card, chip) usa grid responsivo
(`grid-template-columns:repeat(auto-fill,minmax(<largura mínima>,1fr))`, o mesmo padrão
de `.sy-library-grid`) — nunca um grid de coluna única pra conteúdo que não precisa da
largura toda. Corrigido em `.sy-locality-grid`; **o resto do arquivo não foi auditado
ainda** — é candidato a revisão numa próxima passada, não prova de que só existia ali.

### 7. Ação rara/perigosa não fica de botão solto — vira item de um menu, ou some

"Re-taguear todos" sobrescrevia papel/local de NPCs já ajustados à mão — servia só pra
distribuir a mesa uma vez, e ficou de botão permanente por descuido. Removido de vez
(23/09/2026): o Yuri disse "a gente não vai fazer isso mais". As ações de manutenção que
sobraram (sortear nível, taguear o que falta, gerar avulsos) foram de botões soltos
disputando espaço com os filtros para dentro de um menu — `<details class="...-menu">`,
mesmo idioma de disclosure que o resto do painel já usa (`sy-library-guide`), sem JS
novo. Regra: **uma ação que só faz sentido uma vez, ou raramente, não fica no primeiro
plano da tela pra sempre** — ou sai, ou entra num menu que abre sob pedido.

## Ferramenta instalada: Stylelint

O projeto não tem bundler nem framework (é HTML/CSS puro injetado no Foundry) — não dá
pra "instalar Tailwind" ou coisa parecida sem mudar como o módulo é entregue. O que
instalamos é um **linter de CSS**, que só confere o arquivo, sem mudar nada em como ele
é servido:

```powershell
npm run lint:css
```

Ele pega erro real (seletor vazio, cor inválida, propriedade duplicada dentro da mesma
regra). **Não pega** seletor repetido em blocos diferentes do arquivo — essa regra
(`no-duplicate-selectors`) existe e teria pego o bug #1 acima, mas o projeto usa
"reabrir um seletor pra sobrescrever uma propriedade só" como técnica de trabalho normal
(ver `styles/library.css`), então ligá-la sempre dá 25+ avisos que não são bugs. Ela
fica guardada como auditoria manual, pra rodar de vez em quando (não a cada commit):

```powershell
npx stylelint --config .stylelintrc.audit.json styles/*.css
```

Se aparecer um seletor repetido que você não lembra de ter reaberto de propósito, é
provavelmente um bug igual ao #1.

## Fora de escopo por agora — registrado, não decidido

- **Indicador "+N" quando os selos do card não cabem** (em vez de só cortar). Dá pra
  fazer depois; hoje corta sem avisar.
- **Aplicar a escala de espaçamento retroativamente** no resto do arquivo (~2000 linhas
  de CSS já escritas antes desta regra). Não vale a pena reescrever tudo de uma vez;
  vale corrigir a área que for mexida por outro motivo.
- **Um "kit de componentes" formal** (tokens de cor central, mixins) — o projeto é CSS
  puro sem pré-processador; se crescer muito mais, pode valer a pena avaliar um passo de
  build só pra CSS (ex.: PostCSS) — não avaliado ainda, não decida sozinho, é conversa
  de design com o Yuri antes.

## Fontes da pesquisa (23/09/2026)

- [The 8pt Grid: Consistent Spacing in UI Design](https://blog.prototypr.io/the-8pt-grid-consistent-spacing-in-ui-design-with-sketch-577e4f0fd520)
- [Spacing systems & scales in UI design](https://blog.designary.com/p/spacing-systems-and-scales-ui-design)
- [Chips – Material Design 3](https://m3.material.io/components/chips/guidelines)
- [Badges vs. Pills vs. Chips vs. Tags — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/)
- [How to Make CSS Grid Items Equal Height (Without Hacks)](https://snipshift.dev/blog/css-grid-equal-height-items)
- [Problem: Multi-Line Clamp in Dynamically Sized Cards](https://www.educative.io/courses/css-design-patterns/multi-line-clamp-in-dynamically-sized-cards)
