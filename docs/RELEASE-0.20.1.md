# v0.20.1 — Cadastro alinhado ao Criador 0.3.1

A preparação de lotes pelo Cadastro exige a capacidade opcional
`npcTemplateResolution` do Criador 0.3.1+. Se a versão instalada for anterior,
o Cadastro informa qual módulo atualizar antes de iniciar a criação.

O formato de modelos, os IDs e as escolhas explícitas são preservados. Nenhuma
classe é substituída para contornar falhas. Os módulos continuam independentes;
não foi adicionada dependência obrigatória.

Validação: testes Node, empacotamento e prévia dos 37 modelos de Thur Thur com
estrutura exportada dos compêndios reais, usando o motor corrigido do Criador.
Importação restaurada e conferida por exportação do mundo: 12 Combatentes,
15 Especialistas e 10 Ocultistas. A criação completa dos Actors e seus recursos
derivados ainda exige conferência após instalar os dois pacotes.
