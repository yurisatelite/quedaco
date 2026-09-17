# Como consultar o mundo sem re-explicar tudo de novo

> Resposta à pergunta do Yuri (17/09/2026): dá pra deixar as informações de referência
> "prontas pra consultar", atualizáveis com um clique? **Sim, com uma ressalva
> importante: não em tempo real.** Este documento explica o que dá e o que não dá, e
> como usar o que foi montado.

## Duas coisas bem diferentes que pareciam uma só

1. **Como o Skyfall e o QUEDAÇO funcionam por dentro** — que campo guarda o quê, que
   arquivo faz o quê. Isso **quase nunca muda**. Foi isso que consumiu tempo hoje (T24):
   reabrir o `skyfall.mjs` (20 mil linhas) pra achar onde fica perícia, idioma, tamanho.
2. **O que existe no mundo agora** — quantos NPCs, em que guilda, em que região, se
   alguém foi excluído ou mudou de lugar. Isso **muda toda sessão** que vocês jogam.

Pra (1), um documento escrito uma vez resolve. Pra (2), **não tem como eu ler isso
sozinho** — o mundo oficial roda remoto, e mesmo se rodasse local, os dados ficam num
banco (LevelDB) que não dá pra abrir com um editor de texto. A única porta é o próprio
Foundry, através de uma macro que você roda.

## O que foi montado

| Documento/arquivo | Resolve o quê | Muda quando |
|---|---|---|
| [REFERENCIA-SKYFALL.md](REFERENCIA-SKYFALL.md) | Campos do sistema (perícia, idioma, tamanho, tipos de Item...) | Só quando o Foundry ou o Skyfall sobem de versão |
| [MAPA-DO-MODULO.md](MAPA-DO-MODULO.md) | Que arquivo/função cuida de cada funcionalidade (Loja, NPCs, Guildas...) | Toda vez que uma área ganha ou perde código — **eu atualizo isso ao mexer** |
| `.local/exportar-mundo.js` | Retrato do mundo agora: NPC por região, guilda por guilda, quem está oculto, o que está liberado | **Só quando você roda a macro** — não é automático |

## Como funciona o "retrato do mundo"

1. Você roda `.local/exportar-mundo.js` no Foundry, como Mestre.
2. Ele baixa `quedaco-retrato-do-mundo.json` — um resumo (nomes, ids, região, guilda,
   contagens), não a ficha inteira de cada um.
3. Você **mexe nele de duas formas**:
   - manda pra mim pelo chat (como fez com o JSON de comparação de monstro), ou
   - salva em `modulo/.local/` — aí eu leio direto na próxima vez que precisar, sem
     precisar que você reenvie (esse arquivo específico deve ficar **fora do git**,
     igual às outras coisas de `.local/`, porque é o retrato do seu mundo, não código).

Da segunda vez que eu precisar saber "quantos NPCs tem sem guilda", eu leio esse arquivo
em vez de te perguntar ou de você ter que descrever de novo.

## O que isto NÃO é (pra não criar expectativa errada)

- **Não é tempo real.** Se você mudar um NPC de região agora, o retrato só reflete isso
  depois que você rodar a macro de novo. É "clique pra atualizar", não "atualiza sozinho".
- **Não detecta sozinho o que foi excluído.** O retrato mostra o que existe *no momento
  em que rodou*; pra saber o que mudou desde a última vez, sou eu que comparo dois
  arquivos, se você guardar os dois (ex.: `quedaco-retrato-do-mundo.json` vira
  `quedaco-retrato-anterior.json` antes de rodar de novo).
- **Não substitui backup.** Continua valendo a regra de fazer backup do mundo antes de
  rodar qualquer macro que grava (as de leitura, como esta, não gravam nada).

## Quando vale a pena rodar

Não é preciso rodar toda sessão. Vale a pena antes de:
- pedir uma mudança que depende de saber a distribuição atual (ex.: "reequilibra as
  guildas" — sem o retrato, eu só sei o que a última macro gravou, que pode estar
  desatualizado);
- fechar uma rodada de trabalho grande, pra registrar o "antes" no `.local/`.

## E a ideia de "vendas", que foi o exemplo?

A Loja/Vendas já tem entrada pronta em [MAPA-DO-MODULO.md](MAPA-DO-MODULO.md#loja--vendas--exemplo-completo)
— arquivos, funções, testes e o que falta, tudo numa tabela. Da próxima vez que quiser
melhorar a loja, começa lendo aquela seção, não este documento.
