# Skyfall — Criador de Personagens do Yuri

Módulo para a mesa online do Yuri. Interface Noka, azul-ciano e conteúdo proveniente dos compêndios da própria mesa. Projeto independente, sem dependências de outros aplicativos pessoais.

**Estado: desenvolvimento 0.1.0. Ainda não é o criador completo.** Veja [cobertura](docs/COBERTURA.md) para as pendências específicas. Benefícios e treinamento de nível 1 já são resolvidos pelo módulo; equipamento inicial e algumas decisões descritas apenas em prosa ainda impedem a liberação para jogadores.

## Ambiente alvo

- Foundry VTT 13 build 351.
- Sistema Skyfall 1.0.1.
- Conteúdo do Livro Básico instalado na mesa (`skyfall-core`).
- Usuários precisam ter acesso aos compêndios; para criar rascunhos, também precisam da permissão de criar Atores. O módulo não muda permissões nem cria acesso privilegiado por socket.

## Desenvolvimento

Node.js 22 ou superior, sem dependências externas de execução.

```sh
npm test
npm run package
```

O empacotamento gera a pasta do módulo em `dist/skyfall-yuri-criador-0.1.0/skyfall-yuri-criador`. Não publica nem instala nada. A fonte Noka fornecida pelo Yuri é incluída localmente; a ferramenta não faz requisições a uma API de IA.

Após instalação em um ambiente de teste, habilite o módulo e use **Criar personagem · Yuri** na aba Atores. A API de abertura também é `game.modules.get('skyfall-yuri-criador').api.open()`.

Use **Conferir conteúdo** para baixar um diagnóstico de catálogo. Esse diagnóstico contém apenas versão do sistema, compêndios, tipos/nomes/UUIDs ausentes ou sem imagem; não exporta macros, credenciais ou conteúdo de chats.

## Fontes

Regras baseadas no PDF fornecido pelo usuário. Descrições, imagens e efeitos são carregados dos documentos autorizados do Foundry, sem incluir o livro ou os compêndios dentro deste repositório. A fonte foi copiada do acervo de identidade visual indicado pelo Yuri, sem dependência de caminho externo em execução.
