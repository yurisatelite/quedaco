# App de criação de personagens de RPG

Documento norteador escrito pelo Claude (a pedido do Yuri) pra você, Codex,
começar do zero. Esse projeto **não tem nenhuma relação** com o Satélite
(o app de conteúdo pra criadores) — é uma pasta separada, um repositório
git separado, ponto de partida em branco.

## O que o Yuri quer

Um aplicativo pra criar personagens do RPG de mesa que ele joga. Ele:
- Tem o livro de regras (físico ou digital).
- Usa Foundry VTT pra rodar as mesas.
- Ainda não decidiu se isso deve ser um **módulo dentro do próprio
  Foundry** ou um **aplicativo separado** (web app fora do Foundry). Ele
  mesmo disse que a ideia de módulo de Foundry é a que mais te agrada,
  mas pode estar "um pouco fora da realidade" — quer decidir isso
  conversando com você, não que a decisão já venha pronta.

## Antes de escrever qualquer código: pergunte ao Yuri

Não assuma nada da lista abaixo. Faça essas perguntas nesta conversa com
ele antes de propor arquitetura ou abrir um arquivo de código:

1. **Qual sistema de RPG e qual edição** (ex: D&D 5e, Tormenta20, Ordem
   Paranormal, sistema próprio/homebrew, etc.)? Isso muda completamente
   as regras de criação de personagem.
2. **Ele tem o livro em PDF/digital** que pode compartilhar com você (ou
   trechos relevantes — ficha, tabelas de raça/classe/atributos,
   perícias, equipamentos)? Ou vai precisar digitar/descrever as regras
   pra você manualmente?
3. **Módulo de Foundry VTT vs. app web separado** — explique pra ele em
   linguagem simples o trade-off real:
   - Módulo de Foundry: aparece dentro do próprio Foundry, gera um
     "Actor" que já entra direto na mesa dele, mas exige aprender a API
     de módulos do Foundry (JavaScript/Handlebars, `manifest.json`,
     `Actor.create()`, sheets customizadas) — mais complexo de começar,
     mais integrado no fim.
   - App web separado: mais rápido de construir e iterar, você escolhe a
     stack livremente, mas no fim ele teria que copiar os dados pra
     dentro do Foundry manualmente (ou você constrói uma exportação
     depois, tipo gerar um JSON no formato de Actor do Foundry pra
     importar).
   - Pergunte a prioridade real dele: importa mais **aparecer dentro do
     Foundry na hora de jogar**, ou importa mais **ter uma ferramenta
     rápida e bonita pra criar personagem fora da mesa**, com exportação
     pro Foundry depois?
4. **Qual versão do Foundry** ele roda (v11, v12, v13...) — a API de
   módulos muda entre versões majors.
5. **O que "criar personagem" precisa cobrir de verdade** — pergunte pra
   ele listar o que a ficha final precisa ter (atributos, raça/classe,
   perícias, equipamento/inventário inicial, magias, rolagem de dados,
   história/background, imagem do personagem etc.), pra não assumir um
   escopo genérico.
6. **Alguma preferência de tecnologia**, ou ele deixa livre? Se for
   módulo de Foundry, a stack é praticamente ditada pelo próprio Foundry
   (JS puro ou TypeScript + Handlebars). Se for app separado, você é
   livre pra propor (mas evite over-engineering pra um projeto pessoal
   — algo simples que rode local ou em um único link já resolve).

## Depois de ter essas respostas

Proponha 2-3 caminhos concretos com prós/contras curtos (não um ensaio) e
espere o Yuri escolher antes de começar a estruturar pastas e escrever
código de verdade.

## Convenções gerais (aplicam-se independente da decisão de arquitetura)

- Repositório próprio, isolado — não referencia nem depende do projeto
  Satélite de forma nenhuma.
- Comitar em git à medida que for avançando, mensagens de commit em
  português, claras.
- Se decidir por app web separado: pode rodar deploy de preview (Vercel,
  Netlify, ou até só local) pra o Yuri ver evoluindo — mas isso é
  secundário, resolve a arquitetura primeiro.
- Projeto pessoal — não precisa da robustez de um produto multi-usuário
  (sem preocupação com múltiplos jogadores/contas a menos que ele peça).
