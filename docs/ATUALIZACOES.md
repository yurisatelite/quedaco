# Atualizações do QUEDAÇO

Manifesto permanente para instalar e atualizar pelo Foundry:

https://github.com/yurisatelite/quedaco/releases/latest/download/module.json

Uma instalação manual antiga precisa ser vinculada a esse manifesto uma vez. Em Configuração do Foundry → Módulos adicionais → Instalar módulo, informe o endereço acima. Nas próximas versões, use a atualização do QUEDAÇO na lista de módulos. Se a mesa estiver aberta, retorne à configuração quando os jogadores terminarem e recarregue os clientes depois da atualização.

## Publicar uma nova versão

1. Aumente a versão em `module.json` e `package.json` e ajuste `download` para a tag correspondente (`vX.Y.Z`). Preserve `manifest`, que deve apontar sempre para `releases/latest/download/module.json`.
2. Execute `npm run release -- -Public`. O pacote público não inclui arquivos da fonte Noka, documentos privados, PDFs nem conteúdo dos compêndios.
3. No repositório `yurisatelite/quedaco`, crie uma release com a tag correspondente e anexe `dist/quedaco.zip` e `dist/module.json`.
4. Publique como a release mais recente. Verifique os dois endereços sem autenticação antes de pedir que usuários atualizem.
5. Não substitua silenciosamente o ZIP de uma versão publicada. Publique uma nova versão para corrigir problemas.

## Identidade visual da mesa

Os arquivos licenciados Noka-Medium.woff2 e Noka-Semibold.woff2 podem permanecer em uma pasta da própria mesa, por exemplo `quedaco-brand`. Em Configurações do módulo, informe essa pasta em “Pasta de fontes da mesa”. Como fica fora de `modules/quedaco`, a pasta sobrevive às atualizações. O pacote público utiliza Outfit quando nenhuma pasta estiver configurada. A Outfit acompanha o módulo e funciona sem serviços externos, em peso Medium (500) no texto e Semibold (600) nos títulos. Sua licença SIL Open Font License 1.1 está incluída em `assets/fonts/OFL-Outfit.txt`.

## Versão 0.3.2

Inclui a fonte secundária Outfit e sua licença de redistribuição. Preserva o canal de atualizações e a opção de carregar Noka da pasta privada da mesa.

Publicada em 08/09/2026. O manifesto permanente e o ZIP responderam sem autenticação. A atualização de 0.3.1 para 0.3.2 foi executada e confirmada na lista de módulos do servidor oficial pelo controle “Executar Atualização se Disponível”.

## Escopo da versão 0.3.1

Adiciona o canal de atualização à base 0.3.0. As bibliotecas de Mapa, Monstros e Itens ainda são estruturas iniciais. A validação automatizada não substitui os testes integrados de progressão e criação dentro do Skyfall.
