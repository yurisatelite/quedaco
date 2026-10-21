# Mapa do módulo — por funcionalidade

## Grupos por código/texto e população — 0.20.0

- `src/npc-population.mjs`: planNpcPopulation/stageNpcPopulation sorteiam por seed/pesos, validam escopo/legados/perfis e fixam purposeProfileId. prepareNpcGroup recebe documento JSON ou objeto e integra fila/preparação; createPreparedNpcGroup delega à criação assinada existente. Sem interface obrigatória.
- `src/npc-batch-content.mjs`: getNpcBatchInstructions().populationEngine fornece contrato, modelos e exemplo real de Maruma (local maruma, região blurghta).
- `src/npc-requests.mjs`: prévia rejeita nomes repetidos no grupo e Criador sem capability de perfil explícito. Os pedidos persistem em Journals privados; Actors só na chamada de criação.
- `tests/npc-population.test.mjs`: sorteio determinístico, escopos, pesos, ânima, pendências, duplicidade, documento → fila → Actor via API, sem cliques. Navegador: tools/test-npc-batch-ui.mjs.
- Uso: `docs/GRUPOS-NPCS-PARA-IA.md`. Sem planejamento automático de Scenes/tokens/pastas, IA interna ou demografia canônica.

## Descrição e fila de NPCs — 0.19.0 (20/10/2026)

- `src/npc-requests.mjs`: Journals privados, IDs/revisões, seleção por lote/origem, preparação, assinaturas, criação e diagnóstico. Sem segredos em settings.
- `src/npc-generation-profiles.mjs`: propostas de propósito/ânima, validação de perfis e escopo por região/localidade; importados como npcGenerationProfiles pelo Cadastro.
- `src/panels/npc-request-controls.mjs`: formulário/seleção no importador de Ambientação existente, revisão das decisões e ação de criação.
- `src/world-catalog.mjs`: preserva descrições locais, comércio, governo e pistas regionais; valida escopos dos perfis.
- `tests/npc-requests.test.mjs`: persistência/privacidade/revisão, criação selecionada, repetição e erros. `tools/test-npc-batch-ui.mjs`: teste de interface no navegador com mocks.
- Guia e diagnóstico: `docs/MOTOR-NPCS-POR-DESCRICAO.md`, `docs/DIAGNOSTICO-NUTRICAO-NPCS.md`.

## Lotes de NPCs (17/10/2026)

- `src/npc-batch-content.mjs`: formato QUEDACO-NPCS 1, conversão de texto/JSON para pacote de Ambientação, exemplo e instruções consultáveis em `api.getNpcBatchInstructions()`.
- `src/catalog-content.mjs`: parser unificado e validação dos modelos com equipe, tags, descrição, imagens e módulo de origem.
- `src/npc-models.mjs`: `previewNpcBatch` e `createNpcBatch` selecionam modelos do Cadastro por IDs/organização/ambiente e delegam ao Criador 0.1.9. Revisão do Cadastro e assinatura acompanham a criação.
- `src/panels/ambient-import.mjs`: instruções no importador existente, prévia de lote, confirmação e relatório. Fallback individual permanece para Criadores antigos.
- `tests/npc-batch.test.mjs`: documento -> Cadastro -> API do Criador, seleção/revisão e dados de equipe.
- Uso e contrato: `docs/LOTES-DE-NPCS.md`. O módulo não interpreta prosa arbitrária com IA; o assistente prepara o documento conforme o guia.

## Importação de ambientação e modelos de NPC (15/10/2026)

- `src/catalog-content.mjs`: contrato v1, JSON/TXT/MD, validação estrita de perfis,
  ambientes e modelos; não executa código nem cria Actors.
- `src/world-catalog.mjs`: `planAmbientContent`, prévia, aplicação atômica na revisão
  esperada, exportação e consultas. Repetição idêntica não grava.
- `src/panels/ambient-import.mjs`: DialogV2 de prévia/Aplicar e prévia separada para
  criar fichas; `src/panels/ambientacao.mjs` lista ambientes e modelos do catálogo.
- `src/npc-models.mjs`: ponte opcional com API `npcTemplates` do Criador independente.
  `src/adapter.mjs:catalogCreatedNpc` registra somente a ficha recém-criada.
- `src/library.mjs` lê as organizações do catálogo atual no editor de NPC.
- `tests/catalog-content.test.mjs`: dados falsos para lote, referências, repetição,
  visibilidade, validação e ponte. Falta conferir DialogV2 e criação completa no Foundry.
- Contrato e instruções: [CONTEUDO-AMBIENTACAO.md](CONTEUDO-AMBIENTACAO.md).

> Escopo ativo: [Foco da campanha — Thur Thur](FOCO-THURTHUR.md). O filtro reversível mora em `src/campaign-focus.mjs` e usa o setting `campaignFocus`.

> Índice pra achar rápido onde uma funcionalidade mora, antes de sair grepando
> `src/library.mjs` (arquivo grande, tudo passa por ele). Cada linha diz: o que é, os
> arquivos e funções principais, os testes que cobrem, e se falta algo conhecido.
>
> **Atualize esta tabela sempre que criar ou mexer numa área** — é o que faz o próximo
> pedido ("melhorar a loja", "mexer nas guildas"...) começar direto na implementação, sem
> perder uma rodada só relendo o código. Ver também `docs/PROGRESSO-MAPA-IMERSIVO.md` (a
> versão "por etapas" disto, pra uma funcionalidade grande em andamento) e
> `docs/REFERENCIA-SKYFALL.md` (o sistema por baixo, não o módulo).

## Vendedores (módulo independente — o painel só reconhece)

O vendedor é o módulo **`quedaco-npcs-de-venda`** (repositório próprio, `E:\RPG\QUEDACO\quedaco-npcs-de-venda`); o QUEDAÇO só **lê** a flag dele. Detalhes e decisão pendente: [T30-VENDEDORES-RECONHECIDOS.md](T30-VENDEDORES-RECONHECIDOS.md).

| Peça | Onde |
|---|---|
| Ler a loja de um ator, distribuição por local | [vendors.mjs](../src/vendors.mjs) — `vendorShop, isVendor, vendorDistribution, vendorLabel, vendorModuleActive` |
| Selo no cartão e quadro "Vendedores por local" | [panels/vendedores.mjs](../src/panels/vendedores.mjs); filtro em `library.mjs` (`lib-npc-vendor-filter`, `lib-npc-place-filter`) |
| Testes | [vendedores.test.mjs](../tests/vendedores.test.mjs) |

## Loja / Vendas · exemplo completo

> **Atenção (13/10/2026):** esta é a loja **antiga** do QUEDAÇO. O jogador compra pelo módulo independente de vendas; o que fazer com este código é decisão pendente do Yuri (`T30-VENDEDORES-RECONHECIDOS.md`). Não apagar sem essa decisão.

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
| Falta conhecido | **diálogo do vendedor** (o NPC "falar", com escolhas) — pesquisa e recomendação em [T28-DIALOGO-DE-VENDA.md](T28-DIALOGO-DE-VENDA.md), decidido em 11/10/2026 e especificado; handoff em [COMANDO-CODEX-12.md](COMANDO-CODEX-12.md). De resto, nada: foi a última coisa fechada antes da 0.8.0. Se for melhorar, comece lendo a tabela de condições de desconto do livro em `negotiation.mjs` antes de mudar a conta. |

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
| Falta conhecido | nada pendente aqui (o painel da cena ativa saiu em 13/10/2026 — ver `docs/T29-PAINEL-SO-DA-MESTRA.md`) |

## Ambientação

| Peça | Onde |
|---|---|
| Organizações e seus dados de referência | [ambientacao.mjs](../src/ambientacao.mjs) — `ORGANIZATIONS` |
| Uniformes, comportamento e equipamentos por função | [organization-profiles.mjs](../src/organization-profiles.mjs) — `campaignProfile`, material de campanha explícito, disponível na API e na aba |
| Associação de uma ficha nativa à organização | `library.mjs: renderNpcEditor, saveNpc` — grava apenas `flags.quedaco.npc.organizationId` no Actor existente |
| Lista de equipes | [panels/ambientacao.mjs](../src/panels/ambientacao.mjs) — lê `game.actors`; não cria nem duplica fichas |
| Testes | [ambientacao.test.mjs](../tests/ambientacao.test.mjs) |

Fichas e conteúdo privado DIPS/COPA: `.local/organizacoes/`, fora do Git e do
pacote. `preparar.mjs` gera o documento de campanha, JSON, importador autônomo e
comando de console com hash. O importador incorpora, na preparação local, os
resolvedores do módulo de personagens; **não importa módulos em execução** e
não cria dependência no manifesto. O ciclo é leitura dos compêndios → prévia e
validação de todas as fichas → Aplicar → criação sequencial de Actors nativos.
Não roda no init/ready. Nomes existentes são preservados, nunca adotados por
coincidência; marcadores de importação permitem identificar retornos. Falha
parcial interrompe o lote e deixa a ficha marcada para revisão, sem apagar
documentos. Relações viram links `@UUID` na biografia dos Actors recém-criados.
Conferência integrada de fichas permanece necessária; os testes privados usam
compêndios falsos e não comprovam o conteúdo real de todas as escolhas.

## Guildas e Hansas

| Peça | Onde |
|---|---|
| Dados de guilda, membros, nível, proteção da mesa | [guilds.mjs](../src/guilds.mjs) — `guildMembers, guildLevel, guildProtectionReasons, planGuildRedistribution` |
| Selo (P.I.P.I. e afins) | [seal-style.mjs](../src/seal-style.mjs) |
| Tela: abas Em jogo/Guardadas, filtro por guilda | `library.mjs: renderGuilds` |
| Redistribuir pela interface (T4) | `library.mjs: redistributeGuildMembers` — **feito, não commitado ainda em 17/09** |
| Macro (antes da T4 existir na tela) | `.local/guildas-em-jogo.js` |
| Testes | [guilds.test.mjs](../tests/guilds.test.mjs) — cobre os casos de proteção da P.I.P.I. |

## Mapa Imersivo (mapa, atlas de cenas, teletransporte, cena ativa)

Nome dado pelo Yuri em 17/09/2026. Funcionalidade grande, em andamento — tem doc próprio
de progresso, não repita aqui: **[PROGRESSO-MAPA-IMERSIVO.md](PROGRESSO-MAPA-IMERSIVO.md)**.
Atalho pra achar código (22/09/2026):

| Peça | Onde |
|---|---|
| Dado puro do atlas (hierarquia, arestas, posição das caixas) | [scene-atlas.mjs](../src/scene-atlas.mjs) — `buildSceneAtlasTree`, `resolveSceneLocality`; `atlas.layout[regionId]['place:x'|'scene:y'|'region:z']={x,y}` em pixels, gravado por `setAtlasLayoutPosition` |
| Quebra-cabeça por região (arranjo inicial, linhas, portais pra fora) | `scene-atlas.mjs: buildRegionPuzzle` (dado) → `panels/mapa-imersivo.mjs` (tela) → `app.mjs: _bindPuzzle` (arrastar caixa = grava posição; arrastar cena da bandeja pra uma caixa = `dropAtlasScene`) |
| Banco de mapas e seleção visual | [map-bank.mjs](../src/map-bank.mjs) (fontes, 48 recomendações, saídas planejadas); [BANCO-DE-MAPAS.md](BANCO-DE-MAPAS.md) (catálogo); `panels/mapa-imersivo.mjs: renderAtlasPuzzle` (cartões e prévia); `app.mjs` (FilePicker e aplicação). O botão **Registrar fundos das cenas vinculadas** lê somente o `background.src` real de cenas já ligadas à localidade e grava os caminhos marcados no banco, sem criar, editar ou mover Scenes. |
| Criar cenas com mapas escolhidos | `scene-atlas.mjs: missingPlaceScenePlan` (plano puro); `library.mjs: setMapBankFile, missingMappedScenes, createMappedScenes` (setting, prévia, Scene.create e save único no atlas) |
| Lista (árvore de `<details>`) | `library.mjs: renderSceneAtlas` com `state.atlasView='list'`; acordeões lembram estado em `state.atlasOpen` via evento `toggle` em `app.mjs` |
| ~~Aba Cena Atual~~ | **Removida em 13/10/2026 (T29).** Sobraram os auxiliares puros `scene-atlas.mjs: sceneNeighborhood, regionLocalityTree` (testados, sem uso na tela) e o CSS `.sy-active-scene*`, `.sy-npc-tree*` — limpar quando mexer ali. |
| World Explorer (módulo de terceiros) | [world-explorer.mjs](../src/world-explorer.mjs) — tudo blindado; `library.mjs: explorationButton`. Formato do dado dele: `docs/REFERENCIA-SKYFALL.md`, seção "Módulos de terceiros" |
| Hooks | `main.mjs`: `canvasReady` (re-render), `deleteScene` (limpa entrada e posição), `updateScene` (pergunta ao ativar) |
| Testes | [scene-atlas.test.mjs](../tests/scene-atlas.test.mjs), [world-explorer.test.mjs](../tests/world-explorer.test.mjs), `library.test.mjs` ("quebra-cabeça do Mapa Imersivo", "painel da cena ativa") |

## Monstros (catálogo do livro + importados de outros jogos)

| Peça | Onde |
|---|---|
| Catálogo do livro (bestiário, ND, página e índice de habitat) | [book-monsters.mjs](../src/book-monsters.mjs) — cada entrada do livro traz `placeId`, `regionId` ou `beyondId` conforme a tabela da macro |
| Conversor D&D 5e → Skyfall | [monster-convert.mjs](../src/monster-convert.mjs) — ver `docs/T24-MONSTROS-COMPLETOS.md` pro estado exato |
| Filtro/facetas na tela (tipo, papel, porte, ND, região e além de Opath) | `library.mjs: monsterLocation, monsterFacetValues, monsterMatches` |
| Região/habitat de cada monstro do mundo | macro `.local/distribuir-monstros-por-regiao.js` → `flags.quedaco.monster`; a flag prevalece sobre o índice do livro |
| Biografia em ficha de campo (T24 §3) | `monster-convert.mjs: buildFieldSheet, alignmentPhrase, tacticsFromItems`; `toSkyfallNpc(mob,{habitat,fieldSheet})`. Temperamento sai da tendência (`mob.alignment`, lida nos 3 normalizadores), Táticas dos Itens gerados, Habitat passado por quem chama (a macro de reconversão lê `flags.quedaco.monster`). Aparência/Comportamento/O que quer/Ganchos vêm de `fieldSheet` — sem ela, "—" |
| Auditoria e reparo de ficha convertida | `monster-convert.mjs: originalTextFromBiography, auditMonsterSheet, repairMonsterItems`. Lê a seção Original preservada na biografia, compara ataques/traços/Ataque Múltiplo aos Items atuais e gera somente as peças ausentes; não grava Actor por conta própria. |
| Fichas de campo escritas | `.local/fichas-de-campo.json` — 44 entradas do bestiário **do livro** (não dos de D&D); nenhum código lê ainda — os do livro são fichas nativas do compêndio, não passam pelo conversor |
| Falta conhecido | traços/magia/hierarquia/arquétipo já viram Itens (T24, passos 4–5, feito 17/09) — mas **não verificado no Foundry**; reconverter os 326 já importados (perderam dado na 1ª importação) |

## Mundo do livro (regiões, locais, moedas)

| Peça | Onde |
|---|---|
| Regiões, locais, Quedas, luas | [book-world.mjs](../src/book-world.mjs) — `REGIONS`, `PLACES`, `BEYOND` |
| Cor de região/pasta | [regions.mjs](../src/regions.mjs) |
| Pesos de localidade (capital sempre lidera) | [locality.mjs](../src/locality.mjs) |
| Moedas | `book-world.mjs: COIN_COMMON, COIN_FACES` |
| Conferência da região-espelho | `library.mjs: regionReadiness, renderRegionReadiness`, no topo de `renderRegionView`; cruza NPCs, cenas, atlas e rumores sem gravar. `scene-atlas.mjs: resolveSceneLocality({includeLegacy:false})` separa cena apenas vinculada pelos settings de uma realmente organizada no Mapa Imersivo. |

## Itens e Imbuir

| Peça | Onde |
|---|---|
| Conversão de item externo pra Skyfall | [item-convert.mjs](../src/item-convert.mjs) |
| Modificação de item (T-ITEM-MODIFICADO) | [item-mod.mjs](../src/item-mod.mjs) |
| Categoria/estilo do cartão de item | `library.mjs: ITEM_CATEGORY_STYLE, itemProperties, itemDescriptors` |

## Imagens da mesa

| Peça | Onde |
|---|---|
| Candidatos, manifesto e fallback | [images.mjs](../src/images.mjs) — `resolveImage, ImageResolver` |
| Índice contra 404 | `images.mjs: buildImageIndex, indexedImageCandidates`; o setting de mundo `imageIndex` guarda somente os caminhos existentes sob a `assetRoot` atual |
| Ação da Mestra | `library.mjs: reindexImages`, botão “Reindexar imagens” no topo da biblioteca; lista uma vez as subpastas conhecidas com `FilePicker.browse` |
| Testes | [images.test.mjs](../tests/images.test.mjs) — índice restringe candidatos existentes; sem índice conserva a tentativa por convenção |

## Sistema visual do painel da Mestra

Regras de espaçamento, chip e card em **[DESIGN-SISTEMA-VISUAL.md](DESIGN-SISTEMA-VISUAL.md)**
— confira antes de escrever CSS novo em `styles/library.css`/`styles/creator.css`.
`npm run lint:css` (Stylelint) audita o CSS; config em `.stylelintrc.json` (regras que
não geram falso positivo) e `.stylelintrc.audit.json` (inclui `no-duplicate-selectors`,
rodar manualmente de vez em quando, é barulhento pelo estilo de override do arquivo).

## Janela do painel e criação de personagem

A criação de personagens **não mora mais aqui** (removida em 0.18.2, 15/10/2026): o fluxo de
13 etapas, `benefits.mjs`, `progression.mjs`, `training.mjs`, `equipment.mjs`, as funções de
criação do `adapter.mjs` (`createDraft`, `addResolvedPlan`, `addInventory`,
`finalizeClassProgression`, `finalizePathProgression`, `applyHitPointProgression`,
`refillResources`, `actorSource`, `addDocument`) e as regras de atributo/vida/dinheiro inicial
do `rules.mjs` vivem só no módulo independente `quedaco-personagens-skyfall-rpg`
(`E:\RPG\QUEDACO\personagens-skyfall-rpg`). Não traga código de criação de volta.

| Peça | Onde |
|---|---|
| Janela do painel (abas, mapa, quebra-cabeça, cliques e campos) | [app.mjs:CampaignApp](../src/app.mjs) |
| Catálogo dos compêndios (usado pelo painel) | [catalog.mjs](../src/catalog.mjs), [coverage.mjs](../src/coverage.mjs) |
| Regras puras que sobraram (modificador, moedas, preço, antecedentes) | [rules.mjs](../src/rules.mjs) |
| Estilos-base da janela (`.sy-creator` é a classe da janela do painel, nome histórico) | [creator.css](../styles/creator.css) |
| Família QUEDAÇO (registro dos módulos satélites, Protocolo v1: `quedaco:register`, `module.api.family`, aba **Módulos** da Mestra) | [family.mjs](../src/family.mjs) (registro puro), [family-view.mjs](../src/family-view.mjs) (aba), `main.mjs` (liga hook + `api.family`), teste `tests/family.test.mjs` |

---

## Como usar isto ao pegar uma tarefa nova

1. Ache a área na tabela acima. Se ela já tem "Falta conhecido" listado, comece por ali.
2. Abra só os arquivos citados — não releia `library.mjs` inteiro.
3. Se a área não está na tabela, é nova: depois de codar, **acrescente uma seção aqui**.
4. Pra saber o que existe *no mundo agora* (quantos NPCs, quais guildas estão em jogo,
   etc.), não dá pra ler isto — isto é o código. Use o snapshot do mundo:
   **[COMO-CONSULTAR-O-MUNDO.md](COMO-CONSULTAR-O-MUNDO.md)**.


## Cadastros compartilhados (14/10/2026)

Contrato e roteiro em [CADASTROS-COMPARTILHADOS.md](CADASTROS-COMPARTILHADOS.md).

| Peça | Onde |
|---|---|
| Catálogo público agregado, validação, revisão, aliases, perfis ambientais | src/world-catalog.mjs — baseWorldCatalog, updateCatalogRecord, createWorldCatalogService |
| Editor da Mestra, salvo apenas por botão | src/panels/world-catalog.mjs — openWorldCatalogEditor, botão na aba Módulos |
| API de descoberta | main.mjs — family é string; objeto passa a familyRegistry; capability worldCatalog |
| Integração no painel | library.mjs — catalogRegions/catalogPlaces; panels/mapa-imersivo.mjs |
| Sincronização | setting worldCatalog → quedaco:catalog-updated |
| Testes | tests/world-catalog.test.mjs; DOM falso do editor em .local/verify-catalog-editor.mjs |

Localidades personalizadas entram no Mapa Imersivo e nos seletores. O foco reversível de Thur Thur continua respeitado. O novo cadastro amplia metadados; não cria Actors, Scenes ou dados dos satélites automaticamente.

## Revisão visual / teste de layout (15/10/2026)

Prévia sem Foundry: `tools/visual-server.mjs` (serve `src/`, `styles/`) + `tools/visual-fixture.mjs`
(dados falsos, renderizadores reais de `CampaignApp`). `node tools/test-layout.mjs` percorre 5
tamanhos de janela × 11 áreas/variantes e falha se algum botão/título/grade passar da borda do
`.sy-shell`, se `<main>` rolar na horizontal ou houver `header/nav` sticky no conteúdo (exclui
`.sy-area-nav` e `.sy-puzzle-scroll`, que rolam de propósito). Prints em `.local/visual-review/`.
`node tools/probe-layout.mjs <área> <variante|-> <largura> [altura]` lista quais elementos
estouram o `<main>` — use pra achar a causa antes de mexer no CSS. Requer Chrome
(`QUEDACO_BROWSER_PATH` pra mudar o caminho) e `playwright-core`.

Causas reais achadas e corrigidas:
- `.sy-area-nav button` sem `flex:0 0 auto;width:auto`: o `button{width:100%}` do Foundry espremia
  as abas de área até sobrepor umas às outras (`styles/creator.css`).
- `.sy-scene-atlas{display:grid}` sem coluna: o quadro do Mapa (min-content ~1070px) alargava a
  coluna implícita e a tela inteira passava da janela. Agora `grid-template-columns:minmax(0,1fr)`.
- Título do editor de NPC com nome longo sem espaço alargava o grid inteiro: `.sy-library-detail`
  com `min-width:0` e `h3` com `overflow-wrap:anywhere`.
- `.sy-npc-level-range label` herdava `flex-direction:column` de `.sy-npc-filters label`
  (display inline-flex vira flex dentro de flex, e a direção não era redefinida).

Lição geral: todo `display:grid` sem `grid-template-columns` e todo item de grid/flex com texto
longo precisa de `minmax(0,1fr)`/`min-width:0` — é a causa nº 1 de estouro neste módulo.


## Integração de lotes — 0.20.2 (21/10/2026)

Em src/npc-models.mjs, batchSelection verifica a capability opcional npcTemplateResolution do Criador 0.3.3 antes de preparar/criar lotes. Falta da capability informa a atualização necessária, sem dependência obrigatória. Regressão em tests/npc-batch.test.mjs. A prévia privada dos 37 modelos de Thur Thur passou com estrutura dos compêndios reais; criação completa ainda precisa ser conferida depois da instalação.
