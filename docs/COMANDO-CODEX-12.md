# COMANDO CODEX — 12ª rodada: Conversa (T28)

Documento de passagem. **Claude estrutura, Codex executa, Yuri confirma.** Leia este
arquivo, o `CLAUDE.md` da raiz e **`docs/T28-DIALOGO-DE-VENDA.md` inteiro** (é a
especificação; este arquivo só ordena o trabalho). As decisões já foram tomadas pelo Yuri
— não pergunte de novo o que o T28 resolve.

**HEAD de referência:** o commit que criou este arquivo (filho de `e358671`).
**Versão publicada:** confira `module.json` — hoje 0.13.0. Esta rodada vira a próxima
versão quando o Yuri autorizar. **Não aumente a versão nem publique** — isso é do Claude,
com autorização do Yuri pra cada versão.

**Outras frentes abertas que NÃO são desta rodada — não mexa:** T26 (montar mapas — a
Tarefa 3, pastas, está em pausa por decisão do Yuri), T27 (Ficha V2) e o ajuste do topo
"descolado" (T25 §1.6, espera print).

---

## 0. Regras

Valem todas as das rodadas 9, 10 e 11 (só está feito quando está na tela; registrar e
commitar se parar no meio; nada sem pedido escrito; a P.I.P.I. nunca é tocada; CRLF/LF
misto — preserve o que existe; separe "testado com dado falso" de "visto no Foundry").
Mais as específicas:

- **CSS segue `docs/DESIGN-SISTEMA-VISUAL.md`** (regra 10 do `CLAUDE.md`) e passa em
  `npm run lint:css`. O overlay da conversa fica **fora** de `.sy-creator`: use o prefixo
  `.sy-conv-*` e não herde nada do painel.
- **Não crie, edite nem exclua Atores do mundo oficial.** Conversa não grava em ficha
  nenhuma — o "nome só da conversa" vive na conversa. Testes param antes de qualquer
  escrita em Actor.
- **Sem dependência nova de módulo** (nada de `lib-wrapper` nem `socketlib`) e **sem
  `socket: true`** no `module.json`. A sincronização usa *setting* de mundo + flag no
  próprio usuário (T28, 4.2). Se um dia o `lib-wrapper` estiver ativo, pode ser usado
  como **atalho opcional**, nunca como requisito.
- Lógica pura em `src/conversation.mjs`; telas em `src/panels/conversa.mjs`. **Não
  engorde o `library.mjs`.** Teste com `node --test`, sem o Foundry rodando.
- Código **próprio**, inspirado na interface do Conversation HUD (MIT). Não copie arquivo
  dele. Acrescente a linha de crédito do T28, seção 0.

---

## 1. Tarefas — nesta ordem

### Tarefa 1 — Lógica pura e testes (T28, seções 4.2, 4.3, 6)  · *média*

Em `src/conversation.mjs`, tudo testável sem Foundry:

1. `conversationActorKind(actor)` → `player | npc | monster | guild` (regra do T28 4.3).
2. `normalizeConversation(value)` — estado seguro (como `normalizeSceneAtlas`): descarta
   campo inválido, garante `id` em cada participante, limita tamanhos.
3. `participantDisplay(participant, {isGM})` → nome mostrado: `alias || name`; com
   `showName:false` e `!isGM`, "Desconhecido".
4. `activeParticipant(conversation, users, {isGM})` — o orador ativo. `gm`: o `activeId`.
   `collective`: se `playersCanSpeak` desligado, o `activeId`; se ligado, o mais recente
   (`at`) entre o do Mestre (`activeAt`) e as flags `speak` dos usuários **que podem
   falar como aquele participante** (dono do ator). Empate: vence o mais recente já
   gravado no estado; flag de outra conversa é ignorada.
5. `dialogueLines(npcFlag)` — as falas do NPC: as escritas (não vazias, até 3), senão o
   texto padrão da atitude (`flag.shop.attitude`, tabela do T28 seção 2 item 4). Atitude
   desconhecida cai em "indiferente".
6. `pullableSceneActors(scene, game)` — atores com token na cena, sem repetir, com
   foto e nome, **sem guildas**.

**Pronto quando:** testes cobrem cada função, incluindo: jogador sem permissão não vira
orador; flag de conversa antiga ignorada; "Desconhecido" só para quem não é o Mestre;
NPC sem falas usa o texto da atitude; monstro `type:'npc'` ≠ NPC `character` com flag.

### Tarefa 2 — Modo 1: conversa de venda (T28, seção 2)  · *média, com um experimento*

**Comece pelo experimento do clique (T28 4.1), numa cópia do mundo — peça ao Yuri, não
no mundo oficial.** Descubra e registre no diário qual das duas formas funciona:
(a) clique simples por ouvinte no palco do canvas; (b) duplo clique via `_onClickLeft2`.
Se a (a) funcionar sem atrapalhar arrastar/panning, use a (a); senão, a (b). **O
comportamento normal do Foundry não pode ser tirado de ninguém que não tenha o diálogo
habilitado.**

Depois:

1. Editor do NPC: bloco **Diálogo de venda** (caixa de habilitar + 3 campos de fala,
   vazio = texto padrão), gravando em `flags.quedaco.npc.dialogue`. Só aparece para NPC
   de venda.
2. Ao clicar no token de um vendedor **habilitado e liberado aos jogadores** (mesma regra
   `npcOpenToPlayers`), para **jogador** (não para o Mestre): confirmação "Abrir diálogo
   com *Nome*?" (`DialogV2.confirm`).
3. Janela do diálogo: cenário desfocado; **NPC à esquerda, personagem do jogador à
   direita** (`game.user.character`, senão o avatar do usuário); caixa de fala com nome +
   texto; clique/Enter avança; "Pular".
4. Depois da última fala: **janela de loja avulsa** só desse NPC, reaproveitando o
   cartão da loja (`npcSellCard`, `cartBlock`, `openShop`). **Não depender da aba NPCs
   estar liberada** (o painel do jogador abre sempre em "Mapa").

**Pronto quando:** testes de tela (editor, janela, sequência de falas, queda para o
texto padrão, o jogador sem o diálogo habilitado não é interceptado); o experimento do
clique está descrito no diário, com o resultado real; o que só se vê no Foundry está
marcado ✖.

### Tarefa 3 — Modo 2: conversa de cena, controlada pelo Mestre (T28, seções 3 e 5)  · *grande*

1. Área **Conversa** no painel da Mestra: criar (tipo, fundo), participantes, caixa Ativo,
   clonar, editar, apagar, arrastar pra reordenar, "Fechar conversa".
2. **Puxar da cena** (foto + nome + caixa de marcar; todos/nenhum/inverter; Adicionar).
3. **Seletor de ator** (T28 seção 5): busca, seções Jogadores · NPCs · Monstros com
   selo, foto + nome, preenche nome e retrato sozinho. **Participante avulso.**
4. **Nome só da conversa** (`alias`) e "exibir nome". A ficha nunca é alterada.
5. **Overlay** em todos os clientes (lido do setting): cenário desfocado, orador grande
   no centro com a barra de nome, barra de ferramentas (fechar · minimizar · mostrar/
   ocultar · trocar fundo), minimizado = retrato pequeno no canto. Não bloqueia o canvas
   quando minimizado.

**Pronto quando:** testes de tela e de estado; mudar o orador atualiza o overlay; o Mestre
vê o nome verdadeiro e o jogador vê "Desconhecido" quando `showName:false`.

### Tarefa 4 — Coletivo (T28, seção 3 item 8)  · *média*

1. Botão **liga/desliga "Jogadores podem falar"** (grava `playersCanSpeak`).
2. Com ele ligado, cada jogador vê, embaixo do overlay, os retratos dos participantes dos
   quais é dono e **clica pra falar** (grava a flag `speak` do usuário com
   `game.time.serverTime`); **o clique mais recente vence**. Desligado: cliques ignorados.

**Pronto quando:** testes com a função `activeParticipant` e com a tela; dois cliques em
sequência trocam o orador; o liga/desliga bloqueia o jogador.

### Ao terminar

Atualize `docs/MAPA-DO-MODULO.md` (área nova "Conversa": onde mora cada função),
`docs/PROGRESSO-CONVERSA.md` (novo, barra e % por etapa, separando código/teste falso/
visto no Foundry — regra 8 da rodada 10) e a barra do T28 (seção 7).

---

## 2. Fica com o Yuri — não codifique

| Item | O que falta |
|---|---|
| **Cópia do mundo para o experimento do clique** | O Codex precisa de um mundo de teste (não o oficial) pra descobrir se o clique simples funciona. |
| **Conferir tudo no Foundry** | Modo 1 e Modo 2, numa cópia do mundo, depois que o Claude publicar. |
| **Escrever as falas dos vendedores** | Hoje valem os textos padrão por atitude; ele reescreve as que quiser. |
| **Publicar** | Só o Claude, com autorização do Yuri. |

---

## 3. Diário de bordo — preencha aqui

Formato de cada entrada:

```
### <data> — Tarefa N
**Fiz:** o que mudou de comportamento, e em quais arquivos.
**Funcionou:** o que você verificou, e como.
**Não funcionou / deixei de fora:** e o motivo.
**Checklist da regra 1:** tela ✔/✖ · ações ✔/✖ · app.mjs ✔/✖ · CSS ✔/✖ · teste ✔/✖ · Foundry ✔/✖
**Precisa de decisão:** a pergunta exata para o Yuri, se houver.
```
