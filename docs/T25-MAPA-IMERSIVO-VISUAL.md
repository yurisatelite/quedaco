# T25 — Mapa Imersivo: acertos de uso e o mapa conceitual de verdade

> Pedido do Yuri, 17/09/2026, depois de testar a v0.9.0 no Foundry pela primeira vez.
> Mandou prints. Isto é o primeiro retorno de uso real do Mapa Imersivo — tudo abaixo
> veio de bater o olho nele funcionando, não de teste com dado falso.
>
> **Atualizado no mesmo dia**, depois de uma conversa de design sobre a seção 2 (o
> Yuri desenhou à mão o que queria) e sobre o item 4.2 (o módulo World Explorer, que
> ele já usa no mundo oficial). As decisões de design que faltavam já estão tomadas —
> não pergunte de novo o que este documento já resolve.

> **Estado em 22/09/2026:** §1.1–1.5 feitos pelo Codex (commits `a34ea0a`, `60c706d`);
> §1.7 (Cena Atual com mini-diagrama e árvore de NPCs), §2 (quebra-cabeça) e §4.2 (World
> Explorer) feitos pelo Claude. **Só falta o §1.6** (precisa de print com F12) e a conferência
> no Foundry. Onde a implementação escolheu algo que este documento deixava em aberto, está
> em `PROGRESSO-MAPA-IMERSIVO.md`, "Decisões de implementação".

**Antes de codar, leia [docs/PROGRESSO-MAPA-IMERSIVO.md](PROGRESSO-MAPA-IMERSIVO.md)** —
o estado de cada peça do Mapa Imersivo está lá, e esta tarefa muda esse estado.

---

## 0. O pedido original não foi atendido — isto é o principal

A citação que abriu o Mapa Imersivo dizia **"mapa conceitual"**. O que existe hoje
(`renderSceneAtlas`, `src/library.mjs`) é uma árvore de `<details>` aninhados — região
abre, dentro tem local, dentro tem cena, tudo em lista recuada. Funciona, mas não é o que
foi pedido. O Yuri mandou este print do que ele quer ver:

> Caixas coloridas por tipo (ele mandou azul, roxo, verde — cores diferentes, sem
> exigir que sejam exatamente essas), ligadas por linhas que mostram a relação de
> verdade — região liga em local, local liga em cena, cena liga em cena por
> teletransporte — **num diagrama visual**, não numa lista com recuo.

**Isto é a seção 2 deste documento, e é a maior peça — já com decisão de design tomada
(2.1).** A seção 1 são os ajustes de uso que apareceram testando o que já existe —
comece por eles, são menores e o quebra-cabeça vai se apoiar em cima da mesma árvore de
dados (`buildSceneAtlasTree`) que já funciona.

---

## 1. Bugs e ajustes de uso — pequenos, façam antes do diagrama

Cada item cita o arquivo e por que acontece, quando eu (Claude) consegui achar a causa
sem ver o Foundry rodando. Onde não consegui, digo que precisa reproduzir.

### 1.1 — Acordeões sempre abrem sozinhos quando têm conteúdo

**O que acontece:** toda região e todo local com pelo menos uma cena começa **aberto**
(`renderSceneAtlas`: `<details ... ${region.counts?.scenes?'open':''}>`; `renderSceneAtlasPlace`:
`<details ... ${count?'open':''}>`). Com 122 cenas na mesa, isso deixa a tela um mostrengo.

**Por que também parece "resetar" ao criar uma cena:** o `open` de cada `<details>` **não
é lembrado** — é recalculado do zero a cada `render()`, a partir da contagem de cenas.
Toda ação em qualquer lugar do painel (não só "criar cena aqui") reconstrói o HTML
inteiro e joga fora o que o Yuri abriu ou fechou na mão. Quando uma cena nova muda a
contagem de um local de 0 para 1, aquele local **pode virar aberto de surpresa**, empurra
o conteúdo, e por baixo do capô o scroll até é preservado em pixel (`app.mjs: rerender`
já salva e restaura `scrollTop`) — mas como o que está desenhado ali embaixo mudou de
forma, parece ter voltado para o topo.

**Pedido:** os acordeões começam **fechados sempre**, e ficam do jeito que o Yuri deixou
entre uma ação e outra — nunca abrem sozinhos por conta de conteúdo novo.

**Como fazer:** guardar o estado em `this.state` (algo como
`state.atlasOpen = {regions: new Set(), places: new Set()}`), não no `open` computado da
contagem. Cada `<details>` escuta o evento nativo `toggle` (delegar em `app.mjs`, no
mesmo lugar que já escuta `click`/`change`) e grava no set correspondente. O `open` do
HTML passa a ler só esse set — nunca mais `region.counts?.scenes`.

### 1.2 — Nome do local aparece duas vezes, sem explicar por quê

**O que acontece:** um local chamado "Alberich" tem, dentro dele, uma **cena** também
chamada "Alberich" (a Mestra deu o mesmo nome aos dois). O cabeçalho do local mostra
"Alberich" e, logo abaixo, o cartão da cena mostra "Alberich" de novo — visualmente
parece duplicata, mas é local + cena com nome igual, coisas diferentes.

**Pedido:** não fundir os dois, mas deixar claro que são coisas diferentes. Ideia: quando
o nome da cena bater exatamente com o nome do local que a contém, prefixar o cartão da
cena com um rótulo curto — "Mapa: Alberich" em vez de só "Alberich" — só nesse caso.

### 1.3 — Cena apagada no Foundry vira um item quebrado, sem jeito de tirar

**O que aconteceu:** o Yuri removeu uma cena, e ela virou uma entrada travada, mostrando
o id interno cru (`GaT46iOjJwumsAP5`) em vez de um nome, com "cena ausente" e nenhum
botão além de "Mover" — que não serve pra nada aqui, porque a cena não existe mais em
lugar nenhum pra mover.

**Causa:** `atlas.scenes[id]` guarda a referência mesmo depois que a Scene é apagada no
Foundry, e não existe nenhum `Hooks.on('deleteScene', ...)` limpando isso.
`removeAtlasScene(atlas, sceneId)` **já existe** em `src/scene-atlas.mjs` e já é testado
— só não está ligado a nada.

**Pedido, dois lados:**
1. Quando `node.missing` for verdadeiro, mostrar um botão "Remover esta entrada" (trilha
   de lixeira, como o botão que já existe em `renderSceneAtlasEdge`) chamando
   `removeAtlasScene`.
2. `main.mjs`: `Hooks.on('deleteScene', ...)` chama `removeAtlasScene` sozinho quando uma
   Scene de verdade é apagada, pra esse problema não se repetir.

O "deu erro, ficou estranho" que o Yuri descreveu pode ser um efeito colateral disso
(tentar mover uma entrada que não existe mais) — sem log em mãos, **quem pegar esta
tarefa deve reproduzir**: apagar uma cena vinculada no Foundry, ver a entrada travada,
tentar interagir com ela do jeito que dava pra imaginar que funcionaria, anotar o erro
exato antes de corrigir.

### 1.4 — Miniaturas escondidas por padrão

**O que acontece:** `state.atlasThumbnails:false` — precisa clicar "Mostrar miniaturas"
toda vez que abre a mesa.

**Pedido:** começar com `true`. Trocar o valor inicial em `library.mjs`
(`this.state={...atlasThumbnails:true...}`, no construtor de `CampaignLibrary`) — mesma
mudança de uma linha, sem mexer em mais nada.

### 1.5 — Ordem das abas do Mapa: Mapa Imersivo primeiro

**O que acontece:** a barra de abas mostra "Mapa de Opath" antes de "Mapa Imersivo"
(`renderMap`), e o painel abre por padrão em "Mapa de Opath"
(`state.mapDisplay:'geographic'`).

**Pedido:** inverter os dois. "Mapa Imersivo" vira a primeira aba e a vista padrão;
"Mapa de Opath" (o mapa geográfico com as imagens) vira a segunda.

**Como fazer:** trocar a ordem dos dois `<button>` em `vista` (`renderMap`) e o valor
inicial de `state.mapDisplay` para `'atlas'`.

### 1.6 — A parte de cima "vazando"/descolada — confirmado que é geral, não só do Mapa

**Atualização:** o Yuri confirmou que acontece **em todas as abas** (NPCs, Guildas,
Mapa, Monstros, Itens...), não só no Mapa Imersivo. Isso muda onde procurar: **não é
nada específico do atlas** — é algo no cabeçalho/casca compartilhados entre as abas,
provavelmente ligado à Tarefa 8 da rodada anterior ("Limpar o topo das abas", que criou
um cabeçalho comum pra NPCs/Guildas/Monstros/Itens) ou na casca geral do painel
(`app.mjs`/o container principal), não no `styles/library.css` da área do atlas
especificamente — não há `position: sticky`/`fixed` ali.

**Quem pegar esta tarefa:** reproduza primeiro em pelo menos duas abas diferentes
(NPCs e Mapa, por exemplo), abra o inspetor do navegador (F12) e veja qual elemento
está por cima do outro — não tente adivinhar pela leitura do CSS, comece pelo
cabeçalho compartilhado da Tarefa 8 como suspeito principal.

### 1.7 — O painel da cena ativa (Tarefa 6) muda de lugar e ganha profundidade

**O que o Yuri decidiu, depois de usar:** o painel que fiz na Tarefa 6
(`renderActiveScenePanel`) vive hoje **dentro** da aba Mapa, e isso trava — quando o
grupo está numa cena, a aba Mapa vira só aquele painel e ele não consegue mais navegar o
mapa geográfico nem o Mapa Imersivo enquanto joga. O mesmo problema valeria pra NPCs,
Guildas etc. se o painel morasse lá.

**Pedido:** uma **aba nova, própria, "Cena Atual"** (ao lado de NPCs/Guildas/Mapa/...,
não dentro de nenhuma delas), com duas partes:

1. **A cena ativa e as cenas ligadas a ela**, num diagrama pequeno e focado — a imagem/
   nome da cena atual no centro, e as cenas conectadas a ela por teletransporte
   (`edges` do atlas) ao redor, clicáveis. É uma versão em miniatura do diagrama da
   seção 2 deste documento, focada só na vizinhança da cena ativa, não o mundo inteiro.
2. **Os NPCs da região, organizados por localidade — não a região inteira misturada.**
   Uma região tem cidades e locais (ex.: Thur Thur tem Alberich, Velha Alberich, Casebres,
   Lado de Fora...) e cada NPC mora num desses locais específicos, nunca "na região" de
   forma solta. O painel de hoje agrupa por regionId OU placeId num nível só
   (`npcsForLocation`); o pedido é uma **árvore**: região → local → NPCs daquele local,
   igual à estrutura que `buildSceneAtlasTree`/`resolveSceneLocality` já enxergam pro
   atlas — reaproveite essa mesma árvore de dados, só que preenchendo NPC em vez de cena
   em cada nó de local.

**O resto do painel de hoje continua** (guildas presentes, mercadores com atitude ao
vivo, botão de rumor, botão de liberar localidade) — só a organização dos NPCs e a
casa (aba própria em vez de dentro do Mapa) mudam.

**Como fazer:** nova entrada na lista de áreas (`npcs`/`guilds`/`map`/... ganha
`activeScene`), novo botão na barra de abas do mestre, `renderActiveScene()` novo
(pode reaproveitar boa parte do `renderActiveScenePanel` de hoje, adaptando o bloco de
NPCs pra árvore por local). Tirar a chamada de dentro de `renderMap`.

---

## 2. O mapa conceitual de verdade — o pedido principal

### 2.1 — Decidido: arrastável, montado região por região (Opção B)

O Yuri confirmou: **quer montar na mão, tipo quebra-cabeça**, região por região — não um
diagrama do mundo inteiro de uma vez, nem um layout calculado sozinho. O fluxo exato,
descrito por ele:

1. No Mapa Imersivo, escolhe uma região pra "montar" (ex.: Deserto de Mirmir).
2. Abre um **quadro em branco**, sem imagem de fundo, já com as caixas do que **já
   existe** para aquela região — os locais e cenas já cadastrados (Kravokia, Porto de
   Kravokia, Atoleiro de Kramboso, no exemplo dele) aparecem prontos, já ligados entre si
   conforme os dados que já existem (`buildSceneAtlasTree`).
3. **Essas caixas pré-existentes são fixas** — ele não reorganiza a hierarquia que já
   está montada nelas arrastando (não desliga um local da sua região, por exemplo). O
   que ele pode fazer é **arrastar uma caixa nova pro quadro** (uma masmorra nova dentro
   do deserto, por exemplo) e ligá-la a uma caixa existente — isso é a mesma ação que
   "Criar cena aqui" + "Mover" já fazem hoje na lista, só que visual.
4. A posição de cada caixa nova fica **guardada e lembrada** — abrir de novo mostra do
   jeito que ele deixou.
5. **Sem imagem nas caixas por enquanto** — só nome. Não precisa reservar espaço pra
   imagem agora.

**Guarda a posição como coordenada livre em pixels (x, y) dentro de um quadro em
branco por região — não como % de uma imagem de fundo.** Isso importa pro item 2.4
abaixo.

### 2.1.1 — Sobre juntar com o mapa de Opath (a imagem com pinos): não, por enquanto

O Yuri perguntou se dava pra montar isso em cima da imagem do mapa geográfico que já
existe. **Decisão: não agora.** Motivos discutidos com ele:

- O mapa de Opath usa posição em **% de uma imagem única do continente**; o
  quebra-cabeça usa coordenada livre num quadro em branco, por região. Misturar os dois
  sistemas de posição agora é complexidade sem necessidade.
- Nem toda região tem uma imagem regional de boa qualidade pra servir de fundo — a
  maioria só tem a imagem do continente inteiro.
- **Não fecha a porta:** guardando a posição como pixel livre (não como %), dá pra
  **futuramente** acrescentar uma imagem de fundo opcional atrás do quadro, sem refazer
  o esquema de dados. Se um dia quiser essa fusão, o item 2.4 já deixa isso possível.

### 2.2 — O que o diagrama precisa mostrar

- **Caixa por nó:** o local/cena/sub-local que já existe pra aquela região (inclusive
  sub-local, como Casebres dentro de Alberich). Cor por região (reaproveitar
  `regionColor`, já existe). Formato ou borda diferente por tipo (local/cena) — não
  precisa ser exatamente igual ao print, só distinguível. **Sem imagem por enquanto**
  (2.1, item 5).
- **Linha por relação:** a mesma hierarquia que `buildSceneAtlasTree` já resolve
  (local → sua região, sub-local → seu local-pai, cena → seu local/região) mais uma
  linha **diferente** (tracejada, ou com ícone de portal) pra cada `edge` de
  teletransporte entre cenas — é uma relação de jogo, não de hierarquia geográfica, não
  deve se confundir visualmente com as outras.
- **Clique numa caixa** abre a mesma cena/local/região que já abre hoje (reaproveitar
  `lib-open-scene`, os seletores existentes — não duplicar navegação).
- **Cena ausente** (item 1.3) aparece com o mesmo aviso visual, mas dentro do diagrama —
  com o botão de remover do item 1.3, já que agora tem lugar visual pra ele.
- Como isto é grande e visual, **um teste automatizado não prova que ficou bom** — depois
  de implementar, mande um print pro Yuri antes de considerar pronto. Testes automatizados
  continuam cobrindo os dados (que nó existe, que ligação existe, que posição foi salva),
  não a aparência.

### 2.3 — Onde entra na tela

Substitui o conteúdo de `renderSceneAtlas`. **O Yuri disse que gostou da lista como
ideia, só não do jeito que ficou hoje** — mantenha as duas: o quebra-cabeça arrastável
como visão principal de cada região, e a árvore de `<details>` de hoje como uma segunda
aba interna "Lista" (corrigida pelos itens 1.1–1.3), pra quando ele quiser ver tudo em
texto em vez de montar visualmente.

### 2.4 — O schema do atlas cresce: posição por caixa

`atlas.scenes[id]` ganha `x`/`y` (pixels, livres, não porcentagem — ver 2.1.1). O mesmo
pra locais que ganharem posição customizada (hoje `PLACES` não tem posição própria; uma
opção é guardar as posições de local também dentro do atlas, com chave `place:<id>`, sem
mexer no catálogo do livro em `book-world.mjs`, que é dado de referência, não deve
carregar posição de tela). **Migração:** atlas que já existem no mundo (o do Yuri, com
122 cenas) não têm `x`/`y` — ao abrir uma região pela primeira vez nesse modo novo, as
caixas sem posição aparecem numa fileira/grade inicial (não em `0,0` empilhadas umas
sobre as outras), e ficam onde ele arrastar dali em diante.

---

## 3. Ordem sugerida

1. Itens 1.4 e 1.5 (uma linha cada) — não têm risco, façam primeiro.
2. Item 1.1 (acordeão lembra estado) — resolve a sensação de "volta pro topo" sem mexer
   no resto.
3. Itens 1.2 e 1.3 (nome duplicado, cena órfã) — pequenos, independentes entre si.
4. Item 1.6 — reproduzir em duas abas diferentes antes de corrigir (é geral, não é só
   do Mapa — comece pelo cabeçalho compartilhado da Tarefa 8 como suspeito).
5. Item 1.7 (aba "Cena Atual" nova, NPCs por local em árvore) — depende de nada dos
   itens acima, pode andar em paralelo.
6. Seção 2 (o quebra-cabeça arrastável) — a maior peça, decisão de design já tomada
   (2.1, 2.1.1). Comece pelo schema (2.4) e o layout inicial em grade pra quem já tem
   atlas sem posição, depois o arrastar em si.

**Pronto quando:** os itens 1.1–1.6 estão na tela e testados; a aba "Cena Atual" (1.7)
existe com as duas partes descritas; o quebra-cabeça arrastável (seção 2) funciona pra
pelo menos uma região de teste, com posição lembrada entre uma abertura e outra, e o
Yuri viu um print antes de considerar pronto (2.2, último item).

---

## 4. Decidido na conversa, mas fora do escopo direto desta tarefa

Registrado aqui pra não se perder — não trava a Tarefa 13, viram tarefas à parte.

### 4.1 — Imbuir sai da lista de abas, vai pra dentro da ficha do NPC

O Yuri quer a aba "Imbuir" (hoje ao lado de NPCs/Guildas/Mapa/...) removida da barra
principal e reincorporada **dentro da ficha de cada NPC** — ainda sem desenho de como
fica lá dentro; precisa de uma conversa de design própria antes de virar tarefa
especificada, do jeito que T21 e T8b já esperam. Não codifique isso ainda; só não
remova a funcionalidade de imbuir, só o lugar dela vai mudar.

### 4.2 — Ponte pequena e segura com o módulo World Explorer

O Yuri já usa o módulo **World Explorer** (`CarlosFdez/world-explorer`, compatível com
Foundry 13, ativo — última versão de 09/09/2026) no mundo oficial, com hexágonos já
revelados pelos jogadores. Ele resolve sozinho a exploração "névoa de guerra manual" —
**não precisamos reimplementar nada disso.** O que cabe ao QUEDAÇO, decidido nesta
conversa:

1. **Um botão "Abrir mapa de exploração"**, em Mapa Imersivo (ou na aba Cena Atual, se
   fizer mais sentido depois de pronta), que só aparece quando
   `game.modules.get('world-explorer')?.active` for verdadeiro, e que só chama
   `scene.view()` na cena de exploração associada (reaproveitar `regionMainScene` pra
   saber qual é). **Não lê nem escreve nada do World Explorer** além de checar se está
   ativo — zero dependência da estrutura interna dele.
2. **Opcional, com proteção:** mostrar quantos hexágonos já foram revelados, lendo
   `scene.getFlag('world-explorer','gridData')` — um objeto `{chave: {offset:{i,j},
   reveal: true|false|'partial'}}`. **Essa leitura precisa estar blindada:** qualquer
   formato inesperado (chave ausente, tipo errado, `undefined`) faz a contagem
   simplesmente não aparecer — nunca lançar erro nem travar o painel. Isso é acesso não
   documentado a dado de outro módulo; blindar é obrigatório, não opcional.

**Pronto quando:** o botão do item 1 funciona e some sozinho se o módulo não estiver
ativo; o item 2 (se feito) nunca quebra a tela mesmo com o World Explorer desinstalado,
desatualizado ou com o dado em formato diferente do esperado.
