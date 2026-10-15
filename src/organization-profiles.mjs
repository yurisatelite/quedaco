/** Design da campanha, não uniformes nem regras oficiais do Livro Básico. */
export const ORGANIZATION_PROFILES={
  dips:{
    source:'campaign',
    identity:'Investigação paciente, preservação de provas e responsabilidade por quem atravessa uma Porta. A instituição não sabe tudo: laudos falham, arquivos têm lacunas e testemunhas precisam de proteção.',
    uniform:{
      everyday:'Casaco azul-petróleo de corte reto, forro cinza, camisa clara, calça resistente e botas baixas. Insígnia de latão numerada presa por dentro da lapela; a numeração identifica o agente, não concede autoridade mágica.',
      field:'Casaco encurtado ou capa impermeável sobre roupa de viagem, luvas, bolsa transversal para provas e cintos sem peças soltas. Reforços de couro só para quem tem treinamento; investigadores discretos usam roupas comuns.',
      formal:'Casaco escuro limpo, gola cinza e insígnia exposta durante audiências. Chefias distinguem-se pelo acabamento e pelos documentos que portam, sem depender de cor para reconhecer o cargo.',
      adaptations:'Aberturas e fechos adaptados a asas, caudas, chifres, pétalas e corpos pequenos ou grandes. Nada comprime brânquias ou cobre sentidos necessários. Retornados usam forros macios para evitar ruído entre os ossos.'
    },
    conduct:['Apresentar-se e explicar o motivo da abordagem antes de pedir colaboração.','Separar relatos, hipóteses e fatos comprovados no registro do caso.','Preservar a cena e evitar manusear objetos de origem desconhecida.','Oferecer retirada segura a civis; prender não equivale a condenar.'],
    equipment:[
      {purpose:'Investigação e prova',items:['Lanterna','Caixa para fogo','Mochila'],notes:'Caderno, lacres, etiquetas, envelopes de amostra e giz são pertences narrativos próprios, sem bônus automático.'},
      {purpose:'Defesa pessoal',items:['Adaga','Bastão curto'],notes:'Uma arma adequada ao papel. Armadura leve somente se a ficha tiver a proficiência correspondente.'},
      {purpose:'Custódia e perímetro',items:['Corda de cânhamo (15 m)','Corrente (3 m)','Cadeado'],notes:'Itens físicos normais: não bloqueiam teletransporte nem anulam magia por conta própria.'},
      {purpose:'Perícia arcana',items:['Bolsa para componentes'],notes:'Somente para quem usa esse equipamento. Lentes, mapas de ressonância e fichários são instrumentos narrativos até existir regra nativa.'}
    ],
    finances:'A moeda na ficha é dinheiro pessoal. Requisições, provas e orçamento institucional não viram uma bolsa ilimitada. Equipamento de serviço permanece identificado na descrição do item.',
    ranks:['Escrivão ou auxiliar: níveis 1–2; registra, orienta e pede apoio.','Agente ou perito: níveis 2–5; conduz diligências e tem uma especialidade.','Detetive veterano: níveis 4–6; acompanha casos complexos.','Comissário: níveis 6–8; coordena recursos e responde pelo órgão. Cargo não é uma regra de nível.'],
    hooks:['Uma prova desaparece da cadeia de custódia; a falha pode ser humana antes de ser conspiração.','Uma testemunha teme a própria escolta e pede que os aventureiros verifiquem seu destino.'],
    limits:'Acesso a arquivos depende da função. Informantes não recebem todos os segredos institucionais. A ligação com Lápis não é conhecimento comum da equipe.'
  },
  copa:{
    source:'campaign',
    identity:'Resposta regional, reconhecimento de terreno e retirada de civis. Seus integrantes discordam sobre fechar rotas ou mantê-las abertas com escolta; a instituição precisa negociar apoio e suprimentos.',
    uniform:{
      everyday:'Túnica verde-musgo, lenço ocre, calça de lona e botas de trilha. Identificação costurada no ombro e pequena placa de serviço na mochila; o lenço pode ser retirado em reconhecimento discreto.',
      field:'Capa curta impermeável, camadas que secam rápido, tiras de equipamento presas ao corpo e bainhas protegidas da lama. Patrulheiros levam corda e provisões; socorristas usam faixa clara com identificação legível.',
      formal:'Mesmo uniforme limpo, capa dobrada e placa à vista nas reuniões com governos locais. Não há armadura cerimonial obrigatória.',
      adaptations:'Cortes ajustados ao legado e ao clima, suporte para caudas e asas, alças largas para corpos pesados e proteção que não prejudique respiração ou movimento. O uniforme deve permitir resgate e caminhada prolongada.'
    },
    conduct:['Reconhecer a rota antes de deslocar uma comitiva.','Avisar civis de riscos concretos e indicar um caminho de retirada.','Preferir observação e contenção a perseguir criatura desconhecida sem apoio.','Registrar recursos gastos e entregar feridos e evidências ao responsável adequado.'],
    equipment:[
      {purpose:'Patrulha e reconhecimento',items:['Mochila','Rações (1 dia)','Saco de dormir','Corda de cânhamo (15 m)'],notes:'Número de rações acompanha a missão. Abrigos e reservas maiores pertencem ao posto, não ao inventário de cada pessoa.'},
      {purpose:'Resposta armada',items:['Lança','Arco curto','Flechas (20)','Escudo leve'],notes:'Cada função recebe só o que consegue carregar e usar. Armadura pesada fica com a equipe de contenção treinada.'},
      {purpose:'Socorro',items:['Kit de curandeiro'],notes:'Usos e efeitos são os do Item nativo. Faixas, lista de pacientes e identificação são complementos narrativos.'},
      {purpose:'Acampamento e sinalização',items:['Caixa para fogo','Lanterna','Tenda (para duas pessoas)'],notes:'Material coletivo é atribuído ao responsável e descrito como carga do posto. Apitos e bandeirolas não concedem ações especiais.'}
    ],
    finances:'Dinheiro pessoal separado do fundo de patrulha. Alimentação e material de missão têm responsável e quantidade; nenhum estoque se repõe sozinho.',
    ranks:['Auxiliar de posto: níveis 1–2; cuida de registros, mantimentos e avisos.','Patrulheiro ou socorrista: níveis 2–4; acompanha rotas e atende incidentes.','Especialista de campo: níveis 4–6; lidera uma parte da missão.','Coordenador: níveis 6–8; decide deslocamentos e negocia com autoridades. Faixas são escolhas de campanha.'],
    hooks:['Duas vilas precisam da mesma escolta no mesmo dia; a equipe pede um grupo auxiliar.','Uma criatura evita atacar socorristas, mas destrói os marcos da estrada.'],
    limits:'A COPA não substitui governos vizinhos. Captura, travessia de fronteira e investigação prolongada exigem cooperação local; a DIPS recebe provas planares.'
  }
};
