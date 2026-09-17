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

**Última atualização:** 17/09/2026, depois do primeiro uso real no Foundry (v0.9.0
publicada e testada pelo Yuri) — ver `docs/T25-MAPA-IMERSIVO-VISUAL.md`.

## Visão geral

```
[██████████████████████████░░░░░░░░░░░░] 65%
```

**A etapa A caiu de 100% pra 60%:** "testado e visto no Foundry" não é o mesmo que
"pronto". O Yuri usou de verdade e voltou com 6 ajustes de uso e um pedido que não foi
atendido — o "mapa conceitual" virou uma árvore de listas, não um diagrama visual. Isso
é a Tarefa 13 (`docs/T25-MAPA-IMERSIVO-VISUAL.md`). As etapas D e E (painel da cena
ativa, pergunta ao ativar cena) ainda não tiveram nenhum retorno de uso — só B e a
árvore da A foram testadas até agora.

| # | Etapa | Código | Testado (fake) | Visto no Foundry | % |
|---|---|---|---|---|---|
| A | Atlas de cenas (árvore região → local → cena, editar à mão) | ✅ | ✅ | 🟡 visto, com 6 ajustes pendentes (T25 §1) + o diagrama visual ainda não existe (T25 §2) | 60% |
| B | Teletransporte automático (Stairways ou Regions nativas) | ✅ | ✅ | ❌ ainda não testado | 100% |
| C | **Conferir A e B no Foundry** (T3, roteiro pronto) | — | — | 🟡 A foi visto (com ressalvas); B segue pendente | 40% |
| D | Painel da cena ativa (T6) | ✅ | ✅ | ❌ ainda não testado | 100% |
| E | Perguntar ao ativar cena (T7) | ✅ | ✅ | ❌ ainda não testado | 100% |

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

---

## Como dividir isto entre chats/modelos

| Etapa | Esforço sugerido | Por quê |
|---|---|---|
| C — conferir A e B no Foundry | **Você, sem código** | É clicar e observar. |
| **Conferir D e E no Foundry** | **Você, sem código** | Ativar uma cena de teste e ver se o painel aparece e se a pergunta sai certa. |
| Ajustes finos de CSS/texto que aparecerem nas conferências | **Sonnet** | Mudança pontual guiada pelo que quebrar. |

O que parecia precisar de Opus (D, o painel) acabou sendo tranquilo no Sonnet — reaproveitou
funções que já existiam, sem inventar nada novo de interface.
