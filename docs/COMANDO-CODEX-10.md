# COMANDO CODEX — 10ª rodada

Documento de passagem. **Claude estrutura, Codex executa, Yuri confirma.** Leia este
arquivo e o `CLAUDE.md` da raiz; não precisa reler conversa nenhuma nem a 9ª rodada.

**HEAD de referência:** `1cbe655` (22/09/2026). `npm test` = **240 passando**. Árvore limpa.
**Versão no repositório:** 0.9.0, **já publicada** (v0.9.0, 17/09/2026). Tudo commitado
depois dela (Tarefas 5, 8, 9, 10, 12, 13 e 15 desta rodada) ainda não foi publicado — vira
a 0.10.0 quando o Yuri autorizar. **Não aumente a versão nem publique** — isso é do Claude,
com autorização do Yuri pra cada versão.

> **22/09/2026 — o Claude codou o que faltava sem decisão pendente:** o quebra-cabeça do
> Mapa Imersivo (T25 §2), a aba Cena Atual completa (§1.7), o World Explorer (T15) e a
> biografia em ficha de campo (T24 §3). Ver o diário (seção 4). **O que sobra pro Codex
> são as Tarefas 16, 17 e 18**, no fim da seção 1.

---

## 0. Regras desta rodada — leia antes de tudo

Todas as da 9ª continuam valendo (checklist "só está feito quando está na tela",
registrar e commitar se parar no meio, nada sem pedido escrito, macro importa o módulo
instalado, a P.I.P.I. nunca é tocada, CRLF/LF misto). Mais uma, do que aconteceu nesta:

8. **Uma feature grande ganha um `docs/PROGRESSO-<nome>.md`, com barra e % por etapa**
   (código pronto × testado com dado falso × visto no Foundry de verdade). Não é
   burocracia — foi o que permitiu dividir o Mapa Imersivo em pedaços e mostrar, sem
   ambiguidade, que "código pronto e testado" **não** é o mesmo que "funciona". Antes de
   marcar uma tarefa como concluída, pergunte: isso foi *visto* rodando no Foundry, ou só
   testado com Node e dado inventado? As duas coisas são diferentes e o documento de
   progresso deve dizer qual é qual.

**Achado nesta rodada, vale para qualquer conversor/parser de texto de fonte externa:**
um teste com dado inventado prova que a lógica funciona *para aquele dado*, não que ela
bate com o formato real. `parseInnateSpellcasting` tinha um bug (cortava a lista de
magia inata pela metade) que **nenhum** dos testes com texto escrito à mão pegava, porque
todos escreviam o texto do jeito que eu *imaginava* que a fonte real teria. Só apareceu
rodando contra os 322 monstros de verdade da API do Open5e. Sempre que der, rode contra
uma amostra real antes de considerar um parser pronto — não só contra exemplos que você
mesmo escreveu.

---

## 1. Tarefas — nesta ordem

As tarefas 1–7 e 11 (T24) da 9ª rodada estão **concluídas** (ver diário na seção 4 de
`docs/COMANDO-CODEX-9.md`, que fica fechada). **As tarefas 5, 8, 9, 10 e 12 abaixo também
já foram concluídas pelo Codex — ver o diário na seção 4 deste documento.** Ficam
descritas aqui só como referência do que foi pedido; não refaça nenhuma delas. A 13 ficou
quase toda pronta (só o §1.6 espera um print do Yuri) e a 15 está feita. A 14 espera
conversa de design. **O que resta pro Codex: Tarefas 16, 17 e 18.**

### ~~Tarefa 5~~ — Conferência da região-espelho  · **concluída (diário: 17/09/2026)**

Especificação original em `docs/COMANDO-CODEX-9.md`, Tarefa 5 (bloco só de leitura em
`renderRegionView`: NPC sem legado, sem herança, sem local, sem guilda; sem retrato;
mercador com estoque vazio). **Não verificada no Foundry** — o diário registra isso.

### ~~Tarefa 8~~ — Limpar o topo das abas  · **concluída (diário: 17/09/2026)**

Especificação original em `docs/COMANDO-CODEX-9.md`, Tarefa 8. O cabeçalho compartilhado
criado aqui (NPCs/Guildas/Monstros/Itens) é o suspeito principal do bug "topo descolado"
da Tarefa 13 — comece a investigação por ele.

### ~~Tarefa 9~~ — Os 404 de imagem no console  · **concluída (diário: 17/09/2026)**

Especificação original em `docs/COMANDO-CODEX-9.md`, Tarefa 9. **Não verificada no
Foundry** — o ambiente de teste não navega armazenamento de mundo de verdade.

### ~~Tarefa 10~~ — Monstros por região no painel  · **concluída (diário: 17/09/2026)**

Especificação original em `docs/COMANDO-CODEX-9.md`, Tarefa 10.

### ~~Tarefa 12~~ — Biografia em ficha de campo (T24, passo 6)  · **parcial (diário: 17/09/2026)**

Especificação em `docs/T24-MONSTROS-COMPLETOS.md`, seção 3. **Feito:**
`.local/fichas-de-campo.json` com as 44 ameaças do bestiário do livro (Codex, 17/09); o
conversor monta a biografia em ficha de campo e aceita uma ficha escrita por monstro
(Claude, 22/09). **Falta:** o conteúdo para os monstros de D&D e a macro ler esse
arquivo — é a **Tarefa 18**.

### ~~Tarefa 13~~ — Mapa Imersivo: ajustes de uso e o mapa conceitual de verdade  · **concluída no código, exceto o §1.6 (diário: 17/09 Codex, 22/09 Claude)**

**Não refaça.** §1.1–1.5 e a aba nova: Codex (`a34ea0a`, `60c706d`). §1.7 completo, §2
inteiro: Claude (`1cbe655`). **§1.6 (topo descolado em todas as abas) fica parado** até o
Yuri mandar um print com o inspetor (F12) mostrando qual elemento está por cima — não dá
pra reproduzir sem o Foundry rodando, e a regra é não adivinhar pela leitura do CSS.
Especificação original, pra referência:

**Primeiro retorno de uso real** — o Yuri testou a v0.9.0 no Foundry, mandou prints, e
depois teve uma conversa de design com o Claude sobre a peça maior. **Todas as decisões
já estão tomadas — leia o documento inteiro, não pergunte de novo o que ele já resolve.**
Resumo: 7 ajustes pequenos (seção 1) e o quebra-cabeça arrastável por região (seção 2,
decisão confirmada — arrastar, não calcular sozinho; não junta com o mapa de Opath por
enquanto). A seção 1.7 move o painel da cena ativa (Tarefa 6 da rodada anterior) pra uma
aba nova "Cena Atual", com os NPCs organizados por localidade dentro da região, não a
região inteira misturada.

### Tarefa 14 — Imbuir sai da barra de abas, vai pra dentro da ficha do NPC  · *precisa de conversa de design antes de especificar*

Decidido nesta rodada de conversa (`docs/T25-MAPA-IMERSIVO-VISUAL.md`, seção 4.1), mas
**ainda sem desenho de como fica dentro da ficha do NPC.** Não codifique — isto é só um
lembrete registrado pra não se perder, do mesmo jeito que T21 e T8b esperam decisão.

### ~~Tarefa 15~~ — Ponte com o módulo World Explorer  · **concluída (diário: 22/09/2026, Claude)**

O Yuri já usa esse módulo no mundo oficial pra revelar hexágonos de exploração. O
QUEDAÇO só precisa de um botão que abre a cena de exploração quando o módulo está
ativo — **sem ler nem escrever nada da estrutura interna dele** além de checar se está
ativo. A leitura opcional de quantos hexágonos já foram revelados (item 2 da seção 4.2)
é fora do escopo principal e precisa vir **blindada contra formato inesperado** — nunca
pode quebrar a tela.

### Tarefa 16 — Revisar o que o Claude codou em 22/09  · *média — revisão, não feature nova*

Segundo par de olhos em `1cbe655`. Leia `docs/PROGRESSO-MAPA-IMERSIVO.md` ("Decisões de
implementação") antes — não desfaça uma decisão registrada lá; se discordar, anote no
diário como pergunta pro Yuri. Confira, com teste pra cada coisa que achar:

1. **`scene-atlas.mjs: buildRegionPuzzle`** — região sem nenhum local; cena pendurada
   direto na região (`region:`); cena cujo local-pai não existe mais em `PLACES`; região
   com 30+ locais (o quadro fica largo demais? o arranjo quebra linha a 1100 px — confira
   que nenhuma caixa cai em cima de outra); ciclo em `place.parentId`.
2. **`app.mjs: _bindPuzzle`** — arrastar e soltar fora do quadro; soltar a cena da bandeja
   em cima de uma caixa `is-missing` (deve ser ignorado); clique no botão de dentro da
   caixa não pode iniciar arrasto; re-render no meio de um arrasto (o setting muda e o
   `onChange` re-renderiza — veja se não duplica listener: `_bindPuzzle` roda a cada
   render, em elemento novo, então não deveria).
3. **`library.mjs: activeSceneNpcTree`** — NPC com `placeId` de outra região; região com
   100+ NPCs (a árvore começa fechada, mas o HTML é montado inteiro — meça).
4. **Acessibilidade, opcional:** hoje só dá pra posicionar caixa arrastando com mouse. Se
   couber pequeno, setas do teclado movem a caixa focada 10 px e gravam ao soltar a tecla.
   Não invente outra interação além dessa.
5. **`monster-convert.mjs: buildFieldSheet`** — rode contra `.local/srd-monstros.json`
   inteiro (`node tools/buscar-srd.mjs` se não existir) e confira 10 biografias ao acaso:
   táticas coerentes com os Itens, nenhum HTML quebrado.

**Pronto quando:** cada caso acima tem teste (ou nota no diário dizendo por que não
precisa); `npm test` e `npm run package` passando.

### Tarefa 17 — Tirar o Mapa Imersivo de dentro do `library.mjs`  · *média — estrutura, regra da seção 2*

`library.mjs` passou de 2000 linhas. Mova pra `src/panels/mapa-imersivo.mjs` as funções de
tela do Mapa Imersivo e da Cena Atual: `renderSceneAtlas`, `renderSceneAtlasScene`,
`renderSceneAtlasPlace`, `renderSceneAtlasEdge`, `sceneAtlasParentOptions`,
`sceneAtlasAddForm`, `sceneAtlasFirstScene`, `renderAtlasPuzzle`, `puzzleBoard`,
`activeSceneDiagram`, `activeSceneNpcTree`, `renderActiveScenePanel`, `explorationButton`.
Jeito sugerido: funções que recebem a instância da biblioteca (`renderSceneAtlas(lib)`) e
métodos finos em `CampaignLibrary` que só delegam — assim nenhum teste nem `action()`
muda. **Nenhuma mudança de comportamento** nesta tarefa: o HTML gerado tem de ser igual
byte a byte (compare `renderMap(false)` e `render('activeScene')` antes/depois num teste
temporário).

**Pronto quando:** `library.mjs` não tem mais essas funções; todos os testes passam sem
alteração; `docs/MAPA-DO-MODULO.md` aponta o arquivo novo.

### Tarefa 18 — Fichas de campo dos monstros de D&D mais usados  · *conteúdo + um ajuste pequeno de macro*

O conversor já monta a biografia em ficha de campo (T24 §3), mas Aparência,
Comportamento, O que quer e Ganchos saem "—" porque ninguém escreveu esse conteúdo para
os monstros de D&D (as 44 de `.local/fichas-de-campo.json` são do bestiário **do livro**).

1. Crie `.local/fichas-de-campo-dnd.json` no **mesmo formato** do arquivo do livro
   (`appearance`, `temperament`, `behavior`, `wants`, `hooks[]`), chaveado pelo **nome
   em inglês do SRD** (o mesmo de `flags.quedaco.sourceName`). Comece pelos monstros que
   aparecem na tabela `HABITAT` de `.local/distribuir-monstros-por-regiao.js` — são os que
   o Yuri já pôs em alguma região.
2. **Regras de conteúdo (T24 §3, "O que fica de fora"):** palavras próprias, curtas, sem
   copiar parágrafo; nada de deus, plano, reino ou nome próprio do cenário de origem —
   traço de cultura entra traduzido em comportamento. `temperament` é opcional (o
   conversor já escreve um pela tendência; o do arquivo vem antes).
3. Em `.local/reconverter-monstros-dnd.js`: depois de pedir o `srd-monstros.json`, peça um
   **segundo arquivo opcional** (`fichas-de-campo-dnd.json`; cancelar = seguir sem) e passe
   `toSkyfallNpc(mob,{habitat,fieldSheet:fichas[sourceName]})`. A prévia no chat conta
   quantos ganharam ficha escrita.

**Pronto quando:** o JSON valida (os cinco campos em todas as entradas, `hooks` com 2–3
frases); a macro roda `node --check`; a prévia diz quantos têm ficha. **Não rode a macro no
mundo oficial** — quem roda é o Yuri.

---

## 2. Enquanto trabalha — melhorias de estrutura

- `src/library.mjs` continua enorme. Mesma regra da 9ª: mova a renderização de uma aba
  por vez para `src/panels/<aba>.mjs`, só quando já estiver mexendo ali, com o teste
  "todo botão tem ação" (tarefa 1 da 9ª) garantindo que nada quebrou.

---

## 3. Fica com o Yuri — não codifique

| Item | O que falta |
|---|---|
| ~~Publicar a versão nova~~ | **Feito** — v0.9.0 publicada em 17/09/2026 (`gh release`), com `quedaco.zip` e `module.json`. |
| ~~`gh auth login`~~ | **Feito.** O Claude publica release sozinho a partir de agora, com autorização do Yuri pra cada versão. |
| Mundo de teste | Ainda vale a pena, pra conferir a Tarefa 13 e o resto sem risco ao mundo oficial. |
| **Autorizar a 0.10.0** | Tudo da Tarefa 13/15 e a ficha de campo estão no código; o Claude publica quando você disser "pode publicar a 0.10.0". |
| **Conferir o Mapa Imersivo no Foundry, depois da 0.10.0** | Quebra-cabeça (arrastar caixa, soltar cena da bandeja, Criar caixa, Reorganizar), aba Cena Atual (mini-diagrama + árvore de NPCs) e o botão do World Explorer — nada disso foi visto ainda. A pergunta ao ativar cena (etapa E) também segue sem retorno. Roteiro em `docs/PROGRESSO-MAPA-IMERSIVO.md`. |
| **Print do topo "descolado" (T25 §1.6)** | Abra qualquer aba, aperte F12, clique na setinha de inspecionar e clique na parte que está vazando. Mande o print com o painel do inspetor aberto — é o que falta pra corrigir. |
| **T14 e T21** — Imbuir dentro da ficha do NPC / trocar legado no editor | Ambas ainda precisam de conversa de design com o Yuri antes de virar tarefa especificada. |
| **T8b** — ficha de profissão do NPC | Protótipo em `.local/criar-vendedor-prototipo.js`; falta o brainstorm. |
| Imagens das moedas | 33 prompts prontos em `docs/T17-PROMPTS-MOEDAS.md`. |
| **Reconverter os 326 monstros de D&D** | **Depois da 0.10.0** (a ficha de campo só existe nela). `node tools/buscar-srd.mjs` no seu computador, depois `.local/reconverter-monstros-dnd.js` no Foundry (prévia primeiro). Backup do mundo antes — ela apaga e recria os Itens e **reescreve a biografia** de cada monstro convertido. |
| Fichas de campo dos 326 monstros de D&D (Tarefa 12, o que falta) | Conteúdo, não código — as 44 do livro já estão feitas; os de D&D podem ser escritos por qualquer um, inclusive o Yuri, seguindo o mesmo formato. |

---

## 4. Diário de bordo — preencha aqui

Formato de cada entrada:

```
### <data> — Tarefa N
**Fiz:** o que mudou de comportamento, e em quais arquivos.
**Funcionou:** o que você verificou, e como.
**Não funcionou / deixei de fora:** e o motivo.
**Checklist da regra 1:** tela ✔/✖ · ações ✔/✖ · app.mjs ✔/✖ · CSS ✔/✖ · teste ✔/✖
**Precisa de decisão:** a pergunta exata para o Yuri, se houver.
```

### 22/09/2026 — Tarefas 13 (§1.7 e §2), 15 e 12 (biografia) · Claude
**Fiz:** (1) Quebra-cabeça por região: `atlas.layout` guarda `{x,y}` por caixa e região (`scene-atlas.mjs: setAtlasLayoutPosition, resetAtlasLayout`, e `removeAtlasScene` limpa a posição); `buildRegionPuzzle` monta caixas (região/local/sub-local/cena), linhas de hierarquia, portais tracejados e a lista de portais pra fora da região, com arranjo inicial em árvore que quebra linha. Tela em `library.mjs: renderAtlasPuzzle, puzzleBoard`; arrastar em `app.mjs: _bindPuzzle`. Sub-abas "Quebra-cabeça" (padrão) e "Lista". (2) Cena Atual: `activeSceneDiagram` (`sceneNeighborhood`) e `activeSceneNpcTree` (`regionLocalityTree`), além de "Aqui agora" e do resto do painel. (3) `src/world-explorer.mjs` + `explorationButton`. (4) `monster-convert.mjs: buildFieldSheet, alignmentPhrase, tacticsFromItems`; `alignment` lido nos 3 normalizadores; macro de reconversão passa o habitat.
**Funcionou:** 240 testes (10 novos, incluindo o botão do World Explorer com dado estranho e a árvore começando fechada). Prévia estática no navegador com dados falsos de Thur Thur: quebra-cabeça e Cena Atual renderizam como esperado. Ficha de campo rodada contra os 322 monstros reais do SRD — nenhum sem Temperamento ou Táticas.
**Não funcionou / deixei de fora:** o arrastar não foi exercitado de verdade (a prévia não tem o `app.mjs`); nada visto no Foundry. §1.6 não foi tocado (precisa de print). Conteúdo das fichas de D&D virou a Tarefa 18.
**Checklist da regra 1:** tela ✔ (prévia) · ações ✔ · app.mjs ✔ · CSS ✔ · teste ✔ · **Foundry ✖**
**Precisa de decisão:** nenhuma — as escolhas de implementação estão em `docs/PROGRESSO-MAPA-IMERSIVO.md`.

### 22/09/2026 — Tarefa 16
**Fiz:** revisei o quebra-cabeça e a árvore de NPCs de `1cbe655`. `regionLocalityTree` agora quebra ciclos de `place.parentId` em raízes seguras, evitando que NPCs desapareçam da árvore quando dois locais apontam um para o outro. Acrescentei teste para cena diretamente na região, local apagado, 31 locais, região ausente e ciclo.
**Funcionou:** `npm test` passou com 241 testes; `npm run package` gerou o pacote de desenvolvimento. Os cenários são dados falsos de Node.
**Não funcionou / deixei de fora:** o arrasto nativo, o drop fora do quadro, re-render durante arrasto e a inspeção visual com 100+ NPCs exigem DOM/Foundry; não há mundo de teste nesta execução. A amostra SRD já tinha sido validada no commit revisado; não alterei o conversor.
**Checklist da regra 1:** tela ✖ · ações ✖ · app.mjs ✖ · CSS ✖ · teste ✔ · Foundry ✖
**Precisa de decisão:** nenhuma.

### 22/09/2026 — Tarefa 17
**Fiz:** movi as funções de tela do Mapa Imersivo e da Cena Atual para `src/panels/mapa-imersivo.mjs`. `CampaignLibrary` conserva métodos delegadores, portanto as ações e chamadas existentes continuam com a mesma assinatura.
**Funcionou:** `npm test` passou com 241 testes e `npm run package` gerou o pacote de desenvolvimento. A extração preserva as mesmas funções auxiliares e strings de HTML; a conferência é de Node, não de Foundry.
**Não funcionou / deixei de fora:** a aparência e o arrasto ainda precisam da conferência no Foundry já registrada para a T13; não há mundo de teste nesta execução.
**Checklist da regra 1:** tela ✔ (HTML testado) · ações ✔ · app.mjs ✔ (inalterado) · CSS ✔ (inalterado) · teste ✔ · Foundry ✖
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 13 (§1.1–1.5 e aba Cena Atual) · Codex — *registrado pelo Claude a partir dos commits*
**Fiz:** `a34ea0a` — acordeões lembram estado (`state.atlasOpen` + evento `toggle` em `app.mjs`), prefixo "Mapa:" quando a cena tem o nome do local, botão "Remover esta entrada" em cena ausente (`lib-atlas-scene-remove`) e `Hooks.on('deleteScene')` em `main.mjs`, miniaturas ligadas por padrão, Mapa Imersivo como primeira aba e vista padrão. `60c706d` — área nova `activeScene` ("Cena Atual") na barra do mestre; o painel saiu de dentro do Mapa.
**Funcionou:** testes de `library.test.mjs` ajustados; 230 passando naquele ponto.
**Não funcionou / deixei de fora:** o diário não tinha sido preenchido; a árvore de NPCs e o mini-diagrama ficaram pro Claude (entrada acima).
**Checklist da regra 1:** tela ✔ · ações ✔ · app.mjs ✔ · CSS ✔ · teste ✔ · Foundry ✖
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 5
**Fiz:** incluí no topo da visão de região da Mestra o bloco somente-leitura “Conferência da região”. Ele lista, com contagem e atalhos, NPCs sem legado, herança, local ou guilda; retratos provisórios; mercadores sem estoque; localidades sem cena; cenas regionais fora do Mapa Imersivo; e localidades com NPCs sem gancho de rumor. A resolução do atlas ganhou a opção de ignorar os vínculos legados, para a auditoria não confundir uma cena escolhida antes com uma cena organizada no atlas.
**Funcionou:** os testes cobrem cada categoria, os atalhos para editor de NPC/localidade/cena e o selo “Região pronta para servir de modelo” quando não há pendência. Os testes direcionados de biblioteca e atlas passaram; a conferência não atualiza settings nem Actors.
**Não funcionou / deixei de fora:** a aparência e os atalhos ainda precisam de conferência visual num mundo de teste do Foundry. Rumores escritos à mão continuam regionais; para a checagem por localidade, os ganchos automáticos agora carregam o NPC e a localidade de origem.
**Checklist da regra 1:** tela ✔ · ações ✔ (somente ações existentes) · app.mjs ✔ (encaminhamento existente) · CSS ✔ · teste ✔
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 12
**Fiz:** criei `.local/fichas-de-campo.json` com 44 fichas curtas, uma para cada ameaça do bestiário do livro. Cada uma tem aparência, temperamento, comportamento, o que quer e dois ganchos, todos redigidos em palavras próprias e sem texto extenso de livro.
**Funcionou:** validei o JSON e a presença dos cinco campos em todas as 44 entradas. O arquivo fica em `.local`, portanto não entra no pacote nem no repositório público.
**Não funcionou / deixei de fora:** o conversor atual ainda não lê o arquivo, então a reconversão não preenche essas fichas automaticamente até essa etapa ser conectada. Não criei conteúdo para os 326 monstros de D&D.
**Checklist da regra 1:** tela ✖ (conteúdo local) · ações ✖ · app.mjs ✖ · CSS ✖ · teste ✔ (validação estrutural local)
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 10
**Fiz:** incluí no catálogo do bestiário o local, região ou além de Opath de cada uma das 44 ameaças do livro, seguindo a tabela da macro de distribuição. A aba Monstros ganhou facetas de Região e Além de Opath, chip de localização no cartão e linha de habitat no detalhe. Uma flag `flags.quedaco.monster` de uma ficha do mundo prevalece sobre o índice do livro; sem qualquer origem, a ameaça entra em “Sem região”.
**Funcionou:** o teste cobre as três origens da faceta (local do livro, flag do mundo e ausência), além de confirmar as novas facetas e a linha de habitat na tela. A seleção continua usando o filtro já existente e não grava Actor nem setting.
**Não funcionou / deixei de fora:** “Aranha gigante” e “Gavião gigante” ficaram somente no nível regional porque a tabela da macro aponta Túneis/Dunas, que não são localidades cadastradas no índice público do módulo; não criei localidade fictícia.
**Checklist da regra 1:** tela ✔ · ações ✔ (reaproveita filtros e edição de habitat) · app.mjs ✔ (encaminhamento existente) · CSS ✔ · teste ✔
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 9
**Fiz:** adicionei o índice de imagens do mundo. A Mestra usa “Reindexar imagens”; o módulo lista as pastas conhecidas uma vez e guarda os caminhos existentes. Com índice da mesma pasta de imagens, o resolvedor oferece apenas os arquivos listados, evitando as tentativas `.webp`/`.png` inexistentes. Sem índice, ou se a pasta mudou, ele conserva o fallback antigo.
**Funcionou:** o teste cobre um índice com só `.png` existente e confirma que `.webp` não entra na cadeia; também confirma a cadeia completa no primeiro uso, sem índice. O botão é uma ação de Mestra e o jogador apenas lê o setting de mundo.
**Não funcionou / deixei de fora:** a listagem real do `FilePicker` ainda precisa de uma conferência no Foundry, pois o ambiente de teste não tem armazenamento de mundo para navegar.
**Checklist da regra 1:** tela ✔ · ações ✔ · app.mjs ✔ (encaminhamento genérico existente) · CSS ✔ (botão usa o topo existente) · teste ✔
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 8
**Fiz:** retirei da tela a cobertura regional de NPCs, a importação de guildas já concluída e a instrução “Onde colocar as imagens” do Mapa. Criei um cabeçalho compartilhado para NPCs, Guildas, Monstros e Itens: pesquisa vem antes, filtros vêm em seguida, e Guildas mantém abas à esquerda e ações à direita na mesma faixa. “Guardar as sem membro” agora tem a aparência de ação secundária.
**Funcionou:** testes confirmam que os blocos retirados não voltam a ser renderizados, que NPCs e Guildas usam o cabeçalho com “Pesquisar” e “Filtrar por”, e que o mapa configurado não mostra mais a instrução removida. O CSS reserva uma quebra segura para 700 px, levando as ações abaixo das abas sem sobreposição.
**Não funcionou / deixei de fora:** a geração por cobertura permanece como ação interna porque ainda há automação e teste para ela; somente o painel antigo foi removido da interface.
**Checklist da regra 1:** tela ✔ · ações ✔ (as existentes preservadas) · app.mjs ✔ (encaminhamento existente) · CSS ✔ · teste ✔
**Precisa de decisão:** nenhuma.
