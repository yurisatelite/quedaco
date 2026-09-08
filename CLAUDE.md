# QUEDAÇO — contexto para Claude Code

Este repositório contém um módulo comunitário de Foundry VTT para Skyfall RPG. Leia `README.md` e `docs/COBERTURA.md` antes de alterar código.

## Ambiente confirmado

- Foundry VTT 13 build 351.
- Sistema `skyfall` 1.0.1.
- Mundo oficial remoto: **Skyfall RPG**.
- O módulo antigo `skyfall-yuri-criador` foi substituído por `quedaco`.
- O código local é a fonte de verdade. Não edite diretamente os arquivos do servidor.

## Regras de trabalho

1. Não invente regras, campos ou opções. Confira `E:/RPG/Skyfall RPG - Livro Básico DIGITAL 1.25.pdf` e o esquema local em `C:/Users/YURI/AppData/Local/FoundryVTT/Data/systems/skyfall`.
2. Não copie textos extensos nem imagens do livro para o repositório. O módulo lê conteúdo dos compêndios autorizados da mesa.
3. Não crie, edite ou exclua Atores do mundo oficial durante desenvolvimento. Testes integrados devem parar antes da criação da ficha, salvo instrução expressa do Yuri.
4. Preserve compatibilidade com Foundry 13 e Skyfall 1.0.1 até uma migração deliberada.
5. Use `rg` para buscas. Faça mudanças pequenas e verificáveis.
6. Rode `npm test` e `npm run package` antes de considerar a alteração pronta.
7. Aumente `module.json.version` e `package.json.version` somente ao preparar uma versão instalável.
8. Não publique a fonte Noka em repositório público sem confirmar sua licença de redistribuição.

## Arquitetura

- `src/app.mjs`: interface ApplicationV2, navegação e fluxo de 13 etapas.
- `src/catalog.mjs`: catálogo canônico dos compêndios; itens soltos de Mundo ficam fora.
- `src/benefits.mjs`: grafo de benefícios e escolhas até o nível de destino.
- `src/progression.mjs`: marcos de classe dos níveis 1–12.
- `src/training.mjs`: perícias, proteções, idiomas, proficiências e especialidade.
- `src/equipment.mjs`: equipamento inicial, compras, quantidades e volume.
- `src/rules.mjs`: regras puras de atributos, vida, dinheiro e capacidade.
- `src/adapter.mjs`: único ponto que cria ou atualiza documentos do Foundry.
- `styles/creator.css`: identidade visual Noka e azul-ciano.
- `tests/`: testes Node sem dependência do Foundry em execução.

## Comandos

```powershell
npm test
npm run package
npm run release
```

O pacote resultante fica em `dist/quedaco-<versão>/quedaco`. `npm run release` também cria o ZIP com `module.json` na raiz, pronto para uma release. Para instalação manual, envie somente a pasta `quedaco` para `Data/modules`.

## Estado funcional

- QUEDAÇO 0.3.2 está instalado no servidor oficial; atualização de 0.3.1 confirmada pela interface do Foundry em 08/09/2026.
- O módulo antigo está desativado no mundo oficial.
- Jogadores veem Criação de Personagens; a Mestra também vê NPCs, Mapa, Monstros e Quests.
- A progressão 1–12 usa os benefícios registrados nos documentos do sistema. Escolhas descritas apenas em prosa ainda exigem implementação e conferência individual.
- Canal de atualização publicado em `https://github.com/yurisatelite/quedaco`. Siga `docs/ATUALIZACOES.md`: pacote público inclui Outfit/OFL e exclui Noka. Não substitua arquivos de versões publicadas; aumente a versão e publique nova release.

## Entrega de uma mudança

Informe ao Yuri: comportamento alterado, arquivos principais, testes executados e qualquer parte ainda não confirmada dentro do Foundry. Não envie arquivos ao servidor nem publique releases sem autorização explícita para aquela versão.
