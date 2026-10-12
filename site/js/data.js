/* Catálogo. Para incluir uma peça nova, copie uma linha, troque a foto em assets/fotos
   e o texto. Nenhum preço aqui de propósito: tudo é "faça seu orçamento". */
window.VS_CONFIG = {
  whatsapp: "5571999065792",           // (71) 99906-5792 — confirmar com a Viviane
  instagram: "vsartepelasmaosres",
  nome: "VS Artes pelas Mãos"
};

window.VS_GRUPOS = {
  cadernetas: "Cadernetas e agendas",
  festa: "Festa e decoração",
  feltro: "Arte em feltro",
  copos: "Copos e garrafas",
  brindes: "Brindes e laser"
};

/* hero: true = já aparece no topo da página, então a galeria não repete. */
window.VS_PRODUTOS = [
  { grupo: "cadernetas", tipo: "caderneta", titulo: "Caderneta de vacinação · Borboletas",
    desc: "Borboletas e florzinhas em rosa, com fecho dourado.", img: "caderneta-vacinacao-borboletas", hero: true,
    alt: "Caderneta de vacinação rosa com borboletas, laços e florzinhas, chaveiro de borboleta e fecho dourado" },
  { grupo: "copos", tipo: "brinde", titulo: "Copo térmico · Nossa Senhora", hero: true,
    desc: "Gravação a laser com o nome e a imagem que você escolher.", img: "copo-nossa-senhora",
    alt: "Copo térmico azul-marinho com alça e gravação a laser de Nossa Senhora e o nome Nathalia" },
  { grupo: "copos", tipo: "brinde", titulo: "Copo térmico · Nome e borboleta",
    desc: "Nome em letra manuscrita com coração e borboleta.", img: "copo-nome-borboleta", hero: true,
    alt: "Copo térmico preto com gravação dourada do nome Vanessa, coração e borboleta" },
  { grupo: "copos", tipo: "brinde", titulo: "Copo térmico · Meus gostos",
    desc: "Ícones do que a pessoa ama, em linha delicada.", img: "copo-icones-favoritos",
    alt: "Copo térmico preto com gravação de ícones: exercício, fone de ouvido, café e taça de vinho" },
  { grupo: "copos", tipo: "brinde", titulo: "Copo térmico · Presente para professora",
    desc: "Frase e nome gravados, sem sair com a lavagem.", img: "copo-professora",
    alt: "Copo térmico preto com gravação Para a melhor professora do mundo e o nome Erica" },
  { grupo: "copos", tipo: "brinde", titulo: "Copo colorido com nome",
    desc: "Cores vivas e o nome gravado.", img: "copo-amarelo-nome",
    alt: "Copo térmico amarelo com tampa transparente e gravação do nome e de uma frase" },
  { grupo: "copos", tipo: "brinde", titulo: "Garrafa térmica · Ícones favoritos",
    desc: "Garrafa rosa com gravação personalizada.", img: "garrafa-rosa-icones",
    alt: "Garrafa térmica rosa com tampa e gravação de ícones e o nome Ray" },
  { grupo: "copos", tipo: "brinde", titulo: "Caneca com arte em adesivo",
    desc: "Arte em adesivo resistente à água, em cores vivas.", img: "caneca-laranja-adesivo", hero: true,
    alt: "Caneca laranja de alumínio com a arte Confra das Bests 2026 e o nome Maiara" },
  { grupo: "festa", tipo: "festa", titulo: "Topo de bolo em MDF · Nome e idade",
    desc: "Argola com o nome e a idade, em MDF, com base de apoio.", img: "topo-bolo-mdf-nome-idade", hero: true,
    alt: "Topo de bolo em MDF em formato de argola com o nome Eliane e 50 anos, sobre uma base" },
  { grupo: "cadernetas", tipo: "caderneta", titulo: "Caderneta de vacinação · Fadinha",
    desc: "Capa dura, nome e tema escolhidos por você.", img: "caderneta-vacinacao-fadinha", hero: true,
    alt: "Caderneta de vacinação com capa de fadinha lilás entre flores, passarinhos e casinha de pássaro" },
  { grupo: "cadernetas", tipo: "caderneta", titulo: "Caderneta de vacinação · Ursinho",
    desc: "Ursinho, balão e nuvens em azul suave.", img: "caderneta-vacinacao-ursinho",
    alt: "Caderneta de vacinação azul com ursinho de gravata borboleta, balão e blocos de letras" },
  { grupo: "cadernetas", tipo: "caderneta", titulo: "Caderneta de saúde · Futebol",
    desc: "Para o pequeno craque, com chaveiro de bola.", img: "caderneta-saude-futebol",
    alt: "Caderneta de saúde azul com silhueta de menino chutando bola e chaveiro de bola de futebol" },
  { grupo: "cadernetas", tipo: "caderneta", titulo: "Caderneta de saúde · Coelhinhos",
    desc: "Sol sorridente, arco-íris e coelhinhos com flores.", img: "caderneta-saude-coelhinhos",
    alt: "Caderneta de saúde amarela com sol sorridente, arco-íris, coelhinhos e flores" },
  { grupo: "cadernetas", tipo: "caderneta", titulo: "Caderneta de saúde · Floresta",
    desc: "Corças, coelhos e abelhas em aquarela suave.", img: "caderneta-saude-floresta",
    alt: "Caderneta de saúde rosa com floresta em aquarela, coelho, corça, ouriço, abelhas e chaveiro de cogumelo" },
  { grupo: "cadernetas", tipo: "caderneta", titulo: "Caderneta de saúde · Nuvens",
    desc: "Lua, estrelas e bichinhos em tons de bege.", img: "caderneta-saude-nuvens",
    alt: "Caderneta de saúde bege com lua, estrelas, ursinho, coelho e ovelhinha entre nuvens e chaveiro de nuvem" },
  { grupo: "cadernetas", tipo: "agenda", titulo: "Capa com a sua ilustração",
    desc: "Um desenho feito a partir da sua foto.", img: "caderneta-azul-ilustrada",
    alt: "Caderno azul com ilustração de mulher de cabelo cacheado, flores douradas e pingente de coração" },
  { grupo: "cadernetas", tipo: "agenda", titulo: "Agenda personalizada 2027",
    desc: "Para profissionais: sua imagem na capa, miolo de horários.", img: "agenda-2027",
    alt: "Agenda 2027 com ilustração de profissional de jaleco verde, espiral cobre e fitas rosa" },
  { grupo: "cadernetas", tipo: "agenda", titulo: "Agenda para eventos e grupos",
    desc: "Capa e miolo do jeito do seu evento.", img: "agenda-conjadb-2026",
    alt: "Duas agendas de evento em azul-marinho e branco com detalhes dourados e espiral" },
  { grupo: "cadernetas", tipo: "agenda", titulo: "Miolo de agenda",
    desc: "Horários, procedimentos e anotações organizados.", img: "agenda-miolo",
    alt: "Miolo de agenda aberto com tabela de horários e colunas coloridas" },
  { grupo: "cadernetas", tipo: "agenda", titulo: "Miolo: Meu querido diário",
    desc: "Páginas ilustradas, com espaço de anotações.", img: "miolo-diario",
    alt: "Diário aberto com cabeçalho rosa e azul, linhas pontilhadas e quadro de anotações" },
  { grupo: "cadernetas", tipo: "agenda", titulo: "Caderno para a sua marca",
    desc: "Capa com a identidade do seu negócio.", img: "caderno-confeitaria-cupcake",
    alt: "Caderno com capa rosa de cupcake com cobertura e logo de confeitaria" },
  { grupo: "festa", tipo: "festa", titulo: "Centro de mesa · Patinhos",
    desc: "Enfeites com haste e base transparente.", img: "festa-patinhos",
    alt: "Três patinhos de papelaria personalizada com laços rosa e balões sobre bases de acrílico" },
  { grupo: "feltro", tipo: "feltro", titulo: "Ganso de feltro",
    desc: "Feito à mão, com laço de tecido floral.", img: "feltro-ganso",
    alt: "Ganso de feltro creme com bico e pés terracota e laço de tecido florido" },
  { grupo: "brindes", tipo: "brinde", titulo: "Bottons personalizados",
    desc: "Conjunto com 4: foto, nome, personagem ou logo.", img: "brindes-bottons",
    alt: "Nove bottons redondos com desenhos de personagens e um com coração rosa" },
  { grupo: "brindes", tipo: "brinde", titulo: "Cartela de bottons",
    desc: "Já embalados na cartela da marca.", img: "brindes-bottons-cartela", hero: true,
    alt: "Cartela branca com quatro bottons de personagens e a logo VS arte pelas mãos" },
  { grupo: "brindes", tipo: "brinde", titulo: "Gravação a laser em madeira",
    desc: "Santinha de MDF gravada, com base de apoio.", img: "laser-madeira-nossa-senhora",
    alt: "Peça de MDF com desenho gravado de Nossa Senhora em pé sobre base redonda" }
];

/* Campos que mudam conforme o tipo de pedido. */
window.VS_PEDIDOS = {
  caderneta: { rotulo: "Caderneta de vacinação ou saúde", campos: [
    { id: "nome_capa", rotulo: "Nome que vai na capa", dica: "Ex.: Helena" },
    { id: "tema", rotulo: "Tema ou personagem", dica: "Ex.: fadinha, futebol, ursinho" },
    { id: "cores", rotulo: "Cores de que você gosta", dica: "Ex.: lilás e rosa" } ] },
  agenda: { rotulo: "Agenda, caderno ou diário", campos: [
    { id: "nome_capa", rotulo: "Nome ou título da capa", dica: "Ex.: Agenda da Dra. Ana" },
    { id: "tema", rotulo: "Tema ou ilustração", dica: "Pode ser uma foto para eu desenhar" },
    { id: "ano", rotulo: "Ano ou período", dica: "Ex.: 2027" } ] },
  festa: { rotulo: "Festa e decoração", campos: [
    { id: "tema", rotulo: "Tema da festa", dica: "Ex.: patinhos, safári, princesa" },
    { id: "nome_festa", rotulo: "Nome e idade de quem faz aniversário", dica: "Ex.: Maria, 3 anos" },
    { id: "data_evento", rotulo: "Data da festa", tipo: "date" },
    { id: "itens", rotulo: "O que você quer", dica: "Topo de bolo, centro de mesa, mini festa…" } ] },
  feltro: { rotulo: "Arte em feltro", campos: [
    { id: "peca", rotulo: "O que você imagina", dica: "Ex.: um ganso, uma boneca, um enfeite" },
    { id: "cores", rotulo: "Cores", dica: "Ex.: creme com laço rosa" } ] },
  brinde: { rotulo: "Brindes e gravação a laser", campos: [
    { id: "item", rotulo: "Qual peça", dica: "Chaveiro, caneta, copo, garrafa, botton, tábua…" },
    { id: "texto", rotulo: "Texto ou arte da gravação", dica: "Nome, frase ou imagem" },
    { id: "qtd", rotulo: "Quantidade", dica: "Ex.: 20", tipo: "number" } ] },
  empresa: { rotulo: "Brindes para empresa", campos: [
    { id: "empresa", rotulo: "Nome da empresa", dica: "Como aparece no brinde" },
    { id: "item", rotulo: "Qual brinde", dica: "Chaveiro abridor, caneta, botton, copo…" },
    { id: "qtd", rotulo: "Quantidade", dica: "Ex.: 100", tipo: "number" },
    { id: "prazo", rotulo: "Precisa até quando?", tipo: "date" },
    { id: "logo", rotulo: "Você tem a logo em arquivo?", dica: "Sim, vou enviar / ainda não" } ] },
  outro: { rotulo: "Outro pedido", campos: [
    { id: "ideia", rotulo: "Conte sua ideia", dica: "Quanto mais detalhes, melhor" } ] }
};
