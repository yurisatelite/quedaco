# QUEDAÇO

Módulo de controle de campanha para Skyfall RPG. Reúne Mapa Imersivo, Cena Atual, NPCs, guildas, monstros, itens, imbuir e quests.

## Estado da versão 0.13.0

O canal de atualização está publicado no GitHub. Consulte [`docs/ATUALIZACOES.md`](docs/ATUALIZACOES.md) para instalar, atualizar e publicar novas versões. A validação integrada das regras de criação e progressão continua pendente; os testes automatizados não comprovam todos os comportamentos da ficha nativa.

Depois da 0.6.0 entraram, sem versão publicada ainda: as correções de miniatura, filtros de Monstros e do "Militar apagado ao salvar", e o T17 fase 2 (preço em três moedas, cartão de item com cor por categoria, carrinho de compras, venda para qualquer NPC e atitude editável ao vivo). A fila em aberto vive em [`docs/FILA-PROXIMA-ATUALIZACAO.md`](docs/FILA-PROXIMA-ATUALIZACAO.md).

O criador agora vive no módulo independente [QUEDAÇO - Personagens Skyfall RPG](https://github.com/yurisatelite/quedaco-personagens-skyfall-rpg). Os dois módulos podem ser instalados juntos, sem compartilhar interface ou estado de execução.

Jogadores veem as áreas de campanha que a Mestra liberar. A Mestra vê **NPCs**, **Guildas**, **Mapa**, **Cena Atual**, **Monstros**, **Itens**, **Imbuir** e **Quests**.

A interface preserva a rolagem durante escolhas, mantém a navegação inferior fixa, mostra carregamento em operações demoradas e usa cartões compactos com descrições acessíveis pelo botão `?`. A loja só é liberada depois que o equipamento inicial for finalizado, separa os itens por categoria e mantém um carrinho visível.

## Ambiente alvo

- Foundry VTT 13 build 351.
- Sistema Skyfall 1.0.1.
- Conteúdo do Livro Básico instalado na mesa (`skyfall-core`).

## Desenvolvimento

Node.js 22 ou superior, sem dependências externas em execução.

```sh
npm test
npm run package
```

O pacote privado é gerado em `dist/quedaco-<versão>/quedaco`. Para distribuição pública, execute `npm run release -- -Public` e use `dist/quedaco.zip` e `dist/module.json`. A API `game.modules.get('quedaco').api.open()` abre o painel de campanha.

O projeto inclui [`CLAUDE.md`](CLAUDE.md) para uso com Claude Code. O fluxo local e o modelo de atualizações estão documentados em [`docs/CLAUDE-E-ATUALIZACOES.md`](docs/CLAUDE-E-ATUALIZACOES.md).

**Conferir conteúdo** exporta um diagnóstico de catálogo com versões, compêndios, documentos ausentes, vínculos quebrados e número de duplicações removidas. Ele não exporta credenciais, macros ou conversas.

## Conteúdo

As regras foram conferidas no Livro Básico DIGITAL 1.25 fornecido pelo usuário. O repositório não redistribui textos, ilustrações nem compêndios do livro; esses materiais são lidos no Foundry conforme as permissões da mesa.


## Cadastros compartilhados

Abra Módulos → Cadastros compartilhados para cadastrar regiões, localidades, tags e perfis de clima. Os módulos satélites consultam a API pública quando o núcleo estiver ativo. Contrato, exemplos e limitações em [docs/CADASTROS-COMPARTILHADOS.md](docs/CADASTROS-COMPARTILHADOS.md).
