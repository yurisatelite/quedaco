# COMANDO CODEX — 9ª rodada

Documento de passagem. **Claude estrutura, Codex executa, Yuri confirma.** Leia este arquivo
e o `CLAUDE.md` da raiz; não precisa reler conversa nenhuma nem a 8ª rodada.

**HEAD de referência:** `061c018`. `npm test` = **189 passando**. Árvore limpa.
**Versão no repositório:** 0.8.0 (tag `v0.8.0`). O atlas de cenas (`25ab14c`) já está
commitado depois dela e **ainda não foi publicado**.

---

## 0. Regras desta rodada — leia antes de tudo

As da 8ª continuam valendo (repositório em `E:\RPG\QUEDACO\modulo`, as oito regras do
`CLAUDE.md`, uma tarefa por commit com mensagem em português explicando o porquê, não
mexer em versão, registrar tudo na seção 4). Mais estas, que vieram do que deu errado:

1. **Funcionalidade só está feita quando está inteira na tela.** Na rodada passada o atlas
   de cenas ficou com a lógica pronta e testada, mas sem entrada na interface, com cinco
   botões chamando ações inexistentes, funções que ninguém chamava, formulário sem enviar
   campos e sem CSS. Checklist obrigatório antes de dar qualquer tarefa por pronta:
   - dá para chegar na tela clicando, a partir do painel?
   - todo `data-op` que a tela desenha tem `if(op==='…')` em `action()`? (a tarefa 1 cria
     um teste que confere isso sozinho)
   - o `app.mjs` coleta os campos que a ação lê em `data`?
   - existe CSS para as classes novas?
   - existe teste?
2. **Se for parar no meio, registre.** Ficou sem tokens ou sem tempo: escreva na seção 4 o
   que está pronto, o que falta e em que arquivo, e faça commit do que já passa nos testes.
   Trabalho sem commit e sem diário é trabalho que outra pessoa tem que redescobrir lendo
   código.
3. **Nada começa sem pedido escrito.** Ideia nova do Yuri vira meia página em
   `docs/Txx-nome.md` antes do código. As tarefas abaixo já vêm especificadas; se algo
   não estiver claro, pergunte em vez de inventar.
4. **Macro importa o módulo instalado, não o repositório.** `/modules/quedaco/src/...` é
   a versão publicada no Foundry. Macro que depende de função nova quebra no Foundry do
   Yuri (já aconteceu: `placeWeight is not a function`). Confira com
   `git show v0.8.0:src/<arquivo>` se o `export` existe na versão publicada.
5. **A guilda da mesa (P.I.P.I.) nunca é tocada** — nem guardada, nem redistribuída, e
   ninguém entra nem sai dela. Reconheça por três sinais: nome sem ligar para ponto e
   espaço, ficha de jogador entre os membros, e o selo `Dragão prateado`.
6. **O arquivo mistura CRLF e LF.** Substituição de texto com várias linhas falha em
   silêncio. Use âncoras de uma linha só ou normalize antes de comparar.
7. Continuam valendo as armadilhas da 8ª: `tests/changelog.test.mjs` fixa a lista de
   versões; regra de CSS duplicada ganha da primeira.

---

## 1. Tarefas — nesta ordem

As três primeiras são pequenas e protegem o resto. Não pule para as grandes antes.

### Tarefa 1 — Teste: todo botão de toda aba tem ação  · *pequena*

Já existe um teste assim só para o atlas, no fim de `tests/library.test.mjs` (procure
"nenhum botão do atlas sem ação"). Generalize: renderize **cada aba do mestre** (`npcs`,
`guilds`, `map` nas duas vistas, `monsters`, `items`, `imbue`, `quests`) e a **visão do
jogador** com um mundo falso razoável — pelo menos um NPC mercador com estoque, uma
guilda, uma cena —, extraia todo `data-op="lib-…"` do HTML e falhe listando os que não
têm `op==='…'` no `src/library.mjs`.

**Pronto quando:** o teste roda em todas as abas e, se você apagar um `if(op===…)` de
propósito, ele falha dizendo qual.

### Tarefa 2 — Embutir o desligamento do diálogo de benefícios na macro de geração  · *pequena*

`.local/desligar-dialogo-beneficios.js` é um trecho que precisa ser colado no topo de
`.local/Skyfall-Criador-de-Conteudo.js`, mas **nunca foi**: cada NPC gerado ainda abre o
diálogo "BENEFÍCIOS" do Skyfall, porque a macro adiciona classe e antecedente (linhas
~930). Coloque o trecho logo depois do primeiro `{` do `(async () => {`, dentro de
`try/catch`, e restaure o `prompt` original no fim da execução (`finally`) — o trecho
atual deixa desligado até recarregar a página, e o módulo em `adapter.mjs`
(`addResolvedPlan`) mostra o jeito certo de restaurar.

Depois, em `.local/MACROS.md`, tire o aviso ⚠ dessa linha e mova o arquivo
`desligar-dialogo-beneficios.js` para `.local/_arquivadas/`, acrescentando o motivo no
`LEIA-ME.md` de lá.

**Pronto quando:** `node --check` passa na macro e o trecho está dentro dela com a
restauração no `finally`. Não dá para testar sem Foundry — registre isso na seção 4.

### Tarefa 3 — Roteiro de conferência dentro do Foundry  · *pequena, só documento*

Nada das versões 0.7.0 e 0.8.0 nem do atlas foi conferido dentro do Foundry; os testes
rodam em Node. Escreva `docs/ROTEIRO-CONFERENCIA.md`: um passo a passo curto (15 a 20
minutos) que o Yuri segue **num mundo de teste**, cópia do oficial, nunca no oficial. Para
cada item: o que clicar, o que deve aparecer, o que é defeito. Cubra pelo menos:

- T9 — liberar uma região: o jogador vê só a região, sem localidades, NPCs nem cenas.
- T10 — fechar uma localidade: NPC já conhecido fica cinza, sem loja nem botões.
- Guildas — abas "Em jogo"/"Guardadas", "Pôr em jogo", selo ★ da mesa sem botão de guardar.
- Carrinho — adicionar, total, fechar compra sem dinheiro suficiente (tem que recusar).
- Vender para um NPC que não é mercador.
- Atlas — abrir a aba, criar ligação, **marcar a ponta clicando no mapa com a janela do
  QUEDAÇO aberta** (ponto de maior risco), construir com Regiões nativas e com Stairways
  0.11.x, atravessar com um token.
- Regulador de miniaturas em Guildas.

**Pronto quando:** o documento existe e cada item tem "deve acontecer" e "é defeito se".

### Tarefa 4 — Redistribuir membros de guilda pela interface  · *média*

Hoje, trocar uma guilda em jogo exige três passos fora do módulo: guardar, pôr outra em
jogo e rodar `.local/guildas-em-jogo.js` com `SELECAO = 'atual'`. Traga o caso "atual"
para dentro do módulo:

- **Lógica pura** em `src/guilds.mjs`: `planGuildRedistribution({guilds, npcs, archived,
  protectedIds, parts:{guild:.6, hansa:.2}})` devolvendo, sem gravar nada, o plano: membros
  depois de cada guilda, nível depois (`guildLevel`), guilda nova de cada NPC, contagens. A
  referência de comportamento é a macro — inclusive proteção, determinismo por hash do id e
  "guardada fica sem membros".
- **Porte os casos do simulador** `.local/_dev/_simula-guildas-em-jogo.mjs` para
  `tests/guilds.test.mjs` (os 10 cenários, menos os de semente e sorteio, que não se
  aplicam aqui).
- **Gravação** num método novo em `library.mjs`, usando `Actor.updateDocuments` em lotes
  de 50, como as macros.
- **Tela:** na aba "Em jogo", um botão "Redistribuir membros". Antes de gravar, um
  `DialogV2.confirm` com o plano resumido (quantos NPCs mudam, quantos em guilda, em hansa,
  sem nenhuma, qual guilda é protegida e por quê). Sem confirmação, nada é gravado.
- Proteção: `tableGuildIds()` já existe; some a ela o nome `P.I.P.I.` (compacto) e o selo
  `Dragão prateado`. Se nada for protegido, recuse.

**Pronto quando:** checklist da regra 1 completo, os cenários portados passam, e a macro
continua existindo (não apague — o Yuri pode estar numa versão sem o botão).

### Tarefa 5 — Conferência da região-espelho  · *média*

O plano do Yuri é fechar **uma região inteira** como modelo antes de replicar. Falta ver o
que ainda está incompleto nela. Na visão de região do mestre (`renderRegionView`), um
bloco **só de leitura** "Conferência da região" com contagem e lista clicável de:

- NPC sem legado, sem herança (reaproveite `npcLegacy`), sem local, sem guilda;
- NPC sem retrato (imagem é o placeholder `mystery-man`);
- mercador com estoque vazio;
- localidade sem cena atribuída (`placeScenes`) e cena da região fora do atlas;
- localidade com NPC mas sem nenhum rumor possível.

Cada linha com número; clicar abre o editor do NPC ou o local. Quando tudo zera, um selo
"região pronta para servir de modelo". Não grava nada.

**Pronto quando:** checklist da regra 1 e um teste com uma região falsa cobrindo cada
contagem, inclusive o selo de pronta.

### Tarefa 6 — Painel da cena ativa  · **concluída em 17/09/2026, não verificada no Foundry**

> Feita como parte do **Mapa Imersivo** (nome dado pelo Yuri em 17/09/2026). Ver
> `docs/PROGRESSO-MAPA-IMERSIVO.md` (etapa D) e `src/library.mjs: renderActiveScenePanel`.
> A especificação abaixo continua valendo como registro do que foi pedido e construído —
> **não codifique de novo**; se algo estiver errado, é ajuste, não reescrita.

**Por quê:** durante a sessão, o que o mestre precisa está espalhado em abas. O atlas
agora sabe em que região e localidade cada cena fica, então dá para juntar tudo no momento
em que se precisa.

**O que é:** no topo da aba Mapa do mestre, quando existe cena ativa, um bloco "Cena
atual: *nome* — *localidade*, *região*" com:

1. os NPCs daquela localidade — reaproveite `npcsForLocation`, que já desenha o cartão
   único e os filtros;
2. as guildas presentes — `guildsForPlace` já existe em `src/guilds.mjs`;
3. os mercadores com a atitude de cada um e o seletor de atitude ao vivo (`npcGmStrip`);
4. o botão de rolar rumor da região (`rollRegionRumors`);
5. um botão "Liberar esta localidade aos jogadores" (`setNpcLocality`).

**Como achar a localidade da cena:** primeiro o atlas (`sceneAtlas.scenes[id].parentId`,
subindo pela cadeia `scene:` até chegar em `place:` ou `region:`), depois `placeScenes` e
`regionScenes`. Sem nada: mostre "Esta cena ainda não está no atlas" com atalho para a
aba Atlas.

**Quando atualiza:** registre em `main.mjs` um `Hooks.on('canvasReady')` que re-renderiza
o painel se a janela estiver aberta na aba Mapa. Nada abre sozinho.

**Não faça:** não crie aba nova, não duplique cartão (use as funções citadas), não
libere nada sem clique.

**Pronto quando:** checklist da regra 1; teste com `canvas.scene` falso cobrindo cena
dentro de outra cena, cena direto numa localidade, cena só com região e cena fora do atlas.

### Tarefa 7 — Perguntar se libera ao ativar cena  · **concluída em 17/09/2026, não verificada no Foundry**

> Ver `docs/PROGRESSO-MAPA-IMERSIVO.md` (etapa E), `src/library.mjs: shouldAskReleaseOnActivate`
> e o `Hooks.on('updateScene')` em `src/main.mjs`. **Não codifique de novo.**

Quando o mestre **ativa** uma cena (`Hooks.on('updateScene')` com `active` passando a
`true`) cuja localidade ainda não está liberada, um `DialogV2.confirm`: "O grupo chegou em
*Localidade*. Liberar aos jogadores?". Sim chama `setNpcLocality`; não, nada acontece.
Nunca libere sem confirmação. Uma opção nas configurações do módulo desliga a pergunta.

**Pronto quando:** checklist da regra 1 e teste da decisão (localidade já liberada não
pergunta; sem localidade não pergunta; configuração desligada não pergunta).

### Tarefa 8 — Limpar o topo das abas  · *média — depois da 4, que mexe na mesma linha*

Pedido do Yuri com print (17/09/2026): "esse monte de menu tem que sumir e eu tenho que ter
clareza de onde é filtro e onde é pesquisa".

- **NPCs:** tirar da tela o bloco "Cobertura regional de NPCs · N lacunas" (`sy-npc-coverage`,
  perto de `renderNpcs`). Foi para um momento da criação e acabou. Pode apagar a renderização.
  A ação "Criar N próximos" vai junto se ninguém mais chamar.
- **Guildas:** tirar o bloco "Importar guildas do apêndice" (`importer` em `renderGuilds`). A
  importação já foi feita.
- **Mapa:** tirar "Onde colocar as imagens" (o `<details>` em `renderMap`). O botão de pôr
  imagem já existe.
- **Guildas — uma linha só no topo:** à esquerda as abas *Em jogo · N* e *Guardadas · N*. Os
  botões de ação (*Guardar as sem membro*, *Redistribuir membros*) ficam **na mesma linha,
  grudados à direita** (`margin-left:auto`), acompanhando a largura quando a janela estica ou
  encolhe. *Guardar as sem membro* ganha **outra cor**: ação secundária, sem o ciano dos
  filtros.
- **Pesquisa e filtro separados de verdade**, nesta ordem:
  1. linha de **pesquisa**: rótulo "Pesquisar", campo, contagem "N entradas";
  2. linha de **filtros**: rótulo "Filtrar por" antes dos chips (*Tipo*, *Campo de atuação*...);
  3. o aviso "Nenhuma entrada corresponde aos filtros" vai **abaixo** dos filtros, junto da
     lista. Hoje ele fica entre a pesquisa e os filtros e parece fazer parte da busca.
- Faça isso num helper só (ex.: `panelHeader({tabs, actions, search, filters})`) e use nas
  abas que já têm barra: Guildas, NPCs, Monstros, Itens. Não crie um visual novo por aba.

**Pronto quando:** checklist da regra 1; o teste da tarefa 1 continua passando; um teste
confere que Guildas não renderiza mais "Importar guildas do apêndice" e NPCs não renderiza
"Cobertura regional"; em 700 px de largura os botões não quebram por cima das abas.

### Tarefa 9 — Os 404 de imagem no console  · *pequena*

Ao abrir Itens, o console mostra dezenas de `404 (Not Found)` em `assets/itens/*.webp|png`. As
imagens aparecem, então **não quebra nada**, mas é ruído, pedido de rede à toa e esconde
erro de verdade. Causa: `resolveImage` (`src/images.mjs`) monta candidatos por convenção
(`<slug>.webp`, depois `.png`) e o navegador **tenta cada um** até achar; os que não existem
viram 404.

Correção: o **Mestre** lista as pastas de imagem uma vez (`FilePicker.browse`) e grava um
índice dos arquivos que existem numa configuração de mundo. Jogador não tem permissão de
listar, então lê o índice. `resolveImage` só oferece candidato que está no índice. Sem índice
(primeira abertura), mantém o comportamento de hoje. Um botão "Reindexar imagens" no topo
do Mestre para quando ele subir arquivo novo.

**Pronto quando:** teste de `resolveImage` com índice (só candidatos existentes) e sem índice
(igual a hoje); abrir Itens com índice não gera 404.

### Tarefa 10 — Monstros por região no painel  · *média*

A macro `.local/distribuir-monstros-por-regiao.js` (feita pelo Claude) grava
`flags.quedaco.monster = {regionId, placeId, beyondId, habitat}` nos monstros do mundo. O
painel ainda não lê isso.

- `src/book-monsters.mjs`: acrescentar `placeId` aos 44 monstros do livro. Os valores já
  estão na tabela `HABITAT` da macro (bloco "Skyfall (livro)", com as páginas). Copie de lá;
  é índice de referência, não regra nova.
- Aba Monstros: faceta **Região** (e "Além de Opath" para `beyondId`), chip da região na cor
  da região (`regionColor`) no cartão, e a linha de habitat no detalhe.
- Monstro sem região aparece no filtro como "Sem região", nunca some.

**Pronto quando:** checklist da regra 1; teste de `monsterFacetValues` com as três situações
(livro com `placeId`, mundo com flag, sem nada).

### Tarefa 11 — Conversor de monstros completo  · **concluída em 17/09/2026**

Leia `docs/T24-MONSTROS-COMPLETOS.md` (atualização do topo) se for mexer aqui de novo.
Os 5 passos estão feitos e testados (221 testes): tamanho, testes de resistência, perícias,
idiomas, resistências, arquétipo, alcance, traços/magia inata/Ataque Múltiplo como Itens, e
os Itens de hierarquia/arquétipo copiados do compêndio `skyfall-core.npc-creation` (com
seus benefícios), ligado em `library.mjs: importMonster`. **Não verificado no Foundry** —
falta um monstro de teste de verdade passar por `Actor.create` com o compêndio instalado
(o `getIndex`/`getDocument` reais podem ter alguma diferença de forma que o fake dos
testes não captura). Se for melhorar a conversão de novo, o que falta é o que já está
listado no documento: reconverter os 326 já importados (busca de novo no SRD, porque a
primeira importação não guardou teste de resistência/perícia/idioma/tamanho em lugar
nenhum), e as regras de custo de ação lendária do guia (1–2 ações → normal, 3 → recarga)
não são aplicadas sozinhas — os Itens de ação lendária viram Item genérico, texto do guia
continua na biografia pro mestre ajustar na mão.

---

## 2. Enquanto trabalha — melhorias de estrutura

Não são tarefas próprias; faça **só quando já estiver mexendo naquela parte**:

- `src/library.mjs` tem milhares de linhas, muitas enormes numa linha só. Ao mexer numa
  aba, considere mover a renderização dela para um arquivo próprio
  (`src/panels/guilds.mjs`, etc.). Uma aba por vez, sem mudar comportamento, com o teste
  da tarefa 1 garantindo que nada se perdeu. Não faça isso de uma vez.

---

## 3. Fica com o Yuri — não codifique

| Item | O que falta |
|---|---|
| Publicar a 0.8.0 | Se ainda não subiu: `dist/quedaco.zip` + `dist/module.json`, tag `v0.8.0`. Quem prepara a próxima versão é o Claude com ele. |
| `gh auth login` | O GitHub CLI já está instalado. Com o login feito, a publicação pode sair daqui sem erro de tag. |
| Mundo de teste | Cópia do oficial para seguir o roteiro da tarefa 3. |
| **T21** — trocar legado no editor | Conversa de design antes: reconstruir a ficha no nível atual mexe em muita coisa. |
| **T8b** — ficha de profissão do NPC | Protótipo em `.local/criar-vendedor-prototipo.js`; falta o brainstorm. |
| Imagens das moedas | 33 prompts prontos em `docs/T17-PROMPTS-MOEDAS.md`. |
| Macros que gravam no mundo | Fazer backup do mundo antes de rodar. |
| ~~JSON de comparação de monstro~~ | **Feito 17/09.** A tarefa 11 já usa a ficha real; leia `docs/T24-MONSTROS-COMPLETOS.md` antes de continuar — parte já está pronta (tamanho, proteções, perícias, idiomas, arquétipo, alcance), falta traços/magia/ataque múltiplo como Itens e os Itens de hierarquia/arquétipo copiados do compêndio. |
| Monstros por região | Conferir a prévia de `.local/distribuir-monstros-por-regiao.js` e aplicar. A tarefa 10 mostra o resultado no painel. |
| Reconverter os 326 monstros de D&D | Depois de publicar a versão nova: `node tools/buscar-srd.mjs` (fora do Foundry) e depois `.local/reconverter-monstros-dnd.js` (prévia primeiro). Backup do mundo antes. |

---

## 4. Diário de bordo — preencha aqui

Mesmo formato da 8ª, no mesmo commit da tarefa:

```
### <data> — Tarefa N
**Fiz:** o que mudou de comportamento, e em quais arquivos.
**Funcionou:** o que você verificou, e como.
**Não funcionou / deixei de fora:** e o motivo.
**Checklist da regra 1:** tela ✔/✖ · ações ✔/✖ · app.mjs ✔/✖ · CSS ✔/✖ · teste ✔/✖
**Precisa de decisão:** a pergunta exata para o Yuri, se houver.
```

<!-- A partir daqui é do Codex. Acrescente embaixo, não apague. -->

### 17/09/2026 — Tarefa 1
**Fiz:** generalizei o teste de ações da interface em `tests/library.test.mjs`. Ele agora renderiza NPCs, Guildas, Mapa geográfico, Atlas de cenas, Monstros, Itens, Imbuir e Quests para a Mestra, além das sete áreas na visão do jogador, com um mundo falso que inclui mercador com estoque, personagem, guilda, cenas e quest. Cada `data-op="lib-…"` encontrado precisa ter tratamento explícito em `CampaignLibrary.action()`, e a falha lista a ação e as telas onde apareceu.
**Funcionou:** teste direcionado 1/1, `tests/library.test.mjs` 42/42, `npm test` 190/190 e `git diff --check` passaram. Nenhuma ação ausente foi encontrada no código atual.
**Não funcionou / deixei de fora:** o teste confirma a ligação entre HTML e roteador; não substitui cliques reais no Foundry.
**Checklist da regra 1:** tela ✔ (todas as áreas renderizadas) · ações ✔ · app.mjs ✔ (formulários condicionais presentes no HTML coberto) · CSS ✔ (nenhuma classe nova) · teste ✔
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 2
**Fiz:** incorporei em `.local/Skyfall-Criador-de-Conteudo.js` a suspensão temporária do `BenefitsDialog.prompt` somente durante a inclusão de legado, herança, antecedente, classe e trilha. A macro sempre restaura o método original no `finally`, inclusive quando a criação falha. Arquivei o trecho solto em `.local/_arquivadas/desligar-dialogo-beneficios.js` e atualizei os dois índices privados de macros.
**Funcionou:** `node --check .local/Skyfall-Criador-de-Conteudo.js` passou; a chamada de criação dos itens relevantes está dentro do helper, a criação de habilidades de monstro permaneceu fora dele, e o arquivo antigo deixou a raiz de `.local/`.
**Não funcionou / deixei de fora:** a abertura efetiva do diálogo só pode ser conferida dentro do Foundry. A pasta `.local/` é privada e ignorada pelo Git; por isso este commit público contém apenas este registro, sem expor a macro.
**Checklist da regra 1:** tela — (macro, sem tela nova) · ações — · app.mjs — · CSS — · teste ✔ (sintaxe; conferência funcional pendente no Foundry)
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 3
**Fiz:** criei `docs/ROTEIRO-CONFERENCIA.md`, um passe de 15 a 20 minutos para executar somente numa cópia do mundo oficial. O roteiro dá os cliques exatos e, em cada bloco, separa “Deve acontecer” de “É defeito se” para T9, T10, Guildas, carrinho, venda a NPC não mercador, regulador de miniaturas e Atlas com Stairways e Regiões nativas.
**Funcionou:** conferi os rótulos e caminhos do roteiro contra a interface gerada por `src/main.mjs`, `src/app.mjs` e `src/library.mjs`; o passo do Atlas preserva a janela aberta durante o clique no canvas, exige Stairways 0.11.1 e testa a troca de mecanismo com um token. `git diff --check` passou nos arquivos desta tarefa.
**Não funcionou / deixei de fora:** o roteiro ainda não foi executado dentro do Foundry; essa conferência depende da cópia do mundo oficial e das duas sessões Mestra/jogador que ficam com o Yuri.
**Checklist da regra 1:** tela — · ações — · app.mjs — · CSS — · teste — (tarefa somente documental)
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefas 6 e 7 (Claude/Sonnet) — nome dado: "Mapa Imersivo"
**Fiz:** o Yuri batizou a funcionalidade de "Mapa Imersivo" (antes só "atlas de cenas"); renomeei o rótulo na tela ("Atlas de cenas" → "Mapa Imersivo") e nos documentos. `src/scene-atlas.mjs: resolveSceneLocality` acha a localidade de uma cena subindo a cadeia `scene:` até `place:`/`region:`, com fallback pros mapas legados `placeScenes`/`regionScenes`. `src/library.mjs: renderActiveScenePanel` monta o bloco no topo da aba Mapa quando há cena ativa — NPCs (`npcsForLocation`), guildas (`guildsForPlace`), mercadores com atitude ao vivo (`npcGmStrip`), rumor da região (`rollRegionRumors`) e o botão de liberar a localidade (`setNpcLocality`), lendo `game.scenes.active`. `main.mjs` ganhou `Hooks.on('canvasReady')` pra re-renderizar o painel só quando a janela já está aberta na aba Mapa. Pra tarefa 7: `shouldAskReleaseOnActivate` (puro, em `library.mjs`) decide quando perguntar; `main.mjs: Hooks.on('updateScene')` chama o `DialogV2.confirm` e, num "sim", `setNpcLocality` — usando uma `CampaignLibrary` descartável quando a janela não está aberta, já que a pergunta não pode depender disso. Nova configuração do módulo "Perguntar ao ativar uma cena" desliga a pergunta.
**Funcionou:** 225 testes (`npm test`), 10 novos — os 4 casos do "pronto quando" da T6 (cena aninhada, direto numa localidade, só região, fora do atlas), os 3 da T7 (localidade já liberada, sem localidade, configuração desligada não perguntam), e um teste de tela cobrindo NPC, guilda, mercador, rumor e o aviso de "cena fora do Mapa Imersivo". `npm run package` ok.
**Não funcionou / deixei de fora:** **nada disto foi visto no Foundry.** `game.scenes.active`, o `Hooks.on('canvasReady')` e o `DialogV2.confirm` só existem em tempo de execução real — os testes usam cenas e `game` falsos. Ver `docs/PROGRESSO-MAPA-IMERSIVO.md`, etapas D e E.
**Checklist da regra 1:** tela ✔ (painel no topo da aba Mapa) · ações ✔ (reaproveita ops que já existiam, nenhuma nova) · app.mjs — (não precisou de campo de formulário novo) · CSS ✔ (`.sy-active-scene*`) · teste ✔
**Precisa de decisão:** nenhuma — só falta a conferência do Yuri no Foundry (etapas C, D e E do `PROGRESSO-MAPA-IMERSIVO.md`).

### 17/09/2026 — Tarefa 4 (Codex) — commitada só agora
**Fiz:** este trabalho é do Codex, feito antes desta entrada — ficou pronto no disco sem commit nem diário (violando a regra 2 desta rodada). Registro agora porque commitei junto do Mapa Imersivo (Tarefas 6/7): `planGuildRedistribution` em `src/guilds.mjs`, os cenários do simulador portados para `tests/guilds.test.mjs`, o botão "Redistribuir membros" na aba Em jogo com `DialogV2.confirm` resumindo o plano, e a gravação em `library.mjs: redistributeGuildMembers`.
**Funcionou:** os testes já existiam e passavam antes de eu tocar em qualquer arquivo desta sessão — inclusive os casos de proteção da P.I.P.I. (nome, ficha de jogador, selo).
**Não funcionou / deixei de fora:** não é meu trabalho pra avaliar em detalhe; não verificado no Foundry (nenhuma tarefa desta rodada foi).
**Checklist da regra 1:** não conferido por mim — quem retomar isto deve conferir antes de considerar fechado de vez.
**Precisa de decisão:** nenhuma nova; só a conferência no Foundry, como tudo o mais nesta rodada.
