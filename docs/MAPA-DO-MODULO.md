# Mapa do módulo — por funcionalidade

> Índice pra achar rápido onde uma funcionalidade mora, antes de sair grepando
> `src/library.mjs` (arquivo grande, tudo passa por ele). Cada linha diz: o que é, os
> arquivos e funções principais, os testes que cobrem, e se falta algo conhecido.
>
> **Atualize esta tabela sempre que criar ou mexer numa área** — é o que faz o próximo
> pedido ("melhorar a loja", "mexer nas guildas"...) começar direto na implementação, sem
> perder uma rodada só relendo o código. Ver também `docs/PROGRESSO-MAPA-CENAS.md` (a
> versão "por etapas" disto, pra uma funcionalidade grande em andamento) e
> `docs/REFERENCIA-SKYFALL.md` (o sistema por baixo, não o módulo).

## Loja / Vendas · exemplo completo

**O que é:** o Mestre marca um NPC como vendedor; jogadores compram do estoque dele
(carrinho, tudo-ou-nada) e vendem itens da própria ficha para qualquer NPC, com desconto
por atitude, condições do livro e pechincha.

| Peça | Onde |
|---|---|
| Preço nas 3 moedas | [rules.mjs:precoFormatado](../src/rules.mjs) |
| Cotação (compra/venda, atitude, condições, pechincha) | [negotiation.mjs:quote,sellQuote](../src/negotiation.mjs) |
| Compra/venda de verdade no Actor (débito, estoque, entrega) | [adapter.mjs:purchaseItem,purchaseCart,sellItem](../src/adapter.mjs) |
| Tela: abrir loja, montar carrinho, cartão do NPC vendedor | [library.mjs: openShop, cartFor, shopLineQuote, cartBlock, npcSellCard, npcGmStrip, coinNote](../src/library.mjs) (linha ~1146) |
| Ops de tela (`CampaignLibrary.action`) | `lib-cart-*` (4), mais os que abrem a ficha/loja |
| Visual | `styles/library.css` — bloco do cartão de item, carrinho, tira do GM |
| Testes | [adapter.test.mjs](../tests/adapter.test.mjs), [negotiation.test.mjs](../tests/negotiation.test.mjs) — compra debita e reduz estoque, insuficiente não altera nada, falha na entrega devolve a moeda, carrinho é tudo-ou-nada, venda paga metade do livro e credita a bolsa, venda parcial, quantidade maior que a ficha recusa |
| Doc original do pedido | `docs/T17-VENDINHAS-FASE2.md` |
| Falta conhecido | nenhum nesta rodada — foi a última coisa fechada antes da 0.8.0. Se for melhorar, comece lendo a tabela de condições de desconto do livro em `negotiation.mjs` antes de mudar a conta. |

**Pra melhorar a loja amanhã:** já dá pra abrir direto `negotiation.mjs` (a conta) e
`library.mjs` na linha 1146 (a tela) sem precisar re-explorar nada.

## NPCs

| Peça | Onde |
|---|---|
| Flag do NPC (papel, local, loja, forja) | [npcs.mjs](../src/npcs.mjs) — `flags.quedaco.npc` |
| Inferir região/local pela pasta ou pelo texto | `npcs.mjs: inferRegionId, inferPlaceId, regionIdFromFolderPath` |
| Cobertura regional (arquétipos esperados x existentes) | `npcs.mjs: npcCoverage` — **a exibição na tela some na tarefa 8** |
| Cartão de NPC na tela | `library.mjs: npcCard` (aba NPCs, e reaproveitado em `npcsForLocation`) |
| Geração de NPC novo | macro `.local/Skyfall-Criador-de-Conteudo.js` (fora do git) |
| Falta conhecido | painel da cena ativa (T6) ainda não reaproveita `npcsForLocation` no lugar certo — ver `docs/PROGRESSO-MAPA-CENAS.md` |

## Guildas e Hansas

| Peça | Onde |
|---|---|
| Dados de guilda, membros, nível, proteção da mesa | [guilds.mjs](../src/guilds.mjs) — `guildMembers, guildLevel, guildProtectionReasons, planGuildRedistribution` |
| Selo (P.I.P.I. e afins) | [seal-style.mjs](../src/seal-style.mjs) |
| Tela: abas Em jogo/Guardadas, filtro por guilda | `library.mjs: renderGuilds` |
| Redistribuir pela interface (T4) | `library.mjs: redistributeGuildMembers` — **feito, não commitado ainda em 17/09** |
| Macro (antes da T4 existir na tela) | `.local/guildas-em-jogo.js` |
| Testes | [guilds.test.mjs](../tests/guilds.test.mjs) — cobre os casos de proteção da P.I.P.I. |

## Mapa, atlas de cenas e teletransporte

Funcionalidade grande, em andamento — tem doc próprio de progresso, não repita aqui:
**[PROGRESSO-MAPA-CENAS.md](PROGRESSO-MAPA-CENAS.md)**.

## Monstros (catálogo do livro + importados de outros jogos)

| Peça | Onde |
|---|---|
| Catálogo do livro (bestiário, ND, página) | [book-monsters.mjs](../src/book-monsters.mjs) |
| Conversor D&D 5e → Skyfall | [monster-convert.mjs](../src/monster-convert.mjs) — ver `docs/T24-MONSTROS-COMPLETOS.md` pro estado exato |
| Filtro/facetas na tela (tipo, papel, porte, ND) | `library.mjs: monsterFacetValues, monsterMatches` |
| Região/habitat de cada monstro do mundo | macro `.local/distribuir-monstros-por-regiao.js` → `flags.quedaco.monster` |
| Falta conhecido | traços/magia/hierarquia/arquétipo já viram Itens (T24, passos 4–5, feito 17/09) — mas **não verificado no Foundry**; reconverter os 326 já importados (perderam dado na 1ª importação); filtro de região na tela ainda não lê a flag (tarefa 10) |

## Mundo do livro (regiões, locais, moedas)

| Peça | Onde |
|---|---|
| Regiões, locais, Quedas, luas | [book-world.mjs](../src/book-world.mjs) — `REGIONS`, `PLACES`, `BEYOND` |
| Cor de região/pasta | [regions.mjs](../src/regions.mjs) |
| Pesos de localidade (capital sempre lidera) | [locality.mjs](../src/locality.mjs) |
| Moedas | `book-world.mjs: COIN_COMMON, COIN_FACES` |

## Itens e Imbuir

| Peça | Onde |
|---|---|
| Conversão de item externo pra Skyfall | [item-convert.mjs](../src/item-convert.mjs) |
| Modificação de item (T-ITEM-MODIFICADO) | [item-mod.mjs](../src/item-mod.mjs) |
| Categoria/estilo do cartão de item | `library.mjs: ITEM_CATEGORY_STYLE, itemProperties, itemDescriptors` |

## Criação de personagem (jogador)

| Peça | Onde |
|---|---|
| Interface, navegação, 13 etapas | [app.mjs](../src/app.mjs) |
| Grafo de benefícios/escolhas | [benefits.mjs](../src/benefits.mjs) |
| Marcos de classe 1–12 | [progression.mjs](../src/progression.mjs) |
| Perícias, proteções, idiomas | [training.mjs](../src/training.mjs) |
| Equipamento inicial | [equipment.mjs](../src/equipment.mjs) |
| Regras puras (atributo, vida, dinheiro, capacidade) | [rules.mjs](../src/rules.mjs) |

---

## Como usar isto ao pegar uma tarefa nova

1. Ache a área na tabela acima. Se ela já tem "Falta conhecido" listado, comece por ali.
2. Abra só os arquivos citados — não releia `library.mjs` inteiro.
3. Se a área não está na tabela, é nova: depois de codar, **acrescente uma seção aqui**.
4. Pra saber o que existe *no mundo agora* (quantos NPCs, quais guildas estão em jogo,
   etc.), não dá pra ler isto — isto é o código. Use o snapshot do mundo:
   **[COMO-CONSULTAR-O-MUNDO.md](COMO-CONSULTAR-O-MUNDO.md)**.
