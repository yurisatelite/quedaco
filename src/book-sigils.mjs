// Resumos de consulta. Livro Básico DIGITAL 1.25, pp. 244–258.
const rows=[];
function add(equipment,grade,page,entries){for(const [name,slot,charges,fragments,imbued,summary,note] of entries)rows.push({name,category:'Sigilos',equipment,grade,page,slot,charges,fragments,imbued,summary,...(note?{note}:{})});}
const P='Permanente',R='Recarregável',pre='Prefixo',suf='Sufixo';
add('Arma',1,246,[
 ['Atenta (criatura)',pre,3,1,P,'Detecta hostilidade do tipo de criatura escolhido a até 18 m por meio do brilho da arma.'],
 ['Retornável',pre,3,1,P,'Após o arremesso, a arma retorna à mão do portador.'],
 ['da Munição Mágica',suf,3,1,P,'Cria munição mágica e permite recarregar sem gastar ação, até o fim da cena.'],
 ['do Arremesso',suf,3,1,P,'Concede o descritor de arremesso até o fim da cena.']
]);
add('Arma',2,247,[
 ['Buscadora',pre,3,2,P,'Dá vantagem contra um alvo que já foi atacado pelo portador na cena.'],
 ['Conjuradora Ofensiva (superficial)',pre,3,2,R,'Permite conjurar uma magia ofensiva superficial definida no sigilo, pagando os PE, sem aprimoramentos.'],
 ['Elemental (elemento)',pre,2,2,P,'Adiciona 1d6 de dano ácido, elétrico, frio ou de fogo até o fim da cena.'],
 ['Superior',pre,2,2,R,'Dá vantagem no próximo ataque que usar uma manobra de superioridade.'],
 ['+1 (arma)',suf,2,2,P,'Ao jogar iniciativa, pode conceder +1 em ataques e dano com a arma até o fim da cena.'],
 ['da Caça (criatura)',suf,3,2,P,'Acrescenta 2d6 de dano contra o tipo de criatura escolhido.'],
 ['Mergulhadora',suf,3,2,P,'Adiciona 2d6 de dano em ataques subaquáticos e remove sua desvantagem por esse ambiente.']
]);
add('Arma',3,248,[
 ['Celestial',pre,2,3,P,'Acrescenta 2d8 de dano trovejante até o fim da cena.'],
 ['Conjuradora Ofensiva (rasa)',pre,2,3,R,'Permite conjurar a magia ofensiva rasa definida no sigilo, pagando seus PE.'],
 ['Marcadora',pre,2,3,R,'Ao acertar, marca uma proteção do alvo: os ataques contra ela recebem vantagem até o próximo turno.'],
 ['Saltadora',pre,3,3,R,'Ao acertar, permite teleportar até 9 m sem gerar ataques de oportunidade.'],
 ['+2 (arma)',suf,2,3,P,'Ao jogar iniciativa, pode conceder +2 em ataques e dano até o fim da cena.']
]);
add('Arma',3,249,[['Vingadora',suf,2,3,R,'Ao ficar machucado, prepara o próximo ataque para causar 4d6 de dano adicional.'],['da Aniquilação (criatura)',suf,3,3,P,'Acrescenta 3d6 de dano contra o tipo de criatura escolhido.']]);
add('Arma',4,250,[
 ['Conjuradora Ofensiva (profunda)',pre,2,4,R,'Permite conjurar a magia ofensiva profunda definida no sigilo, pagando seus PE.'],
 ['de Explosão de (elemento)',pre,2,4,P,'Adiciona 3d6 do elemento escolhido até o fim da cena.'],
 ['+3 (arma)',suf,2,4,P,'Ao jogar iniciativa, pode conceder +3 em ataques e dano até o fim da cena.'],
 ['da Retaliação Mágica',suf,2,4,R,'Quando um inimigo a até 9 m conjura magia superficial ou superior, prepara 4d10 energéticos adicionais no próximo ataque contra ele.']
]);
add('Armadura',1,251,[['Manipuladora de Sombras',pre,3,1,P,'Após descansar, permite alterar o tamanho da própria sombra até o próximo descanso.'],['Resistente ao Clima',pre,3,1,P,'Concede vantagem em um teste contra efeitos climáticos.'],['do Silêncio',suf,3,1,R,'Concede vantagem para esconder-se e mover-se silenciosamente até o fim da cena.']]);
add('Armadura',2,251,[['Conjuradora Utilitária (superficial)',pre,2,2,R,'Conjura a magia utilitária superficial definida no sigilo, pagando seus PE.'],['do Escalador',pre,2,2,R,'Concede escalada igual ao deslocamento terrestre, ou dobra a escalada existente, até o fim da cena.'],['Negociadora',pre,2,2,P,'Concede vantagem para negociar até o fim da cena.']]);
add('Armadura',2,252,[['Refletora',pre,2,2,R,'Uma magia que erra o portador pode ser refletida para outro alvo a até 9 m, usando os valores originais.'],['Treinadora',pre,2,2,P,'Concede vantagem em testes de resistência física e acrobacia até o fim da cena.']]);
add('Armadura',3,252,[['Conjuradora Utilitária (rasa)',pre,2,3,R,'Conjura a magia utilitária rasa definida no sigilo, pagando seus PE.'],['da Resistência (elemento)',pre,2,3,P,'Concede resistência ao elemento escolhido até o fim da cena.'],['Implacável',pre,2,3,P,'Converte um acerto crítico sofrido em acerto comum.']]);
add('Armadura',3,253,[['+1 (armadura)',suf,2,3,P,'Ao sofrer dano, pode aumentar a redução de dano em 1.'],['Protetora +1',suf,2,3,P,'Ao ser alvo de um ataque, pode conceder +1 às proteções físicas.']]);
add('Armadura',4,253,[['Conjuradora Utilitária (profunda)',pre,2,4,R,'Conjura a magia utilitária profunda definida no sigilo, pagando seus PE.'],['da Invulnerabilidade (elemento)',pre,2,4,P,'Concede imunidade ao elemento escolhido até o fim da cena.'],['+2 (armadura)',suf,2,4,P,'Ao sofrer dano, pode aumentar a redução de dano em 2.','A indicação de ação e o texto de ativação divergem na página; confira a descrição original.']]);
add('Armadura',4,254,[['Protetora +2',suf,2,4,P,'Ao ser alvo de um ataque, pode conceder +2 às proteções físicas.']]);
add('Escudo',1,254,[['Enraizante',pre,3,1,R,'Permite ignorar um movimento forçado sofrido.'],['Iluminador',pre,3,1,R,'Ilumina como uma tocha até o fim da cena; pode ser apagado e reacendido durante o efeito.']]);
add('Escudo',2,254,[['da Comunicação',pre,2,2,P,'Permite entender e falar um idioma ouvido até o fim da cena.'],['de Absorção Elemental',pre,2,2,R,'Após sofrer dano elemental, acrescenta 2d8 do mesmo tipo ao próximo ataque na cena.'],['+1 (escudo)',suf,2,2,P,'Ao sofrer dano, pode aumentar a redução de dano em 1.','Grau a conferir: tabela da p. 245 e seção da p. 254 indicam 2º; o selo da descrição indica 3º.']]);
add('Escudo',3,255,[['da Repulsão',pre,2,3,R,'Reage a uma criatura adjacente: ataque mágico contra FOR empurra 3 m; ampliar 15 adiciona 2d8 energéticos.'],['do Fogo Amigo',pre,2,3,R,'Ao ver um aliado a até 9 m ser atingido, concede resistência ao dano e compartilha esse dano.'],['+2 (escudo)',suf,2,3,P,'Ao sofrer dano, pode aumentar a redução de dano em 2.']]);
add('Escudo',4,256,[['do Portal Portátil',pre,1,4,R,'Cria um portal de 1,5 m a até 18 m, no mesmo plano, com saída ao lado do portador, até o fim da cena.'],['+3 (escudo)',suf,2,4,P,'Ao sofrer dano, pode aumentar a redução de dano em 3.']]);
add('Vestimenta',1,256,[['do Visual Alterado',pre,3,1,R,'Cabeça ou joia: permite pequenas alterações de aparência.'],['Mensageiro',pre,3,1,R,'Cabeça ou mãos: envia mensagem mental de até 25 palavras entre criaturas que se veem.']]);
add('Vestimenta',2,257,[['da Concentração Resoluta',pre,3,2,P,'Cabeça ou torso: concede vantagem para manter concentração.'],['do Salto do Gato',pre,3,2,R,'Pés ou torso: dobra a distância de um salto.'],['da Resistência (elemento)',suf,3,2,R,'Mãos ou torso: concede resistência ao elemento escolhido até o fim do turno.'],['do Corpo Sarado',suf,3,2,P,'Mãos ou pés: concede vantagem em Preparo Físico até o fim da cena.','O ícone de ação e o texto de ativação divergem; confira o original.'],['Magiletal',suf,3,2,P,'Mãos ou joia: acrescenta +2 ao dano mágico até o próximo turno.']]);
add('Vestimenta',3,258,[['Flechaletal',suf,2,3,P,'Mãos ou joia: acrescenta +2 ao dano à distância e de arremesso até o próximo turno.']]);
add('Vestimenta',4,258,[['Combateletal',suf,1,4,P,'Acrescenta +2 ao dano de todos os ataques até o próximo turno.','O ícone de ação e o texto de ativação divergem; confira o original.']]);
export const SIGILS=rows.map((row,index)=>({id:`book-sigil-${index+1}`,...row}));
