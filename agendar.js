/* ============================================================
   Vizio Barber · VIZIO — agendar.js
   AGENDAMENTO ONLINE PÚBLICO (o cliente final agenda sozinho,
   sem login — link para bio/Instagram/WhatsApp da barbearia).
   Melhor que apps genéricos (ex.: TopSalão): fluxo guiado premium,
   preço e duração à vista, HORÁRIOS INTELIGENTES (respeitam a
   duração do serviço + a agenda real do profissional), PAGAMENTO
   ANTECIPADO com desconto (reduz no-show) e CONFIRMAÇÃO por WhatsApp.
   Camaleão-ready. Depende de app.js (WORK, svc/brb/cli, uid, persist,
   PAYGATE, money, dtBR, today, waLink, esc, emblemSVG).
   ============================================================ */
let AGD=null;
const _DOW=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function _hm(s){var p=(s||'0:0').split(':');return (+p[0])*60+(+p[1]||0);}
function _mh(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function _addDaysISO(iso,n){var d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}

function abrirAgendamento(){
  var l=document.getElementById('login'); if(l)l.style.display='none';
  var ap=document.getElementById('app'); if(ap)ap.style.display='none';
  var pt=document.getElementById('portal'); if(pt)pt.style.display='none';
  AGD={step:1,servicoId:null,barbeiroId:null,barbeiroPref:null,data:today(),hora:null,nome:'',tel:'',antecipado:true};
  var a=document.getElementById('agendar'); a.style.display='flex'; renderAgendar();
}
window.abrirAgendamento=abrirAgendamento;
function fecharAgendamento(){location.hash='';location.reload();}
window.fecharAgendamento=fecharAgendamento;
function agdVoltar(){ if(AGD.step<=1){fecharAgendamento();return;} AGD.step--; renderAgendar(); }
window.agdVoltar=agdVoltar;

/* ---------- disponibilidade inteligente ---------- */
function _barberLivre(bid,data,startMin,dur){
  var busy=WORK.agenda.filter(a=>a.barbeiroId===bid&&a.data===data&&a.statusIdx<5);
  for(var i=0;i<busy.length;i++){var a=busy[i];var as=_hm(a.hora);var ad=(svc(a.servicoId).tempoMin||30);
    if(startMin<as+ad&&as<startMin+dur)return false;}
  return true;
}
function _agdSlots(){
  var s=svc(AGD.servicoId),dur=s.tempoMin||30,cfg=WORK._cfg||{};
  var openM=cfg.horaAbre?_hm(cfg.horaAbre):9*60, closeM=cfg.horaFecha?_hm(cfg.horaFecha):20*60, step=30;
  var barbers=AGD.barbeiroPref?[brb(AGD.barbeiroPref)]:WORK.barbeiros.filter(b=>b.ativo);
  var now=new Date(), nowM=(AGD.data===today())?(now.getHours()*60+now.getMinutes()):-1;
  var out=[];
  for(var t=openM;t+dur<=closeM;t+=step){
    if(t<=nowM+5)continue;
    var free=barbers.filter(b=>_barberLivre(b.id,AGD.data,t,dur));
    if(free.length)out.push({min:t,hora:_mh(t),barbeiros:free.map(b=>b.id)});
  }
  return out;
}
function _acharOuCriarCliente(nome,tel){
  var d=(tel||'').replace(/\D/g,'');
  var ex=d&&WORK.clientes.find(c=>((c.tel||'').replace(/\D/g,''))===d);
  if(ex){ if(nome&&ex.nome==='Cliente')ex.nome=nome; return ex; }
  var novo={id:uid('C'),nome:nome||'Cliente',tel:tel,email:'',nasc:'',cadastro:today(),visitas:0,ultimaVisita:null,freqDias:null,descontoPrimeiroUsado:false,obs:'Cadastro via agendamento online'};
  WORK.clientes.push(novo);persist('clientes','create',novo);return novo;
}

/* ---------- render ---------- */
function _agdHead(titulo,sub){
  var cfg=WORK._cfg||{},nome=window.BRAND_NAME||cfg.barbearia||'Vizio Barber';
  var pct=Math.round(((AGD.step-1)/6)*100);
  return '<div class="agd-top">'+
    '<button class="agd-back" onclick="agdVoltar()" aria-label="Voltar">‹</button>'+
    '<div class="agd-brand"><div class="emblem" id="emblemA" style="width:26px"></div><span>'+esc(nome)+'</span></div>'+
    '<button class="agd-back" onclick="fecharAgendamento()" aria-label="Início" style="font-size:15px">⌂</button></div>'+
    '<div class="agd-prog"><i style="width:'+pct+'%"></i></div>'+
    '<div class="agd-h"><h2>'+titulo+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>';
}
function renderAgendar(){
  var body='';
  if(AGD.step===1)body=_agdServico();
  else if(AGD.step===2)body=_agdProfissional();
  else if(AGD.step===3)body=_agdData();
  else if(AGD.step===4)body=_agdHorario();
  else if(AGD.step===5)body=_agdDados();
  else if(AGD.step===6)body=_agdPagamento();
  else if(AGD.step===7){ document.getElementById('agendar').innerHTML='<div class="agd-card">'+_agdConfirmado()+'</div>'; _renderEmblemA(); return; }
  document.getElementById('agendar').innerHTML='<div class="agd-card">'+_agdHead(body.t,body.s)+'<div class="agd-body">'+body.h+'</div></div>';
  _renderEmblemA();
}
function _renderEmblemA(){var e=document.getElementById('emblemA');if(e&&typeof emblemSVG==='function'){e.innerHTML=emblemSVG();if(e.firstElementChild)e.firstElementChild.style.maxWidth='26px';}}

function _agdServico(){
  var cats={}; WORK.servicos.filter(s=>s.ativo).forEach(function(s){(cats[s.categoria||'Serviços']=cats[s.categoria||'Serviços']||[]).push(s);});
  var h=Object.keys(cats).map(function(cat){
    return '<div class="agd-cat">'+esc(cat)+'</div><div class="agd-grid">'+cats[cat].map(function(s){
      return '<button class="agd-opt" onclick="agdPickServico(\''+s.id+'\')">'+
        '<div class="agd-opt-t">'+esc(s.nome)+'</div>'+
        '<div class="agd-opt-m"><b>'+money(s.preco)+'</b><span>· '+s.tempoMin+' min</span></div></button>';
    }).join('')+'</div>';
  }).join('');
  return {t:'Escolha o serviço',s:'Preço e duração à vista. Toque para selecionar.',h:h};
}
function agdPickServico(id){AGD.servicoId=id;AGD.step=2;renderAgendar();}
window.agdPickServico=agdPickServico;

function _agdProfissional(){
  var s=svc(AGD.servicoId);
  var opts='<button class="agd-opt agd-prof" onclick="agdPickProf(\'\')">'+
    '<div class="agd-av" style="background:linear-gradient(135deg,var(--gold-2),var(--gold-4))">★</div>'+
    '<div><div class="agd-opt-t">Sem preferência</div><div class="agd-opt-s">Primeiro profissional disponível</div></div></button>';
  opts+=WORK.barbeiros.filter(b=>b.ativo).map(function(b){
    var ini=(b.apelido||b.nome).trim().slice(0,2).toUpperCase();
    return '<button class="agd-opt agd-prof" onclick="agdPickProf(\''+b.id+'\')">'+
      '<div class="agd-av">'+esc(ini)+'</div>'+
      '<div><div class="agd-opt-t">'+esc(b.apelido||b.nome)+'</div><div class="agd-opt-s">Barbeiro</div></div></button>';
  }).join('');
  return {t:'Escolha o profissional',s:esc(s.nome)+' · '+money(s.preco),h:'<div class="agd-list">'+opts+'</div>'};
}
function agdPickProf(id){AGD.barbeiroPref=id||null;AGD.step=3;renderAgendar();}
window.agdPickProf=agdPickProf;

function _agdData(){
  var days='';
  for(var i=0;i<14;i++){var iso=_addDaysISO(today(),i);var d=new Date(iso+'T12:00:00');
    var lbl=i===0?'Hoje':(i===1?'Amanhã':_DOW[d.getDay()]);
    days+='<button class="agd-day'+(iso===AGD.data?' on':'')+'" onclick="agdPickData(\''+iso+'\')">'+
      '<span class="agd-day-w">'+lbl+'</span><span class="agd-day-n">'+d.getDate()+'</span><span class="agd-day-m">'+(d.getMonth()+1)+'</span></button>';}
  return {t:'Escolha o dia',s:'Próximos 14 dias.',h:'<div class="agd-days">'+days+'</div>'+
    '<div style="text-align:center;margin-top:18px"><button class="b" onclick="AGD.step=4;renderAgendar()">Ver horários →</button></div>'};
}
function agdPickData(iso){AGD.data=iso;AGD.step=4;renderAgendar();}
window.agdPickData=agdPickData;

function _agdHorario(){
  var slots=_agdSlots();
  var groups={'Manhã':[],'Tarde':[],'Noite':[]};
  slots.forEach(function(sl){var g=sl.min<12*60?'Manhã':(sl.min<18*60?'Tarde':'Noite');groups[g].push(sl);});
  var h=Object.keys(groups).map(function(g){ if(!groups[g].length)return '';
    return '<div class="agd-cat">'+g+'</div><div class="agd-slots">'+groups[g].map(function(sl){
      return '<button class="slotchip" onclick="agdPickHora(\''+sl.hora+'\',\''+sl.barbeiros[0]+'\')">'+sl.hora+'</button>';
    }).join('')+'</div>';
  }).join('');
  if(!slots.length)h='<div class="agd-empty">Sem horários livres neste dia. <button class="b b-ghost b-sm" onclick="AGD.step=3;renderAgendar()">Trocar o dia</button></div>';
  var s=svc(AGD.servicoId),prof=AGD.barbeiroPref?(brb(AGD.barbeiroPref).apelido||brb(AGD.barbeiroPref).nome):'Sem preferência';
  return {t:'Escolha o horário',s:esc(s.nome)+' · '+dtBR(AGD.data)+' · '+esc(prof),h:h};
}
function agdPickHora(hora,bid){AGD.hora=hora;if(!AGD.barbeiroPref)AGD.barbeiroId=bid;else AGD.barbeiroId=AGD.barbeiroPref;AGD.step=5;renderAgendar();}
window.agdPickHora=agdPickHora;

function _agdDados(){
  return {t:'Seus dados',s:'Para confirmar e enviar o lembrete.',h:
    '<label>Nome</label><input id="agd_nome" value="'+esc(AGD.nome)+'" placeholder="Seu nome">'+
    '<label>WhatsApp</label><input id="agd_tel" value="'+esc(AGD.tel)+'" placeholder="(71) 9 9999-9999" inputmode="tel">'+
    '<div style="text-align:center;margin-top:20px"><button class="b" onclick="agdSalvarDados()">Continuar →</button></div>'};
}
function agdSalvarDados(){
  AGD.nome=(document.getElementById('agd_nome').value||'').trim();
  AGD.tel=(document.getElementById('agd_tel').value||'').trim();
  if(!AGD.nome){toast('Informe seu nome');return;}
  if((AGD.tel||'').replace(/\D/g,'').length<10){toast('Informe um WhatsApp válido');return;}
  AGD.step=6;renderAgendar();
}
window.agdSalvarDados=agdSalvarDados;

function _agdPagamento(){
  var s=svc(AGD.servicoId),cfg=WORK._cfg||{},pAnt=cfg.descontoAntecipadoPct||10;
  var valAnt=+(s.preco*(1-pAnt/100)).toFixed(2);
  return {t:'Pagamento',s:'Garanta seu horário agora ou pague na unidade.',h:
    '<div class="agd-list">'+
     '<button class="agd-opt agd-pay'+(AGD.antecipado?' on':'')+'" onclick="AGD.antecipado=true;renderAgendar()">'+
       '<div><div class="agd-opt-t">Pagar antecipado <span class="badge b-ok" style="margin-left:6px">'+pAnt+'% OFF</span></div>'+
       '<div class="agd-opt-s">Garante o horário e reduz falta · '+money(valAnt)+'</div></div>'+
       '<div class="agd-radio">'+(AGD.antecipado?'●':'○')+'</div></button>'+
     '<button class="agd-opt agd-pay'+(!AGD.antecipado?' on':'')+'" onclick="AGD.antecipado=false;renderAgendar()">'+
       '<div><div class="agd-opt-t">Pagar na hora</div>'+
       '<div class="agd-opt-s">Sem desconto · '+money(s.preco)+'</div></div>'+
       '<div class="agd-radio">'+(!AGD.antecipado?'●':'○')+'</div></button>'+
    '</div>'+
    '<div style="text-align:center;margin-top:20px"><button class="b" onclick="agdConfirmar()">'+(AGD.antecipado?'Pagar e confirmar':'Confirmar agendamento')+'</button></div>'};
}
window.agdConfirmar=function(){
  var s=svc(AGD.servicoId),cfg=WORK._cfg||{};
  var c=_acharOuCriarCliente(AGD.nome,AGD.tel);
  var desc=AGD.antecipado?(cfg.descontoAntecipadoPct||10):0;
  if(!c.descontoPrimeiroUsado)desc=Math.max(desc,cfg.descontoCadastroPct||5);
  var valor=+(s.preco*(1-desc/100)).toFixed(2);
  var novo={id:uid('A'),data:AGD.data,hora:AGD.hora,clienteId:c.id,barbeiroId:AGD.barbeiroId,servicoId:AGD.servicoId,statusIdx:AGD.antecipado?1:0,
    pagamento:{forma:AGD.antecipado?'antecipado':'na hora',status:'pendente',valor:valor,descontoPct:desc},gorjeta:0,obs:'Agendamento online'};
  AGD._valor=valor;AGD._clienteId=c.id;AGD._desc=desc;
  var fin=function(){WORK.agenda.push(novo);persist('agenda','create',novo);AGD.step=7;renderAgendar();};
  if(AGD.antecipado&&typeof PAYGATE!=='undefined'){PAYGATE.charge({desc:'Agendamento: '+s.nome,valor:valor,clienteId:c.id}).then(function(){novo.pagamento.status='pago';fin();});}
  else fin();
};

function _agdConfirmado(){
  var s=svc(AGD.servicoId),b=brb(AGD.barbeiroId),cfg=WORK._cfg||{},nome=window.BRAND_NAME||cfg.barbearia||'Vizio Barber';
  var msg='Olá! Acabei de agendar online na '+nome+': '+s.nome+' com '+(b.apelido||b.nome)+' em '+dtBR(AGD.data)+' às '+AGD.hora+'. '+(AGD.antecipado?'Paguei antecipado. ':'')+'Qualquer coisa, aviso por aqui! 💈';
  var wa=(typeof waLink==='function'&&cfg.tel)?waLink(cfg.tel,msg):'';
  return '<div class="agd-ok">'+
    '<div class="agd-check">✓</div>'+
    '<h2>Agendamento confirmado!</h2>'+
    '<p>Enviamos os detalhes e o lembrete chega antes do horário.</p>'+
    '<div class="agd-resumo">'+
      '<div><span>Serviço</span><b>'+esc(s.nome)+'</b></div>'+
      '<div><span>Profissional</span><b>'+esc(b.apelido||b.nome)+'</b></div>'+
      '<div><span>Data</span><b>'+dtBR(AGD.data)+' · '+AGD.hora+'</b></div>'+
      '<div><span>Valor</span><b>'+money(AGD._valor)+(AGD._desc?' <span class="badge b-ok">-'+AGD._desc+'%</span>':'')+'</b></div>'+
      '<div><span>Pagamento</span><b>'+(AGD.antecipado?'Antecipado (pago)':'Na unidade')+'</b></div>'+
    '</div>'+
    '<div class="agd-acts">'+
      (wa?'<a class="b b-wa" href="'+wa+'" target="_blank" rel="noopener">'+(typeof WA_ICON!=='undefined'?WA_ICON:'')+'Confirmar no WhatsApp →</a>':'')+
      '<a class="b b-ghost b-sm" href="'+_agdGCal(s,b)+'" target="_blank" rel="noopener">Adicionar à agenda</a>'+
    '</div>'+
    '<div style="text-align:center;margin-top:16px"><button class="b b-ghost b-sm" onclick="abrirAgendamento()">Novo agendamento</button></div>'+
  '</div>';
}
function _agdGCal(s,b){
  var cfg=WORK._cfg||{},dur=s.tempoMin||30;
  var st=AGD.data.replace(/-/g,'')+'T'+AGD.hora.replace(':','')+'00';
  var em=_hm(AGD.hora)+dur;var en=AGD.data.replace(/-/g,'')+'T'+_mh(em).replace(':','')+'00';
  var txt=encodeURIComponent(s.nome+' — '+(window.BRAND_NAME||cfg.barbearia||'Vizio Barber'));
  var det=encodeURIComponent('Profissional: '+(b.apelido||b.nome));
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+txt+'&dates='+st+'/'+en+'&details='+det;
}

/* deep-link público: barber.viziostudio.com.br/#agendar */
(function(){ try{ if((location.hash||'').toLowerCase().indexOf('agendar')>-1){ setTimeout(abrirAgendamento,60); } }catch(e){} })();
