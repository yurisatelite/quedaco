# Progresso — Mapa Imersivo (atlas de cenas, teletransporte e cena ativa)

> Documento de acompanhamento, não de tarefa. Serve pra qualquer chat (Claude ou Codex)
> saber em que pé está esta funcionalidade sem reler a conversa inteira. Atualize a
> "Última atualização" e a % de cada etapa sempre que mexer aqui. As tarefas com número
> (T6, T7...) apontam pro `docs/COMANDO-CODEX-9.md`, que tem a especificação completa.
>
> **Nome dado em 17/09/2026:** o Yuri batizou esta funcionalidade — o mapa geográfico, a
> árvore de cenas ligadas por teletransporte, e o painel de tudo-o-que-tem-nesta-cena —
> de **Mapa Imersivo**. É o nome que aparece na aba do Mestre (antes "Atlas de cenas") e
> nesta e em outras documentações a partir de agora.

**Última atualização:** 04/10/2026 — o Mapa Imersivo foi aberto no Foundry hospedado: a
estrutura existente de Thur Thur foi conferida, mas o foco da versão 0.11.0 ainda não está
ativo no mundo. Os detalhes estão na etapa G.

## Visão geral

```
Código      [██████████████████████████████████████] 97%   (falta só o 1.6, que depende de print)
No Foundry  [███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 18%   (só a árvore da v0.9.0 foi vista)
```

| # | Etapa | Código | Testado (fake) | Visto no Foundry | % |
|---|---|---|---|---|---|
| A | Atlas de cenas: **quebra-cabeça por região** (principal) + Lista (sub-aba) | ✅ 22/09 | ✅ | ❌ versão nova ainda não publicada | 70% |
| A.1 | Ajustes de uso T25 §1.1–1.5 (acordeão, "Mapa:", cena órfã, miniaturas, ordem das abas) | ✅ Codex 17/09 | ✅ | ❌ | 70% |
| A.2 | T25 §1.6 — topo "descolado" em todas as abas | ❌ | — | precisa de print com F12 do Yuri | 0% |
| B | Teletransporte automático (Stairways ou Regions nativas) | ✅ | ✅ | ❌ ainda não testado | 70% |
| C | **Conferir A e B no Foundry** (roteiro pronto) | — | — | 🟡 A (versão antiga) visto; B pendente | 40% |
| D | Aba **Cena Atual**: mini-diagrama das cenas ligadas + NPCs em árvore por local + guildas/mercadores/rumor/liberar | ✅ 22/09 | ✅ | ❌ | 70% |
| E | Perguntar ao ativar cena (T7) | ✅ | ✅ | ❌ ainda não testado | 70% |
| F | Botão do World Explorer + contagem blindada de hexágonos (T15) | ✅ 22/09 | ✅ | ❌ | 70% |

**Régua desta tabela:** 70% = código + teste com dado falso. Os 30% restantes só existem
depois que o Yuri vê rodando no Foundry. É de propósito — "testado com Node" não é "funciona".

### Decisões de implementação tomadas no código (sem mudar nada que o Yuri decidiu)

- **Posição guardada em `atlas.layout[regionId][nodeId]`**, não em `atlas.scenes[id].x/y`
  como o T25 §2.4 sugeria: o quadro é por região, e locais também ganham posição (chave
  `place:<id>`) sem tocar em `book-world.mjs`. Mesmo efeito, um lugar só pra tudo.
- **Arranjo inicial em árvore** (região no topo, cada local com o que tem dentro embaixo),
  em blocos que quebram linha a ~1100 px. "Reorganizar caixas" joga fora as posições da
  região e volta a esse arranjo — nunca mexe na hierarquia.
- **Caixas pré-existentes fixas na hierarquia:** arrastar só muda posição. O que muda
  hierarquia é (a) soltar uma cena da bandeja "Cenas sem local" em cima de uma caixa ou
  (b) "Criar caixa" (cria uma Scene nova dentro da caixa escolhida, já posicionada abaixo
  dela). "Mover" continua existindo na Lista.
- **Mini-diagrama da Cena Atual** mostra portais (tracejado) **e** o mapa onde a cena fica
  / mapas internos dela (linha cheia) — sem isso, cena sem portal ficaria sozinha.
- **Botão do World Explorer** aparece só com o módulo ativo **e** alguma cena que já tenha
  dado dele (`gridData`); prefere a "cena principal" da região. Contagem estranha some,
  botão fica.

---

## A — Atlas de cenas · 60% — visto no Foundry, precisa de rework visual

> **Atualização 17/09/2026:** visto de verdade pela primeira vez. Retorno completo em
> [T25-MAPA-IMERSIVO-VISUAL.md](T25-MAPA-IMERSIVO-VISUAL.md) — 7 ajustes de uso pequenos
> e o pedido principal (um quebra-cabeça arrastável por região, não a árvore de listas
> de hoje) **já com decisão de design tomada** — mandado pro Codex como Tarefa 13.

Árvore que liga região → localidade → cena, editável pela aba **Mapa Imersivo** do
Mestre. Dá pra criar uma cena dentro de uma região ou localidade.

- [scene-atlas.mjs](../src/scene-atlas.mjs) (normalização e árvore).
- Ligado em [library.mjs](../src/library.mjs) (`renderSceneAtlas`, `renderMap`).
- Testado em [scene-atlas.test.mjs](../tests/scene-atlas.test.mjs) — com cenas
  **inventadas** no teste, não cenas reais do seu mundo.

## B — Teletransporte automático · 100% do código, 0% conferido

Quando duas cenas do Mapa Imersivo estão ligadas, o módulo cria sozinho a ponte de
teletransporte, usando **Stairways** (se instalado, 0.11.x) ou **Regions nativas** do
Foundry 13. Você escolhe qual mecanismo fica ativo; nunca os dois ao mesmo tempo.

- [teleport-connectors.mjs](../src/teleport-connectors.mjs) e o trecho de `adapter.mjs`
  que cria a ponte (`ensureStairways`, `ensureNativeRegions`, `setRuntimeProvider`).
- Testado em [teleport-connectors.test.mjs](../tests/teleport-connectors.test.mjs) com um
  Foundry e um Stairways **simulados** — nunca rodou contra o de verdade.

## C — Conferir A e B dentro do Foundry · 0%, esperando você

**Isso é o que falta pra saber se A e B funcionam.** O roteiro já está escrito —
[ROTEIRO-CONFERENCIA.md](ROTEIRO-CONFERENCIA.md), seção 5, 7 a 9 minutos — e pede:

1. um mundo de teste (cópia do oficial, pra não arriscar nada real);
2. marcar duas cenas no Mapa Imersivo e apertar "Construir";
3. testar os dois mecanismos, um de cada vez;
4. clicar a ponte com o token e ver se o grupo troca de cena de verdade.

Isso é trabalho seu dentro do Foundry, não código.

## D — Painel da cena ativa · feito em 17/09/2026, 0% conferido

**Antes:** nenhuma linha de código existia. **Agora:** quando o Mestre ativa uma cena, um
bloco no topo da aba Mapa mostra, juntos: os NPCs da localidade, as guildas presentes, os
mercadores com a atitude de cada um (seletor ao vivo), um botão de rolar rumor da região,
e um botão de liberar a localidade aos jogadores.

- [library.mjs: renderActiveScenePanel](../src/library.mjs) — reaproveita
  `npcsForLocation`, `guildsForPlace`, `npcGmStrip`, `rollRegionRumors`, `setNpcLocality`;
  não duplica nenhum cartão.
- A localidade da cena vem de [scene-atlas.mjs: resolveSceneLocality](../src/scene-atlas.mjs)
  — sobe a cadeia `scene:` até achar `place:`/`region:`, com fallback pros mapas legados
  `placeScenes`/`regionScenes`.
- `main.mjs`: `Hooks.on('canvasReady', ...)` re-renderiza o painel se a Mestra estiver
  com a janela aberta na aba Mapa. Nada abre sozinho.
- Testado em [library.test.mjs](../tests/library.test.mjs) (cena aninhada, sem atlas,
  sem cena ativa, visão do jogador) e [scene-atlas.test.mjs](../tests/scene-atlas.test.mjs)
  (os 4 casos do "pronto quando" da T6) — sempre com cenas e atores falsos.
- **Nunca visto na tela do Foundry de verdade.**

## E — Perguntar ao ativar cena · feito em 17/09/2026, 0% conferido

Ao ativar uma cena cuja localidade ainda não foi liberada, `DialogV2.confirm` pergunta
antes de liberar. Uma configuração do módulo ("Perguntar ao ativar uma cena") desliga a
pergunta pra sempre.

- `main.mjs`: `Hooks.on('updateScene', ...)`, decisão pura em
  [library.mjs: shouldAskReleaseOnActivate](../src/library.mjs) (localidade já liberada
  não pergunta; sem localidade não pergunta; configuração desligada não pergunta —
  os 3 casos testados).
- **Nunca visto abrindo de verdade** — o `DialogV2.confirm` só existe no Foundry.

## G — Montar os mapas · código e testes falsos, ainda sem conferência no Foundry

- **A · Sugerir onde ficam:** feito na 11ª rodada, commit `21b154a`. Cenas sem local podem receber sugestão com prévia e aplicação em um save.
- **B · Banco e criação de cenas:** [BANCO-DE-MAPAS.md](BANCO-DE-MAPAS.md) registra uma fonte visual para cada uma das 48 localidades/Quedas. A Mestra escolhe o arquivo pelo FilePicker; a prévia da região permite marcar e criar cenas com fundo, vincular ao Mapa Imersivo e repetir sem duplicar. Saídas pai → sublocal ficam nomeadas, sem teletransporte posicionado. Só houve teste com cenas falsas; não havia imagens nem mundo Foundry acessível.
- **C · Organizar pastas:** aguardando a montagem dos mapas, conforme a prioridade mais recente do Yuri.

Depois da conferência visual, preparar tokens dos NPCs já existentes, visão e lojas nas cenas e posicionar as passagens estratégicas. Essas etapas não foram executadas neste lote.

**Conferência parcial no Foundry, 04/10:** o Mapa Imersivo abriu no mundo hospedado e
mostrou 123 cenas, 51 organizadas, zero ligações e Stairways 0.11.1 disponível. Thur Thur
já tem uma cena vinculada para cada localidade, mas uma entrada órfã (`GaT46iOjJwumsAP5`)
aparece sob Lado de Fora depois da Scene ter sido apagada. Nada foi corrigido nem criado
nessa conferência. A versão 0.11.0 ainda não está ativa no mundo — as dez regiões seguem
visíveis —, então o foco em Thur Thur precisa ser visto novamente após a atualização.

---

## Como dividir isto entre chats/modelos

| Etapa | Esforço sugerido | Por quê |
|---|---|---|
| C — conferir A e B no Foundry | **Você, sem código** | É clicar e observar. |
| **Conferir D e E no Foundry** | **Você, sem código** | Ativar uma cena de teste e ver se o painel aparece e se a pergunta sai certa. |
| Ajustes finos de CSS/texto que aparecerem nas conferências | **Sonnet** | Mudança pontual guiada pelo que quebrar. |

O que parecia precisar de Opus (D, o painel) acabou sendo tranquilo no Sonnet — reaproveitou
funções que já existiam, sem inventar nada novo de interface.
