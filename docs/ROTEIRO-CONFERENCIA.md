# Roteiro de conferência no Foundry

> **Faça este roteiro somente em um mundo de teste, criado como cópia do mundo
> oficial. Nunca execute estes testes no mundo oficial.** As compras, vendas,
> permissões, guildas e ligações abaixo alteram documentos do mundo.

Tempo previsto: **15 a 20 minutos**, depois que os dados de teste estiverem preparados.

## Antes de começar

Abra o mundo de teste em duas sessões ao mesmo tempo:

- uma como **Mestra (GM)**;
- outra, de preferência numa janela anônima, como **jogador** com um personagem
  atribuído ao usuário.

Na barra de controles à esquerda da cena, abra os controles de Token e clique no botão
de dragão **QUEDAÇO**. Na sessão da Mestra aparecem as abas **NPCs**, **Guildas**,
**Mapa**, **Monstros**, **Itens**, **Imbuir**, **Quests** e **Criação de Personagens**.
O jogador só deve receber as abas liberadas pela Mestra.

Antes de iniciar o cronômetro, confirme que a cópia possui:

- um mercador com estoque e uma localidade atribuída;
- um NPC acessível que **não** seja mercador;
- um item com preço na ficha do personagem do jogador;
- uma guilda comum que possa ser guardada e a guilda da mesa;
- duas cenas descartáveis, com um token do jogador na cena de origem;
- **Stairways 0.11.1** instalado e ativo.

Nos botões de liberação, `Liberar…` significa desligado e `✓ … visível/liberado`
significa ligado. Não clique num botão que já está no estado necessário, pois ele
funciona como liga/desliga.

## 1. Região sem vazamento de conteúdo — T9 (2 minutos)

1. Na sessão da Mestra, abra **Mapa** → **Mapa de Opath**.
2. Se o botão disser **Liberar a aba Mapa aos jogadores**, clique nele. Se disser
   **✓ Aba Mapa visível aos jogadores**, deixe como está.
3. Escolha uma região de teste. No índice ao lado do mapa, deixe desligados os olhos de
   todas as cidades e localidades dessa região. Se o visor de Opath não estiver
   configurado, faça o mesmo nos cartões de **Cidades e locais**, deixando seus botões
   em **Liberar**.
4. Libere somente a região pelo ícone de olho ao lado do nome dela. No modo sem visor,
   use **Liberar** no cartão da região.
5. Na sessão do jogador, abra **Mapa** e entre na região pelo pino, nome ou botão
   **Explorar região**.

**Deve acontecer:** o jogador vê o nome, a imagem ou o resumo da região e a mensagem de
que cidades, locais e pessoas aparecem quando forem liberados. Não aparecem nomes ou
contagem de localidades, NPCs, guildas nem botões de cenas.

**É defeito se:** qualquer cidade ou localidade for revelada junto com a região;
aparecer NPC, loja, guilda, **Mapas desta região**, **Abrir cena vinculada** ou qualquer
cena não liberada; a região não aparecer apesar de a aba e a região estarem liberadas.

## 2. NPC conhecido fora de alcance — T10 (2 minutos)

1. Na sessão da Mestra, abra **NPCs**. Ligue **Liberar a aba NPCs aos jogadores**
   somente se ainda estiver desligado.
2. Abra **Liberar NPCs por localidade** e clique numa localidade que tenha pelo menos um
   NPC. O botão da localidade deve ficar destacado.
3. Na sessão do jogador, abra **NPCs**, clique em **Ver quem você conhece** na região
   correspondente e confirme que o NPC está acessível.
4. Volte à sessão da Mestra e clique novamente na mesma localidade para fechá-la.
5. Observe o mesmo NPC na sessão do jogador.

**Deve acontecer:** depois do fechamento, o NPC continua listado, em cinza, com a marca
**Conhecido · fora de alcance**. O cartão não mostra loja, **Vender pra ele**, seletor
**o que essa pessoa é?**, **Marcar**, anotações nem qualquer botão de interação. Ao
reabrir a localidade, o cartão volta ao estado normal sem nova configuração.

**É defeito se:** o NPC desaparecer; continuar colorido ou interativo; permitir comprar,
vender, marcar papel ou usar a forja fora de alcance; for necessário liberar o NPC
individualmente para ele voltar ao normal.

## 3. Guildas e regulador de miniaturas (2 minutos)

1. Na sessão da Mestra, abra **Guildas**.
2. Confirme as abas **Em jogo · N** e **Guardadas · N**.
3. Em **Em jogo**, escolha uma guilda comum e clique **📦 Guardar**. Abra **Guardadas**
   e confirme que ela foi movida para lá.
4. No cartão guardado, clique **↩ Pôr em jogo** e confirme que ele voltou à primeira aba.
5. Localize a guilda da mesa, como a P.I.P.I., e examine suas ações.
6. Arraste o controle **Miniaturas** para os dois extremos e depois deixe-o num tamanho
   confortável.

**Deve acontecer:** cada aba mostra somente as guildas daquele estado; guardar e pôr em
jogo preserva ficha e membros. A guilda da mesa exibe **★ da mesa** e não oferece
**Guardar**. O regulador altera imediatamente a largura dos cartões e a quantidade que
cabe por linha também na aba Guildas.

**É defeito se:** uma guilda aparecer nas duas abas ou sumir das duas; **Pôr em jogo**
não funcionar; a guilda da mesa oferecer **Guardar**; o regulador mexer no controle, mas
não no tamanho dos cartões, ou funcionar em outras abas e não em Guildas.

## 4. Carrinho e venda para qualquer NPC (4 minutos)

### Compra com carrinho

1. Na sessão do jogador, reabra pela sessão da Mestra a localidade usada no teste
   anterior e entre em **NPCs** → **Ver quem você conhece**.
2. No cartão do mercador, escolha a quantidade de um item e clique **Adicionar**.
3. Confira o bloco **Carrinho**, a linha com item × quantidade, o **Total** e o valor da
   **bolsa**.
4. Com dinheiro suficiente, clique **Fechar compra**. Confira a notificação, a bolsa, o
   inventário do personagem e o estoque do mercador.
5. Para a recusa, deixe a bolsa do personagem abaixo do total e adicione outro item.

**Deve acontecer:** o total corresponde às linhas do carrinho e às condições mostradas
na visita. Uma compra válida desconta a moeda, entrega os itens e reduz estoque finito.
Sem dinheiro suficiente aparece **Falta moeda para fechar este carrinho** e **Fechar
compra** fica desativado; nenhuma moeda, item ou estoque muda.

**É defeito se:** o total não acompanhar a quantidade; uma compra válida entregar
parcialmente; a compra insuficiente ficar habilitada, gerar saldo negativo, entregar
item, consumir estoque ou limpar o carrinho como se tivesse dado certo.

### Venda para NPC que não é mercador

1. Ainda como jogador, abra o cartão de um NPC acessível cujo papel não seja Mercador.
2. Clique **Vender pra ele**.
3. Anote a bolsa e a quantidade de um item com preço de tabela, escolha a quantidade e
   clique **Vender**.

**Deve acontecer:** o NPC não precisa exibir uma loja. A venda reduz ou remove o item da
ficha, aumenta a bolsa pelo valor apresentado e mostra uma notificação. **Vender pra
ele** muda para **Fechar venda** enquanto a lista está aberta.

**É defeito se:** o botão não aparecer num NPC acessível por ele não ser mercador;
surgir erro dizendo que o NPC não é mercador; moeda e item forem alterados só pela
metade; um NPC apenas conhecido e fora de alcance permitir a venda.

## 5. Atlas e teletransporte pelos dois mecanismos (7 a 9 minutos)

1. Na sessão da Mestra, abra **Mapa** → **Atlas de cenas**.
2. Em **Construções automáticas**, ligue **Stairways** e **Regiões nativas**. O
   Stairways deve mostrar a versão 0.11.1 e as Regiões, Foundry 13. Se aparecer
   **indisponível agora**, corrija a instalação antes de continuar.
3. Em **Nova ligação jogável**, escolha as duas cenas descartáveis em **Origem** e
   **Destino**, dê um nome identificável, mantenha **Ida e volta** marcado e clique
   **Adicionar ligação**.
4. Antes de posicionar, arraste a janela do QUEDAÇO para um lado, deixando uma área do
   mapa visível. **Não feche nem minimize a janela.**
5. No cartão da ligação, clique **⌖ Entrada · nome da origem**. Aguarde a cena abrir e
   então clique, fora da janela do QUEDAÇO, no ponto exato da passagem. O botão deve
   mudar para **✓ Entrada**.
6. Repita em **⌖ Saída · nome do destino**. Confira se os dois pontos marcados
   correspondem visualmente aos lugares clicados.
7. Clique **Construir opções ligadas**.

**Deve acontecer nesta preparação:** a janela permanece aberta durante os dois cliques;
cada clique é aceito uma única vez; o cartão mostra as duas pontas com `✓`; o botão de
construir é habilitado. Com os dois construtores ligados, aparecem construções para
**Stairways** e **Regiões**, prontas para escolher, sem duplicatas. Somente um mecanismo
pode ficar ativo durante o jogo.

**É defeito se:** for preciso fechar ou minimizar o QUEDAÇO para o mapa aceitar o
clique; o clique for ignorado ou expirar; o ponto nascer longe do lugar clicado; a cena
errada abrir; construir criar duplicatas; apenas um dos dois mecanismos ser preparado;
ambos ficarem ativos ao mesmo tempo.

### Testar Stairways

1. No cartão da ligação, clique **Usar Stairways**.
2. Na sessão do jogador, abra a cena de origem, selecione o token e dê **um clique
   esquerdo** no ícone da passagem Stairways.
3. Na cena de destino, use a passagem correspondente para voltar.

**Deve acontecer:** o cartão marca Stairways como ativo e Regiões como inativo. O token
selecionado chega ao ponto correspondente da outra cena e consegue voltar. Não fica uma
cópia do token na origem.

**É defeito se:** o clique não transportar; transportar para a cena ou posição errada;
exigir recriar manualmente o par; deixar token duplicado; a Região nativa também disparar
e causar segundo salto ou ciclo.

### Trocar para Regiões nativas

1. Na sessão da Mestra, clique **Usar Regiões** na mesma ligação, sem reconstruí-la.
2. Na sessão do jogador, deixe o token pelo menos um quadrado afastado do ponto e
   arraste-o para dentro da passagem marcada.
3. Faça o mesmo na cena de destino para voltar.

**Deve acontecer:** Regiões passa a ativo e Stairways a inativo. Entrar no ponto
teletransporta o token nos dois sentidos. A troca aproveita a mesma ligação conceitual e
não exige apagar ou refazer cenas, pontos ou o par Stairways.

**É defeito se:** trocar o mecanismo apagar a outra construção; Stairways continuar
acionável; entrar na Região não transportar; houver dois saltos, ciclo, duplicação de
token ou chegada no ponto errado.

## Resultado da conferência

Registre uma linha por bloco antes de encerrar:

| Bloco | Resultado | Observação |
|---|---|---|
| T9 — região sem vazamento | passou / falhou | |
| T10 — conhecido fora de alcance | passou / falhou | |
| Guildas e miniaturas | passou / falhou | |
| Carrinho | passou / falhou | |
| Venda para não mercador | passou / falhou | |
| Atlas — posicionamento | passou / falhou | |
| Atlas — Stairways | passou / falhou | |
| Atlas — Regiões nativas | passou / falhou | |

Em caso de falha, anote: usuário (Mestra ou jogador), cena e NPC ou guilda usados,
botão clicado, o que apareceu, o que deveria aparecer e a primeira mensagem vermelha do
console (`F12`). Uma captura da tela antes de recarregar ajuda a separar defeito do
QUEDAÇO, do Stairways e do próprio Foundry.
