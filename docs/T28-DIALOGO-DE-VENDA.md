# T28 — Conversa: diálogo do vendedor e conversa de cena

> Pedido do Yuri, 11/10/2026. Ele já testou o Conversation HUD na mesa, mandou 26 prints
> de como ele funciona por dentro e descreveu o que quer: **a estética e o fluxo dele,
> dentro do QUEDAÇO, em dois modos** (conversa de venda com o jogador; conversa de cena
> controlada pelo Mestre, com um modo "coletivo" onde os jogadores pedem a fala).
>
> **Estado: decidido e especificado. Nada codado.** Handoff para o Codex em
> `docs/COMANDO-CODEX-12.md`.

## 0. Decisão

**Recriar dentro do QUEDAÇO, copiando a interface e o fluxo do Conversation HUD. Não
depender dele.** O Yuri disse "pode copiar igual tá ali" e mandou os prints pra isso.

Por quê, em uma linha cada:

- O que ele quer **não existe** no Conversation HUD: o modo **Coletivo** (cada jogador
  clica pra falar) aparece **desligado** na tela de criação ("em desenvolvimento"), e não
  há texto de fala, escolhas nem ligação com a loja.
- Depender dele seria 3 módulos extras (`lib-wrapper`, `socketlib`,
  `lib-dfreds-ui-extender`), uma API sem documentação quebrada na 6.0.0 e só Foundry 13
  (ver `docs/REFERENCIA-SKYFALL.md`, "ConversationHUD").
- O QUEDAÇO já tem o que a venda usa: atitude, pechincha, carrinho, retrato do NPC.

**Crédito e licença:** o Conversation HUD é MIT. A gente escreve código próprio inspirado
na interface dele (não copia arquivo). Se algum trecho for copiado, manter o aviso de
copyright MIT junto. Colocar uma linha de crédito ("interface inspirada no
ConversationHUD, de Saervicus") na documentação do módulo.

## 1. O que os prints do Yuri mostram (o desenho a copiar)

**Criar conversa.** Um botão "Create Conversation" abre a escolha de tipo:

| Tipo | Texto original | No módulo dele |
|---|---|---|
| **GM Controlled** | "Só o Mestre escolhe quem fala. Melhor para cenas em que NPCs falam ao grupo." | funciona |
| **Collective** | "Cada jogador escolhe seu orador. Útil para cenas de grupo em que os jogadores se revezam." | **desligado** |

Depois, uma janela com **fundo da conversa** (imagem opcional; sem imagem = fundo escuro
translúcido desfocado) e a lista de **participantes**, com dois botões: "puxar
participantes da cena" e "adicionar participante".

**Participante** (duas abas, Participante · Facção): nome, "exibir nome" (desligado mostra
"Desconhecido"), retrato com seletor de arquivo, escala do retrato, âncora vertical e
horizontal do retrato, diário vinculado, **ator vinculado**.

**Puxar da cena:** lista com **foto + nome + caixa de marcar** de cada ator da cena, botões
marcar todos / nenhum / inverter, e "Adicionar atores". É o fluxo que o Yuri quer ("adiciono
todos e marco quem eu quero").

**Lista de participantes:** alça de arrastar, caixa **Ativo** (quem fala agora), faixa,
detalhes (retrato, nome, facção) e ações clonar · editar · apagar.

**Na mesa:** o cenário fica **desfocado**; o participante ativo aparece **grande, no
centro**, com o nome numa barra embaixo. Barra de ferramentas: fechar · minimizar ·
travar minimização · mostrar/ocultar · "falar como" no chat · trocar fundo · salvar.
Minimizado, vira um retrato pequeno no canto de baixo. A lista fica numa aba da barra
lateral, com "Fechar conversa".

**Os três problemas que o Yuri achou usando:**

1. **"Ator vinculado" lista todo mundo só por nome** (centenas, inclusive guildas).
2. **O participante novo entra "anônimo"** — escolher o ator vinculado **não** preenche
   nome nem retrato. O Yuri adicionou "Jorel rabo de raposa" e ele ficou como
   "Desconhecido".
3. **Não distingue monstro de NPC.**

## 2. Modo 1 — Conversa de venda (o jogador, no token do vendedor)

**Fluxo**, nas palavras do Yuri: chegamos na cidade, o mapa tem o token do NPC. Se ele é de
venda e está habilitado, **quando o jogador clica no token, pergunta "Abrir diálogo com o
NPC?"**. Se sim: o NPC tem **2 ou 3 falas** pro jogador ver, com a **imagem do NPC à
esquerda e a do jogador à direita**. **Em seguida abre a loja.**

1. **Quem é afetado:** só NPC **vendedor** — e vendedor agora é o que o **módulo
   independente `quedaco-npcs-de-venda`** diz (T30, 13/10/2026): `flags['quedaco-npcs-de-venda']
   .shop` com `enabled` e `public` ligados. O QUEDAÇO **reconhece** isso por
   `src/vendors.mjs` (`vendorShop`, `isVendor`), já pronto e testado. Em cima disso, uma
   chave **só do QUEDAÇO**, por NPC e desligada por padrão (`flags.quedaco.npc.dialogue.enabled`),
   liga a conversa: vendedor sem a chave continua vendendo normalmente, sem diálogo. O bloco
   do editor só aparece para NPC reconhecido como vendedor.
2. **Clique no token do vendedor** → pergunta Sim/Não ("Abrir diálogo com *Nome*?").
   Para o Mestre nada muda (ele continua com o comportamento normal do Foundry).
   **Atenção ao limite técnico verificado — seção 4.1.**
3. **A janela:** cenário desfocado atrás; NPC grande à esquerda, personagem do jogador
   (`game.user.character`, ou o avatar do usuário se não tiver) à direita; uma caixa de fala
   embaixo com o nome de quem fala e o texto. Clique/Enter avança; "Pular" vai direto
   pra loja.
4. **As falas:** 2 ou 3 por NPC, escritas pela Mestra no editor do NPC. **Sem fala escrita,
   vale um texto padrão por atitude** (hostil → aliado), pra habilitar um vendedor já
   funcionar na hora. Textos padrão provisórios (a Mestra reescreve):

   | Atitude | Fala 1 | Fala 2 | Fala 3 (opcional) |
   |---|---|---|---|
   | Hostil | "Ah, é você. Fale logo o que quer, não tenho o dia todo." | "Os preços são esses. Se não gostar, a porta está logo ali." | "Mexeu em algo sem pagar, e a conversa acaba." |
   | Negativo | "Pois não… mas não espere milagres." | "Estoque é o que está à vista. Preço também." | "Olhe com cuidado e decida logo." |
   | Indiferente | "Boas. Dê uma olhada, nada está escondido." | "Preço de tabela, sem enrolação." | "Se precisar de algo, é só chamar." |
   | Prestativo | "Ora, bem-vindos! Entrem, entrem." | "Deixe-me ver se tenho algo que sirva ao grupo." | "Pra quem trata bem, eu trato melhor." |
   | Aliado | "Que bom ver vocês! Chegaram na hora certa." | "Pra vocês eu guardei o que tenho de melhor." | "Hoje o preço sai bem mais em conta. Amigo é amigo." |

   A atitude vem de `flags.quedaco.npc.shop.attitude` (escala do livro,
   `src/negotiation.mjs`). **A atitude continua sendo da Mestra** — o livro diz que ela
   muda por sucesso e falha nas Cenas de Interação Social (`docs/T-NEGOCIACAO.md`).
5. **Depois da última fala, abre a loja — a do módulo de vendas, não uma nossa.**
   **Atualizado em 13/10/2026 (T29 + T30):** o painel do QUEDAÇO é só da Mestra e a loja
   virou o módulo independente `quedaco-npcs-de-venda` (v0.1.0). A T28 **não constrói
   janela de loja nenhuma**: chama a API dele,
   `game.modules.get('quedaco-npcs-de-venda')?.api?.open(actor)`. Se o módulo não estiver
   ativo, avisa com uma notificação e encerra a conversa — nunca erro. **Quem pode comprar
   é problema dele:** o jogador precisa ter **observador** na ficha do vendedor e uma ficha
   própria com moedas, e a Mestra precisa estar conectada pra aprovar cada pedido (README do
   módulo). Isso também ajuda o clique no token: observador é mais que o LIMITED que o
   duplo clique exige (seção 4.1). **Não use `npcOpenToPlayers`, "localidade liberada",
   `openShop`, `npcSellCard` nem `cartBlock`** — são a loja antiga do QUEDAÇO, que agora
   duplica o módulo novo (o que fazer com ela é decisão pendente do Yuri, ver
   `docs/T30-VENDEDORES-RECONHECIDOS.md`).

## 3. Modo 2 — Conversa de cena (o Mestre)

Copia o Conversation HUD, com os acréscimos que o Yuri pediu.

1. **Dois tipos**, igual à tela de escolha dele: **Controlada pelo Mestre** e **Coletiva**
   (esta funciona de verdade).
2. **Criar:** fundo opcional (seletor de arquivo; sem fundo = o próprio cenário
   desfocado), e participantes.
3. **Puxar da cena:** lista com foto + nome + caixa de marcar dos atores que têm token na
   cena atual; marcar todos / nenhum / inverter; "Adicionar". O Mestre adiciona todos e
   marca quem quer.
4. **Adicionar participante** por um **seletor com foto e nome** (seção 5), ou **avulso**
   (nome + imagem, sem ator) — pro caso do Jorel, que não tem ficha.
5. **Nome e retrato vêm sozinhos** ao escolher o ator (problema 2 do Yuri).
6. **Nome só da conversa:** cada participante tem um **"Nome na conversa"** editável,
   guardado só na conversa — **a ficha nunca é alterada**. Mostra-se o nome da conversa
   se existir, senão o do ator. A caixa "exibir nome" desligada mostra "Desconhecido" para
   os jogadores (o Mestre vê sempre o nome verdadeiro).
7. **Na mesa:** cenário desfocado; **quem está falando fica grande no centro**, com o
   nome numa barra; mudar o orador troca na hora. Barra de ferramentas: fechar ·
   minimizar · mostrar/ocultar pros jogadores · **trocar o fundo** · **liga/desliga o
   "jogadores podem falar"** (item 8). Minimizado vira um retrato pequeno no canto.
8. **Coletivo — o que o Yuri mais quer:** **cada jogador clica livremente pra falar.**
   O personagem dele aparece em destaque. **Se outro jogador clica e fala, troca
   automaticamente** (vale o clique mais recente). O Mestre tem **um botão liga/desliga**
   pra permitir ou impedir isso. Ligado: os jogadores veem, embaixo da conversa, os
   retratos dos participantes que **eles controlam** (ator de que são donos) e clicam.
   Desligado: os cliques dos jogadores não fazem nada e só o Mestre escolhe o orador.
9. **Onde o Mestre mexe:** uma área nova **Conversa** no painel da Mestra (lista de
   participantes, caixa Ativo, clonar, editar, apagar, arrastar pra reordenar, fechar a
   conversa). Não criar aba na barra lateral do Foundry.

## 4. Restrições técnicas verificadas

Conferidas no código do Foundry **13.351** instalado nesta máquina
(`client/canvas/placeables/token.mjs`, `placeable-object.mjs`) e no nosso código.

### 4.1 Clique no token: o jogador **não consegue** clicar no token de um NPC alheio

- O clique simples (`clickLeft`) só dispara se `_canControl` deixar, e isso exige poder
  **modificar** o token (`document.canUserModify(user,"update")`). **Jogador não controla
  token de NPC — então `Token#_onClickLeft` nunca é chamado pra ele.** Interceptar esse
  método não funciona.
- O **duplo clique** (`clickLeft2` → `_onClickLeft2`) **funciona** pra quem tem permissão
  **LIMITED** no ator, e o Foundry usa isso hoje pra abrir a ficha. O QUEDAÇO já dá
  LIMITED ao NPC quando a Mestra salva (teste "salvar NPC concede visão limitada").
- **Hover** (`hoverIn`) funciona pra qualquer um.

**Então o "clique" vira uma de duas coisas, e quem implementar tem de descobrir qual
funciona na mesa do Yuri, numa cópia do mundo, antes de construir o resto:**

1. **Clique simples** por um ouvinte nosso no palco do canvas (acha o token sob o
   ponteiro e ignora arrastos/panning). Melhor experiência; precisa de teste real.
2. **Duplo clique** interceptando `_onClickLeft2` só para token de vendedor habilitado
   (no lugar de abrir a ficha). Garantido pelo Foundry; um clique a mais.

Se o Mestre ou o jogador não tiver o diálogo habilitado, **o comportamento normal do
Foundry nunca pode ser tirado**.

### 4.2 Sincronizar a conversa sem socket

O módulo hoje **não usa socket** (`module.json` sem `"socket": true`, nenhum
`game.socket` em `src/`). Dá pra continuar sem, com os dois mecanismos que já usamos:

- **Estado da conversa = um *setting* de mundo** (só o Mestre grava; `onChange` redesenha
  em todos os clientes). Mesmo padrão de `sceneAtlas`, `sharedContent` etc.
- **Cliques dos jogadores = uma flag no próprio usuário** (`user.setFlag`, o jogador
  pode gravar a dele — é assim que as tags de papel dos jogadores funcionam hoje,
  `NPC_ROLES2_FLAG` em `src/library.mjs`). Cada clique grava
  `{conversationId, participantId, at}`; quem calcula o orador ativo é uma **função pura**
  que pega o mais recente entre o do Mestre e os dos jogadores permitidos. Usar
  **`game.time.serverTime`** (não `Date.now()`, que difere entre computadores).

### 4.3 NPC × monstro

No mundo do Yuri: NPC do módulo = ator `character` com `flags.quedaco.npc` (função
`npcFlag`); monstro = ator `npc` do Skyfall (os convertidos têm
`flags.quedaco.convertedFrom`); guilda = ator `guild`. Função pura
`conversationActorKind(actor)` → `player | npc | monster | guild`, com teste.
**Guildas ficam fora do seletor.**

## 5. Seletor de ator (com foto, nome e busca)

Substitui o menu de centenas de nomes. Uma janela com:

- **Campo de busca** por nome.
- **Abas ou seções: Jogadores · NPCs · Monstros** (Monstros = fichas de ameaça, com um
  selo "Monstro" no cartão). Mostra **foto + nome**, e nos NPCs o local/papel pequeno.
- Escolher **preenche nome e retrato sozinho** (o retrato usa o mesmo `ImageResolver` dos
  cartões de NPC) e grava `actorUuid`.
- Também a opção **"Participante avulso"** (nome + imagem).

Seguir `docs/DESIGN-SISTEMA-VISUAL.md` (escala 4/8px, rótulo+campo com gap, cards de
altura igual, nada de contêiner esticado sem necessidade).

## 6. Dados

```
flags.quedaco.npc.dialogue = { enabled:false, lines:['','',''] }   // vazio = texto padrão da atitude

setting de mundo `conversation` = {
  id, type:'gm'|'collective', background:'', visible:true,
  playersCanSpeak:false, activeId:null, activeAt:0,
  participants:[{ id, actorUuid:'', kind:'player'|'npc'|'monster'|'free',
                  name, alias:'', img, showName:true, scale:1 }]
}

user.flags.quedaco.speak = { conversationId, participantId, at }
```

Código novo: lógica pura em `src/conversation.mjs` (tipo do ator, escolha da fala, orador
ativo, normalização do estado), telas em `src/panels/conversa.mjs` e CSS próprio
`.sy-conv-*` (o overlay fica **fora** de `.sy-creator`). Nada disso no `library.mjs`.

## 7. Etapas e progresso

```
Pesquisa e especificação  [████████████████████] 100%   (este documento)
1 Lógica pura + testes    [░░░░░░░░░░░░░░░░░░░░]   0%
2 Modo 1 (vendedor)       [░░░░░░░░░░░░░░░░░░░░]   0%
3 Modo 2 (Mestre)         [░░░░░░░░░░░░░░░░░░░░]   0%
4 Coletivo                [░░░░░░░░░░░░░░░░░░░░]   0%
5 Conferência no Foundry  [░░░░░░░░░░░░░░░░░░░░]   0%   ← Yuri, numa cópia do mundo
```

**Esforço:** todas as etapas cabem no **Sonnet**. A única parte de risco é o experimento
do clique (4.1); só voltar pro Opus se o experimento mostrar que nenhuma das duas formas
serve.

## 8. Decisões que escolhi por padrão (o Yuri pode trocar)

1. **Falas padrão por atitude** quando o NPC não tem fala escrita (seção 2, item 4).
2. **Orador do jogador:** só participantes de cujo ator ele é dono (`actor.isOwner`).
3. **Fundo padrão:** o próprio cenário desfocado; trocável por imagem.
4. **Loja = a do módulo de vendas** (`api.open(actor)`), chamada depois do diálogo; o QUEDAÇO não tem mais loja própria para o jogador (T29/T30).
5. **"Falar como" no chat** e **salvar conversa em Diário** (os dois ícones da barra do
   Conversation HUD): **fora da v1**, não foram pedidos.
6. **Diferença NPC × monstro:** seletor em seções + selo no cartão e na lista do Mestre.

## 9. Fora do escopo da v1

Facções, ramificação de diálogo (escolhas do jogador dentro da fala), conversa salva em
Diário, "falar como" no chat, integração com o Conversation HUD (ponte opcional — só se
um dia fizer falta; seria protegida como a do World Explorer), vários vendedores falando
ao mesmo tempo.

## 10. Fontes

- Prints do Yuri, 11/10/2026 (interface do Conversation HUD na mesa dele).
- [ConversationHUD — Foundry](https://foundryvtt.com/packages/conversation-hud) ·
  [GitHub](https://github.com/CristianVasile23/conversation-hud) (MIT) ·
  [CHANGELOG](https://github.com/CristianVasile23/conversation-hud/blob/main/CHANGELOG.md)
- Código do Foundry 13.351 instalado: `client/canvas/placeables/token.mjs`
  (`_canControl`, `_canView`, `_onClickLeft`, `_onClickLeft2`) e `placeable-object.mjs`
  (`_createInteractionManager`).
