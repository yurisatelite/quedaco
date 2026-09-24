# COMANDO CODEX — 11ª rodada

Documento de passagem. **Claude estrutura, Codex executa, Yuri confirma.** Leia este
arquivo e o `CLAUDE.md` da raiz. A 10ª rodada (`COMANDO-CODEX-10.md`) está encerrada e fica
como histórico — não precisa relê-la, mas as regras dela continuam valendo (seção 0).

**HEAD de referência:** `bf84002` (23/09/2026 — Tarefas 1 e 2 do Codex já commitadas,
mais a revisão de design do Claude em cima). `npm test` = **250 passando**. Árvore limpa.
**Versão publicada:** 0.10.0 (22/09/2026). Tudo desta rodada vira a 0.11.0 quando o Yuri
autorizar. **Não aumente a versão nem publique** — isso é do Claude, com autorização do Yuri
pra cada versão.

---

## 0. Regras

Todas as da 9ª e da 10ª continuam valendo:

- Só está feito quando está na tela: tela + ação + `app.mjs` + CSS + teste.
- Se parar no meio, registre no diário e commite.
- Nada sem pedido escrito.
- Macro importa o módulo **instalado**.
- A P.I.P.I. nunca é tocada.
- CRLF/LF misto: preserve o que já existe em cada arquivo.
- Feature grande ganha documento de progresso.
- Separe "testado com dado falso" de "visto no Foundry".

Mais uma, específica desta rodada:

9. **Tudo que cria ou move documento do mundo (Scene, Folder) tem prévia com caixa de
   marcar e só grava no clique de "Aplicar".** Um save só no fim. Rodar de novo não pode
   duplicar nada.

Código novo de tela do Mapa Imersivo vai para `src/panels/mapa-imersivo.mjs` (Tarefa 17 da
10ª). Função pura vai para `src/scene-atlas.mjs`. Não volte a engordar o `library.mjs`.

---

## 1. Tarefas — nesta ordem

Especificação completa: **[docs/T26-MONTAR-MAPAS.md](T26-MONTAR-MAPAS.md)**. Leia o
documento inteiro antes da primeira tarefa. As decisões já estão lá; não pergunte de novo o
que ele resolve.

### Tarefa 1 — "Sugerir onde ficam" (T26, Parte A)  · *média*

Função pura `suggestSceneParents` + botão na bandeja "Cenas sem local" do quebra-cabeça +
prévia com caixa de marcar + "Aplicar marcadas" num save só. Nome e pasta da cena decidem;
se discordarem, não sugere.

### Tarefa 2 — "Criar cenas dos locais sem mapa" (T26, Parte B)  · *média*

Botão no quebra-cabeça, só para a região aberta. Prévia com a imagem de fundo de cada local
(`placeImages` ou índice de imagens — nunca caminho chutado). `navigation:false`. Idempotente.
Confira o campo de fundo contra o schema de `Scene` do Foundry 13 antes de escrever.

### Tarefa 3 — "Organizar as pastas das cenas" (T26, Parte C)  · *média*

Plano puro (pastas a criar, cenas a mover) + botão na aba Lista + prévia "de → para". Limite
de profundidade por `CONST.FOLDER_MAX_DEPTH`. Reaproveita pasta existente, **nunca apaga
pasta**, cena sem local não se mexe.

### Ao terminar as três

Atualize `docs/PROGRESSO-MAPA-IMERSIVO.md` (etapa nova "G — Montar os mapas", com as três
partes e a régua de 70% = código + teste falso) e a seção "Mapa Imersivo" de
`docs/MAPA-DO-MODULO.md` (onde mora cada função nova).

---

## 2. Fica com o Yuri — não codifique

| Item | O que falta |
|---|---|
| **Conferir a v0.10.0 no Foundry** | Quebra-cabeça, Cena Atual, World Explorer — roteiro em `docs/PROGRESSO-MAPA-IMERSIVO.md`. Numa cópia do mundo. |
| **Print do topo "descolado" (T25 §1.6)** | F12 → inspecionar → clicar na parte que vaza → print com o inspetor aberto. |
| **Reconverter os monstros de D&D** | `.local/reconverter-monstros-dnd.js` com `srd-monstros.json` e, opcional, `fichas-de-campo-dnd.json` (121 fichas). Backup antes. |
| **Ideias de mapa que esperam decisão** | Notas no mapa de Opath, jogadores vendo o quebra-cabeça — `docs/T26-MONTAR-MAPAS.md`, "Fora desta tarefa". |
| **T14, T21, T8b** | Imbuir na ficha do NPC, trocar legado no editor, ficha de profissão — esperam conversa de design. |

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

### 22/09/2026 — Tarefa 1
**Fiz:** adicionei `suggestSceneParents` em `src/scene-atlas.mjs`; ela compara nome e trilha de pastas sem acento, escolhe a localidade de nome mais longo, só aceita sugestão quando nome e pasta concordam, e ignora conflitos, atlas já organizado e vínculos legados. No Mapa Imersivo, a bandeja agora abre uma prévia com caixas de marcar; alta confiança vem marcada e **Aplicar marcadas** grava tudo numa única atualização do atlas.
**Funcionou:** `npm test` passou com 243 testes; inclui testes de nome longo, acento, pasta aninhada, conflito, cena organizada, legado, confiança alta e prévia/aplicação única com dados falsos. `npm run package` gerou o pacote de desenvolvimento.
**Não funcionou / deixei de fora:** não abri o Foundry nem alterei cenas, pastas ou Atores de mundo. Não há dado real de cenas nesta verificação.
**Checklist da regra 1:** tela ✔ · ações ✔ · app.mjs ✔ · CSS ✔ · teste ✔ · Foundry ✖
**Precisa de decisão:** nenhuma; falta apenas conferir a prévia e a aplicação numa cópia do mundo no Foundry.

### 22/09/2026 — Tarefa 2 (escopo atualizado pelo Yuri: banco e seleção de mapas antes dos NPCs)
**Fiz:** cataloguei uma fonte pública para cada uma das 48 localidades/Quedas em `src/map-bank.mjs` e `docs/BANCO-DE-MAPAS.md`. O Mapa Imersivo mostra as fontes por região, permite escolher um arquivo de imagem real pelo FilePicker e abre uma prévia com caixas de marcar antes de criar cenas. Aplicar cria somente as cenas marcadas com imagem escolhida, `background.src` e `navigation:false`, vincula cada uma ao local no atlas e grava o atlas uma vez; cenas já vinculadas ou marcadas pelo banco não são duplicadas. As saídas pai → sublocal aparecem com nome e destino, ainda sem posição nem teletransporte jogável.
**Funcionou:** testes com dados falsos verificaram cobertura das 48 localidades, exclusão de locais com cenas existentes, prévia, campo de fundo, vínculo, save único e repetição sem duplicar. O campo `background` e `navigation` foram conferidos no schema oficial de Scene do Foundry 13. `npm test`, `npm run package` e `git diff --check` passaram antes do commit.
**Não funcionou / deixei de fora:** não havia arquivos de mapas nem acesso a um mundo Foundry nesta execução; nenhuma cena real foi criada. Arquivo visual, escala, grade e FilePicker precisam de conferência numa cópia do mundo. Conforme a prioridade mais recente do Yuri, tokens de NPC, visão, lojas, teletransportes posicionados e Tarefa 3 de pastas aguardam a montagem visual dos mapas.
**Checklist da regra 1:** tela ✔ · ações ✔ · app.mjs ✔ · CSS ✔ · teste ✔ (dados falsos) · Foundry ✖
**Precisa de decisão:** nenhuma para o código desta etapa; para preencher as cenas reais, o Yuri precisará obter os arquivos das fontes e escolhê-los no Foundry.
