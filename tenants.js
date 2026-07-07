/* ============================================================
   Vizio Barber · VIZIO — tenants.js
   PRESETS DE DEMONSTRAÇÃO (Camaleão / white-label).
   Vestem o sistema com a MARCA e o CARDÁPIO REAIS de um cliente,
   SEM hardcodar no produto (o padrão continua VIZIO). Ativa por URL:
     barber.viziostudio.com.br/?vini            (sistema com a marca VN Barber)
     barber.viziostudio.com.br/?vini#agendar    (agendamento público da VN Barber)
   Depende de app.js (WORK) e theme.js (applyTheme). Não persiste:
   ao sair do link, volta ao padrão VIZIO.
   ============================================================ */
const TENANTS={
  vini:{
    brand:{ nome:"VN Barber", accent:"#2F6BF0", logo:"vini-symbol.png" },
    cfg:{ barbearia:"VN Barber", tel:"71 98245-1860", horaAbre:"09:00", horaFecha:"20:00" },
    servicos:[
      {id:"S1", nome:"Corte máquina",        preco:25, tempoMin:30, categoria:"Corte",     ativo:true},
      {id:"S2", nome:"Corte navalhado",      preco:30, tempoMin:40, categoria:"Corte",     ativo:true},
      {id:"S3", nome:"Corte tesoura",        preco:35, tempoMin:40, categoria:"Corte",     ativo:true},
      {id:"S4", nome:"Barba",                preco:20, tempoMin:20, categoria:"Barba",     ativo:true},
      {id:"S5", nome:"Pezinho",              preco:13, tempoMin:10, categoria:"Detalhe",   ativo:true},
      {id:"S6", nome:"Sobrancelha (masc/fem)",preco:10,tempoMin:10, categoria:"Detalhe",   ativo:true},
      {id:"S7", nome:"Pigmentação",          preco:15, tempoMin:20, categoria:"Detalhe",   ativo:true},
      {id:"S8", nome:"Corte máq + tesoura",  preco:30, tempoMin:45, categoria:"Combo",     ativo:true},
      {id:"S9", nome:"Corte navalhado + tesoura",preco:35,tempoMin:50,categoria:"Combo",   ativo:true},
      {id:"S10",nome:"Corte máq + barba + sobrancelha",preco:45,tempoMin:55,categoria:"Combo",ativo:true},
      {id:"S11",nome:"Corte navalhado + barba + sobrancelha",preco:50,tempoMin:65,categoria:"Combo",ativo:true},
      {id:"S12",nome:"Corte navalhado + pigmentação + sobrancelha",preco:45,tempoMin:60,categoria:"Combo",ativo:true},
      {id:"S13",nome:"Corte máq + pigmentação + sobrancelha",preco:40,tempoMin:55,categoria:"Combo",ativo:true},
      {id:"S14",nome:"Luzes + corte",        preco:90, tempoMin:120,categoria:"Química",   ativo:true}
    ],
    barbeiros:[
      {id:"B1", nome:"Vinicius", apelido:"Vinicius", tel:"71 98888-0001", comissaoPct:40, desde:"2022-01-10", ativo:true},
      {id:"B2", nome:"Pitter",   apelido:"Pitter",   tel:"71 98888-0002", comissaoPct:40, desde:"2023-03-01", ativo:true},
      {id:"B3", nome:"Tairon",   apelido:"Tairon",   tel:"71 98888-0003", comissaoPct:40, desde:"2024-06-01", ativo:true}
    ]
  }
};
(function(){ try{
  var q=(location.search+' '+location.hash).toLowerCase();
  var key=Object.keys(TENANTS).find(function(k){return q.indexOf(k)>-1;});
  if(!key||typeof WORK==='undefined')return;
  var t=TENANTS[key];
  if(t.servicos)WORK.servicos=JSON.parse(JSON.stringify(t.servicos));
  if(t.barbeiros)WORK.barbeiros=JSON.parse(JSON.stringify(t.barbeiros));
  if(t.cfg)Object.assign(WORK._cfg,t.cfg);
  WORK.agenda=[];            /* agenda limpa: barbearia nova, agenda 100% livre */
  window.__TENANT=key;
  if(typeof applyTheme==='function')applyTheme({nome:t.brand.nome,accent:t.brand.accent,logo:t.brand.logo});
}catch(e){} })();
