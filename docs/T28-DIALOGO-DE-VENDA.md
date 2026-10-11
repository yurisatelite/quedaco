# T28 — Diálogo dos NPCs de venda: integrar com o Conversation HUD ou recriar?

> Pedido do Yuri, 11/10/2026: "existe um módulo chamado Conversation HUD. Ou a gente vai
> integrar com ele pra criar um diálogo pros NPCs de venda ou a gente vai recriar ele
> pra adicionar nos NPCs de venda. Verifica isso."
>
> **Estado: pesquisa feita, decisão do Yuri pendente.** Nada foi codado. Este documento
> é o que o Codex (ou qualquer modelo) precisa ler antes de começar — e o que o Yuri
> precisa ler pra decidir.

## 0. Resposta curta

**O Conversation HUD não faz diálogo.** Ele é um painel de retratos: mostra na tela de
todo mundo quem está numa conversa e destaca quem está falando. Não tem texto de fala,
não tem escolhas, não tem ramificação, não tem ligação com loja ou preço. Então as duas
opções do pedido se desfazem num ponto: **a parte "diálogo" (falas, escolhas, reação à
pechincha) vai ter que ser nossa de qualquer jeito.** A pergunta real é só se o
*retrato na tela de todos* vem dele ou da gente.

**Recomendação: recriar a versão leve (caminho B), e deixar uma ponte opcional com o
Conversation HUD pra depois (caminho C).** Motivos na seção 4.

## 1. O que o Conversation HUD é — conferido em 11/10/2026

Fonte: código do GitHub (`CristianVasile23/conversation-hud`, lido pela API do GitHub),
página do pacote no Foundry e changelog. Onde digo "não confirmei", é porque não achei.

| Fato | Valor |
|---|---|
| Autor / licença | Saervicus (Cristian Vasile) · **MIT** |
| Versão atual | **6.0.0**, publicada em **16/10/2025** (quase um ano atrás); último push no repositório em 13/03/2026 |
| Compatibilidade | **Foundry 13 apenas** (`minimum/verified/maximum = 13` no `module.json`). A 6.0.0 abandonou o 12 e inferiores |
| Dependências obrigatórias | **3**: `lib-wrapper`, `socketlib` e `lib-dfreds-ui-extender` |
| Atividade | 26 issues abertas, 20 estrelas — módulo de um autor só, pequeno |
| O que faz | Janela com os retratos dos participantes; destaca o "participante ativo"; conversas salvas em Diário; vínculo de conversa a cena; facções; fundo da conversa |
| O que **não** faz | Texto de fala, escolhas do jogador, ramificação, estado de loja/preço/atitude |
| API pública | **Não documentada.** A wiki lista "API Reference — Coming Soon". A 6.0.0 *quebrou* a API de macros ("it is very likely that some of your macros might no longer work") |
| Como se alcança por código | `game.ConversationHud` (objeto global, não `game.modules.get(...).api`), com `startConversationFromData(data, visibility)`, `createConversation`, `removeConversation`, `setConversationVisibility`, e eventos `ConversationEvents.Created/Removed/Updated` |
| Formato dos dados | `{type, background, conversation:{defaultActiveParticipant, participants:[{name, displayName, img, imgScale, portraitAnchor, faction, linkedActor, linkedJournal}]}}` — **os tipos no código estão marcados `[TODO: Complete JSDoc]`**, e não confirmei se o `main` é idêntico ao da release 6.0.0 |
| Tipo de conversa | Só a "controlada pelo Mestre" está ligada; a "coletiva" está "em desenvolvimento" |

## 2. O que um diálogo de venda precisaria

Hoje a loja do QUEDAÇO é uma tela de compra: o jogador abre o cartão do NPC vendedor,
vê o estoque, monta o carrinho (`openShop`, `cartBlock`, `npcSellCard` em
`src/library.mjs`), a atitude é escolhida pela Mestra (`ATTITUDES` em
`src/negotiation.mjs`) e a pechincha é um teste de CAR (`haggle`). Não existe cena de
conversa — o NPC não "fala".

| Necessidade de um diálogo de venda | Conversation HUD | Precisa ser nosso |
|---|---|---|
| Retrato do vendedor na tela dos jogadores | ✔ | — |
| Destacar quem fala | ✔ | — |
| Fala do NPC (saudação, reação) | ✘ | ✔ |
| Escolhas do jogador (ver mercadorias · pechinchar · vender · sair) | ✘ | ✔ |
| Fala muda com a atitude (hostil → aliado) | ✘ | ✔ |
| Reação ao resultado da pechincha (aceita / recusa) | ✘ | ✔ |
| Abrir a loja / carrinho / venda que já existem | ✘ | ✔ (reaproveita os `lib-npc-*`) |
| Texto escrito pela Mestra por NPC | ✘ | ✔ |

Ou seja: do que o diálogo precisa, ele cobre as duas primeiras linhas e nada mais.

## 3. Os três caminhos

### A — Integrar: o QUEDAÇO monta a conversa dentro do Conversation HUD

- **Ganha:** retrato bonito, multi-participante, já pronto e testado pela comunidade.
- **Perde / risco:**
  - Exige instalar **3 módulos** (um deles, `lib-dfreds-ui-extender`, só existe pra ele).
  - A API é **indocumentada e foi quebrada na última versão** — é a mesma situação do
    World Explorer, só que pior: ali o dado era estável há um ano; aqui a própria
    estrutura de dados está com `TODO`.
  - Compatibilidade **só 13**: quando o Foundry 14 chegar, ficamos presos a um módulo de
    um autor só, sem atualização há quase um ano.
  - Não resolve o problema principal: as falas e as escolhas continuam por nossa conta,
    e ainda teríamos que fazê-las conviver com a janela de outro módulo.

### B — Recriar a versão leve, dentro do QUEDAÇO ✔ recomendado

Não recriar o Conversation HUD inteiro (facções, conversa salva em Diário, vários
participantes, conversa coletiva — nada disso serve pra venda). Só o que a venda usa:
**uma janela com o retrato de um NPC, a fala dele e botões de escolha**, ligados ao que
já existe.

- **Ganha:** zero dependência; imagem, texto e escolhas pensados pra venda; reaproveita
  atitude, pechincha, carrinho e venda sem ponte nenhuma; não quebra com atualização de
  terceiros; combina com o resto do painel (`DialogV2`/`ApplicationV2`, mesmo estilo).
- **Perde:** a gente mantém o código (é pouco: uma janela, uma tabela de falas, 4 botões);
  não herda o que o Conversation HUD tem a mais (multi-participante, facções).

### C — Híbrido: B primeiro, ponte opcional depois

Fazer B. Depois, **só se o Yuri quiser**, um botão "Mostrar no Conversation HUD" que só
aparece com o módulo ativo e que monta uma conversa de um participante só, **protegido
contra erro** (mesma regra do World Explorer: dado fora do formato esperado = o botão
some, nunca trava a tela). Custo pequeno, e só depois que o B existir.

## 4. Por que recomendo B

1. **O núcleo do pedido é o diálogo, e ele não oferece diálogo.** Integrar não economiza
   a parte difícil.
2. **Fragilidade:** API sem documentação, quebrada na última versão, tipos com `TODO`,
   três dependências, um mantenedor. Pra algo que o Yuri vai usar toda sessão com
   vendedores, é um risco desproporcional ao que ele entrega (um retrato).
3. **O que precisamos já existe do lado de cá:** atitude, pechincha, carrinho, venda,
   portrait do NPC (`npcPortrait`, `ImageResolver`). O diálogo é uma *casca* em volta
   disso.
4. **Dá pra voltar atrás:** B não fecha a porta do C.

## 5. Esboço do B — pra ser conferido com o Yuri antes de virar tarefa

> **Não codifique a partir deste esboço.** Falta decidir os itens da seção 6. Isto é só
> pra o Yuri enxergar o tamanho da coisa.

**O jogador vê:** no cartão do NPC vendedor (aba NPCs do jogador), um botão **Conversar**.
Abre uma janela com o retrato grande do vendedor, uma fala (ex.: *"Entre, entre. O que
procura hoje?"*) e botões:

| Botão | O que faz | Reaproveita |
|---|---|---|
| Ver mercadorias | abre a loja/carrinho que já existe | `openShop`, `cartBlock` |
| Pechinchar | rola o teste e o NPC reage com uma fala de "aceitou" ou "recusou" | `haggle` |
| Vender algo | abre a venda | `npcSellCard`, `sellItem` |
| Sair | fecha com uma fala de despedida | — |

**A fala depende da atitude do NPC** (hostil · negativo · indiferente · prestativo ·
aliado — escala do livro, já no módulo). Cada NPC traz um texto padrão por atitude; a
Mestra pode sobrescrever qualquer um no editor do NPC. **A atitude continua sendo da
Mestra**: o livro diz que ela sobe e desce por sucessos e falhas nas Cenas de Interação
Social (`docs/T-NEGOCIACAO.md`), então o módulo não decide isso sozinho.

**Onde fica o dado:** `flags.quedaco.npc.dialogue` — as falas por atitude, a de
pechincha aceita/recusada e a de despedida. Mesmo lugar onde já moram `shop` e `markup`.

**Código novo (estimativa):** um painel em `src/panels/` (a regra da rodada 11 é não
engordar o `library.mjs`), uma função pura que escolhe a fala (atitude + situação) com
teste, um bloco no editor de NPC pra escrever as falas, e CSS seguindo
`docs/DESIGN-SISTEMA-VISUAL.md`. Tamanho: **média**. Cabe no Sonnet; a parte visual
precisa de olho humano depois.

## 6. O que falta o Yuri decidir

1. **Quem vê a conversa?** O Conversation HUD mostra na tela de **todos** na mesa. Uma
   janela nossa abre só pra **quem clicou**. Dá pra fazer as duas coisas (a janela é de
   quem conversa; um aviso/retrato aparece no chat pra todos), mas é uma escolha de
   mesa: o vendedor "fala com o grupo" ou "fala com um jogador"?
2. **Quem escreve as falas?** (a) texto padrão por atitude já vem pronto e a Mestra só
   troca o que quiser; (b) a Mestra escreve tudo do zero; (c) o módulo gera por
   papel/região. **Recomendo (a)** — ninguém quer preencher 5 falas pra cada um dos
   mercadores.
3. **Escolhas fixas ou personalizáveis?** Os 4 botões acima (recomendado, mais simples)
   ou a Mestra poderia acrescentar escolhas próprias de um NPC (ex.: "Perguntar sobre o
   forte")? Isso é um "diálogo ramificado" de verdade e muda o tamanho da tarefa.
4. **Quer mesmo assim a ponte com o Conversation HUD (caminho C)?** Se ele já usa esse
   módulo na mesa, vale; se não usa, ignoramos.

## 7. O que não verifiquei

- Não abri o Conversation HUD rodando — só li o código e as páginas dele. Não sei se o
  mundo oficial o tem instalado.
- Não confirmei se o formato de dados do `main` é o mesmo da release 6.0.0.
- Uma busca por "diálogo ramificado" apontou outros módulos (Visual Novel Maker,
  yugen-merchant). **Só li a descrição das páginas deles; não avaliei nenhum.** Se a
  decisão da seção 6, item 3 for "quero ramificação de verdade", vale uma pesquisa
  própria antes de escrever código.

## 8. Fontes (11/10/2026)

- [ConversationHUD — Foundry](https://foundryvtt.com/packages/conversation-hud)
- [conversation-hud — GitHub](https://github.com/CristianVasile23/conversation-hud)
  (código lido pela API do GitHub: `js/init.js`, `js/conversation.js`, `js/types/*`,
  `module.json`)
- [CHANGELOG do conversation-hud](https://github.com/CristianVasile23/conversation-hud/blob/main/CHANGELOG.md)
- [Wiki do conversation-hud](https://github.com/CristianVasile23/conversation-hud/wiki)
