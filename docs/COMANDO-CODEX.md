# COMANDO ÚNICO PARA O CODEX — QUEDAÇO (09/09/2026)

Este arquivo é **auto-suficiente**. Ignore `FILA-QUEDACO.md`, `T-MAPA-IMAGENS.md`,
`T-NPCS.md`, `T-ITEM-MODIFICADO.md` — o conteúdo deles está aqui.

## Como trabalhar

- **Faça a lista inteira de uma vez** (BUGS → T3 → T13). Commit por tarefa, mas **uma
  entrega só no fim**: quando tudo o que dá para fazer sem o Yuri estiver implementado e
  testado, devolva o lote com um resumo do que mudou e os docs para ele subir no GitHub.
- Volte ao Yuri no meio **apenas** para os itens marcados **"PRECISA DO YURI"**.
- `npm test` + `npm run package` verdes antes de fechar. Registrar andamento em
  `docs/CONTINUAR-QUEDACO.md`.
- **Nunca no repositório:** chave de API, a macro de geração do Yuri, imagens do livro.
  O módulo só *referencia* a macro pelo nome (setting) e lê assets por caminho.
- Ambiente: Foundry VTT 13 build 351, sistema `skyfall` 1.0.1. Testes em `tests/` rodam
  sem Foundry (`node --test`).

## Estado atual

- Último commit: `75d6d5b`. O WIP não commitado do Codex (trilha, selo amarelo, CSS de
  janela, troca de logo) fica — **corrigir os bugs abaixo dentro dele** e commitar.
- Dados de consulta já prontos e conferidos: `src/book-world.mjs` (10 regiões, 48
  locais, 5 além), `src/book-monsters.mjs` (44), `src/book-items.mjs` + `src/book-sigils.mjs`
  (214). Não recruzar o livro.

---

# BUGS — corrigir primeiro (regressões desta rodada)

## B1 — Selo amarelo aparece em TODAS as etapas

`src/app.mjs`, `<nav aria-label="Etapas">`: hoje `done ? ✓ verde : ! amarelo`. Todo
passo incompleto — mesmo os **nunca visitados** — mostra "!".

Regra: amarelo **só** em etapa **visitada e incompleta**. Não visitada = **sem selo**.
```
const issues = this.stepIssues(i);
const seen = this.visited.has(i);
// !issues.length && seen -> <span class="sy-done">✓</span>
// issues.length && seen  -> <span class="sy-warning">!</span>
// !seen                  -> (nada)
```
Etapas 3 (Maldição) e 11 (Retrato): `stepIssues` deve retornar algo não-vazio enquanto
`!this.visited.has(i)`, para não virarem ✓ antes de visitadas.

## B2 — Rolagem volta ao topo a cada clique

Causa: `styles/creator.css` agora tem `.sy-creator .window-content{overflow:hidden}` +
`.sy-shell>main{overflow:auto}` + `.sy-layout>main{overflow:auto}` — o container que
rola mudou. Mas `src/app.mjs > rerender()` e `_onRender()` ainda lêem/gravam `scrollTop`
de `.window-content` (que não rola mais → sempre 0) → toda re-render pula pro topo.

Fix: helper `_scroller(){ return this.element?.querySelector?.('.sy-layout>main, .sy-shell>main, .window-content'); }`
e usar `this._scroller()` na captura (`rerender`) e na restauração (`_onRender`).

## B3 — `TypeError: Cannot read properties of null (reading 'insertAdjacentHTML')` ao pôr o mapa

Aparece (2×) quando o Yuri define `quedaco.opathMapImage` e abre a aba Mapa. O único
`insertAdjacentHTML` do código (indicador `.sy-busy`, `app.mjs`) já é `?.`-encadeado —
há outro caminho lendo `null` sem guarda, provavelmente introduzido agora.
Fix: reproduzir, pegar o stack completo no console, guardar o `null`. Preventivo:
`if(!this.element) return;` no topo de `handleClick`, `_onRender`, `rerender`.

## B4 — Caixa de perícia: azul + amarelo ao mesmo tempo

Item selecionado tem borda ciano (`.sy-check-grid label.is-selected`) **e** a grade
ganha contorno amarelo (`.sy-required-grid`). Dois indicadores.
Fix: **manter só o ciano** = "selecionado". Remover o contorno amarelo por-item/na
grade **dentro da tela**; o aviso de etapa pendente fica só no selo do menu esquerdo
(B1). Checkbox: marca pequena, sem caixa colorida competindo com a borda do label.

---

# T3 — Logo (quase pronto)

`assets/quedaco-dragon.png` (256×256, arte do Yuri, pode empacotar) já existe; o `.svg`
já foi apagado. Falta garantir em `src/app.mjs` que as 2 referências de imagem do
`.sy-brand-lockup` apontam para `modules/quedaco/assets/quedaco-dragon.png`. Conferir
`.sy-brand-lockup img{width:54px;height:54px;filter:drop-shadow(...)}` — a PNG já tem
brilho; reduzir/remover o `drop-shadow` se ficar pesado.

---

# T4 — Padrão de imagem nos cartões + botão "Liberar" no canto + cartão de monstro

`src/library.mjs` + `styles/library.css`.

**M1 — faixa de imagem única.** Todos os cartões (regiões, locais, monstros, itens):
faixa **no topo, de canto a canto**, `width:100%`, altura fixa (128px em regiões/locais,
96px em monstros/itens), `object-fit:cover`, `object-position:center`. **Não distorcer**:
imagem vertical é cortada em cima/baixo. Sem imagem → faixa some ou ícone genérico (T5).
Ordem no cartão de local/região: faixa → rótulo pequeno ("Capital"/"Ilha"/…) → nome →
resumo. Classe `.sy-card-figure`.

**M2 — botão "Liberar pros jogadores" pequeno, canto superior direito.** Hoje é botão
largo no rodapé. Trocar por absoluto no canto: `.sy-share-toggle` compacto
(`position:absolute;top:6px;right:6px;width:auto;padding:3px 8px;font-size:11px;
z-index:3;background:#0c1c28cc`). `.sy-library-card` e `.sy-library-detail` viram
`position:relative`. Ligado = verde preenchido; desligado = contorno.

**M7 — cartão de monstro quebrado.** Sintoma: "ND 11 · PlantaÁrvore pregoeira" grudado,
quebrando letra a letra ao lado da miniatura. Fix em `library.css`:
`.sy-library-card summary{display:flex;align-items:center;gap:10px}` ·
`.sy-library-thumb{flex:0 0 44px}` ·
`.sy-library-card summary>span:first-child{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}`
· `small` e `strong` em linhas separadas · `.sy-library-status{flex:0 0 auto}` ·
`.sy-library-grid{grid-template-columns:repeat(auto-fill,minmax(270px,1fr))}`.
Decidir: **faixa no topo (M1) OU miniatura ao lado**, não os dois.

---

# T5 — Itens: tirar "Ataque desarmado" + fallback de imagem

- **"Ataque desarmado"** some da lista de Itens (todo mundo já tem). Filtrar no
  `renderItems` de `library.mjs` (`entry.name !== 'Ataque desarmado'`), **sem** remover
  de `book-items.mjs` (mantém dados e testes).
- **Fallback de imagem por categoria** para itens sem match de compêndio (virotes,
  balas, flechas, tenda, corrente…), com ícones nativos do Foundry (`icons/…`). Mapear:
  weapon → arma; armor → peito; consumable → poção; equipment/loot → mochila;
  munição → flechas; ajustar aos caminhos que existem no build 351. `thumb()` recebe o
  fallback quando `src` vazio. Idem monstros sem Actor casado (`icons/svg/mystery-man.svg`).

---

# T6 — Imagens de região e capital (assets da mesa) + hotspots

**Código** (`src/library.mjs`, `src/app.mjs`, `styles/library.css`):
- Settings: `quedaco.regionImages` (`scope:'world'`, `config:false`, `Object`, `{}`);
  reuso de `quedaco.placeImages` (já existe). Registrar em `registerLibrarySettings`.
- Op `lib-region-img` (igual ao `lib-place-img` que já existe): botão "Definir imagem" /
  "Trocar" / "Remover" também nos cartões e no detalhe de **região**.
- Renderizar as imagens na faixa M1 no índice **e** no detalhe, entre rótulo e nome.
- Nada empacotado — arte do livro é asset da mesa.

**Imagens (PRECISA DO YURI: ele passa os prints do livro das regiões e capitais):**
- O Codex **recorta** cada print na proporção da faixa M1, otimiza (`.webp`/`.jpg`,
  ~1200px de largura) e nomeia pelo id do QUEDAÇO (`huma.webp`, `limsa.webp`, … /
  `foice.webp`, `salim.webp`, …).
- Salvar em **`.local/imagens-mesa/`** (fora do pacote público).
- Escrever `.local/quedaco-importar-imagens.js` — macro que o Yuri roda **uma vez**:
  `FilePicker.upload` de cada arquivo para o armazenamento da mesa e grava
  `quedaco.regionImages` / `quedaco.placeImages` de uma vez. Assim ele não sobe imagem
  por imagem à mão.

**Hotspots:** ajustar os 10 `REGIONS[i].hotspot` (x%,y%) com o mapa real carregado (as
coordenadas atuais são estimativas do Claude).

---

# T7 — NPCs por cidade: vendedores + aliados/rivais/figurantes

Regra dura: **o vendedor nunca cria item solto de Mundo.** Item vendido e "item
tabelado" novo são sempre documento de **compêndio**. O QUEDAÇO **não cria** os Actors
NPC — o Yuri/uma IA cria por fora; o QUEDAÇO lê um flag, edita, mostra e roda a loja.

## Flag no Actor

`actor.flags.quedaco.npc`:
```
{ role: "merchant"|"ally"|"rival"|"extra",
  placeId: "foice",
  active: true,
  shop: { markup: 1, note: "", stock: [ { uuid, price, qty, note } ] } }  // só role merchant
```
`uuid` sempre de compêndio; `price` null → `system.price*markup`; `qty` null → infinito.

## Setting

`quedaco.itemCompendium` (config **visível**, `String`, default `""`): o `collection` do
compêndio onde nascem os "itens tabelados". Vazio → passo desabilitado com aviso.
**PRECISA DO YURI:** ele diz qual compêndio.

## Compartilhamento

`emptyShare()` ganha `npcs: []` (guarda `actor.uuid`). Visibilidade para o jogador:

| role | jogador vê | jogador faz |
|---|---|---|
| merchant | nome, imagem, "Abrir loja" | compra |
| ally / extra | **só nome e imagem** | nada |
| rival | nada, salvo o mestre liberar caso a caso | nada |

Aparece só quando `active === true` **e** `actor.uuid ∈ shared.npcs` **e** (merchant)
`npcs` está em `shared.areas`. Ficha do Actor **sempre** do mestre — o jogador nunca
abre a ficha pelo QUEDAÇO. `Hooks.on('updateActor')` re-renderiza o painel aberto.

## Aba NPCs (`app.mjs > renderArea`, hoje placeholder)

**Mestre:** 4 seções (Mercadores/Aliados/Rivais/Figurantes) listando Actors por
`flags.quedaco.npc.role`. Botão "Marcar um NPC" → seletor de Actors NPC → grava o flag e
abre o editor. Cartão: imagem + nome + local + toggles **Ativo** e **Liberar** (canto
sup. dir., padrão M2), botão **Editar**, e para merchant **Abrir loja (prévia)**.
Editor: `role`, `placeId` (select dos locais), `note`; merchant: `markup` + lista de
estoque (adicionar item do catálogo **só compêndio**, `price`/`qty`/`note`, remover) +
**"Criar item tabelado"**.
**Jogador:** conforme a tabela acima.
**Atalho pela ficha:** `getActorSheetHeaderButtons` (ou equivalente v13) → botão
"QUEDAÇO · NPC" nas fichas com o flag; abre o painel na aba NPCs apontando esse NPC.

## Loja e transação

Cabeçalho: nome, `note`, **bolsa do comprador** (k/p/t de `buyer.system.currency`, via
`wallet`/`walletTotal` de `rules.mjs`). Lista: imagem, nome, preço unitário calculado,
volume, `qty`, campo de quantidade, **Comprar**. `buyer = game.user.character` (senão,
escolher).

`src/adapter.mjs`:
```
export async function purchaseItem(buyer, merchantActor, entry, qty)
```
- Valida `buyer.isOwner`; `qty` inteiro ≥ 1; item existe no compêndio.
- unit = `entry.price ?? Math.round((doc.system.price ?? 0) * (shop.markup ?? 1))`.
- total = `unit*qty` (Trocados). `walletTotal(buyer.system.currency) < total` →
  `throw Error('Moeda insuficiente.')`.
- Debita: `buyer.update({'system.currency': wallet(walletTotal(...) - total)})`.
- Entrega: `buyer.createEmbeddedDocuments('Item', [embeddedSource(doc)])` com
  `system.quantity = qty`. **Nunca** item de Mundo.
- `entry.qty` numérico → `merchantActor.update` decrementando no flag; a 0, some.
- Segurança: roda como o jogador (pode burlar chamando a API). Mesa privada — aceitável
  no MVP; registrar como limite.

## "Criar item tabelado"

Só do mestre, só com `quedaco.itemCompendium`. Campos: nome, categoria do livro (select
das categorias de `book-items.mjs`). Casou nome normalizado → pré-preenche preço/volume
de `book-items.mjs`; senão o mestre digita. Categoria → `type` (conferir schema do
Skyfall): Armas* → weapon; Armaduras e escudos → armor; Vestimentas → clothing;
Consumíveis → consumable; Munição/Equipamentos/Serviços → equipment;
Sigilos/Materiais/Artefatos/Sinapses → loot. `Item.create({name,type,img,system:{price,
volume/…}}, {pack: quedaco.itemCompendium})`. Adiciona ao `stock`.

## Ler as pastas da macro do Yuri (T13 embutido)

A macro cria Actors e organiza em `🤖 Criados pela IA/{NPCs,Monstros,Personagens}` e
`🤖 NPCs por Região/<Região>/<Capital>`. **Pegadinha:** ela faz NPC como
`type:"character"` e monstro como `type:"npc"` (invertido).
- `Hooks.on('createActor')` → re-renderiza o painel aberto.
- A aba NPCs pode listar Actors dessas pastas e, para um em
  `🤖 NPCs por Região/<Região>/<Capital>`, **derivar `placeId`** casando o nome da
  capital com um local do QUEDAÇO (normalizado) e pré-preencher
  `flags.quedaco.npc.placeId`. O Yuri só escolhe `role` e liga `active`.
- Função pura testável: `placeIdFromFolderPath(["🤖 NPCs por Região","Deserto de Mirmir","Kravokia"], PLACES) === 'kravokia'`; desconhecido → `null`.

## Testes

`tests/shop.test.mjs`: `purchaseItem` — saldo suficiente debita e entrega a quantidade
certa; insuficiente lança e não altera nada; estoque finito decrementa; source sempre
com `compendiumSource`. Visibilidade: função pura `{role,active,sharedNpcs}` → o que o
jogador vê, cobrir os 4 papéis. `placeIdFromFolderPath` conforme acima.

---

# T8 — Importar pack de monstros em lote  *(PRECISA DO YURI)*

O Yuri tem documentos de monstro já gerados a inserir. Ele precisa passar **1–2
documentos de exemplo** (o formato salvo) para desenhar o mapeamento dados → schema de
NPC do Skyfall. Sem isso, não implementar. (T12 já cobre gerar 1 sob demanda.)

---

# T9 — Grafo de vínculos entre NPCs

`quedaco.npcLinks` (`scope:'world'`, `Array`, `[]`):
`[ { from, to, type, note } ]` — `type` ∈ pai|mãe|filho|irmão|aliado|conhecido|inimigo.
Familiares direcionais (from = pai/mãe de to); sociais simétricos (dedup a↔b). Alvo
pode ser `"txt:Nome"` para parentes fora da mesa. Posições: `quedaco.npcGraph = { [key]: {x,y} }`.

**Fase 1 (fazer agora):** no editor de NPC, seção "Vínculos" (adicionar `tipo` + alvo,
remover). No cartão do NPC: linha "Filho de X · Inimigo de Y · Aliado de Z". Filtro por
tipo. `tests/npc-graph.test.mjs`: dedup de simétricos, direção em familiares, resumo
textual por NPC.

**Fase 2 (quando o Yuri pedir):** canvas com pan (arrastar fundo) + zoom (roda) via
`transform: translate() scale()`, sem biblioteca. Nós = divs arrastáveis (persiste x,y),
arestas = `<svg>` overlay com `<line>`/`<path>` coloridas por tipo. Paleta lateral com
os NPCs para arrastar. Só do mestre.

---

# T10 — Montar item modificado (calculadora) + explicação de imbuir

**Não cria Item no Foundry** — calculadora + folha de custo. Dados em `book-items.mjs`
(`SIGIL_COSTS`, `IMBUE_COSTS`, `MODIFICATION_GUIDES`, linhas de materiais) e
`book-sigils.mjs` (`SIGILS`).

## Regras (já conferidas — não reinterpretar)

- **Material especial**: 6 materiais, **+T$ 300** fixo. Só em item sem sigilo/fragmento/
  material. Passo 1, sobre o item limpo.
- **Encantar sigilo** = `SIGIL_COSTS[jaPresentes][grau-1]`:
  `[[50,250,900,3500],[75,375,1350,5250],[115,550,2050,7900],[170,850,3050,11900]]`
  (linha = quantos sigilos o item já tem; coluna = grau 1..4). Máx 4 por item, ≤2
  prefixos + ≤2 sufixos (campo `slot`). Escudo aceita sigilo de arma.
- **Imbuir** = `IMBUE_COSTS = [250, 1000, 5000, null]` por grau. `null` no 4º =
  divergência do livro ("T$ 1.2000"): mostrar "a conferir", não somar. Uma vez por
  sigilo; ordem não importa.

## Montador (aba Itens, bloco "Montar item modificado")

Estado em `CampaignLibrary` (`this.modBuilder = {baseUuid, material, sigils:[{sigilId,imbue}]}`),
não em setting. Passos: 1) item base (catálogo só compêndio ou `book-items.mjs`) —
mostra preço/volume; 2) material opcional (+300 + nota do efeito); 3) sigilos de
`SIGILS` filtrados por `equipment` compatível, valida limite 2+2/4, checkbox "imbuir"
por sigilo; 4) **folha de custo linha a linha em PT**, mostrando **qual célula da
tabela** foi usada (nº de sigilos já presentes × grau) — é isso que confunde. Total em
Trocados + K$/P$/T$ via `wallet()`. Botão "Copiar folha" (texto puro).

Exemplo de folha:
```
Item base: Espada longa ........................ T$ 15
Material: Nácar ................................ T$ 300
1º sigilo — Elemental (Fogo), grau 2  (linha 0, col 2) . T$ 250
2º sigilo — +1 (arma), grau 2        (linha 1, col 2) . T$ 375
Imbuir "Elemental (Fogo)" (grau 2) ............. T$ 1.000
─────────────────────────────────────────────────────
TOTAL ......................................... T$ 1.940
```

## Bloco fixo "o que é imbuir" (no montador e onde compra/imbui no fluxo de equipamento)

> **Imbuir** = tornar o encantamento do sigilo **permanente**. Em vez de gastar cargas
> até acabar, o efeito fica sempre disponível (passivo) ou recarrega no descanso longo,
> conforme o sigilo. Custo **fixo por grau**, pago uma vez por sigilo: 1º T$ 250 · 2º
> T$ 1.000 · 3º T$ 5.000 · 4º *a conferir* (o livro imprime "T$ 1.2000"). A ordem não
> altera o preço.

## Teste

`tests/item-mod.test.mjs` — `modifiedItemCost({basePrice, material, sigils})`: material
soma 300; 1º/2º/3º/4º sigilo puxam a linha certa; imbuir soma `IMBUE_COSTS[grau-1]` e
grau 4 não soma (aviso); limite 2+2/4 rejeita a 5ª aplicação e o 3º prefixo.

---

# T11 — Filtros de Monstros por faceta, com caixas de marcar

`src/library.mjs > renderMonsters`. Trocar o `<select>` único por **um `<fieldset>` de
checkboxes por faceta** (mesmo visual `.sy-check-grid`):
- **Tipo de criatura**: valores de `creatureType`.
- **Papel**: `role.split('·')[1]` → Bruto, Defensor, Flanqueador, Líder, Atirador,
  Sentinela, Cavalaria, Coletivo.
- **Porte**: `role.split('·')[0]` → Simples, Complexo, Chefão.
- **Deslocamento**: `terrestrial`/`aquatic`/`aerial` de `MONSTERS[i].movement` (campo
  ainda existe; reativar). Rótulos: Terrestre / Aquático / Aéreo.
- **Nível de Desafio**: ND 1–4 / 5–8 / 9–12 / 13+.
- **Conferência**: Ficha pendente / Encontrado / A conferir.

`data-category` do cartão prefixado por faceta, separado por `|`:
`tipo:Fera|papel:Atirador|papel:Bruto|porte:Complexo|desloc:terrestrial|desloc:aerial|nd:ND 5-8|conf:found`.

Nova função de casamento: um cartão fica visível se, **para cada faceta com algum
checkbox marcado**, o `data-category` contém **pelo menos um** valor marcado daquela
faceta (AND entre facetas, OR dentro). Faceta sem marca = ignorada. A busca por texto
(`libraryQuery`) combina por AND. Contador e "nenhuma entrada" continuam.

`tests/library.test.mjs`: `monsterMatches(entry, {tipo:[],papel:[],porte:[],desloc:[],nd:[],conf:[]})`
— AND entre facetas, OR dentro, faceta vazia ignorada.

---

# T12 — "Gerar um monstro assim" quando o filtro não acha nada

Filtro de T11 com **zero** resultados → bloco:
> Nenhuma ameaça do livro combina com esses filtros.  [ Gerar um monstro assim ]

Botão `data-op="lib-generate-monster"` (GM):
- Setting `quedaco.generatorMacro` (config **visível**, `String`, default
  `"Skyfall — Criador de Conteúdo"`).
- `const m = game.macros.getName(this.game.settings.get(MODULE_ID,'generatorMacro'));
  m ? await m.execute() : ui.notifications.warn("Macro '…' não encontrada. Configure o
  nome em Configurações do Módulo → QUEDAÇO.")`.
- Dica no bloco: "Depois de gerar, clique em Conferir Foundry novamente."
- **Proibido:** embutir a macro, a chave de API ou chamadas à API da Anthropic no
  módulo. Só `macro.execute()` de uma macro que já existe na mesa.
- Teste: só a resolução do nome do setting (fallback para o default) numa função pura.

---

# T14 — Mapa dinâmico (zoom / pan / drill-down)

Detalhe completo + pesquisa das ferramentas de fora em **`docs/T14-MAPA-DINAMICO.md`**.
Fazer **só a FASE 1** (visor único com pan+zoom por ponteiro, pinos de região/cidade em
%, drill-down região→cidade com zoom animado, painel de detalhe do local, breadcrumb,
fallback quando não há imagem). FASE 2 (camadas, polígonos SVG, rotas, névoa, minimapa)
fica para quando o Yuri pedir. Sem biblioteca externa. Testes puros: `clampPan`,
`zoomToPoint`, `focusRegion`.

# T15 — Caixinha "O que mudou" ao atualizar

Detalhe em **`docs/T15-CAIXINHA-DE-NOVIDADES.md`**. `src/changelog.mjs` com `CHANGELOG`
(entrada nova sempre no topo) + `isNewer` + `entriesSince`. No `ready`, se
`lastSeenVersion` (client setting) != versão do módulo, abre um diálogo com as novidades
e grava a versão **ao fechar**. Primeira instalação mostra só a entrada mais recente.
Testes em `tests/changelog.test.mjs`. Adicionar "atualizar CHANGELOG" ao checklist de
release.

# T16 — NPCs: excluir, editar direto, e inferir o local

Detalhe completo em **`docs/T16-NPCS-EDITAR-EXCLUIR-LOCALIZAR.md`**. Resumo:
1. Op `lib-npc-delete` (GM, confirmação DialogV2, `actor.delete()`); botão "Excluir" em
   todo cartão de NPC; nunca para `actor.hasPlayerOwner`.
2. Fim do "marcar ator": cartão de NPC gerado já traz Ativar/Editar/Abrir ficha/Excluir;
   "Editar" adota o flag automaticamente; botão "Adotar todos os detectados"; tirar a
   caixa "Marcar um NPC existente" da vista padrão (mover pra um `<details>` recolhido).
3. `inferPlaceId(actor, places)` em `src/npcs.mjs` — pasta → texto da ficha
   (`system.details.description` p/ `character`, `system.biography` p/ `npc`) → nome do
   ator → null. `adoptNpcFlag(actor)` grava o local inferido só na adoção, nunca
   sobrescreve local manual. Dica "Local sugerido pela ficha" no editor +
   `<select name="npcPlaceFilter">` na aba.
4. Testes de `inferPlaceId`/`adoptNpcFlag`/`stripTags` em `tests/npcs.test.mjs`.

A limpeza das ~200 duplicatas é **comando de console**
(`docs/CONSOLE-LIMPAR-NPCS-DUPLICADOS.md`), **não** entra no módulo.

# B5 — Monstros: miniatura inteira, sem corte

Na aba **Monstros** (`renderMonsters` em `src/library.mjs`), o cartão usa
`cardFigure(...,'compact')` → `.sy-card-figure` com `object-fit:cover` e altura 96–128px,
que **corta** a criatura. Queremos ver o monstro inteiro.

- Nova variante `sy-card-figure-full` só para monstros: `object-fit:contain`,
  `object-position:center`, altura fixa alta (**300px**, ajustar se ficar exagerado),
  fundo escuro (`#0f1620`) sobrando em cima/embaixo. Sem corte.
- Trocar a chamada no `<summary>` do cartão de monstro para
  `cardFigure(entry.matches[0]?.img||'icons/svg/mystery-man.svg', entry.name, 'full')`.
- `cardFigure` passa a aceitar `size='full'`. As outras áreas não mudam.
- Placeholder `mystery-man.svg` continua centralizado (fica pequeno no meio, tudo bem).

# B6 — Filtros de monstro: abrir só ao clicar

`monsterFilters()` renderiza um `<fieldset>` por faceta (Tipo, Papel, Porte,
Deslocamento, ND, Conferência) **todos abertos** → muita caixa, sobrepondo o resto.

- Trocar cada `<fieldset><legend>X</legend>…</fieldset>` por
  `<details class="sy-facet"><summary>X</summary><div class="sy-check-grid">…</div></details>`,
  **fechado** por padrão.
- `.sy-monster-facets` vira uma linha/coluna compacta: cada `<details>` fechado é só o
  rótulo (chip). Aberto, expande os checkboxes abaixo sem empurrar/cobrir os cartões.
- Se alguma faceta tem checkbox marcado, mostrar no `<summary>` a contagem
  (`Papel (2)`) e deixar esse `<details>` aberto ao re-renderizar.
- **Não mexer** nos `<input type="checkbox" name="monsterFacet" data-monster-facet>` nem
  em `filter()` / `monsterMatches` — só o invólucro e o CSS.

# B7 — Itens: voltar para a miniatura pequena

Regressão: `itemCard` passou a usar `cardFigure(...,'compact')` (faixa 96px cortada).
Antes era a miniatura pequena `thumb()` (44px, inline, ao lado do nome) e estava certo.

- No `<summary>` de `itemCard`, remover o `cardFigure(...)` e voltar ao
  `thumb(matches[0]?.img||itemFallback(entry))` dentro do `.sy-card-heading`, antes do
  bloco de nome (como era).
- Só itens. Monstros mantêm a figura (agora `full`, B5). Mapa/NPC inalterados.

# B8 — "Imbuir" como área própria no topo (separar dos Itens)

Hoje o montador de item modificado + a explicação de imbuir vivem **dentro da aba
Itens** (`renderItems` → `this.modifications()`). O Yuri quer isso como **entrada
própria na navegação do topo**, sem misturar com o catálogo de itens.

- `src/app.mjs`: `areaLabels` ganha `imbue:'Imbuir'`; entra na whitelist de
  `sharedAreas` (`['npcs','map','monsters','items','quests','imbue']`) e no dispatch
  `['npcs','map','monsters','items'].includes(this.area)` → incluir `'imbue'`.
- `src/library.mjs`: `render(area)` → `area==='imbue' ? this.renderImbue(readonly) : …`;
  `titles` ganha `imbue:'Imbuir'`.
- Mover o corpo de `this.modifications()` para `renderImbue(readonly)`. A aba **Itens
  deixa de chamar** `this.modifications()`.
- `renderImbue` (GM): montador (item base + material + sigilos), lista de sigilos
  escolhidos com botão Imbuir por sigilo, planilha de custo, bloco "O que é imbuir?",
  e o `<details>` "Consultar regras e tabelas" (SIGIL_COSTS + IMBUE_COSTS). Readonly:
  só o explicador "O que é imbuir?".
- Share toggle próprio: `areas:imbue` ("✓ Aba Imbuir visível aos jogadores").
- Os ops `lib-mod-*` e os handlers `modBase`/`modMaterial` em `app.mjs` continuam
  iguais, só passam a ser exibidos na área nova.
- **PRECISA DO YURI** se "imbuir os fragmentos" for outra mecânica do Skyfall (recurso
  `system.fragments`) e não o imbuir de sigilo do T10 — nesse caso, perguntar antes.

Entrega dos B5–B8 pode ir junto do T16 no mesmo bump (0.4.10).
