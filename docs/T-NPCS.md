# T-NPCs — sistema de NPCs (vendedores + aliados/rivais/figurantes)

Substitui e amplia `T-VENDEDOR.md`. Para o Codex. `npm test` + `npm run package` antes
de dar por pronta. Fazer **depois** de T1 (trilha) e T2 (menu).

Regra dura: **nunca criar item solto de Mundo.** Tudo que o vendedor entrega — e todo
"item tabelado" novo — é documento de **compêndio** (config `quedaco.itemCompendium`).
Isso vale mesmo sem limpar o banco atual (Yuri optou por não mexer nos itens existentes).

O QUEDAÇO **não cria os Actors NPC**. Yuri/uma IA cria os NPCs por fora (macro, prompt).
O QUEDAÇO só: lê um flag, oferece um editor, mostra na aba NPCs / no local, roda a loja.

## Flag único no Actor

`actor.flags.quedaco.npc`:

```js
{
  role: "merchant" | "ally" | "rival" | "extra",   // Mercadores / Aliados / Rivais / Figurantes
  placeId: "foice",          // local do QUEDAÇO onde esse NPC está (opcional)
  active: true,              // o mestre liga/desliga conforme o grupo anda pelas cidades
  shop: {                    // só quando role === "merchant"
    markup: 1,
    note: "",
    stock: [ { uuid, price, qty, note } ]   // uuid sempre de compêndio; price null -> system.price*markup; qty null -> infinito
  }
}
```

Viaja com o Actor ao arrastar pro mapa / duplicar / importar. A criação (complexa,
externa) só precisa escrever esse flag.

## Compartilhamento

Estender `emptyShare()` (library.mjs): adicionar `npcs: []` guardando `actor.uuid`.

Regras de visibilidade para o jogador:

| role | jogador vê | jogador faz |
|---|---|---|
| merchant | nome, imagem, "Abrir loja" | compra (desconta moeda, recebe item) |
| ally / extra | **nome e imagem apenas** | nada — sem ficha |
| rival | nada por padrão; o mestre libera caso a caso | nada |

- A **ficha do Actor continua sob controle do mestre** — o jogador nunca abre a ficha
  pelo QUEDAÇO. Para aliados/figurantes o painel mostra um cartão só com nome + imagem
  + `note` curta se o mestre quiser.
- Só aparece para o jogador quando: `active === true` **e** `actor.uuid ∈ shared.npcs`
  **e** (para merchant) a aba `npcs` está em `shared.areas`.
- O mestre desativa (`active:false`) quando o grupo sai da cidade — some da vista do
  jogador na hora (o `onChange` de setting já re-renderiza; para o flag do Actor, usar
  `Hooks.on('updateActor')` re-renderizando o painel aberto).

## Aba NPCs do painel (`app.mjs > renderArea`, hoje placeholder)

**Mestre:**

- Quatro seções: Mercadores, Aliados, Rivais, Figurantes — listando Actors por
  `flags.quedaco.npc.role`.
- Botão **"Marcar um NPC"**: seletor de Actors NPC do mundo → grava
  `flags.quedaco.npc = { role, active:true }` e abre o editor.
- Cartão de cada NPC: imagem + nome + local + toggles **Ativo** e **Liberar aos
  jogadores** (canto superior direito, padrão M2 do `T-MAPA-IMAGENS.md`), botão
  **Editar** e, para merchant, **Abrir loja (prévia)**.
- **Editor**: `role`, `placeId` (select dos locais), `note`. Para merchant: `markup` +
  lista de estoque (adicionar item do catálogo — só compêndio —, `price`/`qty`/`note`,
  remover) + **"Criar item tabelado"**.

**Jogador:** só os NPCs conforme a tabela de visibilidade acima.

**Atalho pela ficha:** `getActorSheetHeaderButtons` (ou equivalente v13) adiciona
"QUEDAÇO · NPC" nas fichas com o flag; abre o painel na aba NPCs apontando esse NPC.

## Loja (compra)

- Cabeçalho: nome do vendedor, `note`, **bolsa do comprador** (k/p/t de
  `buyerActor.system.currency`, via `wallet`/`walletTotal` de `rules.mjs`).
- Lista do estoque: imagem, nome, preço unitário calculado, volume, `qty` disponível,
  campo de quantidade, **Comprar**.
- `buyerActor` = `game.user.character`; se faltar, pedir para escolher.

### Transação — `adapter.mjs`

```
export async function purchaseItem(buyer, merchantActor, entry, qty)
```

- Valida `buyer.isOwner`; `qty` inteiro ≥ 1; item existe no compêndio.
- unit = `entry.price ?? Math.round((doc.system.price ?? 0) * (shop.markup ?? 1))`.
- total = `unit * qty` (Trocados). Se `walletTotal(buyer.system.currency) < total` →
  `throw Error('Moeda insuficiente.')`.
- Debita: `buyer.update({ 'system.currency': wallet(walletTotal(...) - total) })`.
- Entrega: `buyer.createEmbeddedDocuments('Item', [source])`, `source = embeddedSource(doc)`
  com `system.quantity = qty`. **Nunca** item de Mundo.
- `entry.qty` numérico → `merchantActor.update` decrementando no flag; a 0, esconder.
- Segurança: roda como o jogador; ele poderia chamar a API direto e burlar. Mesa
  privada — aceitável no MVP; registrar como limite.

## "Criar item tabelado"

Só do mestre, só com `quedaco.itemCompendium` configurado.

- Campos: nome, categoria do livro (select das categorias de `src/book-items.mjs`).
- Casou nome normalizado com entrada de `book-items.mjs` → pré-preenche preço e volume;
  senão o mestre digita.
- Categoria → `type` (conferir schema real do Skyfall em `Data/systems/skyfall`):
  Armas* → `weapon`; Armaduras e escudos → `armor`; Vestimentas → `clothing`;
  Consumíveis → `consumable`; Munição/Equipamentos/Serviços → `equipment`;
  Sigilos/Materiais/Artefatos/Sinapses → `loot`.
- `Item.create({ name, type, img, system: { price, volume/… } }, { pack: quedaco.itemCompendium })`.
- Adiciona ao `stock` do vendedor.

## Testes

`tests/shop.test.mjs`:
- `purchaseItem`: saldo suficiente debita e entrega a quantidade certa; saldo
  insuficiente lança e não altera nada; estoque finito decrementa; source sempre com
  `compendiumSource` (nunca item de Mundo).
- Visibilidade: função pura que, dado `{role, active, sharedNpcs}`, devolve o que o
  jogador enxerga — cobrir os 4 papéis.
- Mocks no estilo `library.test.mjs`.

## Vínculos entre NPCs — árvore/rede de relações (T9)

Yuri quer um "plano gigante" com NPCs ligados por linhas: familiares (pai, mãe, filho,
irmão) e sociais (aliado, conhecido, inimigo).

### Dados — lista de arestas num setting

`quedaco.npcLinks` (`scope:'world'`, `config:false`, `Array`, default `[]`):

```js
[ { from: "Actor.xxxx", to: "Actor.yyyy", type: "pai" | "mãe" | "filho" | "irmão" | "aliado" | "conhecido" | "inimigo", note: "" } ]
```

- Familiares são **direcionais** (`from` é o pai/mãe de `to`); sociais são simétricos
  (renderizar sem seta). Deduplicar simétricos (a↔b == b↔a).
- Nós que só existem no grafo mas ainda não são Actors: permitir `to`/`from` como
  string livre `"txt:Nome do parente"` para parentes fora da mesa (avô falecido etc.).
- Posições dos nós no canvas: `quedaco.npcGraph = { [key]: { x, y } }` (key = uuid ou o
  `txt:` acima). Só o mestre mexe.

### Fase 1 — dados + lista (barato, entrega a maior parte do valor)

- No **editor de NPC** (aba NPCs): seção "Vínculos" — adicionar (`tipo` + alvo:
  select de Actors NPC ou texto livre) e remover.
- No **cartão do NPC**: linha "Filho de X · Irmão de Y · Inimigo de Z · Aliado de W".
- Filtro na aba: "só familiares" / "só sociais" / por tipo.

### Fase 2 — canvas visual

- Sub-aba "Árvore" na aba NPCs. Área grande com **pan** (arrastar o fundo) e **zoom**
  (roda do mouse) — `transform: translate() scale()` num wrapper; sem biblioteca.
- **Nós** = divs posicionados absolutos (retrato + nome), arrastáveis; soltar persiste
  `x,y` em `quedaco.npcGraph`.
- **Arestas** = um `<svg>` overlay por cima, `<line>`/`<path>` calculadas das posições
  dos nós; cor/traço por tipo (familiar sólido com seta, social tracejado, inimigo
  vermelho). Rótulo do tipo no meio da linha.
- Paleta lateral com os NPCs (`flags.quedaco.npc`) para arrastar pro canvas.
- Criar aresta: clicar nó A → clicar nó B → escolher tipo.
- Filtros: mostrar só um subconjunto de tipos; destacar a vizinhança de um nó
  selecionado.
- Só do mestre no MVP. Gancho para, no futuro, compartilhar uma versão filtrada
  ("o que os jogadores já descobriram").

### Testes

`tests/npc-graph.test.mjs`: normalização/dedup de arestas simétricas; direção mantida
em familiares; remoção; resumo textual por NPC a partir da lista de arestas.

### Ordem

Fase 1 **depois** de T7 (precisa do editor de NPC). Fase 2 quando Yuri pedir.

## Fora do MVP

Recompra pelo vendedor, moeda no caixa do vendedor, desconto por perícia, horários,
reabastecimento, log de transações, auto-layout do grafo. Deixar ganchos, não
implementar.
