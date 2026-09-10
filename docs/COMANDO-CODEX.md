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

---

# LOTE ATUAL PARA O CODEX — T17–T29 + B9–B10 (enviado 09/09/2026)

Codex já entregou T14, T15, T16, B5–B8 e a área de Quests (0.4.11). Este lote é o
próximo. Ordem sugerida: B9–B10 (rápidos) → T20/T21/T22/T23/T24 (aba NPCs) →
T17/T18/T19 (mapa) → T25/T26/T29 (cobertura + tokens + mercador) → T28 (forja) →
T27 (logo). Entregar em um bump só quando der, com changelog.

Contexto: Codex já entregou T14, T15, T16, B5–B8 e a área de Quests (0.4.10–0.4.11).
Estes são ajustes em cima disso.

## T17 — Mapa: mover a posição dos pinos (GM)

Sintoma: "castelete da Tora Furada" aparece longe de Maruma (posição errada). Os
`hotspot` das regiões estão fixos em `src/book-world.mjs` e locais não têm hotspot
próprio (são calculados em `placeMarkerPosition`).

- Setting `world` novo `quedaco.mapHotspots` = `{regions:{<id>:[x,y]}, places:{<id>:[x,y]}}`
  (x,y em %).
- Botão "Mover pinos" no `.sy-map-controls` (só GM): liga um modo em que cada
  `.sy-map-marker` fica arrastável (pointerdown/move/up já existem no viewport — só
  interceptar quando o alvo é um marcador e o modo está ligado). Ao soltar, grava
  `[x,y]` no setting. Botão "Voltar ao padrão do livro" limpa o override daquele pino.
- `renderDynamicMap`: posição do pino = `mapHotspots.regions[id]` ?? `region.hotspot`;
  para locais = `mapHotspots.places[id]` ?? `placeMarkerPosition(...)`.
- Função pura `resolveHotspot(overrides, kind, id, fallback)` + teste.

## T18 — Mapa: camadas de pino, zoom e "liberar todos"

- **Zoom controla a camada:** com `scale` abaixo de um limiar (ex. 1.6) e sem `focus`,
  mostrar só pinos de **região**; acima do limiar, mostrar também pinos de **cidade**
  (de todas as regiões, posicionados por `mapHotspots.places`/`placeMarkerPosition`).
  Hoje cidade só aparece com região focada — manter esse caminho e somar o do zoom.
- **Botões de camada** no `.sy-map-controls`: `Regiões` · `Cidades` · `Tudo`
  (`this.state.map.layer`, default `auto`). Escolha manual sobrepõe o automático.
- **Liberar em massa** na faixa de compartilhamento do GM:
  `Liberar todas as regiões` e `Liberar tudo (regiões + cidades)` → chamam
  `setShare('map', id)` em lote; e `Recolher tudo` para desfazer.

## T19 — Imagens de mapa a partir da arte do livro (encanamento; NÃO commitar imagem)

O Yuri tem os prints do livro e quer usá-los como fundo de mapa/região/local.
**Regra CLAUDE.md #2: nenhuma imagem do livro entra no repositório.** O Yuri põe os
arquivos numa pasta do armazenamento da mesa; o módulo resolve por convenção.

- Implementar o descrito em `docs/IMAGENS-E-BANCO-DE-DADOS.md` (Opção A + B):
  - setting `quedaco.assetRoot` (caminho da pasta, escolhido uma vez, `FilePicker`
    tipo folder).
  - `resolveImage(kind, idOuNome)` — precedência: `quedaco-imagens.json` (exceções) →
    arquivo por convenção `<root>/<kind>/<slug>.{webp,png,jpg,svg}` → imagem do
    documento no Foundry → ícone padrão da categoria.
  - `regionImages`/`placeImages` e as figuras de monstro/NPC/item/quest usam
    `resolveImage` como fallback quando não há caminho explícito no setting.
  - Painel de ajuda no Mapa: "Coloque seus arquivos em `<root>/regioes/<id>.webp`,
    `<root>/locais/<id>.webp`…" listando os `id`s.
- Testes: precedência de `resolveImage` + geração de slug (sem acento, minúsculo,
  espaço→`-`).

## B9 — Checkbox de faceta de monstro com visual quebrado

Ao marcar uma faceta (ex. Deslocamento → "Terrestre"), a caixinha fica **amarela com um
quadradinho azul por cima**, parecendo estado de erro.

- O estado marcado tem que ser um controle único e limpo, **igual ao das checkboxes da
  criação de personagem**: preenchimento ciano, sem amarelo, sem indicador duplicado,
  sem contorno de "inválido".
- Verificar se `.sy-creator .sy-monster-facets input` (styles/library.css) está
  brigando com `.sy-creator .sy-check-grid input{appearance:none!important…}`
  (styles/creator.css) — consolidar numa regra só. Conferir no Foundry 13, tema claro
  e escuro.

## B10 — Imagens das quests cortadas

`renderQuests` usa `cardFigure(quest.image||'icons/svg/book.svg', quest.name, 'compact')`
(faixa 96px com `object-fit:cover` → corta a arte).

- Trocar para `'full'` (contain, com espaço sobrando em cima/embaixo) como os monstros,
  ou uma faixa `contain` ~220px específica de quest. O Yuri quer ver a arte inteira.
- Quando `quest.image` é inválida/quebrada, cair no `icons/svg/book.svg` sem mostrar
  imagem quebrada.

## T20 — Aba NPCs: remover adoção, sempre ativo, cartão enxuto, arrastar token

Decisões do Yuri (respostas às pendências):

### 20.1 — Fim de "adotar" e de "detectado"
- **Todo** ator que passa em `isGeneratedNpc(actor)` (ou está nas pastas `🤖`) aparece
  direto na grade de NPCs. **Sem** seção "Detectados nas pastas da macro", **sem**
  botão "Adotar todos", **sem** `lib-npc-adopt-all`.
- O flag `flags.quedaco.npc` **não é mais pré-gravado**. Papel/local/nota/loja/vínculos
  são lidos com fallback em memória: `const flag = npcFlag(actor) ?? adoptNpcFlag(actor)`
  na hora de renderizar/editar. O flag só é **persistido quando o GM salva algo**
  (`saveNpc`, aceitar local sugerido, adicionar vínculo/estoque). `markNpc` e
  `lib-npc-adopt-all` saem.
- `renderNpcs`: uma única lista `all = this.npcActors()` (não separar `marked`/`detected`).

### 20.2 — Sempre ativo
- Remover o conceito Ativo/Inativo: sai o campo `active` do flag, o selo
  "· Ativo/· Inativo" no cartão, o botão `Ativar/Desativar` e o op `lib-npc-active`.
- Visibilidade para o jogador passa a depender **só** do botão "Liberar"
  (`shareButton('npcs', actor.uuid, …)`). Ajustar `npcVisibility` para não exigir
  `active` (só `shared` + `role`).

### 20.3 — Cartão enxuto
- O cartão de NPC não tem faixa de imagem grande. Usar **avatar pequeno**
  (`thumb(actor.img)` 44px, ou `icons/svg/mystery-man.svg`) ao lado do nome, no estilo
  do cartão de item. Nada de `cardFigure(...,'compact')` aqui.
- Linha de ações compacta: **Editar** · **Abrir ficha** + ícone 🗑 pequeno no canto
  (`aria-label="Excluir NPC"`, `.sy-danger`, posicionado como `.sy-help`; escondido se
  `actor.hasPlayerOwner`). Nada de botão "Excluir" de texto na linha.
- Os `<select>` "Filtrar por local" e "Filtrar por vínculo" estão ocupando a linha
  inteira. Deixar **inline e estreitos** (largura automática / `max-width: 220px`),
  lado a lado com os botões de papel, não como blocos full-width.

### 20.4 — Editar abre de fato, sem pulo de scroll, e dá para não editar
- Clicar **Editar** tem que mostrar o editor. Como o flag agora não é gravado na hora,
  `renderNpcEditor` deve renderizar sempre que houver `this.state.npcActor` resolvendo
  para um ator (usar `npcFlag(actor) ?? adoptNpcFlag(actor)`).
- Sem pulo para o topo no re-render (reaproveitar `_scroller`); depois de renderizar,
  rolar `[data-npc-editor]` para a vista. Idealmente o editor sai logo **abaixo do
  cartão clicado**, não no topo da aba.
- O editor **começa fechado**; ninguém é forçado a editar. Botão **"Fechar edição"**
  (`this.state.npcActor=null`) no topo do editor.
- Ficar claro **qual** NPC está em edição: destacar o cartão correspondente
  (`.is-editing`, borda ciano) enquanto o editor está aberto.
- Ao salvar (`saveNpc` etc.), aviso curto `ui.notifications.info('NPC atualizado.')` e
  um `✓ salvo` que some sozinho — hoje não dá para perceber que algo mudou.

### 20.5 — Arrastar para a cena e para módulos (NPC, monstro, item, quest-giver)
- Todo cartão arrastável: `draggable="true"` + `dragstart` →
  `event.dataTransfer.setData('text/plain', JSON.stringify(payload))`.
  - NPC / monstro (com `matches[0]?.uuid`) / quest-giver que resolve para Actor →
    `{type:'Actor', uuid}`.
  - Cartão de **item** (aba Itens) e estoque de loja → `{type:'Item', uuid}` quando há
    `matches[0]?.uuid` de compêndio.
- Esse payload já serve para: canvas (cria token), ficha de personagem (adiciona item) e
  os módulos de diálogo/conversa que aceitam drop de Actor/Item (ex. Monk's Enhanced
  Journal). Não precisa de integração específica — só emitir o drag-data padrão.
- Dica de UI: cursor `grab` + `title="Arraste para a cena, ficha ou diálogo"`.
- **Permissão:** ao gerar/editar NPC, opção (checkbox no editor, default ligado)
  "jogadores podem ver o token" → grava `ownership.default = 1` (LIMITED) no Actor, para
  o token arrastado ser utilizável pelos jogadores. Nunca rebaixar dono existente.

### 20.6 — Redesenho do cartão (remontar)
Print do Yuri: tag de cor pequena demais, 🗑 em cima do avatar, layout bagunçado.
- Grid limpo: `[avatar 40px] [ nome / linha-meta ] [ações à direita ]`. `min-height`
  fixo, `gap` consistente. 🗑 **pequeno, canto superior direito**, nunca sobre o avatar.
- **Cor da região = detalhe, não enfeite** (ver T22): borda-esquerda de 3px na cor da
  região no cartão inteiro **ou** um ponto/ône de 8px antes do nome do local na
  linha-meta. Nada de faixa grande nem fundo colorido.
- **Local vs região tem contorno diferente:**
  - NPC de **cidade** (`placeId`): borda sólida fina na cor da região.
  - NPC **errante/da região** (`regionId`, sem `placeId`): borda **tracejada** na cor
    da região + rótulo "· errante".
  - Sem local: sem borda colorida.
- "Dinâmico, sem colorir demais": a cor vem sempre do dado (folder/paleta), aplicada só
  como borda/ponto; o resto do cartão continua no tema escuro padrão.
- Linha-meta: `«ícone do papel» Papel · «ponto» Local` (o ícone do papel é o T21).

### 20.7 — Testes
- `npcVisibility` sem `active`: `{role:'merchant', shared:true}` → `'shop'`;
  `{role:'ally', shared:false}` → `false`.
- `adoptNpcFlag` continua puro e **não** grava nada.
- Cartão de NPC contém `draggable="true"` e o `uuid` no HTML; cartão de item idem.
- Helper `npcCardOutline(flag)` → `'city' | 'itinerant' | 'none'` + teste.

## T21 — Papéis de NPC com ícone + cor (fácil de bater o olho)

As tags Mercador/Aliado/Rival/Figurante são texto liso, tudo igual. Dar a cada papel
**ícone + cor própria**, como chip:
- **Mercador** — moeda/balança, dourado.
- **Aliado** — escudo/aperto de mão, verde.
- **Rival** — espadas cruzadas, vermelho.
- **Figurante** — máscara/silhueta, cinza.
Usar ícone Font Awesome que o Foundry já carrega (`fa-solid fa-coins`, `fa-shield-halved`,
`fa-swords`… confirmar nomes disponíveis na versão) ou um SVG inline pequeno. Aplicar no
cartão de NPC, no editor e no filtro de papel. Mapa `NPC_ROLE_STYLE = {merchant:{icon,color}…}`.

## T22 — Cor da região (bater com as pastas do Foundry)

As pastas de Ator por região têm cor no Foundry (Deserto de Mirmir amarelo, Lim'Sa roxo,
Norvak azul, Tatsumari rosa…). Quero ver essa cor no QUEDAÇO.
- Ler a cor real: para cada região, achar a `Folder` de Ator com o nome da região
  (`game.folders.filter(f=>f.type==='Actor')`) e pegar `folder.color`. Fallback: paleta
  fixa por `regionId` em `book-world.mjs` (`REGIONS[i].color`), que o Yuri ajusta.
- Usar de forma **discreta e dinâmica** (borda-esquerda 3px ou ponto 8px, nunca fundo
  chapado): pino de região do mapa, borda do cartão de região, borda do cartão de local
  (herda da região), ponto antes do nome do local no cartão de NPC (T20.6), ponto no
  filtro "por local". Um acento só; o resto fica no tema escuro.
- Função pura `regionColor(regionId, folders, REGIONS)` + teste (folder ganha da paleta;
  sem nada → cor neutra).

## T23 — Aba "NPCs" em região e em cidade; NPC pode ser da região (peregrino)

- NPC hoje só tem `placeId` (cidade). Adicionar suporte a **NPC de região**: campo
  `regionId` no flag (e `inferRegionId(actor)` análogo ao `inferPlaceId` — pasta
  `🤖 NPCs por Região/<Região>` sem capital, ou texto da bio citando a região).
  No editor, `<select>` "Região" ao lado de "Local"; um NPC pode ter região sem local
  (peregrino/errante).
- No **Mapa**, no detalhe de região (`regionDetail`) e no detalhe de local
  (`placeDetail`), uma seção **"NPCs"**: lista compacta (avatar + nome + papel) dos NPCs
  cujo `placeId` é aquele local, ou cujo `regionId` é aquela região (incluindo os que
  não têm local). Cada item abre a ficha / arrasta para a cena (mesmo drag do T20.5).
- Reaproveitar: `npcActors()` + filtro por `placeId`/`regionId`.

## T24 — Vínculos de parentesco a partir da bio (não digitar à mão)

- `linksFromBio(actor, allNpcs)` puro: varre `system.details.description` /
  `system.biography` procurando padrões de parentesco/relação em PT
  ("filho de X", "irmã de Y", "mãe de Z", "casado com", "aliado de", "rival de",
  "inimigo de") e casa X/Y/Z com nomes de outros NPCs (normalizados, palavra inteira).
  Devolve `[{type, from, to, note:'da bio'}]`.
- Esses vínculos entram como **sugestão** no editor (lista "Detectados na bio" com
  botão "Confirmar") — não gravam sozinhos. O editor manual de vínculos continua para
  quem quiser ajustar.
- **Nome repetido:** se o alvo de um vínculo bate com **mais de um** NPC, não adivinhar
  — mostrar "⚠ vários NPCs chamados 'Vozz': escolha qual" com um `<select>` na hora de
  confirmar. Função `resolveLinkTarget(name, allNpcs)` → `{match}` | `{ambiguous:[…]}`.
- Testes: "filho de Barra Brasa-Fria" → vínculo `filho`; nome repetido → `ambiguous`.

## DÚVIDA RESPONDIDA — imagens de NPC "de acordo com a bio"

Não existe banco mágico. Três fontes possíveis (dá para combinar), em ordem de esforço:
1. **Por arquivo (T19):** pasta `<assetRoot>/npcs/<slug>.webp`. O Yuri joga o arquivo e
   aparece. Confiável, zero mágica.
2. **Biblioteca de retratos por palavra-chave:** pasta com nomes descritivos
   (`humano-velho-pescador.webp`, `anao-mercador.webp`…). `pickPortrait(bio, index)`
   extrai raça/profissão/idade/aparência da bio e escolhe o arquivo com mais palavras
   em comum. Precisa o Yuri montar a biblioteca uma vez; depois é automático.
3. **Geração por IA:** trabalho da macro do Yuri (ela já monta o prompt). A macro salva
   o resultado em `actor.img` / `prototypeToken.texture.src`. O QUEDAÇO só exibe o que
   estiver lá — **nada de chave de API no módulo**.
Precedência de exibição: `actor.img` explícito → arquivo por convenção (1) → retrato por
palavra-chave (2) → `icons/svg/mystery-man.svg`.
**PRECISA DO YURI:** qual(is) dessas fontes implementar agora (recomendo 1 já, 2 depois).

## T25 — Cobertura de NPCs por região (auditoria + gerar o que falta)

Cada região precisa dos seus NPCs "de serviço": mercadores, magos, e o que o livro
indicar para aquele lugar (porto → mestre de doca, contrabandista; deserto → guia,
mercador de água; capital → autoridade, agiota; etc.).

- **Tabela de arquétipos esperados por região** em `src/book-world.mjs`
  (`REGIONS[i].npcArchetypes = ['mercador','mago','ferreiro','curandeiro','guarda',...]`),
  derivada de `region.trade` / `region.government` / `region.highlights` já existentes.
  Codex propõe a tabela a partir do que o livro diz de cada região; Yuri revisa.
- **Auditoria** (aba NPCs, só GM): para cada região, cruzar os arquétipos esperados com
  os NPCs existentes (por `regionId`/`placeId` + palavra-chave no nome/bio/papel) e
  listar **o que falta**: "Norvak: falta mago, falta ferreiro".
- **Gerar o que falta**: botão por lacuna → chama a macro geradora
  (`game.macros.getName(quedaco.generatorMacro)?.execute()`), passando o contexto
  (região + arquétipo) via `scope` se a macro aceitar; senão só abre a macro com um
  aviso do que criar. **Nunca** embutir a macro/opções/chave no módulo.
- Função pura `npcCoverage(regions, npcs)` → `[{regionId, missing:[...], have:[...]}]` + teste.

## T26 — Tokens locais como fonte de imagem (NPC **e** monstro; sem macro)

Yuri tem um pacote de ~3,5 mil tokens PNG no PC
(`E:\RPG\OPATH\Tokens Pack\tokens-skyfall`, repo git à parte). O servidor Foundry está
quase no limite de GB → **não sobe o pacote inteiro**. Decisão do Yuri: **sem macro**.
Fluxo: ferramenta Node local casa NPCs/monstros ↔ tokens, **copia só os escolhidos**
(1 por ficha, dedup) para uma pasta pequena; Yuri sobe essa pasta uma vez; o módulo
acha por convenção de nome.

**Índice já gerado:** `.local/tokens-skyfall-index.json` (**2058** tokens de NPC e de
monstro; gerador em `.local/tokens-index-gen.mjs`, rodar `node .local/tokens-index-gen.mjs`
para regenerar). Cada item: `{p:caminho relativo no pacote, k:[palavras-chave],
r:raça, s:sexo, t:tipo (humanoide/fera/morto-vivo/dragao/elemental/planta/constructo/
gigante/espirito/aberracao/monstruosidade), h:1 se humanoide-ish, n:1 se é só nome
próprio (ignorar no automático)}`. Contagem por tipo: humanoide 1021, monstruosidade
358, morto-vivo 222, espirito 148, fera 138, aberração 50, dragão 37, gigante 31,
elemental 23, constructo 17, planta 13.

Padrões de nome no pacote: descritivo (`hedge knight.png`, `smiling innkeeper.png`,
`arcane conjurer.png`, `adult blue dragon.png`, `goblin archer.png`); estruturado
(`Fisherman_Human_M_A1_01.png` = `Profissão_Raça_Sexo_variante`); só nome próprio
(`Bertand.png`, `Old Gnawbone.png`) → `n:1`.

**No módulo (puro, testado) — `src/tokens.mjs`:**
- `parseTokenName(filename) -> {keywords, race, sex, isName}`.
- `imageKeywords(doc)` — de um NPC: raça/profissão/idade/aparência da bio + papel;
  de um monstro: `creatureType` + palavras do nome + `movement`/porte.
- `pickToken(keywords, index, {type, humanoid, seed})` — filtra por `t`/`h` compatível
  quando é monstro, depois melhor sobreposição de keywords (profissão/tipo pesa mais que
  raça > sexo > adjetivos); desempate **estável** por hash de `seed` (nome da ficha) para
  fichas parecidas não pegarem todas o mesmo arquivo.
- `slugify(name)` (minúsculo, sem acento, espaço→`-`).
- `resolveImage` (T19) ganha o nível `<assetRoot>/tokens/<slug>.<ext>` (aceitar
  `.webp/.png/.jpg`), tanto para NPC quanto para monstro, antes do `mystery-man`.

**Ferramenta Node local — `tools/pick-tokens.mjs` (NÃO empacotada, dev only):**
1. Lê `.local/tokens-skyfall-index.json`, o pacote em disco e um arquivo
   `.local/fichas-para-casar.json` (lista `[{slug,name,kind:'npc'|'monster',type,keywords}]`).
2. `pickToken` para cada ficha; dedup por caminho escolhido.
3. **Copia** os PNGs escolhidos para `.local/tokens-escolhidos/<slug>.png` (sem
   dependência; sem conversão — são ~256px, ~30–90 KB; ~1 por ficha, poucos MB no total).
4. Escreve `.local/tokens-escolhidos/RELATORIO.md`: casados, sem match, colisões.
- Como a lista `fichas-para-casar.json` é produzida: botão **"Exportar fichas p/ casar
  tokens"** na aba NPCs / Monstros (só GM) que baixa esse JSON a partir de
  `npcActors()` + `MONSTERS`/`audit` já em memória (usa `imageKeywords`). Zero macro.
5. Yuri sobe a pasta `.local/tokens-escolhidos/` para `<assetRoot>/tokens/` pelo
   navegador de arquivos do Foundry (uma vez). `resolveImage` acha pelo slug — sem
   passo de importação.

**Nunca no repositório:** os PNGs do pacote nem os escolhidos; o índice e a pasta ficam
em `.local/` (já no `.gitignore`). `tools/pick-tokens.mjs` pode ir no repo (é só código).
Testes (`tests/tokens.test.mjs`): `parseTokenName` nos dois padrões; `pickToken` —
profissão/tipo manda, monstro só casa token de tipo compatível, desempate estável,
`n:1` ignorado; `slugify`.

## T27 — Logo nova (horizontal, gelo, "— POR YURI SATÉLITE")

Yuri mandou uma logo nova: faixa horizontal de gelo estilhaçado com "QUEDAÇO" e o
crédito "— POR YURI SATÉLITE". Substitui o emblema atual do dragão.
- Yuri coloca o arquivo em **`assets/quedaco-logo.png`** (PNG com transparência; pode
  empacotar — é arte do Yuri). Manter também um `@2x`/versão larga se ele mandar.
- `src/app.mjs`: as duas referências do `.sy-brand-lockup` passam a apontar para
  `modules/quedaco/assets/quedaco-logo.png`.
- É uma logo **horizontal com texto embutido** — o lockup não precisa mais do `<div>` com
  "QUEDAÇO"/subtítulo ao lado; deixar só a imagem (ou manter o subtítulo pequeno abaixo).
  Ajustar `styles/creator.css .sy-brand-lockup` (altura ~64–80px, `object-fit:contain`,
  sem `drop-shadow` pesado — a arte já tem sombra).
- Manter `assets/quedaco-dragon.png` no repo por ora (pode virar favicon/ícone); só parar
  de referenciar no cabeçalho.

## T28 — Forja / Imbuir: gerar o item modificado com as regras do próprio Skyfall

### Como o Skyfall trata isto (analisado em `Data/systems/skyfall/skyfall.mjs`)

- **Sigilo ligado a equipamento** é nativo. O item `weapon`/`armor`/`clothing` tem
  `system.sigils: [{uuid, parentUuid, infused:boolean}]`, `max: 4`.
- Ao **criar** o equipamento num ator (`_onCreate → _createSigils`, ~12172): para cada
  entrada, busca o Sigilo pelo `uuid` (compêndio), cria o Sigilo como **Item embutido**
  no ator, grava `sigilo.system.item = <uuid do equipamento>` e
  `sigilo.system.fragments.value = entry.infused`, e escreve de volta
  `system.sigils[i].parentUuid`. Apagar o equipamento apaga os sigilos.
- **`sigilo.system.fragments.value` (Boolean, label "Imbuído")** = imbuído/infundido.
  `true` → permanente, **não consome** Fragmentos Arcanos e dispensa cargas
  (`fragments.type: permanent|recharge`; `fragments.amount` = custo em fragmentos
  quando NÃO imbuído).
- **Fragmentos Arcanos (ator):** `prepareFragmentsLimit` → `fragments.max = abl + prof*2`;
  soma `amount` dos sigilos **não imbuídos** do equipamento em uso; estourar o limite dá
  `{n}d6` de dano Energético (`SKYFALL2.SIGIL.AlertArcaneOverload`).
- **Sigilo `type`:** `prefix` | `sufix`. O sistema monta `magicName = "<prefixos> <nome>
  <sufixos>"` (`_getMagicName`, ~12066).
- **Material especial:** é um Item `loot` (`/* arte | material-especial */`). O sistema
  **não** aplica bônus automático de material — é conceito de custo/ofício. Regra do
  livro: material = **+T$ 300** fixo (já em `item-mod.mjs`).
- Drop nativo de sigilo em item já existe (`SigilDropOnActor`, `InvalidItemSigil`,
  `DuplicatedItemSigil`).

### O que fazer no QUEDAÇO

Transformar a aba **Imbuir** (`renderImbue`, hoje só calculadora) num fluxo de forja que
**gera o item de verdade**, reaproveitando o cálculo de `item-mod.mjs`
(`modifiedItemSheet`: material +T$300; `SIGIL_COSTS[jáPresentes][grau-1]`;
`IMBUE_COSTS[grau-1]`, grau 4 "a conferir"; limite 4, ≤2 prefixo + ≤2 sufixo).

1. **NPC "ferreiro" / "ferreiro mágico"** (novo `NPC_ROLES.smith` = "Ferreiro", ícone
   bigorna): o cartão dele, aberto pelo jogador, mostra o painel de forja (a mesma UI da
   aba Imbuir, embutida). Setting/flag no NPC: `flag.forge = { enabled:true, markup:1 }`.
   `npcVisibility`: role `smith` + `shared` → modo `'forge'` (análogo a `'shop'`).
2. **Arrastar o equipamento** (jogador): zona de drop no painel; `drop` lê
   `{type:'Item', uuid}`; aceita só `weapon`/`armor`/`clothing` **do próprio ator do
   jogador**; vira o item-base (substitui o `<select>` de base no fluxo do jogador; o GM
   mantém o `<select>` na aba Imbuir).
3. **Escolher sigilos** do compêndio de sigilos da mesa (não itens soltos de Mundo),
   marcar **Imbuir** por sigilo, escolher material especial opcional. Validar limites do
   livro e compatibilidade sigilo×tipo de equipamento.
4. **Preço:** `modifiedItemSheet` × `markup` do NPC. Mostrar a quebra (material, cada
   sigilo, cada imbuir). Mostrar aviso se os sigilos **não imbuídos** estourariam
   `actor.system.fragments.max` (dano de sobrecarga).
5. **Pagar:** descontar do `wallet` do ator com a mesma lógica de moedas do
   `purchaseItem` (k=1000 T$, p=10 T$; `walletTotal`), com checagem de saldo.
6. **Entregar:** criar um **novo Item** no ator = cópia do base com
   `system.sigils = [{uuid:<uuid compêndio do sigilo>, parentUuid:'', infused:<marcado?>}]`.
   O Skyfall embute os sigilos e liga tudo no `_onCreate`. Nome: deixar o sistema montar
   o `magicName`, ou aplicar prefixo/sufixo no `name`. Se havia item-base arrastado,
   **perguntar** se consome o original (apaga) ou mantém os dois.
   Material especial: **não** criar loot solto de Mundo — dobrar o +T$300 no preço e
   anotar no nome/descrição ("de aço-lunar"); se a mesa tiver o material no compêndio,
   pode adicionar como componente.
7. GM: botão continua servindo de calculadora pura (sem criar item) na aba Imbuir.

### 28.8 — UX de bancada (o "imbuir" está confuso; referência: bancada de fusão de jogo)

O Yuri mandou print de um jogo (arrasta a arma, encaixa peças, vê o resultado mudar em
verde, no fim paga/confirma). Objetivo: **visual e claro**, prefixo e sufixo separados.

- **Layout de bancada:** à esquerda o **slot do item base** (a arte do equipamento
  arrastado); ao lado, **4 encaixes de sigilo** divididos: 2 rotulados **Prefixo**, 2
  **Sufixo**. Encaixe vazio = "+"; preenchido = nome do sigilo + grau + botão Imbuir/✓.
- **Abas Prefixo / Sufixo** na lista "Adicionar sigilo": duas abas (`data-op="lib-mod-tab"`,
  estado `this.modBuilder.tab`), cada uma só com os sigilos daquele `type` compatíveis
  com o equipamento e ainda não usados. Contador "Prefixo 1/2", "Sufixo 0/2".
- **Nome em tempo real:** um cabeçalho grande com o nome resultante recalculado a cada
  mudança, usando a **mesma fórmula do Skyfall** (`_getMagicName`: `"<nome> <prefixos>
  <sufixos>"`) para bater com o que a ficha vai mostrar. Ex.: "Arco curto **Atenta**
  **Retornável** **da Munição Mágica**".
- **Efeito por sigilo:** abaixo de cada encaixe, uma linha curta com o efeito
  (`sigil.effect.descriptive` do compêndio) — o que aquele sigilo faz. Sem número
  inventado; só o texto do sigilo.
- **Barra de custo viva:** total em T$ atualizando, com a quebra expandível
  (base 0 · material +300 · sigilo A +250 · imbuir A +250 · …) e o saldo do jogador ao
  lado (verde se cobre, vermelho se não).
- **Fragmentos:** mostrar "Fragmentos Arcanos: usa X / limite Y" com os sigilos **não
  imbuídos** somando; se passar, aviso vermelho "vai sobrecarregar: Nd6 de dano ao
  equipar" (texto do sistema `SKYFALL2.SIGIL.AlertArcaneOverload`).
- **Fechamento:** um único botão final **"Forjar por T$ N"** (desabilitado sem saldo /
  sem item base / limites violados). Ao confirmar: desconto + criação do item (passo 5–6).
- Reaproveitar tudo que já existe (`modBuilder`, `modifiedItemSheet`, ops `lib-mod-*`);
  isto é reorganização visual + as abas + o preview de nome, não um motor novo.

Testes: validação de limites (4 / 2+2 por tipo / compatibilidade); `magicNamePreview(base,
sigils)` == fórmula do Skyfall; preço com markup e quebra; recusa por saldo; recusa de
item que não é do próprio ator; montagem correta do `system.sigils` (incluindo `infused`).

## T29 — Mercador por tipo de localidade (estoque útil e típico do lugar)

Ideia do Yuri: ao chegar num lugar novo, o mercador local vende coisas **daquele
lugar** que são **úteis**. Nem todos ficam em cidade — alguns são errantes da região.

- Tabela `LOCALITY_GOODS` em `src/book-world.mjs` por **tipo de local** (usar
  `place.kind` já existente — "Capital", "Ilha", "Porto", "Vila", … — ou um novo
  `place.localeType`): lista de categorias/itens de `src/book-items.mjs` típicos e úteis
  ali. Exemplos:
  - **Porto / costa:** cordas, redes, âncoras, botes, mantimentos, remédio de enjoo,
    mapas náuticos, arpões, roupa impermeável.
  - **Deserto:** cantis, filtros de água, véus, bússola, óleo solar, montaria, ração
    seca.
  - **Capital:** variedade ampla + itens de status + serviços (encaminha para o
    Ferreiro/T28) + agiota.
  - **Montanha / forja:** minério, picareta, ferramentas, sigilos comuns, material
    especial, lampião.
  - **Pântano:** antídotos, repelente, botas, tocha à prova d'água, corda.
  - **Selvagem / acampamento:** suprimentos básicos, armadilhas, peles, munição, kit de
    primeiros socorros.
  Codex propõe a tabela a partir do que o livro diz de cada local; Yuri revisa.
- **Gerador "Criar mercador típico"** (por local ou por tipo): cria um NPC role
  `merchant` com `placeId`/`regionId` setado e `flag.shop.stock` preenchido **só** com
  itens dos compêndios da mesa que casam com `LOCALITY_GOODS` daquele tipo, preço do
  livro × markup. Nunca cria item solto de Mundo (regra de sempre).
- **Errantes:** opção `itinerant:true` no flag → NPC com `regionId` e sem `placeId`;
  aparece como "mercador errante de <região>" na aba NPCs (T23) e no detalhe da região,
  não numa cidade específica.
- Liga com T25 (auditoria de cobertura): "Porto de Huma: sem mercador típico" → botão
  gera.
- Função pura `localityStock(place, bookItems, packIndex)` → lista de `{uuid, price}` +
  teste (porto traz corda/rede; deserto traz cantil; nada solto de Mundo).

## T30 — Chamar a macro geradora já enquadrada (parar de digitar um a um)

Hoje os botões "Criar marinheiro / Criar mago / …" da auditoria (T25) abrem a macro
`Skyfall — Criador de Conteúdo` **em branco** — o Yuri tem que escolher região, local,
tipo e escrever a descrição toda vez. Automatizar o enquadramento.

- **QUEDAÇO passa contexto para a macro:**
  `game.macros.getName(quedaco.generatorMacro)?.execute({ quedaco: {
    kind: 'npc',                // 'npc' | 'monster'
    regionId, regionName,
    placeId, placeName,         // vazios se for errante/da região
    archetype,                  // 'marinheiro', 'mago', 'ferreiro', ...
    count: 1,
    prompt                      // string pronta (ver abaixo)
  }})`.
  (Foundry passa o objeto como `scope` para o corpo da macro.)
- **Prompt padrão por arquétipo:** função pura `generatorPrompt(archetype, region, place)`
  em `src/library.mjs`/novo `src/generator.mjs` — monta um texto em PT já com região,
  local, facção e ocupação. Ex.: `"Um(a) {archetype} de {place|region}, na região
  {region}. Habitante comum, ND baixo. Descreva ocupação, aparência, um gancho de
  história e o que vende/oferece se for mercador."`. Tabela `ARCHETYPE_HINT` para
  detalhes por arquétipo (mercador → estoque típico do lugar via T29; mago → escola;
  ferreiro → forja/sigilos).
- **A macro do Yuri** precisa ler `scope.quedaco` e, se existir, **pular o diálogo**
  (preencher região/local/tipo/quantidade/descrição e já gerar), invertendo `type`
  como já faz (NPC→`character`, monstro→`npc`) e caindo nas pastas
  `🤖 NPCs por Região/<Região>/<Local>`. **Não commitar a macro.** Entregar
  `.local/macro-hook-quedaco.js` — trecho pronto para o Yuri colar no topo da macro
  (`if (scope?.quedaco) { /* preenche e executa, sem abrir o diálogo */ }`).
- Botão **"Criar 5"/"Criar todos os que faltam"** na auditoria: dispara a macro em lote
  para as lacunas da região (respeitando `count`), com um `ui.notifications.info` de
  progresso. Depois do `createActor` o painel já re-renderiza (T13).
- Se a macro não existir: aviso com o nome esperado e link para Configurações do Módulo.
- **Nunca** embutir a macro, o prompt-engine dela, nem chave de API no módulo — só
  montar o `scope` e chamar por nome.

Testes: `generatorPrompt` inclui região e local; arquétipo desconhecido cai num texto
genérico; `kind` monstro monta prompt de criatura.

## Amend T25 — os botões "Criar X" usam o T30

Cada botão de lacuna (`Criar marinheiro`, etc.) chama `generatorPrompt` + `macro.execute`
com o `scope` do T30 já preenchido (região/local/arquétipo). Nada de abrir a macro vazia.

## Amend T20/T26 — "a maioria dos NPCs está sem imagem"

Aplicar o T26 (tokens locais) a esses NPCs no mesmo lote: botão "Exportar fichas para
casar tokens" já gera a lista; depois de subir `.local/tokens-escolhidos/` o
`resolveImage` preenche os cartões e os tokens. Enquanto não há arquivo, cai no
`mystery-man` — não deixar o cartão quebrado.

---

# 2ª rodada de prints do Yuri (correções sobre o que já foi entregue)

## B11 — Cartão de NPC quebrou (texto vertical)

Print: "Figurante" sai **uma letra por linha** (F/i/g/u/r/a/n/t/e), o nome do local
também ("Alb/eri/ch"), avatar minúsculo, botões espremidos. O grid do T20.6 ficou com
largura apertada demais forçando quebra a cada caractere.

- Cartão: `display:grid;grid-template-columns:40px minmax(0,1fr);gap:10px` — a coluna de
  conteúdo **precisa** de `min-width:0`.
- Nome (`h3`) e linha-meta: `white-space:nowrap;overflow:hidden;text-overflow:ellipsis`
  (nada de `word-break`/`writing-mode`). Nome pode ter 2 linhas com
  `-webkit-line-clamp:2` se quiser, mas **nunca** 1 char por linha.
- Grade: `grid-template-columns:repeat(auto-fill,minmax(280px,1fr))` para o cartão nunca
  ficar estreito o bastante para colapsar.
- Linha de ações: `flex-wrap:wrap;gap:6px`; 🗑 continua absoluto no canto superior
  direito, fora do fluxo.
- Ponto de cor do local: `flex:0 0 8px` para não ser espremido nem empurrar texto.

## B12 — Selo "!" sempre aceso (regressão do B1)

Print: etapa "1 Conceito" com "⚠" mesmo **sem ter sido visitada**. Regra do B1 continua
valendo: "!" **só** em etapa `this.visited.has(i) === true` **e** `stepIssues(i).length`.
Nunca visitada → sem selo. Conferir se a etapa "Conceito" está no array de etapas com o
índice certo e se `visited` está sendo populada no clique dela (não no render).

## T20.8 — Marcar o papel direto no cartão (Aliado/Rival/Figurante/Mercador)

Sem abrir o editor: um seletor compacto no cartão do NPC —
`<select name="npcRoleQuick" data-id="${actor.id}">` com os 4 papéis (mais "Ferreiro"
do T28) — que ao mudar chama `saveNpc(actor.id, {role})` na hora e re-renderiza (sem
pulo de scroll). O chip de papel (T21) reflete a escolha. Os botões de papel no topo
continuam sendo **filtro**, não atribuição.

## T28 (cont.) — a forja precisa CRIAR o item, não só simular

O visual ficou bom (abas prefixo/sufixo, nome em tempo real). Falta o essencial:

### 28.9 — Imagem do item no slot
- Slot do item base mostra o `img` real: item arrastado → `item.img`; item do `<select>`
  do livro → `matches[0]?.img` do compêndio, senão `itemFallback(entry)` (T5). Nada de
  ícone genérico fixo.

### 28.10 — Arrastar de verdade + remover o base
- `dragover`/`drop` no slot base: aceita `{type:'Item',uuid}`; valida
  `weapon`/`armor`/`clothing` **do próprio ator do jogador** (ou de qualquer ator, se
  GM). Erro claro se o tipo não serve (`ui.notifications.warn`).
- Botão **×** no slot base para limpar e escolher outro (hoje só dá pra trocar pelo
  `<select>`; sigilos já têm ×, o base não tinha).

### 28.11 — Botão "Forjar" que entrega o item + cobra
- Botão final **"Forjar por T$ N"** (não "simular"):
  1. checa saldo do ator (`walletTotal`); sem saldo → desabilitado + motivo.
  2. desconta do `wallet` com a lógica do `purchaseItem` (k/p/t).
  3. cria o **Item modificado** no ator = cópia do base + `system.sigils`
     (`{uuid, parentUuid:'', infused}`) — Skyfall embute os sigilos no `_onCreate`.
  4. se o base veio do inventário do jogador: perguntar "consumir o original?" (padrão
     sim) e apagar/atualizar.
  5. `ui.notifications.info("Item forjado: <nome mágico>.")`.
- **Jogador pode fazer** (não exige GM): habilitado quando o painel está no modo
  `'forge'` de um NPC ferreiro liberado. GM continua com a calculadora pura na aba
  Imbuir (sem criar).

### 28.12 — "Abrir negociação" no NPC ferreiro (2 painéis)
- Cartão do NPC role `smith` + liberado → botão "Abrir forja" (jogador). Abre uma
  visão de **dois painéis**:
  - **Esquerda:** inventário de equipamentos do próprio personagem do jogador
    (`weapon`/`armor`/`clothing`), cada um arrastável / clicável "usar como base".
  - **Direita:** a bancada (28.8) — recebe o item, escolhe sigilos/material, vê custo e
    saldo.
  - Concluir → item modificado **volta para o inventário** do jogador, dinheiro
    descontado; sem saldo, bloqueia. Igual a uma compra.
- Reaproveita `modBuilder`, `modifiedItemSheet`, `purchaseItem`. Fecha voltando ao
  cartão do NPC.

Testes: `drop` rejeita item de outro dono (jogador); "Forjar" sem saldo não cria nada;
com saldo cria Item com `system.sigils` correto e desconta o total; remover base zera o
builder.

## T30 (cont.) — a macro "gera e nunca termina"

Sintoma do Yuri: dispara e fica rodando sem criar. Do lado do QUEDAÇO:
- **Nunca bloquear**: `macro.execute(scope)` sem `await` que trave a UI; o painel só
  reage ao hook `createActor` (T13). Mostrar `ui.notifications.info("Gerador disparado…
  os NPCs aparecem aqui quando a macro terminar.")`.
- **Timeout de aviso:** se em ~90s nenhum `createActor` casar o pedido, um aviso
  "a macro ainda não devolveu nada — verifique o console (F12) e a chave/limite da API".
- `.local/macro-hook-quedaco.js` deve incluir: log do `scope.quedaco` recebido,
  `try/catch` em volta do `fetch`/`JSON.parse` com `console.error` legível, e um
  `ui.notifications.error` se a resposta não for JSON válido (causa provável:
  `max_tokens` curto truncando, ou texto fora de JSON). O conserto fino é na macro (fora
  do repo) — o QUEDAÇO só não pode travar nem ficar mudo.

## T27 (lembrete) — logo ainda não trocada

Continua o dragão. Depende do Yuri salvar `assets/quedaco-logo.png`. Assim que o arquivo
existir, aplicar o T27 (trocar as 2 refs do `.sy-brand-lockup`, tirar o texto ao lado,
ajustar CSS).

---

# 3ª rodada — Mapa vira atlas navegável (regiões, camadas, dossiê)

## B13 — Cartões do mapa não abrem mais (só visual)

Regressão: clicar num pino de região/cidade no visor dinâmico **não abre mais a gaveta
de detalhe** (`placeDetail`/`regionDetail`). Dá pra trocar imagem, mas não se vê a
descrição. Consertar: `lib-place`/`lib-map-focus` setam `this.state.place`/`state.map.focus`
e a gaveta (`.sy-map-drawer`) tem que renderizar sempre que houver `place` ou `focus`
resolvido (GM: sempre; jogador: só se liberado). Sem pulo de scroll.

## T31 — Camadas de lugar por tipo (Cidades ≠ tudo)

Hoje "Cidades" mostra tudo (inclusive "Castelete da Tora Furada", "Primeira Grande Queda:
Salim", "Pomares Rúnicos"). Separar por `place.kind`.

- `placeLayer(kind)` puro → `'cidade' | 'marco' | 'queda'`:
  - **cidade:** Capital, Cidade, Vila, Cidade-fortaleza, Cidade costeira, Porto,
    Distrito, Cidade soterrada, Cidades históricas, Capital em ruínas, Ilha, Fazenda,
    Mercado.
  - **queda:** `Queda` (os sítios das Grandes Quedas — 5).
  - **marco:** todo o resto (Vulcão, Bosque(s), Ruínas, Pântano, Fronteira, Fortalezas,
    Floresta, Castelo, Lagoa, Terras mágicas, Cordilheira, Mar).
- Botões de camada (rodapé do mapa e no painel do T32): **Automático · Regiões · Cidades
  · Marcos · Quedas · Tudo**. `state.map.layer` guarda a escolha; `Automático` = regra do
  zoom (T18).
- **Mostrar/ocultar no mapa por lugar:** setting `quedaco.mapHidden` (Set de ids). Os 5
  `Queda` entram **ocultos por padrão**. No painel do T32 e no modo "Mover pinos" (T17):
  toggle "no mapa" por lugar; arrastar para dentro coloca e marca visível, botão remove
  (tira da vista, continua no dado). Teste de `placeLayer` + de default oculto das Quedas.

## T32 — Painel lateral direito: Atlas (árvore de regiões + controles do mapa)

Tirar a faixa de "Liberar mapa / Liberar todas as regiões" de cima e virar um **painel à
direita** do visor (`.sy-atlas`), fixo, rolável.

- **Árvore:** cada região é um item recolhível (quadradinho + nome + ponto de cor T22).
  Expandir → lista dos lugares da região agrupados por camada (Cidades / Marcos /
  Quedas). "Além de Opath" no fim.
- **Por nó (região ou lugar), ícones compactos:** `focar no mapa` (anima o zoom até ele),
  `abrir dossiê` (T33 para região; `placeDetail` para lugar), toggle **Liberar** (share)
  e toggle **no mapa** (T31).
- **Ações em massa no topo do painel:** Liberar todas as regiões · Liberar tudo ·
  Recolher tudo (era do T18).
- Clicar na região no Atlas = focar no mapa **e** abrir o dossiê na gaveta.
- Jogador: o Atlas mostra só o que foi liberado; sem toggles de GM.

## T33 — Dossiê da região (documento visual, guiado, com share por bloco)

Clicar numa região (pino, Atlas ou breadcrumb) abre um **documento visual** na gaveta do
mapa — não só o parágrafo de hoje. Blocos, cada um com toggle "liberar aos jogadores"
(GM) e escondido do jogador até liberado:

1. **Capa:** imagem da região (`regionImages[id]` / `resolveImage`), nome, resumo,
   governo, comércio, destaques (o que `regionDetail` já tem).
2. **Cidades e locais:** cartões dos `PLACES` da região por camada (Cidades / Marcos /
   Quedas), cada um abre `placeDetail`.
3. **Fauna:** lista de animais da região — nova `REGIONS[i].fauna: [string]` (Codex
   extrai do livro; Yuri revisa) ou tag em `book-monsters` (ver abaixo).
4. **Ameaças:** monstros que aparecem na região — dos `MONSTERS` com a região na tag de
   habitat (nova `MONSTERS[i].habitat: [regionId]` / setting `quedaco.monsterHabitats`
   editável pelo GM; fallback: nenhum). Cada um arrastável para a cena (T20.5).
5. **Missões abertas:** quests do Forien cujo `location`/tag casa a região ou uma cidade
   dela (T29/Quests). Abrir quest.
6. **NPCs conhecidos:** NPCs com `placeId` numa cidade da região (os "populares"), com
   avatar + papel; arrastáveis.
7. **NPCs pelo território:** NPCs com `regionId` da região e **sem** `placeId`
   (errantes / paradeiro desconhecido) — T23. Marcador "paradeiro incerto".
8. **Rumores:** nova `REGIONS[i].rumors` **não** no repo como dado do livro — setting
   `quedaco.regionRumors` = `{regionId: [{text, shared}]}`, GM adiciona/edita/libera.
- Tudo montado a partir das **tags** já existentes (placeId/regionId nos NPCs, habitat
  nos monstros, location nas quests) — é por isso que taguear tudo importa. Onde não há
  tag, o bloco aparece vazio com "nada marcado ainda", nunca quebrado.
- `regionDossier(regionId, {npcs, monsters, quests, settings})` puro devolve o modelo de
  cada bloco → testável sem Foundry.

### Dados a acrescentar (Codex propõe do livro, Yuri revisa)
- `REGIONS[i].fauna: string[]` em `src/book-world.mjs`.
- Habitat de monstro: **não** inventar no `book-monsters.mjs` sem base; criar o setting
  `quedaco.monsterHabitats` (`{monsterId:[regionId]}`) e uma UI mínima na aba Monstros
  ("aparece em: [regiões]"). Se o livro disser explicitamente onde vive, aí sim pode ir
  no dado com página.

## Sugestão de nomes (o Yuri pediu)

- Camadas do mapa: **Regiões · Cidades · Marcos · Quedas · Tudo** (+ Automático).
  - *Cidades* = capitais, vilas, portos, distritos (assentamentos).
  - *Marcos* = ruínas, vulcões, bosques, lagoas, cordilheiras, pontos de interesse.
  - *Quedas* = os sítios das Grandes Quedas (tema do cenário); nascem fora do mapa.
- Painel da direita: **Atlas**.
- A página da região: **Dossiê da Região** (ou "Verbete", se quiser tom de enciclopédia
  in-world).

---

# 4ª rodada — Forja: layout, imbuir fragmentos, sobrecarga; conversão de itens D&D

## B14 — Design da forja quebrado dentro do cartão de NPC  *(feito por Claude, 0.4.18)*

Sintoma (print): a bancada de forja aparecia espremida na coluna de um cartão de NPC,
com nomes de item quebrando letra a letra ("Mergulhador a").
Feito: cartão com loja/forja ganha `sy-npc-card-full` (`grid-column:1/-1`), inventário
com `-webkit-line-clamp:2`, bench com `minmax(0,2fr)` + `min-width:0` nos filhos,
"Ataque desarmado" e armas naturais fora da lista "Seu equipamento".
Se sobrar algo torto, ajustar `.sy-forge-*` em `styles/library.css`.

## T34 — Converter itens de D&D 5e para itens de Skyfall (na mesa, sob demanda)

O Yuri quer pôr um **compêndio de itens de D&D 5e** no Foundry e, conforme forem
surgindo na mesa, transformar cada um num **item de Skyfall** — usando a macro geradora
(mesmo padrão dos NPCs/monstros do T30). Hoje um item `dnd5e` não "entra" no QUEDAÇO
porque o schema é outro (dano `2d6`+tipo, propriedades, `weapon`/`equipment` do 5e vs
`weapon`/`armor`/`clothing`/`loot` do Skyfall, RD, volume, descritores).

- **`src/item-convert.mjs` (puro, testado):** `dndToSkyfallDraft(item5e)` → objeto com o
  que dá para mapear direto sem IA:
  - tipo: 5e `weapon`→`weapon`; `equipment` com `armor.type` → `armor` (RD a partir de
    `armor.value`); `consumable`→`consumable`; resto→`loot`/`equipment`.
  - `system.price` a partir de `system.price.value` (converter gp→T$ com uma taxa
    configurável, default 1:1) — marcar `priceKind:'a conferir'` se não houver.
  - `system.weight`→`volume` (taxa configurável).
  - nome, imagem, descrição (texto) mantidos.
  - o que **não** dá para mapear (dano por dado + descritores Skyfall, propriedades
    especiais, encantamentos) fica num campo `notes` para a macro/Yuri resolver.
- **Fluxo na aba Itens (GM):** botão "Converter item de outro sistema" → escolhe um
  Item de um compêndio 5e (ou arrasta) → mostra o `dndToSkyfallDraft` lado a lado (5e à
  esquerda, rascunho Skyfall à direita, editável) → botões:
  - **"Gerar com a macro"**: `game.macros.getName(quedaco.generatorMacro)?.execute({
    quedaco:{ kind:'item', source:item5e.toObject(), draft, prompt } })` — a macro
    devolve o item Skyfall pronto e cria/atualiza num compêndio da mesa (nunca item
    solto de Mundo).
  - **"Criar do rascunho"** (sem IA): cria o item Skyfall no compêndio configurado
    (`quedaco.itemCompendium`) só com o mapeamento direto.
- **`generatorPrompt` (T30) ganha `kind:'item'`:** texto tipo "Converta este item de D&D
  5e para Skyfall RPG: <nome> — <descrição>. Dano/props: <...>. Devolva no formato de
  item Skyfall (weapon/armor/clothing/loot), com dano em dados, descritores, RD, volume
  e preço em T$; mantenha o tema.".
- **`.local/macro-hook-quedaco.js`** documenta o `scope.quedaco.kind==='item'`.
- **Nunca no repo:** o compêndio 5e, a macro, a chave. Regra de sempre.
- Testes: `dndToSkyfallDraft` para arma, armadura, consumível e item genérico; taxa
  gp→T$ e weight→volume configuráveis; campos não mapeáveis vão para `notes`.

## T35 — Rolar o dano de sobrecarga arcana ao equipar

Hoje a forja só **avisa** "vai sobrecarregar: Nd6" (texto de `SKYFALL2.SIGIL.AlertArcaneOverload`).
O Yuri quer que o dano role de verdade quando o item é **equipado**.

- Provável lacuna do próprio Skyfall; o QUEDAÇO cobre com um hook, sem alterar o sistema.
- `Hooks.on('updateItem', ...)`: quando um Item de equipamento passa a
  `system.equipped===true` (ou entra em uso) e o ator tem sigilos **não imbuídos** cujo
  `fragments.amount` somado ultrapassa `actor.system.fragments.max`:
  - `const over = usados - max` (mínimo 1); rolar `new Roll(\`${over}d6\`)`, aplicar como
    dano **Energético** ao ator (`actor.applyDamage?.(total)` ou o caminho de dano do
    Skyfall) e mandar ao chat: "Sobrecarga Arcana ao equipar <item>: <total> Energético".
  - Só dispara na **transição** para equipado (comparar `changed` vs estado anterior),
    nunca em cada render.
  - Setting `quedaco.arcaneOverloadAuto` (config, default ligado) para o mestre desligar.
  - Função pura `arcaneOverload(sigils, fragmentsMax)` → `{used, over, formula}` + teste.
- Cuidado: só considerar sigilos ligados a **equipamento em uso** (mesma regra do
  `prepareFragmentsLimit` do sistema).

## Forja — "imbuir fragmentos" que faltou

O Yuri diz que "imbuir fragmentos não entrou" no cartão do Ferreiro. Hoje há o botão
**Imbuir** por sigilo (marca `infused` → `system.fragments.value=true`), mas falta o
enquadramento:
- Bloco fixo **"O que é imbuir?"** dentro da `renderForge` (o mesmo texto da aba Imbuir).
- Por sigilo, mostrar **custo de imbuir** daquele grau (`IMBUE_COSTS[grade-1]`, grau 4 =
  "a conferir") ao lado do botão Imbuir, e somar no total do `forgeQuote` (confirmar que
  já soma).
- Linha de fragmentos: além de "usa X / limite Y", listar **quais sigilos** estão
  custando fragmento (os não imbuídos) para o jogador entender o que imbuir resolve.
- Se "imbuir fragmentos" for outra ação do Skyfall (infundir fragmento avulso no item,
  fora do imbuir de sigilo) — **PRECISA DO YURI** confirmar o que é exatamente.

---

# T37 — Guildas e Hansas (Apêndice B)

Skyfall tem **Ator `type:"guild"`** nativo (schema com `abilities` cunning/knowledge/
crafting/reputation, `seals`, `level`, `motto`, `members[]`) + itens `Seal` e
`GuildAbility` + `GuildSheet`. **Não reimplementar nada disso.** O QUEDAÇO só indexa,
mostra e liga aos NPCs.

Já existe um parser local: `tools/parse-guilds.mjs` → `.local/guildas.json` (174 orgs:
139 guildas + 35 hansas) e `.local/guildas-foundry.json` (Actors `type:"guild"` prontos
para importar num compêndio da mesa; cada um traz `flags.quedaco.appendix =
{kind:'guilda'|'hansa', creator, symbol, seals[], patron, focus, legend, description,
truths, plot}`). **O texto do apêndice não entra no repositório** — o Yuri importa o
JSON num compêndio da mesa.

## 37.1 — Área "Guildas" (nova, como `imbue`)
- `areaLabels.guildas='Guildas'`; whitelist de sharedAreas; dispatch em `app.mjs` e
  `render()` de `library.mjs`; `titles.guildas='Guildas'`.
- `renderGuilds(readonly)`: lê os Atores `type:"guild"` de `game.actors` (e compêndios
  configurados, se houver). Cartão: brasão (`actor.img` ou ícone), nome, badge
  **Guilda** (⚜, azul) ou **Hansa** (☠, vermelho) via
  `actor.flags.quedaco.appendix.kind` (fallback: heurística pelo nome do compêndio),
  selos/mecenas em chips, dogmas (lista), descrição/verdades curtas. Botão "Abrir ficha"
  (abre o `GuildSheet` nativo) e — se `appendix` presente — "Ver detalhes" expande
  symbol/plot/legend.
- Filtro **Guilda / Hansa / Todas** + busca por nome/criador/selo.
- Compartilhável por item (`shareButton('guildas', actor.uuid, …)`) e a aba toda
  (`areas:guildas`).
- Bloco de ajuda (GM): "Importe `.local/guildas-foundry.json` num compêndio da mesa
  (Compêndios → Importar) para popular esta lista."

## 37.2 — Tag de guilda no NPC
- `flag.guildUuid` (uuid de um Ator `guild`) **ou** `flag.guildText` (nome livre, para
  guilda ainda não criada).
- Editor de NPC: `<select name="npcGuild">` com "Sem guilda" + os Atores `guild`
  ordenados (guildas antes, hansas depois), + `<input name="npcGuildText">` "ou nome
  livre". `saveNpc` grava `guildUuid`/`guildText` (segue o padrão de `linkTarget`).
- Cartão do NPC: chip **⚜/☠ \<nome da guilda\>** na linha-meta (ao lado de papel e
  local), cor azul (guilda) / vermelha (hansa).
- Filtro na aba NPCs: `<select name="npcGuildFilter">` "Todas as guildas" + as que têm
  ao menos um NPC. Estado `state.npcGuildFilter`, op `lib-npc-guild-filter`.
- `npcVisibility` / regras de share inalteradas.

## 37.3 — Guildas no Dossiê da Região / detalhe do local
- Campo GM no Ator guild: `flags.quedaco.guildPlace` (um `placeId`), editável na área
  Guildas (`<select>` de locais) — o apêndice não dá sede (quase todas são Alberich).
- `regionDossier` / `placeDetail` ganham bloco **"Guildas presentes"**: Atores `guild`
  cujo `guildPlace` é aquele local, **ou** cujos NPCs ligados (`flag.guildUuid`) têm
  `placeId`/`regionId` naquela área. Cada uma: brasão + nome + badge, abre a ficha.

## 37.4 — Puro + testes (`tests/`)
- `guildKind(actor)` → `'guilda'|'hansa'` (usa `appendix.kind`; fallback por heurística).
- `npcGuildLabel(flag, actorsById)` → `{icon,label,kind}` ou `null`.
- `guildsForPlace(guildActors, npcs, placeId, regionId)` → lista.
- Teste: NPC com `guildUuid` mostra o chip certo; hansa vira ☠ vermelho; filtro por
  guilda; `guildsForPlace` cruza sede + NPCs.

## 37.5 — Regras de sempre
Nada do apêndice (texto/JSON) no repositório; só código. O QUEDAÇO **não cria** Ator
`guild` — só lê os que a mesa importou (o Yuri importa o `.local/guildas-foundry.json`).
Se quiser um atalho, um `.local/importar-guildas.js` (macro que o Yuri roda uma vez:
`CompendiumCollection` alvo + `Actor.createDocuments(JSON)`).

---

# 5ª rodada — fragmentos, sigilos que dão magia, liberar em massa, workspace de região

## T35 (reforço) — sobrecarga arcana não aplica dano

O Yuri confirma: usar/equipar item acima do limite de Fragmentos Arcanos **não** causa
o dano automático. Não existe "item" que conserte — é lacuna de automação do sistema.
QUEDAÇO cobre com hook `updateItem` (ver T35). Prioridade alta.

## T38 — Sigilos que concedem magia/habilidade: aplicar na ficha ao forjar

Alguns prefixos/sufixos têm particularidades — **alguns concedem uma magia ou truque**
(o texto está em `src/book-sigils.mjs` / no `effect.descriptive` do sigilo de compêndio).
Hoje o QUEDAÇO cria o item com `system.sigils`, mas não adiciona o que o sigilo concede.

- `src/sigil-grants.mjs` (puro): `sigilGrants(sigil)` → lista de `{type:'spell'|'ability'|'descriptor', name, uuid?}` a partir de um padrão no texto do sigilo ("concede o truque X", "permite conjurar X", "ganha o descritor Y"). Onde não der para casar por texto, cai vazio.
- No `executeForge` / `purchaseForgedItem` (T28): depois de criar o item, para cada sigilo escolhido com `sigilGrants` não-vazio, criar na ficha os itens concedidos (buscar por nome nos compêndios de magia/habilidade da mesa; se não achar, só avisar no chat "o sigilo X concede Y — adicione manualmente").
- Marcar de onde veio: `flags.quedaco.fromSigil = <nome do sigilo>` nos itens concedidos, para poder remover junto quando o sigilo sai.
- **PRECISA DO YURI:** confirmar quais sigilos concedem o quê (uma passada no `book-sigils.mjs` marcando `grants: [...]`), já que o texto do livro varia.
- Testes: `sigilGrants` para um sigilo que concede truque, um que concede descritor, e um que não concede nada.

## T39 — Liberar NPCs/missões em massa por local e por região

Cenário do Yuri: os jogadores estão no Deserto de Mirmir, dentro de Kravokia. A região é
grande demais para eles saberem de todo mundo; ele quer liberar **só a cidade** — e nela,
**todos os NPCs de uma vez**.

- No detalhe do **local** (`placeDetail`) e no Atlas, botão **"Liberar tudo desta
  cidade"** (GM): compartilha o próprio local + todos os NPCs com `flag.placeId` desse
  local + as quests cujo `location` casa. Botão irmão **"Recolher tudo desta cidade"**.
- No **Dossiê da Região** / Atlas, **"Liberar tudo da região"**: região + todos os
  locais + NPCs com `regionId`/`placeId` na região + quests da região. (Já existe
  `map-share-all` para regiões/tudo; estender para NPCs e quests, e granular por local.)
- Implementar via um método `shareBundle({placeId?|regionId?, npcs:true, quests:true, on})`
  que junta os `setShare`/`setNpcShare` numa tacada; op `lib-share-bundle`.
- Confirmação leve (`DialogV2.confirm`) mostrando quantos itens vão ser liberados.

## T40 — Workspace da Região (entrar numa região = área própria)

Hoje, ao focar uma região, o mapa dá zoom mas o painel continua o mesmo e os NPCs ficam
espremidos na coluna estreita da direita. O Yuri quer que **entrar numa região abra um
espaço de trabalho daquela região**.

- **Ao escolher uma região** (pino, Atlas, breadcrumb): o mapa **trava com zoom** naquela
  região, com botão **"‹ Voltar ao continente"**; e a aba passa a ser **da região**.
- **Sub-menu no topo da região** (como o `sy-library-tabs`): **Locais · NPCs · Ameaças ·
  Missões · Mapas · Rumores**. Cada painel em **largura total** (não na gaveta estreita),
  com toggle "liberar aos jogadores" por item (o Dossiê do T33 vira este workspace).
- **Vários mapas (Scenes) por região**, não um por local: lista de cenas vinculadas à
  região com **adicionar** (picker de Scene) e **remover**. Setting
  `quedaco.regionScenes = { regionId: [sceneId, ...] }`. O painel "Mapas" mostra
  miniaturas, "Abrir" / "Ativar para jogadores" / "Desvincular" por cena.
- O `renderDossier` do T33 é reaproveitado como o conteúdo dos painéis; o que muda é o
  **enquadramento** (largura total + sub-nav + mapa travado) em vez de gaveta.
- Layout: quando há região focada, `sy-map-layout` vira 1 coluna (mapa fino no topo ou
  lateral compacto) + workspace em baixo/ao lado ocupando o resto.
- Estado: `state.regionWorkspace = { regionId, tab }`. `state.map.focus` continua guiando
  o zoom.
- Absorve a queixa "NPCs apertados no canto" — no workspace eles têm largura total.

## Macro do Yuri — arquivos de apoio entregues

`.local/testar-geracao.js` (diagnóstico de console) e `.local/macro-hook-quedaco.js`
(trecho para o topo da macro: lê `scope.quedaco` e blinda fetch/JSON.parse). Não vão no
repositório. O QUEDAÇO já deve chamar a macro sem `await` que trave (T30).
