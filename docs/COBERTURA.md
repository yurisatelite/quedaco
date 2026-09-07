# Cobertura e estado da implementação

Este arquivo distingue catálogo, texto de regras, escolhas variáveis e ficha jogável. Uma opção aparecer no catálogo não comprova que seus benefícios foram aplicados.

## Fontes verificadas

- Livro Básico DIGITAL 1.25 fornecido pelo Yuri: regras de criação pp. 63–217, equipamento pp. 219–259, magia pp. 261–303 e universos alternativos pp. 416–430.
- Instalação local: Skyfall 1.0.1, compatível com Foundry 13.
- Mesa online: Foundry 13 build 351, Skyfall 1.0.1, 57 módulos ativos, constatado na interface em 07/09/2026.
- Compêndios online do `skyfall-core`: Criação de Personagem, Equipamentos, Magias, Regras e demais coleções do Livro Básico. Constatadas pastas de legados tradicionais e dos universos 12:34 e 37:34.
- Diagnóstico online completo: 1.284 Itens lidos sem falhas (909 de Criação de Personagem, 201 de Equipamentos, 99 documentos no compêndio de Magias, 46 de Guildas e 29 de Criação de Ameaça). O compêndio de Magias contém 98 documentos do tipo `spell`.

## Implementado

- Leitura de todos os índices de Itens acessíveis de Skyfall, sem lista curta ou limite artificial.
- Identificação de falhas/permissões de leitura; relatório de nomes ausentes e imagens genéricas.
- Checklist inicial: 16 legados (11 principais e 5 alternativos), 20 antecedentes, 3 classes, 4 maldições, 18 trilhas.
- Grafo oficial dos legados: 44 heranças vinculadas às opções corretas e nenhum UUID de benefício quebrado. A interface filtra as heranças pelo legado escolhido.
- Interface Noka e ciano; detalhes extraídos do documento real, com acesso à ficha original completa.
- Atributos fixos, convencionais, em ordem ou manuais; dados usando `Roll` do Foundry.
- Dinheiro dos 20 antecedentes e das 3 classes. Aristocrata usa 3d10+30; Devedor tem dívida; Viajante Intrépido tem verba de exploração, sem convertê-la indevidamente em dinheiro livre.
- Criação de `Actor.character` com proprietário explícito, token vinculado, `system.currency.t/p/k`, modificadores de atributos e origem rastreável do conteúdo.
- Inclusão dos documentos preservando seus efeitos, imagens e metadados; o sistema abre suas escolhas nativas.
- Resolução integrada dos benefícios de nível 1: talento de legado/maldição, estilo e façanha correspondente do Combatente, especialidade e duas artimanhas do Especialista, tradição e três truques do Ocultista. As 48 combinações de 16 legados com 3 classes foram auditadas sem grupos vazios.
- Treinamento das 3 classes e dos 20 antecedentes: armas, armaduras, proteções, perícias, aptidões e idiomas são validados e gravados no esquema nativo da ficha. Escolhas repetidas são recusadas.
- Bônus de INT da página 155 como escolha de perícia ou truque para cada dois pontos positivos, sem permitir truques duplicados.
- Equipamento inicial das três classes com todas as alternativas do livro, quantidades e munição adequada. Foram confirmados no compêndio online 18 modelos de armas simples, 16 marciais e todos os itens fixos usados pelos conjuntos.
- Equipamento dos 20 antecedentes: itens concretos disponíveis no compêndio entram no inventário, escolhas respeitam preço e proficiência, e pertences narrativos são preservados nas notas da criação.
- Compras adicionais descontam a bolsa em Trocados; a verba do Viajante Intrépido permanece separada e só aceita itens de exploração. A prévia soma o volume dos itens e compara com a capacidade calculada pela FOR.

## Pendente antes de liberar como criador completo

- Resolver a herança `Corte do Crepúsculo`, presente no compêndio mas sem vínculo com qualquer legado. Ela fica fora das opções até haver fonte segura para atribuí-la.
- Completar escolhas variáveis contidas apenas em prosa dentro de alguns legados e talentos, incluindo tamanho, deslocamento, bênçãos e outras decisões internas.
- Requisitos, quantidade de magias, bônus de INT, fragmentação, aprimoramentos e outras variáveis derivadas.
- Simulação opcional de venda do equipamento inicial por metade do preço.
- Prévia final com efeitos realmente calculados pelo sistema e verificação de recursos/proteções.
- Testar a conclusão automática completa dentro do Foundry e confirmar o resultado com usuário jogador.
- Teste real com usuário jogador, permissões de criação/compêndios e eventual mediação do mestre.
- Imagens ausentes, retratos e tokens adequados às escolhas. Nenhuma arte genérica é considerada cobertura concluída.
- Instalação online e teste integrado com os módulos da mesa.
- O antecedente Estudioso Feérico concede o idioma Feérico, mas esse idioma não existe no esquema fechado de idiomas do Skyfall 1.0.1. Até a integração ser corrigida no sistema, o módulo preserva essa concessão nas notas de criação e aplica Élfico normalmente.

## Diferença encontrada no sistema

O método `prepareMaxHPMean` do Skyfall 1.0.1 local usa `Math.floor((die + 1) / 2)`. O livro informa 6/5/4 como valores fixos após o primeiro nível para d10/d8/d6. Isso produziria uma diferença de 1 PV por nível adicional. O módulo não altera o código do sistema; a criação permanece no nível 1 até resolver e testar a regra de evolução com a mesa.

## Limite atual

Versão 0.1.0 de desenvolvimento. Os testes automatizados verificam regras e contratos com mocks; não substituem o teste dentro do Foundry. O módulo não está declarado pronto para todos os jogadores.
