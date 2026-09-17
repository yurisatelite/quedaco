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

### Tarefa 6 — Painel da cena ativa  · *grande — especificada abaixo*

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

### Tarefa 7 — Perguntar se libera ao ativar cena  · *média — depende da 6*

Quando o mestre **ativa** uma cena (`Hooks.on('updateScene')` com `active` passando a
`true`) cuja localidade ainda não está liberada, um `DialogV2.confirm`: "O grupo chegou em
*Localidade*. Liberar aos jogadores?". Sim chama `setNpcLocality`; não, nada acontece.
Nunca libere sem confirmação. Uma opção nas configurações do módulo desliga a pergunta.

**Pronto quando:** checklist da regra 1 e teste da decisão (localidade já liberada não
pergunta; sem localidade não pergunta; configuração desligada não pergunta).

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
