# Trabalhar com Claude e atualizar o Foundry

## Claude Code no computador

Abra a pasta `E:\CODEX-RPG` no Claude Code. O arquivo `CLAUDE.md` fornece o contexto do projeto automaticamente. Peça a alteração, revise o diff e exija que os testes e o empacotamento sejam executados.

Exemplo de pedido:

> No projeto QUEDAÇO, implemente a área de NPCs sem alterar o criador de personagens. Leia CLAUDE.md e docs/COBERTURA.md, rode os testes e mostre o diff antes de preparar uma nova versão.

## Claude pelo navegador

Para o Claude trabalhar sem acesso ao computador, o projeto precisa estar em um repositório GitHub. Um repositório privado permite editar o código, mas o atualizador do Foundry não consegue baixar releases privadas sem autenticação. Para o botão de atualização funcionar para a comunidade, o manifesto e o ZIP precisam estar disponíveis publicamente.

## Fluxo de versão

1. Alterar o código local ou pelo GitHub.
2. Rodar `npm test`.
3. Aumentar a versão em `module.json` e `package.json`.
4. Rodar `npm run release`, que repete os testes, monta a pasta e cria o ZIP publicável com `module.json` na raiz.
5. Publicar `module.json` e o ZIP da versão em uma URL pública estável.
6. O Foundry compara a versão instalada com o manifesto público e mostra o aviso de atualização.

Antes da publicação pública, confirme a licença de redistribuição de `assets/fonts/Noka-Semibold.woff2`. Se a fonte não puder ser redistribuída, use uma fonte aberta no pacote comunitário e mantenha Noka apenas na instalação pessoal.
