# Biblioteca da campanha — 0.4.0

Fonte: Skyfall RPG, Livro Básico DIGITAL 1.25 fornecido por Yuri. As páginas indicadas são as páginas impressas do livro. Textos são resumos de consulta, não reprodução integral; regras detalhadas continuam no livro e nas fichas nativas.

## Conteúdo

- Mapa: 10 regiões, 48 cidades/locais/Quedas e 5 entradas além de Opath. Páginas 340–392. Região abre suas localidades, com atalho direto à capital e navegação de retorno. Destaques menores ficam nomeados nos cartões. Rumores e locais históricos são identificados no texto.
- Monstros: 44 blocos de ameaça, páginas 449–494. ND, tipo, papel, página e filtros por deslocamento. Não são fichas de Actor e não são encontros regionais.
- Itens: 156 entradas de equipamento, munição, consumíveis, serviços, transporte, engenhocas, sinapses, materiais, espaços de vestimenta e artefatos; mais 58 sigilos. Total de 214 entradas de consulta, não 214 itens comercializáveis. Equipamento nas páginas 222–258; artefatos de Sangue Macabro nas páginas 421–423. Armas e escudos que aparecem em duas tabelas têm uma entrada de consulta. Espaços de vestimenta e ataque desarmado são referências.
- Materiais, sigilos, sinapses e artefatos possuem categorias próprias. Custos de aplicar sigilos e imbuir fragmentos estão na ajuda de itens modificados. Não há aplicação automática de modificações nesta versão.

## Conferência na mesa

A aba Monstros lê os nomes e tipos dos Actors do mundo e dos compêndios acessíveis. Somente correspondência exata normalizada ou alias explícito, de tipo `npc`, conta como encontrada. Nuvem, grupo, indivíduo e variantes não são fundidos. Um nome encontrado não valida atributos, ataques ou efeitos.

Quando qualquer compêndio de Actors falha ou fica inacessível, os nomes restantes ficam como “A conferir”, e não como ausências confirmadas. “Conferir Foundry novamente” atualiza o índice. “Exportar conferência” salva encontrados, pendentes, candidatos de outro tipo e erros de leitura em JSON.

Itens procuram correspondência nos compêndios canônicos acessíveis do sistema. Itens soltos do Mundo continuam excluídos da lista de criação de personagem. Abrir uma ficha existente não altera nenhum documento. Consultar e exportar o índice não chama criação, atualização nem exclusão de Actors ou Items.

As abas da campanha são exclusivas do mestre. A verificação também ocorre nos manipuladores, além de ocultar a navegação para jogadores. O conteúdo de referência incluído no pacote não é um segredo de campanha.

## Divergências registradas

- P. 243: custo de imbuir 4º grau impresso como `T$ 1.2000`; valor numérico deixado indefinido.
- Pp. 245 e 254: `+1 (escudo)` está no 2º grau da tabela/seção, mas sua descrição exibe selo de 3º grau. Aviso no cartão.
- Pp. 224 e 228: escudos leves/pesados custam 5/15 na tabela de armas e 10/20 na de armaduras. Consulta mostra 10/20 e explicita a divergência.
- P. 237: texto da Carteira diverge da conversão K$/T$ da p. 219; aviso no cartão.
- Alguns sigilos têm ícone de ação e texto de ativação diferentes; o cartão pede conferir o original, sem automatizar uma interpretação.

## Reservado para depois

Imagens do livro, mapas e cenas, encontros por região, criação de ameaças faltantes e aplicação de modificações em Items aguardam a revisão/seleção de Yuri. Quests permanecem vazias. NPCs continuam como estrutura reservada.

## Manutenção

Dados: `src/book-world.mjs`, `src/book-monsters.mjs`, `src/book-items.mjs`, `src/book-sigils.mjs`. Consulta e correspondência: `src/library.mjs`. Interface: `styles/library.css`; integração em `src/app.mjs`. Não colocar UUIDs privados da mesa nesses dados públicos.

Validação: `npm test`. Os testes verificam vínculos geográficos, integridade do catálogo, correspondências e variantes, falhas de compêndios e acesso de jogadores. A navegação Mirmir → Kravokia e os filtros foram conferidos em prévia no navegador. A auditoria final dos compêndios depende da mesa conectada.
