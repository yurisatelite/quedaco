# T26 — Montar os mapas: organizar o que já existe e criar o que falta

> Pedido do Yuri, 22/09/2026, logo depois da v0.10.0: "a próxima parte agora é montar os
> mapas". O Mapa Imersivo (quebra-cabeça, Cena Atual, teletransporte) já existe; o que
> falta é **encher** ele. A mesa tem cerca de 122 cenas, e a maior parte ainda está "sem
> local". Montar à mão, cena por cena, é o trabalho que esta tarefa corta.

**Antes de codar, leia** [PROGRESSO-MAPA-IMERSIVO.md](PROGRESSO-MAPA-IMERSIVO.md) e a
seção "Mapa Imersivo" de [MAPA-DO-MODULO.md](MAPA-DO-MODULO.md). Quase tudo aqui reaproveita
funções que já existem (`assignAtlasScene`, `createSceneAtlasScene`, `setAtlasLayoutPosition`,
`buildSceneAtlasTree`, o `ImageResolver`).

## Regra que vale para as três partes

**Nada acontece sozinho.** Toda ação desta tarefa tem **prévia** (lista do que vai mudar,
com caixa de marcar em cada linha) e só grava depois de um clique em "Aplicar". Um único
save no fim (`saveSceneAtlas` uma vez, não uma por cena). Criar Scene e Folder no mundo é
permitido (a regra 3 do `CLAUDE.md` é sobre Atores), mas o Yuri testa primeiro numa cópia
do mundo — deixe isso escrito na prévia: "Teste numa cópia do mundo antes da primeira vez".

---

## Parte A — "Sugerir onde ficam": organizar as cenas soltas de uma vez

**Problema:** cena nova cai em "Sem local". Com 122, arrastar uma por uma da bandeja é lento.
Os nomes e as pastas do Foundry já dizem onde a maioria fica ("Alberich — Praça",
pasta "Thur Thur/Alberich").

**Função pura** em `src/scene-atlas.mjs`:

```
suggestSceneParents({atlas, scenes, folders, places, regions, placeScenes, regionScenes})
→ [{sceneId, sceneName, parentId:'place:x'|'region:y', reason:'nome'|'pasta'|'nome+pasta', confidence:'alta'|'média'}]
```

- Só sugere para cenas **sem pai no atlas e sem vínculo legado** (as que aparecem em "Sem
  local"). Nunca sugere mudar uma cena que já está organizada.
- Compare sem acento e sem maiúscula (`normalize('NFD')`, como `reconverter-monstros-dnd.js`
  faz). **Nome:** o nome da cena contém o nome de um local → `place:`. Se bater mais de um
  local, vence o nome mais longo ("Velha Alberich" vence "Alberich"). Só bateu uma região →
  `region:`. **Pasta:** sobe a cadeia de pastas da cena (`scene.folder`, `folder.folder`) e
  procura nome de local, depois de região.
- **Confiança:** nome e pasta concordam → alta; só um dos dois → média. Nome e pasta
  **discordam** → não sugere (a cena fica na bandeja; o Yuri decide).
- Cena dentro de outra cena ("Taverna do Porco" dentro de "Alberich — Praça") **não** é
  sugerida por esta função: só `place:`/`region:`. Hierarquia entre cenas é do Yuri.

**Tela:** na bandeja "Cenas sem local" do quebra-cabeça, um botão **"Sugerir onde ficam"**
abre a prévia (vale para todas as regiões, não só a aberta): uma linha por sugestão, com
nome da cena, destino, motivo e confiança; as de confiança alta vêm marcadas, as de média
desmarcadas. "Aplicar marcadas" grava tudo num save só. Ação nova em `CampaignLibrary.action`
(algo como `lib-atlas-suggest` para abrir e `lib-atlas-suggest-apply` para gravar), com o
estado da prévia em `this.state`.

**Pronto quando:** testes da função pura (acento, nome mais longo vence, pasta aninhada,
nome × pasta em conflito, cena já organizada ignorada, cena legada ignorada); teste de tela
(botão existe, prévia lista, aplicar grava só as marcadas, num save só).

---

## Parte B — "Criar as cenas que faltam" numa região

**Problema:** muitos locais do livro ainda não têm cena nenhuma. No quebra-cabeça eles
aparecem como caixa de local sem nada embaixo.

**Botão no quebra-cabeça**, perto de "Reorganizar caixas": **"Criar cenas dos locais sem
mapa"** — só para a região aberta.

- **Prévia:** um local por linha, **só os que não têm nenhuma cena** (nem direta, nem em
  sub-local, nem por vínculo legado — use `counts.scenes` do nó em `buildSceneAtlasTree`).
  Cada linha mostra a imagem que vai de fundo: `placeImages[place.id]` se existir; senão a
  imagem da convenção de pastas **só se o índice de imagens confirmar que o arquivo existe**
  (`ImageResolver`, Tarefa 9 da rodada 10 — não chute caminho, isso volta os 404). Sem
  imagem → "sem fundo (coloque depois)". Tudo marcado por padrão.
- **Aplicar:** para cada linha marcada, cria a Scene com nome = nome do local, fundo = a
  imagem acima (ou nenhum), `navigation:false` (não enche a barra de navegação dos
  jogadores), e registra no atlas com pai `place:<id>`. Posição no quadro: logo abaixo da
  caixa do local (mesma conta que "Criar caixa" já faz no `app.mjs`).
- **Idempotente:** rodar de novo não cria duplicata — o local já tem cena, então sai da
  prévia.
- **Confira o campo do fundo contra o Foundry 13 instalado** (`background.src` no schema de
  `Scene` da v13) antes de escrever — não use o formato de outra versão. Grid, escala e
  tamanho: deixe o padrão do Foundry; o Yuri ajusta por cena.

**Pronto quando:** teste com `Scene.create` falso (como o teste do atlas já faz): cria só os
locais sem cena, usa a imagem certa na ordem certa, `navigation:false`, grava o atlas num
save só, segunda execução não cria nada.

---

## Parte C — Pastas do Foundry espelhando o Mapa Imersivo

**Problema:** o diretório de cenas do Foundry e o Mapa Imersivo contam histórias diferentes.
Depois de organizar no quadro, o Yuri teria de reorganizar as pastas à mão.

**Botão na aba Lista** do Mapa Imersivo: **"Organizar as pastas das cenas"**.

- **Prévia:** para cada cena organizada no atlas, a pasta de destino — `Região / Local` (e
  `Região / Local / Sub-local` se couber). Cena dentro de outra cena vai para a pasta da cena
  de cima. **Cena sem local não se mexe.** Mostra "de → para" e quantas pastas novas serão
  criadas.
- **Profundidade:** leia `CONST.FOLDER_MAX_DEPTH` em tempo de execução, não chumbe número.
  Se a hierarquia passar do limite, o excedente fica na pasta mais funda permitida.
- **Aplicar:** reaproveita pasta que já existe com o mesmo nome no mesmo lugar (não duplica),
  cria as que faltam (`Folder.create({type:'Scene', ...})`), e move as cenas marcadas.
  **Nunca apaga pasta**, nem as que ficarem vazias — o Yuri decide o que fazer com elas.
- Prévia com tudo marcado; desmarcar uma linha deixa aquela cena onde está.

**Pronto quando:** função pura que calcula o plano (pastas a criar, cenas a mover, limite de
profundidade respeitado, pasta existente reaproveitada, cena sem local fora do plano) com
teste; teste de tela com `Folder.create` falso.

---

## Fora desta tarefa — ideias que precisam de "sim" do Yuri antes

Registrado pra não se perder. **Não codifique.**

1. **Notas no mapa de Opath dentro do Foundry:** colocar uma nota de mapa em cada local, na
   posição dos pinos que já existem (`mapHotspots`), na cena do mapa do continente. A nota do
   Foundry precisa apontar pra um Diário — ou seja, criar um Diário "Locais de Opath" com
   uma página por local. Decisão: ele quer esse Diário? Os jogadores veem as notas?
2. **Jogadores vendo o quebra-cabeça:** uma versão só de leitura, com só as localidades já
   liberadas. Decisão: vale a pena, ou o Mapa de Opath basta para eles?
3. **Revelar hexágono no World Explorer ao liberar uma localidade:** exigiria **escrever** no
   dado de outro módulo, o que decidimos não fazer em 17/09. Fica registrado como "não".
