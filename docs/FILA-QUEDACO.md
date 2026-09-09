# Fila de implementação — QUEDAÇO

Mantida pelo Claude. **Codex implementa; Yuri confirma quando o Codex perguntar.**
Uma tarefa por vez, `npm test` + `npm run package` antes de dar por pronta, registrar
resultado. Não editar Actors oficiais. Não publicar versão antiga.

Estado de referência: commit `75d6d5b` + o WIP não commitado do Codex (finalize de
trilha, fallback de path em `benefits.mjs`, CSS de janela, testes novos).

---

## T1 — Trilha no nível 2 (e no 7) tem que ser ESCOLHA visível, não "automático"

**Sintoma (Yuri):** no passo Progressão, o nível 2 mostra "auto · Escolha de trilha".
Parece que o sistema escolheu sozinho. A pessoa tem que **escolher** a trilha ali, e
pode ser **qualquer uma** (o autor do Skyfall confirmou: Especialista não fica preso a
trilha especializada). O mesmo vale para o nível 7 ("trilha avançada ou segunda trilha").

**Diagnóstico:** o grupo de escolha existe (o fallback em `benefits.mjs` cria um grupo
`granting:'path'` em `atLevel` 2 e 7, e `populate()` enche com `catalog.list('path')` —
todas as trilhas, sem filtro por classe). O problema é só de apresentação: em
`app.mjs > renderBenefits > levelBlocks`, o texto de `classProgression` para o nível 2
é `"Escolha de trilha"` (de `progression.mjs > shared`), e ele é renderizado como
`autoLine` com o selo **"auto"** — mesmo tendo o grid de escolha logo abaixo.

**Fix (em `app.mjs`, dentro de `renderBenefits > levelBlocks`):**

1. Quando o nível tem um grupo de escolha (`gs.length`), **não** renderizar a `autoLine`
   com selo "auto" para a feature daquele nível. Em vez disso, mostrar o texto da
   feature como subtítulo simples no `.sy-level-head` (contexto, sem afirmar automação).
   Regra concreta: `const showAutoTag = !gs.length;` — a `autoLine` com `<span class="sy-tag-auto">`
   só quando **não** há grupo no nível; havendo grupo, o `feat` vira
   `<small>` ao lado do `<h3>Nível N</h3>`.
2. Garantir que o grupo `granting:'path'` do nível 2/7 sempre apareça como grid de
   escolha (`renderGroup`). Se `group.options` vier vazio, já existe o alerta "Nenhuma
   trilha acessível…" — manter.
3. **Não** filtrar trilhas por classe em `populate()` (`granting:'path'`). Qualquer
   trilha é válida. Já está assim; não mudar.

**Nível 7 — regra do livro:** "avançar a trilha do nível 2" **ou** "escolher uma 2ª
trilha". Versão aceitável agora: o grupo do nível 7 lista todas as trilhas; escolher a
**mesma** do nível 2 = trilha avançada, escolher **outra** = segunda trilha. O
`finalizePathProgression` já precisa lidar com a mesma trilha ocupando `path-01` e
`path-02` (o WIP do Codex trata isso — manter). Rótulo do grupo no 7:
"Trilha avançada (mesma do nível 2) ou segunda trilha".

**Teste:** adicionar caso em `tests/benefits.test.mjs` que monte um plano nível 2 e
nível 7 e verifique que existe um `group` com `granting:'path'` em `atLevel` 2 e 7, com
`options.length > 0` e `count === 1`.

**Conferir no Foundry:** criar Especialista nível 2 → o nível 2 mostra o grid de
trilhas com "Escolher", sem selo "auto". Criar nível 7 → aparece o 2º grupo de trilha.

---

## T2 — Menu superior de abas (`.sy-area-nav`) está escondendo opções; deixar fixo

**Sintoma (Yuri):** nas abas Mapa / Monstros / Itens o menu superior corta as opções.
Em NPCs fica certo. Voltar para Mapa quebra de novo.

**Diagnóstico:** `.sy-shell` é `display:flex; flex-direction:column`. `.sy-layout` e
`.sy-shell > main` têm `flex:1`. O `<header>` e o `<div class="sy-area-nav">` **não têm
`flex-shrink:0`**, então quando o conteúdo é alto (bibliotecas, sem `min-height`) eles
são comprimidos; a `.sy-area-nav` tem `overflow:auto` e passa a **clipar os botões**.
Em NPCs o `renderArea` usa `.sy-empty-area{min-height:540px}`, que empurra o shell para
além da janela e os irmãos mantêm a altura natural — por isso lá "fica certo".

**Fix (em `styles/creator.css`):**

1. `.sy-creator header{flex:0 0 auto}` e `.sy-creator .sy-area-nav{flex:0 0 auto}`.
2. Deixar a barra fixa como o Yuri pediu:
   `.sy-creator .sy-area-nav{position:sticky; top:0; z-index:15; background:#111116}`
   (e, se o header também tiver que ficar visível na rolagem,
   `.sy-creator header{position:sticky; top:0; z-index:16; background:#111116}`).
3. Garantir que a rolagem aconteça **dentro** do `main`:
   `.sy-creator .sy-shell > main{overflow:auto}` (já há `.sy-shell>main{flex:1}` —
   acrescentar `overflow:auto`). Assim o cabeçalho + abas ficam parados e só o conteúdo
   rola.
4. Dar uma `min-height` consistente às áreas de biblioteca para não colapsarem:
   `.sy-creator .sy-library{min-height:100%}` (ou `flex:1` no `<main class="sy-library">`,
   que já herda de `.sy-shell>main`).

**Conferir no Foundry:** abrir Mapa/Monstros/Itens/NPCs e alternar — a fileira
`Criação de Personagens · NPCs · Mapa · Monstros · Itens · Quests` fica inteira,
visível e parada no topo em todas.

---

## T3 — Logo do jogo no cabeçalho  *(pronto p/ Codex)*

Claude extraiu a logo do PDF `Logo Quedaço com dragão.pdf` (emblema de dragão azul,
fundo transparente, arte do próprio Yuri — "FEITO POR YURI SATÉLITE" no PDF, então pode
ir empacotada). Arquivo já em **`assets/quedaco-dragon.png`** (256×256 RGBA, ~86 KB).

**Codex faz:**

1. Em `src/app.mjs`, trocar as **duas** ocorrências de
   `modules/quedaco/assets/quedaco-dragon.svg` por
   `modules/quedaco/assets/quedaco-dragon.png` (no `<img>` do `.sy-brand-lockup`, nos
   dois ramos de `_renderHTML`).
2. Apagar `assets/quedaco-dragon.svg` (não é mais usado).
3. Conferir `styles/creator.css` `.sy-creator .sy-brand-lockup img{width:54px;height:54px;
   filter:drop-shadow(0 0 8px #1fb8de66)}` — a PNG já tem brilho próprio; se ficar
   pesado, reduzir/remover o `drop-shadow`. Manter 54×54.
4. `npm test` + `npm run package`. Conferir no Foundry que a logo aparece no cabeçalho
   do painel.

Versão em alta (2216×2206) fica com o Yuri para outros usos; não vai no módulo.

---

## Fora do módulo — limpeza do banco de itens da mesa (dados, não código)

Auditoria rodada por Yuri (`quedaco-itens-fora-do-canonico.json`):

- **1368 itens fora do compêndio canônico**, em **226 Actors**.
- **1354 são "item de Mundo" (sem compêndio)** — **não há um compêndio duplicado rogue**;
  o que existe é item solto criado direto nas fichas. 14 têm origem `Item.xxx` (cópias).
- **1134 têm equivalente canônico** por tipo+nome (troca segura).
- **234 (≈200 distintos) não têm equivalente** — são os itens autorais/gerados por IA
  (poções, pergaminhos, "Capa Militar de Vael", "Criar novo(a) Trilha", etc.).
- Boa parte dos 226 Actors são **NPCs/monstros/montarias**, não personagens de jogador
  (o filtro `type === 'character'` do macro pega tudo que é ficha tipo personagem nesse
  mundo). Ex.: "Draft Horse A1 Beast 01", "Rakshasa A1 Fiend 01", "Default Item Pile".

**Plano faseado (macros rodados por Yuri, com dry-run; não é mudança no módulo):**

- **Fase A — trocar os 1134 com equivalente** pelo item canônico, preservando
  quantidade e "equipado". Rodar primeiro só nos **personagens de jogador reais**
  (lista curta que o Yuri indicar), conferir, depois estender.
- **Fase B — os ~200 sem equivalente:** Yuri revê a lista; os que valem a pena viram
  Item **no compêndio canônico** com **preço e volume tabelados** de `src/book-items.mjs`
  quando existir referência, ou definidos por ele; as cópias soltas passam a apontar
  para o novo item ou são removidas.
- **Fase C — não há compêndio para renomear/excluir.** O que sobra é impedir novos
  itens soltos: a compra do vendedor (T-Vendedor) sempre cria/entrega itens do
  compêndio canônico, nunca soltos.

Próximo passo aqui: Yuri escolhe se quer o macro da Fase A já, e para quais fichas.

---

## BUGS URGENTES (regressões da rodada do Codex — antes de features novas)

### B1 — Selo amarelo aparece em TODAS as etapas

`app.mjs` nav das etapas: `done ? ✓ : "!"`. Todo passo incompleto — mesmo os que a
pessoa **nunca visitou** — mostra "!" amarelo.

Regra pedida pelo Yuri: amarelo **só** quando a pessoa passou pela etapa e ela
continua incompleta. Etapa não visitada = **sem selo**.

Fix (no `.map` da `<nav aria-label="Etapas">`):
```
const issues = this.stepIssues(i);
const seen = this.visited.has(i);
// !issues.length && seen  -> <span class="sy-done">✓</span>
// issues.length && seen   -> <span class="sy-warning">!</span>
// !seen                   -> nenhum selo
```
Etapas 3 (Maldição) e 11 (Retrato e token): `stepIssues` deve devolver algo não-vazio
enquanto `!this.visited.has(i)`, para não virarem ✓ antes de visitadas; depois de
visitadas, sem issue → ✓.

### B2 — Rolagem volta ao topo a cada clique (Progressão e qualquer lista)

Causa: o Codex mudou o container de rolagem — `styles/creator.css`:
`.sy-creator .window-content{overflow:hidden}` + `.sy-shell>main{overflow:auto}` +
`.sy-layout>main{overflow:auto}`. Mas `app.mjs > rerender()` e `_onRender()` continuam
lendo/gravando `scrollTop` de **`.window-content`**, que agora não rola (fica sempre 0).
Toda re-renderização restaura 0 → pula pro topo.

Fix: `rerender()` e `_onRender()` salvam/restauram a rolagem do **elemento que
realmente rola**. Adicionar um helper:
```
_scroller(){ return this.element?.querySelector?.('.sy-layout>main, .sy-shell>main, .window-content'); }
```
e trocar `content` por `this._scroller()` na captura (rerender) e na restauração
(_onRender). Manter `.window-content` só como último fallback.

### B3 — `TypeError: Cannot read properties of null (reading 'insertAdjacentHTML')` ao pôr o mapa

Aparece (2×) quando o Yuri define a imagem do mapa e abre a aba Mapa.

O único `insertAdjacentHTML` do código (`app.mjs`, indicador `.sy-busy`) já é
`?.`-encadeado — então há um caminho onde `this.element` ou o alvo está `null` **sem
guarda**, provavelmente introduzido nesta rodada.

Fix: reproduzir (definir `quedaco.opathMapImage`, abrir Mapa), pegar o **stack trace
completo** no console, e guardar o `null`. Preventivo: no início de `handleClick`,
`_onRender` e `rerender`, `if(!this.element) return;`. Conferir também qualquer código
novo de render do mapa/pinos que injete DOM.

### B4 — Caixa de seleção de perícia: azul + amarelo ao mesmo tempo

Na tela de Perícias, o item selecionado tem borda ciano (`.sy-check-grid label.is-selected`)
e a grade inteira ganha contorno amarelo (`.sy-required-grid`) quando a etapa está
pendente. Dois indicadores concorrentes.

Decisão: **manter só o ciano** como "selecionado" (borda + fundo do label). Remover o
contorno amarelo por-item / na grade **dentro da tela**; o aviso de "etapa pendente"
fica só no selo da etapa no menu esquerdo (B1). Checkbox: marca pequena, sem caixa
colorida competindo com a borda do label.

---

## T4 — Cartão de monstro quebrado + padrão de imagem + botão liberar no canto

Detalhe em **`docs/T-MAPA-IMAGENS.md`** (M1, M2, M7). Resumo:

- **M7:** consertar o `summary` do cartão de monstro (texto grudando/quebrando letra a
  letra ao lado da miniatura). CSS em `library.css`.
- **M1:** um padrão único de faixa de imagem no topo de todo cartão (regiões, locais,
  monstros, itens): 100% de largura, altura fixa, `object-fit:cover`, sem distorcer;
  vertical é cortada em cima/baixo.
- **M2:** "Liberar pros jogadores" vira botão **pequeno no canto superior direito** do
  cartão/detalhe, não mais botão largo no rodapé.

## T5 — Itens: tirar "Ataque desarmado" + fallback de imagem

- **"Ataque desarmado"** some da lista de Itens (todo mundo já tem). Filtrar no
  `renderItems` de `library.mjs` (`entry.name !== 'Ataque desarmado'`), **sem** remover
  do `book-items.mjs` (mantém dados e testes). Idem se aparecer em outras listas de
  consulta.
- Itens sem imagem (virotes de besta, balas de funda, flechas, tenda, corrente…):
  fallback por categoria com ícones nativos do Foundry — ver **M5** em
  `docs/T-MAPA-IMAGENS.md`.

## T6 — Imagens de região/capital + mapa (assets da mesa)

Detalhe em **`docs/T-MAPA-IMAGENS.md`** (M1, M3, M4).

- **Código:** settings `quedaco.regionImages` + reuso de `quedaco.placeImages`; op
  `lib-region-img` (botão "Definir imagem" também nos cartões/detalhe de **região**,
  igual ao que já existe para local); faixa de imagem padrão M1 (canto a canto, altura
  fixa, `object-fit:cover`, corta vertical em cima/baixo) no índice **e** no detalhe,
  entre o rótulo e o nome; botão "Liberar" pequeno no canto superior direito (M2).
- **Imagens (Yuri fornece os prints do livro):** o Codex **recorta** cada print de
  região e de capital na proporção da faixa M1, otimiza (`.webp` ou `.jpg`, ~1200px de
  largura) e nomeia pelo id do QUEDAÇO (`huma.webp`, `limsa.webp`… / `foice.webp`,
  `salim.webp`…). Como **não podem** ir no ZIP público, salvar em
  **`.local/imagens-mesa/`** (fora do pacote) e escrever um macro
  `.local/quedaco-importar-imagens.js` que o Yuri roda **uma vez**: faz `FilePicker.upload`
  de cada arquivo para o armazenamento da mesa e grava `quedaco.regionImages` /
  `quedaco.placeImages` de uma vez. Assim ele não sobe imagem por imagem à mão.
- Ajuste dos 10 `hotspot` das regiões com o mapa real (estimativas hoje).

## T7 — NPCs por cidade + vendedores + aliados/rivais/figurantes

Detalhe em **`docs/T-NPCS.md`** (substitui `T-VENDEDOR.md`). Resumo:

- Flag `actor.flags.quedaco.npc = { role, placeId, active, shop:{markup,note,stock} }`.
  `role` = merchant | ally | rival | extra.
- Aba NPCs com as 4 seções; o mestre marca Actors existentes, define papel, local,
  liga/desliga `active` conforme o grupo anda pelas cidades.
- Jogador (quando liberado + `active`): merchant → nome/imagem/**loja com compra**;
  ally/extra → **só nome e imagem**; rival → só se o mestre liberar. Ficha sempre do
  mestre.
- Loja + `purchaseItem` em `adapter.mjs` (desconta k/p/t, entrega item de compêndio).
- "Criar item tabelado" → cria no `quedaco.itemCompendium`, nunca solto de Mundo.
- **M6** (em `T-MAPA-IMAGENS.md`): o local mostra seus NPCs e as ameaças ligadas
  (`quedaco.placeMonsters`).

Ordem: **depois de T1, T2, T4.**

## T9 — Grafo de vínculos entre NPCs (família + aliado/conhecido/inimigo)

Detalhe em **`docs/T-NPCS.md` → "Vínculos entre NPCs"**. Resumo:

- Setting `quedaco.npcLinks` = lista de arestas `{from, to, type, note}` (familiares
  direcionais, sociais simétricos; `txt:` para parentes fora da mesa).
- **Fase 1** (barato): editor de vínculos no NPC + resumo textual no cartão
  ("Filho de X · Inimigo de Y…"). Depois de T7.
- **Fase 2** (quando Yuri pedir): canvas com pan/zoom, nós arrastáveis
  (`quedaco.npcGraph` guarda x,y), arestas em SVG coloridas por tipo.

## T11 — Filtros de Monstros por faceta (checkboxes combináveis)

Detalhe em **`docs/COMANDO-CODEX.md` → T11**. Um `<fieldset>` de checkboxes por faceta
(Tipo, Papel, Porte, Deslocamento, ND, Conferência); AND entre facetas, OR dentro.
`data-category` prefixado por faceta; nova função de casamento + teste.

## T12 — "Gerar um monstro assim" (filtro sem resultado → macro do mestre)

Detalhe em **`docs/COMANDO-CODEX.md` → T12**. Setting `quedaco.generatorMacro` (nome da
macro do Yuri). Botão só executa `game.macros.getName(nome).execute()`. **Nunca**
embutir a macro, a chave de API ou chamadas à API no módulo.

## T10 — Montar item modificado + explicação de imbuir

Detalhe em **`docs/T-ITEM-MODIFICADO.md`**. Calculadora de custo (material +T$300;
`SIGIL_COSTS[jaPresentes][grau-1]`; `IMBUE_COSTS[grau-1]`, grau 4 = "a conferir";
limite 2+2/4) + folha explicando cada célula da tabela usada + bloco fixo
"o que é imbuir". Não cria Item no Foundry no MVP.

## T13 — Integração com a macro de geração (pegar e receber)

Detalhe em **`docs/COMANDO-CODEX.md` → T13**. O QUEDAÇO chama a macro por nome e lê os
**Actors** que ela cria (nunca o JSON dela). `Hooks.on('createActor'/'updateActor')`
re-renderiza o painel; aba NPCs lê as pastas `🤖 Criados pela IA` e `🤖 NPCs por Região`
e deriva `placeId` da pasta da capital. Cuidado: a macro faz NPC como `type:"character"`
e monstro como `type:"npc"` (invertido).

## T8 — Importar pack de monstros como fichas Skyfall  *(precisa do Yuri)*

Yuri tem um macro que gera fichas de ameaça no formato Skyfall e vários documentos de
monstros a inserir. Quer um fluxo no QUEDAÇO para importar isso em lote como Actors
(ou como Items num compêndio) já formatados.

**Bloqueio:** preciso do **macro** e de **1–2 documentos de exemplo** (o formato dos
dados) para desenhar o importador. Sem isso, não dá para especificar o mapeamento
dados → schema de NPC do Skyfall. Registrar a pergunta; não implementar às cegas.
