# QUEDAÇO

Módulo de criação de personagens e controle de campanha para Skyfall RPG. A interface usa Noka Semibold, azul-ciano e um símbolo vetorial original de dragão prateado em queda.

## Estado da versão 0.3.0

O criador usa os compêndios autorizados da própria mesa para preservar descrições, imagens e efeitos do sistema. Ele elimina cópias equivalentes do catálogo, prioriza o compêndio **Criação de Personagem** e não oferece documentos soltos de **Mundo** como opções.

O fluxo permite escolher níveis de 1 a 12. Ele reúne os benefícios fixos registrados na classe até o nível escolhido, separa decisões por nível e grava as origens `class-01` a `class-12` que a ficha nativa usa para mostrar a progressão manual. Trilhas escolhidas também abrem os próprios benefícios. O módulo calcula vida e ênfase e permite usar o valor fixo ou rolar os dados de vida dos níveis adicionais.

Jogadores veem somente **Criação de Personagens**. A Mestra também vê as estruturas iniciais de **NPCs**, **Mapa**, **Monstros**, **Itens** e **Quests**. O painel híbrido ligará esses cartões a documentos nativos do Foundry.

A interface preserva a rolagem durante escolhas, mantém a navegação inferior fixa, mostra carregamento em operações demoradas e usa cartões compactos com descrições acessíveis pelo botão `?`. A loja só é liberada depois que o equipamento inicial for finalizado, separa os itens por categoria e mantém um carrinho visível.

## Ambiente alvo

- Foundry VTT 13 build 351.
- Sistema Skyfall 1.0.1.
- Conteúdo do Livro Básico instalado na mesa (`skyfall-core`).
- Permissão de criação de Atores para quem usar o criador.

## Desenvolvimento

Node.js 22 ou superior, sem dependências externas em execução.

```sh
npm test
npm run package
```

O pacote é gerado em `dist/quedaco-0.3.0/quedaco`. Após instalar e habilitar o módulo, use **QUEDAÇO · Criar personagem** na aba Atores. A API de abertura é `game.modules.get('quedaco').api.open()`.

O projeto inclui [`CLAUDE.md`](CLAUDE.md) para uso com Claude Code. O fluxo local e o modelo de atualizações estão documentados em [`docs/CLAUDE-E-ATUALIZACOES.md`](docs/CLAUDE-E-ATUALIZACOES.md).

**Conferir conteúdo** exporta um diagnóstico de catálogo com versões, compêndios, documentos ausentes, vínculos quebrados e número de duplicações removidas. Ele não exporta credenciais, macros ou conversas.

## Conteúdo

As regras foram conferidas no Livro Básico DIGITAL 1.25 fornecido pelo usuário. O repositório não redistribui textos, ilustrações nem compêndios do livro; esses materiais são lidos no Foundry conforme as permissões da mesa.
