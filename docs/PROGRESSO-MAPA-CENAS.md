# Progresso — Mapa dinâmico, atlas de cenas e teletransporte

> Documento de acompanhamento, não de tarefa. Serve pra qualquer chat (Claude ou Codex)
> saber em que pé está esta funcionalidade sem reler a conversa inteira. Atualize a
> "Última atualização" e a % de cada etapa sempre que mexer aqui. As tarefas com número
> (T6, T7...) apontam pro `docs/COMANDO-CODEX-9.md`, que tem a especificação completa.

**Última atualização:** 17/09/2026 (Claude/Sonnet), pelo estado real do código e dos testes.

## Visão geral

```
[██████████████████████░░░░░░░░░░░░░░░░] 55%
```

A funcionalidade tem 5 etapas. As duas primeiras — a árvore de cenas e o teletransporte
entre elas — estão **prontas e testadas com dados falsos**, mas **nenhuma delas foi vista
funcionando dentro do Foundry de verdade**. As outras três ainda não têm nenhum código.

| # | Etapa | Código | Testado (fake) | Visto no Foundry | % |
|---|---|---|---|---|---|
| A | Atlas de cenas (árvore região → local → cena, editar à mão) | ✅ | ✅ | ❌ | 100% |
| B | Teletransporte automático (Stairways ou Regions nativas) | ✅ | ✅ | ❌ | 100% |
| C | **Conferir as duas no Foundry** (T3, roteiro pronto) | — | — | ⬜ pendente | 0% |
| D | Painel da cena ativa (T6) | ❌ nada escrito | — | — | 0% |
| E | Perguntar ao ativar cena (T7, depende da D) | ❌ nada escrito | — | — | 0% |

A % geral (55%) pesa mais as etapas A e B por serem as maiores; C, D e E ainda não
começaram.

---

## A — Atlas de cenas · 100% do código, 0% conferido

O que existe: uma árvore que liga região → localidade → cena, editável pela aba **Mapa de
Opath / Atlas de cenas** do Mestre. Dá pra criar uma cena dentro de uma região ou
localidade, e a árvore mostra tudo isso junto com o mapa desenhado à mão.

- Arquivo: [scene-atlas.mjs](../src/scene-atlas.mjs) (normalização e árvore).
- Ligado na tela em [library.mjs](../src/library.mjs) (`renderSceneAtlas`, `renderMap`).
- Testado em [scene-atlas.test.mjs](../tests/scene-atlas.test.mjs) — mas com cenas
  **inventadas** dentro do teste, não cenas reais do seu mundo.

## B — Teletransporte automático · 100% do código, 0% conferido

O que existe: quando duas cenas do atlas estão ligadas, o módulo pode criar sozinho a
ponte de teletransporte entre elas, usando **um dos dois mecanismos**:
- o módulo **Stairways** (se instalado, versão 0.11.x), ou
- **Regions nativas** do próprio Foundry 13 (sem depender de outro módulo).

Você escolhe qual dos dois fica ativo; o módulo nunca liga os dois ao mesmo tempo.

- Arquivos: [teleport-connectors.mjs](../src/teleport-connectors.mjs) (regras de quando
  cada mecanismo está disponível) e o trecho de `adapter.mjs` que efetivamente cria a
  ponte (`ensureStairways`, `ensureNativeRegions`, `setRuntimeProvider`).
- Testado em [teleport-connectors.test.mjs](../tests/teleport-connectors.test.mjs) com um
  Foundry e um Stairways **simulados** — nunca rodou contra o de verdade.

## C — Conferir A e B dentro do Foundry · 0%, esperando você

**Isso é o que falta pra saber se A e B funcionam.** O roteiro já está escrito —
[ROTEIRO-CONFERENCIA.md](ROTEIRO-CONFERENCIA.md), seção 5, 7 a 9 minutos — e pede:

1. um mundo de teste (cópia do oficial, pra não arriscar nada real);
2. marcar duas cenas no atlas e apertar "Construir" — confere se a ponte de
   teletransporte aparece nas duas cenas;
3. testar os dois mecanismos (Stairways e Regions nativas), um de cada vez;
4. clicar a ponte com o token e ver se o grupo realmente troca de cena.

Isso é trabalho seu dentro do Foundry, não código. Sem isso, não dá pra confiar que A e B
funcionam — só que o código faz o que os testes fingem que ele deveria fazer.

## D — Painel da cena ativa · 0%

**Ainda não existe nenhuma linha de código disto.** A ideia: quando o Mestre ativa uma
cena, um bloco no topo da aba Mapa mostra, juntos, os NPCs daquele lugar, as guildas
presentes, os mercadores com a atitude de cada um, um botão de rolar rumor, e um botão
pra liberar a localidade aos jogadores. Tudo reaproveitando painéis que já existem
(NPCs, Guildas) — a novidade é só reunir na tela certa, no momento certo.

Especificação completa: `docs/COMANDO-CODEX-9.md`, Tarefa 6. Tamanho: grande — é a maior
peça que falta. Só pode ser conferida depois que A e B estiverem verificadas (etapa C),
porque ela lê a região/localidade de cada cena pelo atlas.

## E — Perguntar ao ativar cena · 0%, depende da D

Quando o Mestre troca de cena e a localidade ainda não foi liberada aos jogadores,
perguntar antes de liberar sozinho. Pequena, mas só faz sentido depois da D existir.
Especificação: `docs/COMANDO-CODEX-9.md`, Tarefa 7.

---

## Como dividir isto entre chats/modelos

| Etapa | Esforço sugerido | Por quê |
|---|---|---|
| C — conferir no Foundry | **Você, sem código** | É clicar e observar; nenhum modelo faz por você. |
| D — painel da cena ativa | **Opus** | Mexe com hook do Foundry (`canvasReady`) e junta várias fontes de dados; difícil de testar fora do Foundry, então precisa de mais cuidado de quem escreve. |
| E — perguntar ao ativar cena | **Sonnet**, depois da D pronta | Pequena e mecânica: um `DialogV2.confirm` num hook que já existe. |
| Ajustes finos de CSS/texto em A e B, se aparecerem na conferência C | **Sonnet** | Mudança pontual guiada pelo que você viu quebrar. |

Se for abrir chats separados, mande pra cada um **este arquivo** + `docs/COMANDO-CODEX-9.md`
(a tarefa específica). Peço que quem terminar uma etapa **atualize a tabela e a barra aqui**
antes de passar a vez — é o que evita dois chats reconstruindo o mesmo entendimento do zero.
