/* ============================================================
   Barber Premium · VIZIO — dados de demonstração
   Produto VIZIO multi-barbearia (white-label via Camaleão).
   No go-live, este arquivo é substituído/alimentado pelo backend.
   ============================================================ */
const AG_STATUS = ["Pendente","Confirmado","Atrasado","Em atendimento","Concluído","No-show","Cancelado"];

const DADOS = {
  _meta:{ gerado:"2026-07-05", fonte:"VIZIO-briefing-Sistema-de-Gerenciamento-de-Barbearia.md", versao:"0.1.0" },
  _cfg:{
    produto:"Vizio Barber", barbearia:"Barbearia Demonstração",
    tagline:"Gestão premium para barbearias",
    descontoAntecipadoPct:10,      // incentivo por pagamento antecipado (garante o caixa)
    descontoCadastroPct:5,         // "cadastre-se e ganhe 5% no primeiro serviço"
    toleranciaMin:15,              // tolerância de atraso do cliente
    lembreteBarbeiroMin:15,        // notificação ao barbeiro antes do próximo cliente
    recuperacaoDias:35,            // dias sem visita → cliente entra na recuperação
    gateway:"simulado"             // simulado | stripe | pix | mercadopago (plugável)
  },
  _users:[
    {user:"admin",   nome:"Isaac Nogueira", perfil:"admin",    roleLabel:"Administrador"},
    {user:"gerente", nome:"Rafa Souza",     perfil:"gerente",  roleLabel:"Gerente"},
    {user:"barbeiro",nome:"Diego Costa",    perfil:"barbeiro", roleLabel:"Barbeiro", barbeiroId:"B1"},
    {user:"cliente", nome:"Lucas Almeida",  perfil:"cliente",  roleLabel:"Cliente",  clienteId:"C1"}
  ],

  barbeiros:[
    {id:"B1", nome:"Diego Costa",  apelido:"Diego",  comissaoPct:40, desde:"2023-02-01", ativo:true},
    {id:"B2", nome:"Matheus Lima", apelido:"Teteu",  comissaoPct:40, desde:"2023-08-15", ativo:true},
    {id:"B3", nome:"André Rocha",  apelido:"Dedé",   comissaoPct:45, desde:"2024-05-02", ativo:true},
    {id:"B4", nome:"Vitor Nunes",  apelido:"VT",     comissaoPct:35, desde:"2025-11-10", ativo:true}
  ],

  servicos:[
    {id:"S1", nome:"Corte masculino",        preco:45,  tempoMin:40, categoria:"Corte",  ativo:true},
    {id:"S2", nome:"Barba completa",         preco:35,  tempoMin:30, categoria:"Barba",  ativo:true},
    {id:"S3", nome:"Combo corte + barba",    preco:70,  tempoMin:65, categoria:"Combo",  ativo:true},
    {id:"S4", nome:"Sobrancelha (navalha)",  preco:15,  tempoMin:10, categoria:"Detalhe",ativo:true},
    {id:"S5", nome:"Pigmentação de barba",   preco:55,  tempoMin:35, categoria:"Barba",  ativo:true},
    {id:"S6", nome:"Hidratação capilar",     preco:40,  tempoMin:25, categoria:"Tratamento", ativo:true},
    {id:"S7", nome:"Luzes / platinado",      preco:160, tempoMin:120,categoria:"Química",ativo:true},
    {id:"S8", nome:"Pezinho (acabamento)",   preco:15,  tempoMin:10, categoria:"Detalhe",ativo:true}
  ],

  clientes:[
    {id:"C1", nome:"Lucas Almeida",   tel:"71 99911-2233", email:"lucas.a@gmail.com",  nasc:"1995-07-08", cadastro:"2025-03-14", visitas:18, ultimaVisita:"2026-06-27", freqDias:15, descontoPrimeiroUsado:true,  obs:"Prefere degradê navalhado."},
    {id:"C2", nome:"Pedro Santana",   tel:"71 99822-3311", email:"pedro.s@outlook.com",nasc:"1988-01-22", cadastro:"2025-06-02", visitas:12, ultimaVisita:"2026-06-30", freqDias:21, descontoPrimeiroUsado:true,  obs:""},
    {id:"C3", nome:"Marcos Vinícius", tel:"71 99733-4455", email:"marcosv@gmail.com",  nasc:"2000-11-30", cadastro:"2025-09-18", visitas:9,  ultimaVisita:"2026-05-22", freqDias:20, descontoPrimeiroUsado:true,  obs:"Sensível a lâmina 0."},
    {id:"C4", nome:"Felipe Barros",   tel:"71 99644-5566", email:"f.barros@gmail.com", nasc:"1992-04-15", cadastro:"2026-01-10", visitas:6,  ultimaVisita:"2026-06-20", freqDias:25, descontoPrimeiroUsado:true,  obs:""},
    {id:"C5", nome:"Gabriel Teixeira",tel:"71 99555-6677", email:"gab.tx@gmail.com",   nasc:"1998-07-12", cadastro:"2026-02-28", visitas:4,  ultimaVisita:"2026-05-10", freqDias:28, descontoPrimeiroUsado:true,  obs:"Aniversário próximo — enviar mensagem."},
    {id:"C6", nome:"Rodrigo Farias",  tel:"71 99466-7788", email:"rod.farias@gmail.com",nasc:"1985-09-03",cadastro:"2026-04-05", visitas:3,  ultimaVisita:"2026-04-28", freqDias:30, descontoPrimeiroUsado:true,  obs:"Cliente corporativo (traz colegas)."},
    {id:"C7", nome:"Thiago Menezes",  tel:"71 99377-8899", email:"thi.men@gmail.com",  nasc:"1996-12-19", cadastro:"2026-06-15", visitas:1,  ultimaVisita:"2026-06-15", freqDias:null, descontoPrimeiroUsado:true, obs:"Novo — veio pelo Instagram."},
    {id:"C8", nome:"Bruno Cardoso",   tel:"71 99288-9900", email:"bru.card@gmail.com", nasc:"1990-03-25", cadastro:"2026-07-01", visitas:0,  ultimaVisita:null, freqDias:null, descontoPrimeiroUsado:false, obs:"Cadastrou-se pelo app — 5% no 1º serviço disponível."}
  ],

  // pagamento: {forma:"antecipado"|"na hora", status:"pago"|"pendente", valor, descontoPct}
  agenda:[
    {id:"A1", data:"2026-07-05", hora:"09:00", clienteId:"C2", barbeiroId:"B1", servicoId:"S3", statusIdx:4, pagamento:{forma:"antecipado", status:"pago", valor:63.00, descontoPct:10}, gorjeta:10.00, obs:""},
    {id:"A2", data:"2026-07-05", hora:"10:00", clienteId:"C4", barbeiroId:"B2", servicoId:"S1", statusIdx:4, pagamento:{forma:"na hora", status:"pago", valor:45.00, descontoPct:0}, gorjeta:0, obs:""},
    {id:"A3", data:"2026-07-05", hora:"11:00", clienteId:"C1", barbeiroId:"B1", servicoId:"S3", statusIdx:1, pagamento:{forma:"antecipado", status:"pago", valor:63.00, descontoPct:10}, gorjeta:0, obs:"Degradê navalhado."},
    {id:"A4", data:"2026-07-05", hora:"11:30", clienteId:"C7", barbeiroId:"B3", servicoId:"S1", statusIdx:0, pagamento:{forma:"na hora", status:"pendente", valor:45.00, descontoPct:0}, gorjeta:0, obs:""},
    {id:"A5", data:"2026-07-05", hora:"14:00", clienteId:"C6", barbeiroId:"B2", servicoId:"S2", statusIdx:1, pagamento:{forma:"antecipado", status:"pago", valor:31.50, descontoPct:10}, gorjeta:0, obs:""},
    {id:"A6", data:"2026-07-05", hora:"15:00", clienteId:"C8", barbeiroId:"B4", servicoId:"S1", statusIdx:0, pagamento:{forma:"na hora", status:"pendente", valor:42.75, descontoPct:5}, gorjeta:0, obs:"1º serviço — 5% do cadastro aplicado."},
    {id:"A7", data:"2026-07-06", hora:"09:30", clienteId:"C3", barbeiroId:"B3", servicoId:"S5", statusIdx:1, pagamento:{forma:"antecipado", status:"pago", valor:49.50, descontoPct:10}, gorjeta:0, obs:""},
    {id:"A8", data:"2026-07-06", hora:"10:30", clienteId:"C5", barbeiroId:"B1", servicoId:"S7", statusIdx:0, pagamento:{forma:"na hora", status:"pendente", valor:160.00, descontoPct:0}, gorjeta:0, obs:"Confirmar produto em estoque."},
    {id:"A9", data:"2026-07-04", hora:"16:00", clienteId:"C3", barbeiroId:"B2", servicoId:"S1", statusIdx:5, pagamento:{forma:"na hora", status:"pendente", valor:45.00, descontoPct:0}, gorjeta:0, obs:"Não compareceu, sem aviso."}
  ],

  // Estoque interno (insumos de trabalho)
  insumos:[
    {id:"I1", nome:"Lâmina de barbear (cx 100)", custo:38,  estoque:6,  minimo:4,  unidade:"caixa", fornecedor:"BarberSupply"},
    {id:"I2", nome:"Pomada modeladora (uso)",    custo:22,  estoque:9,  minimo:6,  unidade:"un",    fornecedor:"HairPro"},
    {id:"I3", nome:"Shampoo profissional 5L",    custo:65,  estoque:3,  minimo:2,  unidade:"galão", fornecedor:"HairPro"},
    {id:"I4", nome:"Toalha descartável (pct 50)",custo:29,  estoque:2,  minimo:4,  unidade:"pacote",fornecedor:"CleanBarber"},
    {id:"I5", nome:"Pó descolorante 500g",       custo:48,  estoque:4,  minimo:2,  unidade:"un",    fornecedor:"ColorTech"},
    {id:"I6", nome:"Espuma de barbear 400ml",    custo:18,  estoque:11, minimo:6,  unidade:"un",    fornecedor:"BarberSupply"}
  ],

  // SHOP — produtos que a barbearia vende (retirada na unidade)
  produtos:[
    {id:"P1", nome:"Pomada matte 120g",        custo:24, preco:59,  estoque:14, minimo:6, ativo:true},
    {id:"P2", nome:"Óleo de barba premium",    custo:19, preco:49,  estoque:8,  minimo:5, ativo:true},
    {id:"P3", nome:"Shampoo antiqueda 240ml",  custo:27, preco:69,  estoque:5,  minimo:4, ativo:true},
    {id:"P4", nome:"Kit barba (óleo+balm+pente)",custo:52,preco:129, estoque:4,  minimo:3, ativo:true},
    {id:"P5", nome:"Boné Barber Premium",      custo:21, preco:65,  estoque:10, minimo:4, ativo:true},
    {id:"P6", nome:"Minoxidil 60ml",           custo:34, preco:89,  estoque:3,  minimo:4, ativo:true}
  ],

  pedidosShop:[
    {id:"PS1", data:"2026-07-03", clienteId:"C1", itens:[{produtoId:"P1",qtd:1,valor:59},{produtoId:"P2",qtd:1,valor:49}], status:"Retirado",           pagamento:{forma:"no sistema", status:"pago", valor:108.00}},
    {id:"PS2", data:"2026-07-04", clienteId:"C4", itens:[{produtoId:"P4",qtd:1,valor:129}],                                status:"Aguardando retirada", pagamento:{forma:"no sistema", status:"pago", valor:129.00}},
    {id:"PS3", data:"2026-07-05", clienteId:"C2", itens:[{produtoId:"P3",qtd:1,valor:69},{produtoId:"P5",qtd:1,valor:65}], status:"Separando",           pagamento:{forma:"no sistema", status:"pago", valor:134.00}}
  ],

  // Financeiro — lançamentos do período (receitas de serviços/shop + despesas)
  financeiro:[
    {id:"F1",  data:"2026-07-01", tipo:"despesa", categoria:"Aluguel",       desc:"Aluguel da unidade",        valor:2800.00},
    {id:"F2",  data:"2026-07-01", tipo:"despesa", categoria:"Energia",       desc:"Conta de energia",          valor:410.00},
    {id:"F3",  data:"2026-07-02", tipo:"despesa", categoria:"Insumos",       desc:"Reposição BarberSupply",    valor:322.00},
    {id:"F4",  data:"2026-07-02", tipo:"receita", categoria:"Serviços",      desc:"Atendimentos do dia (12)",  valor:610.00},
    {id:"F5",  data:"2026-07-03", tipo:"receita", categoria:"Serviços",      desc:"Atendimentos do dia (15)",  valor:745.00},
    {id:"F6",  data:"2026-07-03", tipo:"receita", categoria:"SHOP",          desc:"Pedido PS1",                valor:108.00},
    {id:"F7",  data:"2026-07-04", tipo:"receita", categoria:"Serviços",      desc:"Atendimentos do dia (14)",  valor:688.00},
    {id:"F8",  data:"2026-07-04", tipo:"receita", categoria:"SHOP",          desc:"Pedido PS2",                valor:129.00},
    {id:"F9",  data:"2026-07-05", tipo:"receita", categoria:"Serviços",      desc:"Atendimentos até 15h",      valor:139.50},
    {id:"F10", data:"2026-07-05", tipo:"receita", categoria:"SHOP",          desc:"Pedido PS3",                valor:134.00},
    {id:"F11", data:"2026-07-05", tipo:"despesa", categoria:"Comissões",     desc:"Comissões semana 27",       valor:820.00},
    {id:"F12", data:"2026-07-04", tipo:"despesa", categoria:"Marketing",     desc:"Impulsionamento Instagram", valor:120.00}
  ],
  // histórico mensal para gráficos e "Saúde do Negócio" (6 meses)
  historicoMensal:[
    {mes:"2026-02", receita:14350, despesa:9870,  atendimentos:318, novosClientes:22, ticket:45.13},
    {mes:"2026-03", receita:15920, despesa:10240, atendimentos:342, novosClientes:26, ticket:46.55},
    {mes:"2026-04", receita:15310, despesa:10480, atendimentos:329, novosClientes:19, ticket:46.53},
    {mes:"2026-05", receita:17240, despesa:10890, atendimentos:361, novosClientes:31, ticket:47.76},
    {mes:"2026-06", receita:18615, despesa:11130, atendimentos:378, novosClientes:28, ticket:49.25},
    {mes:"2026-07", receita:2553.5,despesa:4472,  atendimentos:47,  novosClientes:6,  ticket:54.33}
  ],

  feedbacks:[
    {id:"FB1", data:"2026-06-27", clienteId:"C1", barbeiroId:"B1", nota:5, comentario:"Melhor degradê da cidade."},
    {id:"FB2", data:"2026-06-30", clienteId:"C2", barbeiroId:"B1", nota:5, comentario:"Pontual e caprichoso."},
    {id:"FB3", data:"2026-06-20", clienteId:"C4", barbeiroId:"B2", nota:4, comentario:"Ótimo corte, atrasou 10 min."},
    {id:"FB4", data:"2026-05-22", clienteId:"C3", barbeiroId:"B3", nota:5, comentario:"Pigmentação ficou natural."},
    {id:"FB5", data:"2026-06-15", clienteId:"C7", barbeiroId:"B3", nota:4, comentario:"Ambiente top."},
    {id:"FB6", data:"2026-05-10", clienteId:"C5", barbeiroId:"B4", nota:3, comentario:"Corte bom, mas demorou a começar."}
  ],

  notas:[
    {id:"N1", numero:128, data:"2026-07-03", clienteId:"C1", valor:108.00, tipo:"NFC-e", status:"Emitida", chave:"29260703demo000128"},
    {id:"N2", numero:129, data:"2026-07-04", clienteId:"C4", valor:129.00, tipo:"NFC-e", status:"Emitida", chave:"29260704demo000129"},
    {id:"N3", numero:130, data:"2026-07-05", clienteId:"C2", valor:134.00, tipo:"NFC-e", status:"Pendente", chave:""}
  ]
};
