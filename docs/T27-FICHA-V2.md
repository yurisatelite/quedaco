# T27 — Ficha V2: níveis que sobem, apagam e se explicam

> Pedido do Yuri, 11/10/2026: "O nível 10, 11 e 12 não consigo subir as coisas. Ele não
> deixa subir, ou dá erro. E quando eu apago o nível 10 ele apaga tudo e fica tudo solto
> na ficha. E eu nunca sei qual talento eu peguei em qual nível."

**Antes de codar, leia** a seção "Progressão do personagem" de
[REFERENCIA-SKYFALL.md](REFERENCIA-SKYFALL.md): ela explica como o sistema guarda nível
(`system.origin` da classe) e como um talento sabe de onde veio (id do benefício).

## Ideia em uma frase

Uma ficha alternativa registrada pelo QUEDAÇO (`DocumentSheetConfig.registerSheet`, **sem**
`makeDefault`) que **herda** a `SkyfallCharacterSheet` do sistema e troca só o pedaço de
progressão. Mesmos dados, mesmos campos: trocar de volta para a ficha do Skyfall não perde
nada. Pegar a classe por `CONFIG.Actor.sheetClasses.character["skyfall.SkyfallCharacterSheet"].cls`
(o sistema não exporta a classe).

## O que está quebrado e por quê (lido em `skyfall.mjs` 1.0.1)

| # | Sintoma do Yuri | Causa | Onde |
|---|---|---|---|
| 1 | "Apago o nível 10 e apaga tudo" | A lixeira da linha "Nível 10 — Combatente 10" é a lixeira **do Item classe**. Ela apaga a classe inteira (todos os níveis dela), sem confirmação. | `progression.hbs` (`data-action="delete" data-delete="Item"`) → `#onDelete` ~14046 |
| 2 | "Fica tudo solto" | Talento/característica ganho por nível guarda em `system.origin` só o **id do benefício** dentro da classe. Sem a classe, esse id não aponta para nada e o item cai na lista "Bônus". | `BenefitsDialog._onSubmit` ~3700; `_progression` ~6226 |
| 3 | "Não deixa subir" depois de mexer | O "Excluir" do menu de clique direito no nível tira `class-10` de `system.origin`, **mas não atualiza `system.level`** da classe. O nível do personagem (soma de `system.level`) fica velho. O próximo arrasto da classe chama `levelUp(nível+1)`, pula o buraco e conta de novo → o nível não sai do lugar. | menu `.class-level` ~13655; `Class.levelUp` ~7720; drop ~13786 |
| 4 | "Nunca sei qual talento peguei em qual nível" | O dado existe (benefício → nível da classe → `class-XX`), mas só aparece aninhado na árvore de progressão, e some quando o item fica solto. | `_progression` ~6226 |
| 5 | "Dá erro" no 10–12 | **Ainda não reproduzido.** O código de nível vai até 12 em todo lugar (`max: 12`, `levelRoll` com 12, tabela de XP). Suspeita: o diálogo de benefícios (`BenefitsDialog.addGrant`) quebra quando o `query` de um talento de nível alto bate num Item sem `system.feats`. Precisa do erro do console (ver "Com o Yuri"). | ~3560 |

## Etapas

| Etapa | O quê | Modelo | Estado |
|---|---|---|---|
| 0 | Yuri manda o erro do console do nível 10–12 (F12 → aba Console, print da linha vermelha) e o nome da classe/personagem | — | ⬜ |
| 1 | Esqueleto: `src/sheet-v2.mjs` registra "QUEDAÇO — Ficha V2" para `character` como ficha **padrão**, herdando a do sistema; nada muda visualmente. Testes em `tests/sheet-v2.test.mjs`. Falta conferir dentro do Foundry | Sonnet | ✅ código / ⬜ Foundry |
| 2 | Função pura `levelMap(actor)` em `src/level-map.mjs`: para cada nível 1–12, qual classe, quais itens vieram dele (benefício → nível da classe → `origin[nivel-1]`) e quais itens estão soltos. Com testes em `tests/` | Opus | ⬜ |
| 3 | Lixeira por nível: na V2, a lixeira da linha de nível remove **só aquele nível** (tira `class-XX`, recalcula `system.level`) e pergunta antes. Apagar a classe inteira vira ação separada, com aviso de quantos itens ficam soltos | Sonnet | ⬜ |
| 4 | Subir de nível sem buraco: arrastar a classe preenche o **primeiro** nível vazio, não `nível+1`; "Excluir" do menu também atualiza `system.level` | Sonnet | ⬜ |
| 5 | Botão "Reparar níveis": recalcula `system.level` de cada classe pelo `origin`, mostra a prévia (antes → depois) e só grava com "Aplicar" | Sonnet | ⬜ |
| 6 | Aba/painel "Por nível": lista 1–12 com classe e o que foi escolhido em cada um; itens soltos aparecem embaixo com "Prender no nível…" | Opus (desenho) / Sonnet (CSS) | ⬜ |
| 7 | Corrigir o erro do 10–12 a partir do print da etapa 0 | Opus | ⬜ |
| 8 | `npm test`, `npm run package`, `npm run lint:css`; doc em `MAPA-DO-MODULO.md` | Sonnet | ⬜ |

**Ordem:** 0 corre em paralelo com 1–2. As etapas 3–5 resolvem os sintomas 1–3 e não
dependem do print.

## Regras

- **Não sobrescrever o sistema.** Nada de patch global em `Class.prototype.levelUp`: a
  correção mora na subclasse da ficha, que só age quando a V2 está escolhida.
- **Regra 3 do `CLAUDE.md`:** teste num personagem de teste (ou numa cópia do mundo). Não
  mexer em ficha de jogador sem o Yuri liberar aquela ficha.
- Toda ação que grava (reparar, prender item solto) tem prévia + "Aplicar".

## Com o Yuri

1. **Print do erro do nível 10–12** (etapa 0): abrir a ficha, tentar subir, apertar F12,
   aba **Console**, print da linha vermelha. Dizer qual classe e se foi arrastando a classe
   ou pelo clique direito no "Nível X".
2. **Ficha quebrada agora:** os itens soltos ainda guardam o id do benefício. Se a classe
   for arrastada de volta do **mesmo compêndio** e os níveis forem refeitos, eles voltam a
   se encaixar sozinhos (os ids do compêndio são fixos). Não apague os itens soltos antes
   disso.
3. Depois da etapa 1, na ficha de teste: engrenagem "Ficha" → escolher "QUEDAÇO — Ficha V2".

## Diário

- 11/10/2026 — Causas 1–4 lidas no código do sistema; causa 5 pendente do print.
- 11/10/2026 — Etapa 1 feita no repositório (262 testes ok, pacote ok). Registrada como padrão: todo personagem sem ficha escolhida passa a abrir na V2; dá pra voltar pela engrenagem "Ficha". Nota do Yuri: apagar nível 7 apaga só o 7, mas o 10 apaga tudo — provável que no 7 a lixeira seja a do item escolhido (trilha), e no 10 a da linha da classe. Reproduzir na etapa 3.
