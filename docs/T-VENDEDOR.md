# T-Vendedor — NPC de loja (versão leve)

> **Histórico.** Spec original da lojinha, escrita quando o trabalho ia para o Codex.
> Entregue e já superada duas vezes: as regras de preço estão em `T-NEGOCIACAO.md` e a
> segunda fase (carrinho, venda, atitude ao vivo) em `T17-VENDINHAS-FASE2.md`. A fila viva
> é `FILA-PROXIMA-ATUALIZACAO.md` — a `FILA-QUEDACO.md` citada abaixo não existe mais.

Spec para o Codex implementar. Fluxo: Claude especifica → Codex coda → Yuri confirma.
Fazer **depois** de T1 (trilha) e T2 (menu) da `FILA-QUEDACO.md`. `npm test` +
`npm run package` antes de dar por pronta.

## Objetivo

O mestre (ou uma IA de criação) gera **Actors NPC** — um por cidade, cada um vendendo
algo. O Actor é arrastado para a cena/mapa e vira token normalmente. Clicar nele abre a
ficha nativa (já funciona). O QUEDAÇO adiciona: marcar esse NPC como **vendedor**, dar a
ele um **estoque**, e uma **lojinha** onde o jogador compra — descontando a moeda da
ficha dele e recebendo o Item.

Regra dura: **nunca criar item solto de Mundo.** Todo item vendido — e todo "item novo
tabelado" — é um documento de **compêndio** (o compêndio canônico escolhido nas
configurações). Isso mantém o banco único sem precisar limpar o que já existe.

## Dados

### Flag no próprio Actor (não em setting global)

`actor.flags.quedaco.shop` — viaja com o Actor ao arrastar/duplicar/importar:

```js
{
  enabled: true,
  placeId: "kravokia",        // id de local do QUEDAÇO (opcional); liga o vendedor à cidade
  markup: 1,                  // multiplicador sobre system.price quando price do item vier vazio
  note: "Alquimista; só vende de dia.",
  stock: [
    { uuid: "Compendium.skyfall-core.equipment.Item.xxxx", price: null, qty: null, note: "" }
    // price null  -> usa system.price * markup
    // qty null    -> estoque infinito; número -> decrementa a cada compra
  ]
}
```

Por que flag e não setting: a IA/macro de criação de NPC pode escrever esse flag em
qualquer Actor do jeito que quiser; o QUEDAÇO só precisa ler. Desacopla a criação
(complexa, externa) da loja (simples, aqui).

### Setting novo

`quedaco.itemCompendium` (config **visível**, `String`, default `""`): o `collection`
do compêndio canônico onde os "itens tabelados" novos são criados
(ex.: `world.itens-da-mesa` ou `skyfall-core.equipment`). Se vazio, o passo "criar item
tabelado" fica desabilitado e avisa o mestre para configurar.

Registrar junto dos outros em `registerLibrarySettings` (`library.mjs`).

## Onde aparece (reusa a infra que já existe)

Aba **NPCs** do painel (hoje é placeholder em `app.mjs > renderArea`).

- **Mestre:** lista todos os Actors com `flags.quedaco.shop?.enabled`. Para cada um:
  cartão com nome/retrato + botões **Editar loja**, **Abrir loja (prévia)**,
  **Liberar aos jogadores** (mesmo `shareButton`, bucket novo `merchants` guardando
  `actor.uuid` — estender `emptyShare()` e o `sharedContent`).
  - Botão **"Marcar um NPC como vendedor"**: abre um seletor de Actors NPC do mundo;
    ao escolher, grava `flags.quedaco.shop = { enabled:true, markup:1, stock:[] }` e abre
    o editor.
- **Editor de loja** (seção no painel, não janela nova): campos `placeId` (select dos
  locais do QUEDAÇO), `markup`, `note`; e a lista de estoque — adicionar item
  (busca no catálogo `this.catalog`, só compêndio), definir `price`/`qty`/`note`,
  remover. Botão **"Criar item tabelado"** (ver abaixo).
- **Jogador:** a aba NPCs (quando `shared.areas` inclui `npcs`) mostra só os vendedores
  em `shared.merchants`. Clicar → **loja** (compra).
- **Atalho pela ficha:** `Hooks.on('getActorSheetHeaderButtons'...)` (ou equivalente v13)
  adiciona um botão "QUEDAÇO · Loja" nas fichas de Actor que tenham o flag; abre o painel
  direto na loja daquele vendedor (`openCreator('npcs')` + estado apontando o merchant).

## Loja (UI de compra)

Reusar o que já existe em `src/equipment.mjs`: `shopItems`, carrinho, `resolvePurchases`
foram feitos para o rascunho de criação — extrair o núcleo para uma função reutilizável
`renderShop(merchantActor, buyerActor)` ou aceitar que a loja do vendedor é uma versão
enxuta própria. MVP aceitável (enxuta própria):

- Cabeçalho: nome do vendedor, `note`, e a **bolsa do comprador** (k/p/t do
  `buyerActor.system.currency`, via `wallet`/`walletTotal` de `rules.mjs`).
- Lista do estoque: imagem, nome, **preço unitário** (calculado), volume, `qty`
  disponível, campo de quantidade, botão **Comprar**.
- `buyerActor` = o Actor do usuário atual. Se o jogador tiver mais de um, usar
  `game.user.character` e, na falta, pedir para escolher.

## Transação (em `src/adapter.mjs`)

```
export async function purchaseItem(buyer, merchant, entry, qty)
```

- Validar: `buyer.isOwner`; `qty` inteiro ≥ 1; item existe no catálogo/compêndio.
- Preço unitário: `entry.price ?? Math.round((doc.system.price ?? 0) * (merchant.flags.quedaco.shop.markup ?? 1))`.
- Custo total = `unit * qty` (em Trocados).
- Saldo: `walletTotal(buyer.system.currency) >= total`. Senão, `throw Error('Moeda insuficiente.')`.
- Debitar: `buyer.update({ 'system.currency': wallet(walletTotal(buyer.system.currency) - total) })`.
- Entregar: `buyer.createEmbeddedDocuments('Item', [source])` — `source` = `embeddedSource(doc)`
  com `system.quantity = qty` (mesmo padrão de `addInventory`). Nunca item de Mundo.
- Estoque finito: se `entry.qty` é número, `merchant.update` decrementando no flag; a 0,
  esconder do jogador.
- (Fora do MVP: creditar moeda ao vendedor, log em chat, recompra.)
- Segurança: a chamada roda como o jogador; ele poderia chamar a API direto e burlar.
  Mesa privada — aceitável no MVP. Registrar como limite conhecido.

## "Criar item tabelado" (item que não existe no compêndio)

Passo no editor de loja, só do mestre, só com `quedaco.itemCompendium` configurado:

- Campos: **nome**, **categoria do livro** (select das categorias de `src/book-items.mjs`).
- Ao escolher categoria/nome: se casar com uma entrada de `book-items.mjs`
  (nome normalizado), **pré-preencher preço e volume** dessa tabela; senão, o mestre
  digita preço e volume.
- Mapa categoria → `type` de Item: Armas* → `weapon`; Armaduras e escudos → `armor`;
  Vestimentas → `clothing`; Consumíveis → `consumable`; Munição/Equipamentos/Serviços →
  `equipment`; Sigilos/Materiais/Artefatos/Sinapses → `loot` (ajustar conforme o schema
  real do Skyfall — conferir em `Data/systems/skyfall`).
- Criar: `Item.create({ name, type, img, system: { price, volume/… } }, { pack: quedaco.itemCompendium })`.
  Conferir os caminhos de campo de preço/volume no schema do Skyfall antes.
- Depois de criado, adicionar automaticamente ao `stock` do vendedor.

## Extensibilidade (a criação de NPC vai ser complexa)

- O contrato é só o flag `flags.quedaco.shop`. Qualquer pipeline de criação (IA, macro)
  que escreva esse flag num Actor NPC ganha loja funcional.
- Itens novos entram sempre pelo compêndio → catálogo do módulo já os enxerga na
  próxima carga (`Catalog.load`).
- Novos tipos de item = só acrescentar no mapa categoria→type e, se preciso, em
  `ITEM_TYPES`/`typesFor` de `catalog.mjs`/`library.mjs`.

## Testes

- `tests/shop.test.mjs`: `purchaseItem` — saldo suficiente debita e entrega a quantidade
  certa; saldo insuficiente lança e não altera nada; estoque finito decrementa; item de
  Mundo nunca é criado (source sempre com `compendiumSource`).
- Mock de `buyer`/`merchant` no estilo dos mocks de `library.test.mjs`.

## Fora de escopo do MVP

Recompra pelo vendedor, moeda que vai pro caixa do vendedor, negociação/desconto por
perícia, horários, reabastecimento, log de transações no chat. Deixar ganchos, não
implementar.
