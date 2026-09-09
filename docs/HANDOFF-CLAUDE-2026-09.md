# Handoff — rodada de correções e biblioteca (Claude, set/2026)

Documento para quem retomar o QUEDAÇO (Codex/GPT ou outra sessão). Resume o que
mudou da 0.3.2 até a 0.4.2, o que foi aprendido do sistema Skyfall, a arquitetura
das partes novas e o que ainda falta conferir.

## Versões

- **0.3.2** — base publicada antes desta rodada (criador de personagem + estruturas
  vazias de Mapa/Monstros/Itens).
- **0.4.0** — só ficou como *draft* no GitHub, nunca publicada. Não use.
- **0.4.1** — biblioteca da campanha + revisão da criação + manifesto `verified: 13`.
  Publicada.
- **0.4.2** — correções sobre a 0.4.1 (trilha na ficha, imagem por local, logo/mapa).
  É a que deve estar como *latest*.

Manifesto permanente: `https://github.com/yurisatelite/quedaco/releases/latest/download/module.json`

## O que mudou, por área (arquivos principais)

### Biblioteca da campanha (`src/library.mjs`, `src/book-*.mjs`, `styles/library.css`)
- `src/book-world.mjs` (10 regiões, 48 locais, 5 "além de Opath"), `book-monsters.mjs`
  (44 blocos), `book-items.mjs` + `book-sigils.mjs` (214 entradas). Dados de consulta
  do Livro Básico DIGITAL 1.25, **conferidos linha a linha** — ver `docs/CONFERENCIA-BIBLIOTECA.md`
  e os índices compactos em `.local/book/index/{world,monsters,items}.md`.
- `CampaignLibrary` renderiza Mapa/Monstros/Itens. `render(area, readonly)` — `readonly`
  é a vista do jogador (só conteúdo liberado, sem controles do mestre).
- Monstros: filtros por **tipo de criatura / papel / porte (Simples·Complexo·Chefão) / ND**
  (classificações reais do livro; o campo `movement` do `book-monsters.mjs` ficou legado,
  não é usado na UI).
- `book-monsters.mjs` também guarda `movement` só por histórico; correções de transcrição
  aplicadas: Kraken `aquatic`, Bando de Atobás e Mariposa gigante `terrestrial aerial`,
  sigilo "do Corpo Sarado" → "Preparo Físico".
- Imagens: monstros puxam `img` do Actor correspondente no compêndio (`loadActors` lê
  `img`); itens puxam `img` do Item correspondente (`itemCard` via `findMatches`).

### Compartilhamento com jogadores (settings de mundo)
- `registerLibrarySettings(game, onChange)` em `library.mjs` registra:
  - `quedaco.sharedContent` = `{ areas:[], map:[], monsters:[], items:[] }` — o que o
    mestre liberou. `areas` = abas visíveis ao jogador; `map/monsters/items` = ids de
    entradas visíveis. Liberar uma entrada abre a aba.
  - `quedaco.placeScenes` = `{ placeId: sceneId }` — cena do Foundry vinculada a um local.
  - `quedaco.placeImages` = `{ placeId: caminho }` — imagem opcional por local.
  - `quedaco.opathMapImage` (config visível) = caminho do mapa de Opath (asset da mesa,
    **não** vai no módulo — mesmo motivo da fonte Noka).
- `onChange` de todos re-renderiza o painel aberto (callback vem do `main.mjs`).
- Ops: `lib-share` (bucket:id), `lib-scene` (placeId:sceneId), `lib-open-scene`,
  `lib-activate-scene`, `lib-place-img` (tratado no `app.mjs`, abre FilePicker).
  Navegação (`lib-map/region/place`) e `lib-open-scene` liberadas ao jogador; o resto
  exige `assertGM()`.
- Hotspots do mapa: cada `REGIONS[i].hotspot = [x%, y%]` em `book-world.mjs`;
  `mapIndexBanner(interactive)` desenha os pinos sobre a imagem. **Coordenadas são
  estimativas** — afinar olhando o mapa carregado.

### Ponto de entrada (`src/main.mjs`, `src/app.mjs`)
- `openCreator(startArea)` — GM pode abrir numa aba específica.
- `Hooks.on('getSceneControlButtons')` adiciona um botão "QUEDAÇO" no controle de cena,
  só para o mestre, abrindo o painel completo em NPCs. Trata array (v12) e objeto (v13).
- Botão da aba Atores agora sempre abre em `characters`.
- `_renderHTML`: para não-GM, `areas` = `characters` + o que estiver em `shared.areas`;
  a barra de abas some quando só há uma. Área não liberada volta para `characters`.

### Revisão da criação (`src/app.mjs`, `styles/creator.css`)
- **Descrição**: removido o balão de hover (mostrava `@EMBED` cru). Clicar no `?`
  (`data-op="detail"`) abre `renderDetail()` **no rodapé da etapa** (`renderCatalog` e
  `renderBenefits` põem `${await this.renderDetail()}` por último), com `enrichHTML`,
  alterna, e rola até a descrição (`_scrollDetailIntoView`).
- CSS `.sy-detail`: sem `overflow-wrap:anywhere` (causava texto vertical), tabelas/blocos
  do Skyfall com `overflow-x:auto`, tipografia com `<strong>`/`<em>`/`<h*>` destacados.
- `.sy-help` (o `?`) reduzido; `.sy-shell` virou flex-column (footer fixo, área central
  cresce); coluna de etapas alargada; checkbox de perícias custom.
- `stepDone`: etapas 3 (Maldição) e 11 (Retrato) só marcam depois de `this.visited.has(i)`
  (marcado no `_renderHTML`).
- Progressão (`renderBenefits`): faixa por nível de 1 até `draft.level` — bloco
  "automático" onde não há escolha (`prog` vem de `classProgression`), bloco de escolha
  no nível certo. Removidas a `sy-timeline` e a lista achatada "Recebidos automaticamente".
- Magia duplicada: `spellPicks` bloqueia a mesma magia em blocos diferentes; `chooseBenefit`
  recusa e `errors()` acusa.
- Dinheiro (`renderMoney`): botão "Limpar" por seção + campo `draft.moneyOverride`
  (total final; `money()` aplica). `handleChange` trata `moneyOverride`.
- **Rolagens internas** (`rollAttributes`/`rollHitPoints`/`rollMoney`): não chamam mais
  `roll.toMessage(...)` — só `evaluate()`. Isso mata o erro `ChatMessage ... does not
  exist!` / `html.find is not a function`, que vinha do **item-piles 3.3.1** reagindo a
  essas mensagens no Foundry 13 (bug do item-piles, não do QUEDAÇO).

### Progressão de classe e trilha na ficha nativa (`src/adapter.mjs`)
Ver a seção seguinte ("Sistema Skyfall") para o porquê.
- `finalizeClassProgression(actor, level)` — depois de `addResolvedPlan`, faz um
  `cls.update({'system.origin': ['class-01'..'class-N'], 'system.level': N})`. Necessário
  porque o `_preCreate` da classe reescreve `system.origin` para `['class-01']` no create.
- `addResolvedPlan` — itens de trilha (`type === 'path'`) saem do lote e são criados
  **um a um** (com `BenefitsDialog.prompt` ainda stubado), para o `_preCreate` do Skyfall
  ver o estado real.
- `finalizePathProgression(actor)` — força `system.origin` da 1ª trilha para `['path-01']`
  e da 2ª para `['path-02']`, via `update`.
- `embeddedSource` não grava `system.origin` para `type === 'path'`.
- Ordem no `createCharacter`: `addResolvedPlan` → `finalizeClassProgression` →
  `finalizePathProgression` → `addInventory` → `update` de treinamento/flags →
  `applyHitPointProgression` → `refillResources`.

## Sistema Skyfall — como a ficha monta progressão (lido de `Data/systems/skyfall/skyfall.mjs`)

Isto é o que custou caro descobrir; guardar para não reinvestigar.

- **Nível do ator** = soma de `system.level` de cada item `class`
  (`Creature.prepareDerivedData`, ~linha 5953).
- **`ClassData._progression()`** (~6226) monta a árvore que a ficha desenha. Percorre
  `rootItems = ['legacy','curse','background', 'class-01'..'class-12', 'guild', 'bonus']`
  e, ao processar `class-02`, insere `path-01` logo depois; ao processar um root com
  `classLevel == 7`, insere `path-02`.
- Para cada root/benefício, procura em `itemOrigin` um item do ator cujo
  `system.origin` **contenha aquela string** (`class-05`, `path-01`, ou o `_id` do
  benefício). Ou seja: **o slot na ficha é definido por `system.origin`**.
  - Item de classe: `system.origin = ['class-01', ..., 'class-N']`, `system.level = N`.
  - Item de trilha: `system.origin` contém `'path-01'` (1ª) ou `'path-02'` (2ª).
  - Benefício concedido (feature/spell/feat): `system.origin = [<_id do benefício na
    classe/trilha>]`. Origin não reconhecido cai em `progression.bonus.children.feature`.
- **Fluxo manual na ficha**: clique-direito numa linha `.class-level` → menu lista as
  classes → `class.system.levelUp(originId)` (~7720). `levelUp` mexe em `system.origin`
  e `system.level` de todas as classes e, se o nível tem benefícios, abre
  `skyfall.applications.BenefitsDialog.prompt({item, level})`.
- **`Identity._preCreate`** → `_allowCreation()` + `system.identityOrigin()`:
  - `Class.identityOrigin()` (~7684): 1ª classe → `updateSource({initial:true,
    origin:['class-01']})` (por isso o QUEDAÇO precisa refixar por `update` depois).
  - `Path.identityOrigin()` (~7841): 1ª trilha → `updateSource({origin:['path-01']})`;
    se já existe uma trilha do mesmo `identifier` → empurra `'path-02'` e **cancela** a
    criação. Só funciona bem quando o item é criado sozinho (não no lote).
- O QUEDAÇO stuba `BenefitsDialog.prompt = () => null` durante a inclusão para não abrir
  os diálogos de escolha (ele resolve as escolhas por conta própria em `benefits.mjs`).

## Convenções do repo (do `CLAUDE.md`)

- Não inventar regras/campos. Conferir o PDF e o esquema do sistema em
  `C:/Users/YURI/AppData/Local/FoundryVTT/Data/systems/skyfall`.
- Não copiar textos longos nem imagens do livro para o repositório. Imagem do mapa de
  Opath e fontes Noka ficam como asset da mesa, referenciadas por configuração.
- `npm test` e `npm run package` antes de considerar pronto. Sem dependências externas
  em execução.
- Subir `module.json`/`package.json` só ao preparar versão instalável; nunca substituir o
  ZIP de uma versão já publicada — publicar versão nova.
- Testes em `tests/` rodam sem Foundry. 45 testes hoje.

## Pendências / conferir no Foundry

1. **Trilha (nível 2+)** e **progressão de classe** na ficha nativa — o mais importante.
   Criar ficha nível ≥3 com trilha e magias; abrir a ficha; ver níveis 2..N e o bloco de
   trilha preenchidos, sem buraco. Se falhar, pegar o `console.warn('system.origin', ...)`
   do Skyfall.
2. Botão no menu lateral (assinatura do `getSceneControlButtons` no build 351).
3. Descrições com bloco de ficha do Skyfall (ex.: "INFLAR"/"ASPECTO") — legibilidade no
   fundo escuro depois de afrouxar o `!important` de cor.
4. Miniatura de cena (`scene.thumb` no v13).
5. Ajuste fino dos 10 `hotspot` das regiões e das imagens por local, com o mapa ao vivo.
6. Logo do dragão: hoje é um SVG estilizado (`assets/quedaco-dragon.svg`); a ideia é
   vetorizar a arte real do dragão da mesa (ferida magenta no peito) e recolorir no gelo.
7. Itens adiados no `docs/BIBLIOTECA.md` ("Reservado para depois"): cenas por região,
   encontros, criação das ameaças faltantes como ficha, aplicação de modificações em
   Items, Quests, NPCs.
