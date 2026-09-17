# COMANDO CODEX — 10ª rodada

Documento de passagem. **Claude estrutura, Codex executa, Yuri confirma.** Leia este
arquivo e o `CLAUDE.md` da raiz; não precisa reler conversa nenhuma nem a 9ª rodada.

**HEAD de referência:** `49ebfbb`. `npm test` = **226 passando**. Árvore limpa.
**Versão no repositório:** 0.8.0. Muita coisa foi commitada depois dela (Mapa Imersivo,
T24 completa) e **ainda não foi publicada** — ver seção 3.

---

## 0. Regras desta rodada — leia antes de tudo

Todas as da 9ª continuam valendo (checklist "só está feito quando está na tela",
registrar e commitar se parar no meio, nada sem pedido escrito, macro importa o módulo
instalado, a P.I.P.I. nunca é tocada, CRLF/LF misto). Mais uma, do que aconteceu nesta:

8. **Uma feature grande ganha um `docs/PROGRESSO-<nome>.md`, com barra e % por etapa**
   (código pronto × testado com dado falso × visto no Foundry de verdade). Não é
   burocracia — foi o que permitiu dividir o Mapa Imersivo em pedaços e mostrar, sem
   ambiguidade, que "código pronto e testado" **não** é o mesmo que "funciona". Antes de
   marcar uma tarefa como concluída, pergunte: isso foi *visto* rodando no Foundry, ou só
   testado com Node e dado inventado? As duas coisas são diferentes e o documento de
   progresso deve dizer qual é qual.

**Achado nesta rodada, vale para qualquer conversor/parser de texto de fonte externa:**
um teste com dado inventado prova que a lógica funciona *para aquele dado*, não que ela
bate com o formato real. `parseInnateSpellcasting` tinha um bug (cortava a lista de
magia inata pela metade) que **nenhum** dos testes com texto escrito à mão pegava, porque
todos escreviam o texto do jeito que eu *imaginava* que a fonte real teria. Só apareceu
rodando contra os 322 monstros de verdade da API do Open5e. Sempre que der, rode contra
uma amostra real antes de considerar um parser pronto — não só contra exemplos que você
mesmo escreveu.

---

## 1. Tarefas — nesta ordem

As tarefas 1–7 e 11 (T24) da 9ª rodada estão **concluídas** (ver diário na seção 4 de
`docs/COMANDO-CODEX-9.md`, que fica fechada). Seguem, na mesma ordem de antes:

### Tarefa 5 — Conferência da região-espelho  · *média*

Sem mudança desde a 9ª rodada — ver `docs/COMANDO-CODEX-9.md`, Tarefa 5, pela
especificação completa (bloco só de leitura em `renderRegionView`: NPC sem legado, sem
herança, sem local, sem guilda; sem retrato; mercador com estoque vazio).

### Tarefa 8 — Limpar o topo das abas  · *média*

Sem mudança — ver `docs/COMANDO-CODEX-9.md`, Tarefa 8. **Atenção:** o painel da cena
ativa (Mapa Imersivo, `renderActiveScenePanel`) agora também fica no topo da aba Mapa,
acima da barra de abas Mapa de Opath/Mapa Imersivo. Ao limpar essa área, não remova nem
duplique esse painel — ele já segue a regra de "não crie bloco novo, reaproveite".

### Tarefa 9 — Os 404 de imagem no console  · *pequena*

Sem mudança — ver `docs/COMANDO-CODEX-9.md`, Tarefa 9.

### Tarefa 10 — Monstros por região no painel  · *média*

Sem mudança — ver `docs/COMANDO-CODEX-9.md`, Tarefa 10. A macro que grava a região já
existe e já rodou contra os monstros do livro; falta só a faceta na tela.

### Tarefa 12 — Biografia em ficha de campo (T24, passo 6)  · *média*

Especificada em `docs/T24-MONSTROS-COMPLETOS.md`, seção 3 ("A biografia — ficha de
campo"). Precisa de um arquivo `.local/fichas-de-campo.json` com aparência, temperamento,
comportamento, o-que-quer e ganchos por monstro — **esse arquivo ainda não existe** e não
é pra inventar de uma vez para os 370 monstros; comece pelos mais usados (os do bestiário
do livro) e deixe os blocos vazios (título + "—") pros que não tiverem entrada, como o
documento já prevê. Não é código, é conteúdo — pode ser feito aos poucos.

### Tarefa 13 — Mapa Imersivo: ajustes de uso e o mapa conceitual de verdade  · *grande — especificada em `docs/T25-MAPA-IMERSIVO-VISUAL.md`*

**Primeiro retorno de uso real** — o Yuri testou a v0.9.0 no Foundry, mandou prints, e
depois teve uma conversa de design com o Claude sobre a peça maior. **Todas as decisões
já estão tomadas — leia o documento inteiro, não pergunte de novo o que ele já resolve.**
Resumo: 7 ajustes pequenos (seção 1) e o quebra-cabeça arrastável por região (seção 2,
decisão confirmada — arrastar, não calcular sozinho; não junta com o mapa de Opath por
enquanto). A seção 1.7 move o painel da cena ativa (Tarefa 6 da rodada anterior) pra uma
aba nova "Cena Atual", com os NPCs organizados por localidade dentro da região, não a
região inteira misturada.

### Tarefa 14 — Imbuir sai da barra de abas, vai pra dentro da ficha do NPC  · *precisa de conversa de design antes de especificar*

Decidido nesta rodada de conversa (`docs/T25-MAPA-IMERSIVO-VISUAL.md`, seção 4.1), mas
**ainda sem desenho de como fica dentro da ficha do NPC.** Não codifique — isto é só um
lembrete registrado pra não se perder, do mesmo jeito que T21 e T8b esperam decisão.

### Tarefa 15 — Ponte com o módulo World Explorer  · *pequena — especificada em `docs/T25-MAPA-IMERSIVO-VISUAL.md`, seção 4.2*

O Yuri já usa esse módulo no mundo oficial pra revelar hexágonos de exploração. O
QUEDAÇO só precisa de um botão que abre a cena de exploração quando o módulo está
ativo — **sem ler nem escrever nada da estrutura interna dele** além de checar se está
ativo. A leitura opcional de quantos hexágonos já foram revelados (item 2 da seção 4.2)
é fora do escopo principal e precisa vir **blindada contra formato inesperado** — nunca
pode quebrar a tela.

---

## 2. Enquanto trabalha — melhorias de estrutura

- `src/library.mjs` continua enorme. Mesma regra da 9ª: mova a renderização de uma aba
  por vez para `src/panels/<aba>.mjs`, só quando já estiver mexendo ali, com o teste
  "todo botão tem ação" (tarefa 1 da 9ª) garantindo que nada quebrou.

---

## 3. Fica com o Yuri — não codifique

| Item | O que falta |
|---|---|
| ~~Publicar a versão nova~~ | **Feito** — v0.9.0 publicada em 17/09/2026 (`gh release`), com `quedaco.zip` e `module.json`. |
| ~~`gh auth login`~~ | **Feito.** O Claude publica release sozinho a partir de agora, com autorização do Yuri pra cada versão. |
| **Decisão de design — Tarefa 13, seção 2.1** | Diagrama do Mapa Imersivo: Opção A (calculado, sem arrastar — mais rápido) ou Opção B (arrastável, posição de cada caixa lembrada — o que o print sugere, mas bem mais trabalho)? Ver `docs/T25-MAPA-IMERSIVO-VISUAL.md`. |
| **Decisão de design — Tarefa 13, seção 2.3** | O diagrama novo substitui a lista de hoje, ou os dois convivem (abas "Diagrama"/"Lista")? O Yuri disse que gostou da ideia de lista, só não do jeito que ficou. |
| Mundo de teste | Ainda vale a pena, pra conferir as próximas rodadas sem risco ao mundo oficial. |
| **Conferir o resto do Mapa Imersivo no Foundry** | O painel da cena ativa e a pergunta ao ativar cena (`docs/PROGRESSO-MAPA-IMERSIVO.md`, etapas D e E) ainda não tiveram retorno — só o atlas (etapa A/C) foi testado, e virou a Tarefa 13. |
| **Reconverter os 326 monstros de D&D** | Depois de publicar: `node tools/buscar-srd.mjs` no seu computador, depois `.local/reconverter-monstros-dnd.js` no Foundry (prévia primeiro). Backup do mundo antes — ela apaga e recria os Itens de cada monstro convertido. |
| **T21** — trocar legado no editor | Ainda precisa de conversa de design. |
| **T8b** — ficha de profissão do NPC | Protótipo em `.local/criar-vendedor-prototipo.js`; falta o brainstorm. |
| Imagens das moedas | 33 prompts prontos em `docs/T17-PROMPTS-MOEDAS.md`. |
| Fichas de campo dos monstros (Tarefa 12) | Conteúdo, não código — pode ser escrito por qualquer um, inclusive o Yuri, seguindo o formato de `docs/T24-MONSTROS-COMPLETOS.md` seção 3. |

---

## 4. Diário de bordo — preencha aqui

Formato de cada entrada:

```
### <data> — Tarefa N
**Fiz:** o que mudou de comportamento, e em quais arquivos.
**Funcionou:** o que você verificou, e como.
**Não funcionou / deixei de fora:** e o motivo.
**Checklist da regra 1:** tela ✔/✖ · ações ✔/✖ · app.mjs ✔/✖ · CSS ✔/✖ · teste ✔/✖
**Precisa de decisão:** a pergunta exata para o Yuri, se houver.
```

### 17/09/2026 — Tarefa 5
**Fiz:** incluí no topo da visão de região da Mestra o bloco somente-leitura “Conferência da região”. Ele lista, com contagem e atalhos, NPCs sem legado, herança, local ou guilda; retratos provisórios; mercadores sem estoque; localidades sem cena; cenas regionais fora do Mapa Imersivo; e localidades com NPCs sem gancho de rumor. A resolução do atlas ganhou a opção de ignorar os vínculos legados, para a auditoria não confundir uma cena escolhida antes com uma cena organizada no atlas.
**Funcionou:** os testes cobrem cada categoria, os atalhos para editor de NPC/localidade/cena e o selo “Região pronta para servir de modelo” quando não há pendência. Os testes direcionados de biblioteca e atlas passaram; a conferência não atualiza settings nem Actors.
**Não funcionou / deixei de fora:** a aparência e os atalhos ainda precisam de conferência visual num mundo de teste do Foundry. Rumores escritos à mão continuam regionais; para a checagem por localidade, os ganchos automáticos agora carregam o NPC e a localidade de origem.
**Checklist da regra 1:** tela ✔ · ações ✔ (somente ações existentes) · app.mjs ✔ (encaminhamento existente) · CSS ✔ · teste ✔
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 12
**Fiz:** criei `.local/fichas-de-campo.json` com 44 fichas curtas, uma para cada ameaça do bestiário do livro. Cada uma tem aparência, temperamento, comportamento, o que quer e dois ganchos, todos redigidos em palavras próprias e sem texto extenso de livro.
**Funcionou:** validei o JSON e a presença dos cinco campos em todas as 44 entradas. O arquivo fica em `.local`, portanto não entra no pacote nem no repositório público.
**Não funcionou / deixei de fora:** o conversor atual ainda não lê o arquivo, então a reconversão não preenche essas fichas automaticamente até essa etapa ser conectada. Não criei conteúdo para os 326 monstros de D&D.
**Checklist da regra 1:** tela ✖ (conteúdo local) · ações ✖ · app.mjs ✖ · CSS ✖ · teste ✔ (validação estrutural local)
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 10
**Fiz:** incluí no catálogo do bestiário o local, região ou além de Opath de cada uma das 44 ameaças do livro, seguindo a tabela da macro de distribuição. A aba Monstros ganhou facetas de Região e Além de Opath, chip de localização no cartão e linha de habitat no detalhe. Uma flag `flags.quedaco.monster` de uma ficha do mundo prevalece sobre o índice do livro; sem qualquer origem, a ameaça entra em “Sem região”.
**Funcionou:** o teste cobre as três origens da faceta (local do livro, flag do mundo e ausência), além de confirmar as novas facetas e a linha de habitat na tela. A seleção continua usando o filtro já existente e não grava Actor nem setting.
**Não funcionou / deixei de fora:** “Aranha gigante” e “Gavião gigante” ficaram somente no nível regional porque a tabela da macro aponta Túneis/Dunas, que não são localidades cadastradas no índice público do módulo; não criei localidade fictícia.
**Checklist da regra 1:** tela ✔ · ações ✔ (reaproveita filtros e edição de habitat) · app.mjs ✔ (encaminhamento existente) · CSS ✔ · teste ✔
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 9
**Fiz:** adicionei o índice de imagens do mundo. A Mestra usa “Reindexar imagens”; o módulo lista as pastas conhecidas uma vez e guarda os caminhos existentes. Com índice da mesma pasta de imagens, o resolvedor oferece apenas os arquivos listados, evitando as tentativas `.webp`/`.png` inexistentes. Sem índice, ou se a pasta mudou, ele conserva o fallback antigo.
**Funcionou:** o teste cobre um índice com só `.png` existente e confirma que `.webp` não entra na cadeia; também confirma a cadeia completa no primeiro uso, sem índice. O botão é uma ação de Mestra e o jogador apenas lê o setting de mundo.
**Não funcionou / deixei de fora:** a listagem real do `FilePicker` ainda precisa de uma conferência no Foundry, pois o ambiente de teste não tem armazenamento de mundo para navegar.
**Checklist da regra 1:** tela ✔ · ações ✔ · app.mjs ✔ (encaminhamento genérico existente) · CSS ✔ (botão usa o topo existente) · teste ✔
**Precisa de decisão:** nenhuma.

### 17/09/2026 — Tarefa 8
**Fiz:** retirei da tela a cobertura regional de NPCs, a importação de guildas já concluída e a instrução “Onde colocar as imagens” do Mapa. Criei um cabeçalho compartilhado para NPCs, Guildas, Monstros e Itens: pesquisa vem antes, filtros vêm em seguida, e Guildas mantém abas à esquerda e ações à direita na mesma faixa. “Guardar as sem membro” agora tem a aparência de ação secundária.
**Funcionou:** testes confirmam que os blocos retirados não voltam a ser renderizados, que NPCs e Guildas usam o cabeçalho com “Pesquisar” e “Filtrar por”, e que o mapa configurado não mostra mais a instrução removida. O CSS reserva uma quebra segura para 700 px, levando as ações abaixo das abas sem sobreposição.
**Não funcionou / deixei de fora:** a geração por cobertura permanece como ação interna porque ainda há automação e teste para ela; somente o painel antigo foi removido da interface.
**Checklist da regra 1:** tela ✔ · ações ✔ (as existentes preservadas) · app.mjs ✔ (encaminhamento existente) · CSS ✔ · teste ✔
**Precisa de decisão:** nenhuma.
