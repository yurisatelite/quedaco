# QUEDAÇO — contexto para Claude Code

Este repositório contém um módulo comunitário de Foundry VTT para Skyfall RPG. Leia `README.md` e `docs/COBERTURA.md` antes de alterar código.

## Ambiente confirmado

- Foundry VTT 13 build 351.
- Sistema `skyfall` 1.0.1.
- Mundo oficial remoto: **Skyfall RPG**.
- O módulo antigo `skyfall-yuri-criador` foi substituído por `quedaco`.
- O código local é a fonte de verdade. Não edite diretamente os arquivos do servidor.

## Onde as coisas moram

Tudo do QUEDAÇO vive dentro de `E:\RPG\QUEDACO` (antes o repositório ficava solto em `E:\CODEX-RPG`):

- `E:\RPG\QUEDACO\modulo` — **este repositório**. Abra esta pasta no Claude Code.
- `E:\RPG\QUEDACO\quedaco` — clone de publicação (o `.git` que vai para o GitHub). Este repositório não tem `remote`.
- `E:\RPG\QUEDACO\Versões do módulo` — pacotes já publicados.
- `E:\RPG\QUEDACO\tokens-*`, `npcs`, `Monstros`, `*.zip` — assets da mesa, fora do git.
- `modulo\.local` — trabalho local fora do git: macros da mesa, texto extraído do livro, índices de token, `fichas-para-casar.json`.

Os utilitários de `tools/` acham a raiz sozinhos (`tools/raiz.mjs`); não volte a chumbar caminho absoluto neles.

## Regras de trabalho

1. Não invente regras, campos ou opções. Confira `E:/RPG/Skyfall RPG - Livro Básico DIGITAL 1.25.pdf` e o esquema local em `C:/Users/YURI/AppData/Local/FoundryVTT/Data/systems/skyfall`.
2. Não copie textos extensos nem imagens do livro para o repositório. O módulo lê conteúdo dos compêndios autorizados da mesa.
3. Não crie, edite ou exclua Atores do mundo oficial durante desenvolvimento. Testes integrados devem parar antes da criação da ficha, salvo instrução expressa do Yuri.
4. Preserve compatibilidade com Foundry 13 e Skyfall 1.0.1 até uma migração deliberada.
5. Use `rg` para buscas. Faça mudanças pequenas e verificáveis.
6. Rode `npm test` e `npm run package` antes de considerar a alteração pronta.
7. Aumente `module.json.version` e `package.json.version` somente ao preparar uma versão instalável.
8. Não publique a fonte Noka em repositório público sem confirmar sua licença de redistribuição.

## Antes de explorar código pra uma feature nova

Confira **[docs/MAPA-DO-MODULO.md](docs/MAPA-DO-MODULO.md)** — provavelmente já tem uma
linha dizendo qual arquivo/função cuida daquela área, os testes e o que falta. Pra campo
do sistema Skyfall (perícia, idioma, tamanho, tipo de Item...), **[docs/REFERENCIA-SKYFALL.md](docs/REFERENCIA-SKYFALL.md)**.
Pra saber o que existe *no mundo agora* (NPCs, guildas, região), não dá pra ler código —
ver **[docs/COMO-CONSULTAR-O-MUNDO.md](docs/COMO-CONSULTAR-O-MUNDO.md)**.

## Arquitetura

- `src/app.mjs`: interface ApplicationV2, navegação e fluxo de 13 etapas.
- `src/catalog.mjs`: catálogo canônico dos compêndios; itens soltos de Mundo ficam fora.
- `src/benefits.mjs`: grafo de benefícios e escolhas até o nível de destino.
- `src/progression.mjs`: marcos de classe dos níveis 1–12.
- `src/training.mjs`: perícias, proteções, idiomas, proficiências e especialidade.
- `src/equipment.mjs`: equipamento inicial, compras, quantidades e volume.
- `src/rules.mjs`: regras puras de atributos, vida, dinheiro e capacidade.
- `src/adapter.mjs`: único ponto que cria ou atualiza documentos do Foundry.
- `src/library.mjs`: painel da Mestra (NPCs, Guildas, Mapa, Monstros, Itens, Imbuir, Quests). Arquivo grande; toda ação da interface passa por `CampaignLibrary.action(op,id,data)`, e `openOps` lista o que o jogador pode disparar.
- `src/npcs.mjs`: flag `flags.quedaco.npc`, papéis, visibilidade e vínculos entre NPCs.
- `src/negotiation.mjs`: atitude, condições de desconto do livro, pechincha e revenda.
- `src/book-*.mjs`: índices de consulta transcritos do livro (mundo, itens, monstros, sigilos, heranças). Dado de referência, nunca regra nova.
- `src/images.mjs`: resolve imagem por convenção de pasta + nome, com JSON de exceções.
- `styles/creator.css`: identidade visual Noka e azul-ciano.
- `styles/library.css`: estilos do painel da Mestra.
- `tests/`: testes Node sem dependência do Foundry em execução.

## Comandos

```powershell
npm test
npm run package
npm run release
```

O pacote resultante fica em `dist/quedaco-<versão>/quedaco`. `npm run release` também cria o ZIP com `module.json` na raiz, pronto para uma release. Para instalação manual, envie somente a pasta `quedaco` para `Data/modules`.

## Estado funcional

- Versão do repositório: **0.8.0** (`module.json` e `package.json`), fechada em 17/09/2026. As macros de `.local/` importam do módulo **instalado** no Foundry, que pode estar atrás do repositório — confira o que está publicado antes de uma macro depender de código novo.
- O módulo antigo está desativado no mundo oficial.
- Jogadores veem Criação de Personagens e as abas liberadas pela Mestra; ela vê NPCs, Guildas, Mapa, Monstros, Itens, Imbuir e Quests.
- A progressão 1–12 usa os benefícios registrados nos documentos do sistema. Escolhas descritas apenas em prosa ainda exigem implementação e conferência individual.
- Canal de atualização publicado em `https://github.com/yurisatelite/quedaco`. Siga `docs/ATUALIZACOES.md`: pacote público inclui Outfit/OFL e exclui Noka. Não substitua arquivos de versões publicadas; aumente a versão e publique nova release.

## Quem está executando

Desde 15/09/2026 a fila é executada pelo **Codex**: o Claude estrutura, o Codex executa,
o Yuri confirma. A rodada atual é **`docs/COMANDO-CODEX-9.md`**: regras, tarefas em ordem, o que fica com o Yuri e o diário do que foi executado (seção 4) — **leia-o antes de retomar qualquer coisa**. A 8ª rodada (`COMANDO-CODEX-8.md`) está encerrada e fica como histórico.

## Entrega de uma mudança

Informe ao Yuri: comportamento alterado, arquivos principais, testes executados e qualquer parte ainda não confirmada dentro do Foundry. Não envie arquivos ao servidor nem publique releases sem autorização explícita para aquela versão.
