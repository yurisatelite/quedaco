# T25 — Mapa Imersivo: acertos de uso e o mapa conceitual de verdade

> Pedido do Yuri, 17/09/2026, depois de testar a v0.9.0 no Foundry pela primeira vez.
> Mandou prints. Isto é o primeiro retorno de uso real do Mapa Imersivo — tudo abaixo
> veio de bater o olho nele funcionando, não de teste com dado falso.

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

**Isto é a Tarefa 2 deste documento, e é a maior peça.** As tarefas 1 e 3+ são os ajustes
de uso que apareceram testando o que já existe — comece por elas, são menores e o
diagrama vai se apoiar em cima da mesma árvore de dados (`buildSceneAtlasTree`) que já
funciona.

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

### 1.6 — A parte de cima "vazando"/descolada

**O que o Yuri descreveu:** logo abaixo das abas do mestre (NPCs/Guildas/Mapa/...),
alguma coisa no topo do Mapa Imersivo parece "descolada" e deixa aparecer o que está
atrás/embaixo dela por trás — like a floating layer sem fundo sólido.

**Não achei a causa com grep** — não há `position: sticky`/`fixed` na área do atlas em
`styles/library.css`, então é provável que seja um `<select>` nativo do navegador com
popup mal posicionado, ou algo que só aparece rodando de verdade. **Quem pegar esta
tarefa reproduz primeiro** (abrir o Mapa Imersivo, rolar a página, prestar atenção no que
"vaza") antes de tentar consertar às cegas.

---

## 2. O mapa conceitual de verdade — o pedido principal

### 2.1 — Duas formas de fazer, e uma pergunta antes de começar

**Opção A — diagrama calculado, sem arrastar.** As caixas nascem numa posição calculada
pela hierarquia (regiões numa fileira, locais abaixo ligados à sua região por uma linha,
cenas abaixo ligadas ao seu local, ligações de teletransporte como linhas extras entre
cenas). Nada de posição salva — o layout é recalculado a cada abertura, como um
organograma. **Bem mais simples de fazer,** e ainda assim já é um mapa conceitual de
verdade — só não fica "torto" como o exemplo que o Yuri mandou (que tem caixas em
posições livres, meio hand-arranged).

**Opção B — diagrama arrastável, com posição de cada caixa lembrada.** Cada
região/local/cena ganha um `x,y` guardado no atlas (`atlas.scenes[id].x/.y`, e o mesmo
pra locais/regiões — o schema do atlas cresce). O Yuri arrasta as caixas onde quiser, e
da próxima vez que abrir está do jeito que ele deixou — é o que o print dele sugere (as
caixas não estão alinhadas em fileiras, parecem arrastadas à mão). **Bem mais trabalho:**
drag-and-drop de verdade, redesenhar as linhas em tempo real enquanto arrasta, e migração
de dado pros atlas que já existem no mundo (todo mundo que já usa o Mapa Imersivo ganha
posição `0,0` pra tudo na primeira vez, até arrastar).

**Pergunte ao Yuri qual das duas antes de começar a codar** — o print que ele mandou
parece pedir a B, mas B é ordens de grandeza mais trabalho que A, e vale confirmar se ele
quer isso agora ou se A já resolve por enquanto (dá pra promover A pra B depois, sem
jogar fora o layout calculado — B só acrescenta a possibilidade de mover manualmente).

### 2.2 — O que o diagrama precisa mostrar, nas duas opções

- **Caixa por nó:** região, local (inclusive sub-local, como Casebres dentro de
  Alberich), cena. Cor por região (reaproveitar `regionColor`, já existe). Formato ou
  borda diferente por tipo (região/local/cena) — não precisa ser exatamente igual ao
  print, só distinguível.
- **Linha por relação:** local → sua região; sub-local → seu local-pai; cena → seu
  local/região (o que `resolveSceneLocality`/`buildSceneAtlasTree` já resolvem); e uma
  linha **diferente** (tracejada, ou com ícone de portal) pra cada `edge` de
  teletransporte entre cenas — essa é uma relação de jogo, não de hierarquia geográfica,
  não deve se confundir visualmente com as outras.
- **Clique numa caixa** abre a mesma cena/local/região que já abre hoje (reaproveitar
  `lib-open-scene`, os seletores de local/região existentes — não duplicar navegação).
- **Cena ausente** (item 1.3) aparece com o mesmo aviso visual, mas dentro do diagrama.
- Como isto é grande e visual, **um teste automatizado não prova que ficou bom** — depois
  de implementar, mande um print pro Yuri antes de considerar pronto. Testes automatizados
  continuam cobrindo os dados (que nó existe, que ligação existe), não a aparência.

### 2.3 — Onde entra na tela

Substitui o conteúdo de `renderSceneAtlas` (ou vira uma alternativa dentro da mesma aba,
com um botão pra trocar entre "Diagrama" e "Lista" — **o Yuri disse que gostou da lista
como ideia, só não do jeito que ficou hoje** — então talvez valha manter os dois: o
diagrama como visão principal, e a árvore de `<details>` de hoje como uma segunda aba
"Lista", corrigida pelos itens 1.1–1.3 acima). Pergunte se ele quer as duas ou só o
diagrama.

---

## 3. Ordem sugerida

1. Itens 1.4 e 1.5 (uma linha cada) — não têm risco, façam primeiro.
2. Item 1.1 (acordeão lembra estado) — resolve a sensação de "volta pro topo" sem mexer
   no resto.
3. Itens 1.2 e 1.3 (nome duplicado, cena órfã) — pequenos, independentes entre si.
4. Item 1.6 — precisa reproduzir antes de corrigir.
5. **Pergunte sobre a seção 2** (Opção A ou B, diagrama substitui ou convive com a
   lista) antes de começar a codar o diagrama.

**Pronto quando:** os itens 1.1–1.5 estão na tela e testados; o item 1.6 tem causa
identificada (mesmo que a correção fique pra depois, registre o que achou); a seção 2 tem
resposta do Yuri registrada aqui antes de qualquer código do diagrama.
