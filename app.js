/* ============================================================
   Vizio Barber (ex-Barber Premium) — app.js (núcleo)
   Depende de dados.js (DADOS, AG_STATUS). Estado em memória
   (cópia de sessão). No go-live, persistência via backend.
   ============================================================ */
/* ===== emblema (logo viva) — símbolo VIZIO BARBER v3 =====
   Vetorial, afiado e reativo ao tema (platina no escuro · grafite quase-preto no claro).
   White-label preservado: se houver marca de cliente (Camaleão), usa a logo dela. */
function emblemSVG(){
  var L=(window.BRAND_LOGO||'vizio-symbol.png');
  if(window.__brandCustom){
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="max-width:110px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image x="1" y="1" width="98" height="98" href="'+L+'" xlink:href="'+L+'"/></svg>';
  }
  var light=document.documentElement.classList.contains('theme-light');
  var m1=light?'#232B3A':'#F4F8FF', m2=light?'#0A0D14':'#B9CADF', ac=light?'#123FA6':'#5AA0FF';
  var u=(emblemSVG._n=(emblemSVG._n||0)+1);
  return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="max-width:110px" xmlns="http://www.w3.org/2000/svg">'
   +'<defs><linearGradient id="mt'+u+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+m1+'"/><stop offset="1" stop-color="'+m2+'"/></linearGradient></defs>'
   +'<circle cx="50" cy="50" r="47" fill="none" stroke="'+ac+'" stroke-opacity=".30" stroke-width="1.3"/>'
   +'<circle cx="50" cy="50" r="43.5" fill="none" stroke="'+ac+'" stroke-opacity=".15" stroke-width="1"/>'
   +'<g transform="rotate(-3 50 71)"><path d="M28 69 L60 67.5 L62 71 L60 74.5 L30 73 Z" fill="url(#mt'+u+')"/>'
     +'<rect x="60" y="67.5" width="14" height="6.6" rx="3.3" fill="none" stroke="url(#mt'+u+')" stroke-width="2.6"/>'
     +'<circle cx="61.5" cy="71" r="1.5" fill="'+ac+'"/></g>'
   +'<g fill="none" stroke="url(#mt'+u+')" stroke-width="3.2" stroke-linecap="round">'
     +'<path d="M50 53 L59.5 74"/><path d="M50 53 L40.5 74"/>'
     +'<circle cx="59.5" cy="80" r="5.4"/><circle cx="40.5" cy="80" r="5.4"/></g>'
   +'<g fill="url(#mt'+u+')">'
     +'<path d="M63.5 15.0 L45.1 51.3 L50.0 53.0 L54.9 54.7 Z"/>'
     +'<path d="M36.5 15.0 L45.1 54.7 L50.0 53.0 L54.9 51.3 Z"/></g>'
   +'<g stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1" fill="none" stroke-linecap="round">'
     +'<path d="M63.5 15 L51 52"/><path d="M36.5 15 L49 52"/></g>'
   +'<circle cx="50" cy="53" r="3.4" fill="'+m2+'" stroke="'+ac+'" stroke-width="1.4"/>'
   +'<rect x="47.5" y="88.5" width="5" height="5" transform="rotate(45 50 91)" fill="'+ac+'"/>'
   +'</svg>';
}

/* ===== estado ===== */
let WORK = JSON.parse(JSON.stringify(DADOS));
let CUR = "home";
let SESSION = null; // {user,nome,perfil,clienteId?,barbeiroId?}
const money = v => "R$ "+(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const byId = (arr,id)=>arr.find(x=>x.id===id)||{};
const cli = id=>byId(WORK.clientes,id);
const brb = id=>byId(WORK.barbeiros,id);
const svc = id=>byId(WORK.servicos,id);
const prd = id=>byId(WORK.produtos,id);
const uid = p => p+"_"+Math.random().toString(36).slice(2,8);
function today(){return new Date().toISOString().slice(0,10);}
function nowHM(){var d=new Date();return String(d.getHours()).padStart(2,'0')+":"+String(d.getMinutes()).padStart(2,'0');}
function esc(s){return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}
function dtBR(iso){return iso?iso.split("-").reverse().join("/"):"—";}
function minsUntil(data,hora){ if(!data||!hora)return 1e9;
  var t=new Date(data+"T"+hora+":00").getTime(); return Math.round((t-Date.now())/60000); }
function agValor(a){ return (a.pagamento&&a.pagamento.valor)||svc(a.servicoId).preco||0; }
function agStatusBadge(i){
  var cls=["b-warn","b-info","b-bad","b-info","b-ok","b-bad","b-dim"][i]||"b-dim";
  return '<span class="badge '+cls+'">'+AG_STATUS[i]+'</span>';
}
function diasSem(c){ if(!c.ultimaVisita)return null;
  return Math.floor((Date.now()-new Date(c.ultimaVisita+"T12:00:00").getTime())/86400000); }
function emRecuperacao(c){ var d=diasSem(c); return d!=null && d>=WORK._cfg.recuperacaoDias; }
function aniversarioHoje(c){ if(!c.nasc)return false; var t=today(); return c.nasc.slice(5)===t.slice(5); }
function aniversarioMes(c){ if(!c.nasc)return false; return c.nasc.slice(5,7)===today().slice(5,7); }

/* ===== login / sessão ===== */
function entrar(e){e.preventDefault();
  var u=(document.getElementById('user').value||'').trim().toLowerCase();
  var found=(WORK._users||[]).find(x=>x.user===u);
  if(!found){ toast('Usuário não encontrado. Perfis demo: admin, gerente, barbeiro, cliente'); return; }
  SESSION=JSON.parse(JSON.stringify(found));
  document.getElementById('login').style.display='none';
  if(SESSION.perfil==='cliente'){ abrirPortalCliente(SESSION.clienteId); return; }
  document.getElementById('app').style.display='block';
  var es=document.getElementById('emblemSide'); es.innerHTML=emblemSVG();
  if(es.firstElementChild)es.firstElementChild.style.maxWidth='44px';
  var av=document.getElementById('avatar'); if(av)av.textContent=(SESSION.nome||'BP').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  go('home');
}
function sair(){location.hash='';location.reload();}
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>{
  if(a.dataset.m){document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));a.classList.add('active');
    go(a.dataset.m);document.getElementById('side').classList.remove('open');}
}));
const TITLES={home:"Início",agenda:"Agenda",clientes:"Clientes",servicos:"Gerenciador de Serviços",
  barbeiros:"Barbeiros & Produtividade",estoque:"Estoque",shop:"SHOP",financeiro:"Financeiro",
  nfe:"Nota Fiscal",dash:"Dashboard Executivo",alavancagem:"Alavancagem",relatorios:"Relatórios"};
function go(m){CUR=m;var q=document.getElementById('q');if(q)q.value='';
  document.getElementById('pageTitle').textContent=TITLES[m]||"";
  if(window.rbacCan&&!rbacCan(m==='dash'?'dashboard':m,false)&&m!=='home'){
    document.getElementById('view').innerHTML='<div class="panel"><h3>🔒 Sem acesso</h3><div style="color:var(--muted);font-size:13px">Seu perfil não tem acesso a este módulo. Fale com o administrador.</div></div>'; return; }
  ({home:renderHome,agenda:renderAgenda,clientes:renderClientes,servicos:renderServicos,
    barbeiros:renderBarbeiros,estoque:renderEstoque,shop:renderShop,financeiro:renderFinanceiro,
    nfe:renderNFe,dash:renderDash,alavancagem:renderAlavancagem,relatorios:renderRelatorios}[m]||renderHome)();
}
function onSearch(){const q=document.getElementById('q').value;
  if(CUR==='clientes')renderClientes(q);
  else if(CUR==='agenda')renderAgenda(q);
  else if(CUR==='estoque')renderEstoque(q);
  else if(CUR==='servicos')renderServicos(q);}

/* ===== HOME ===== */
function renderHome(){
  const t=today();
  const hoje=WORK.agenda.filter(a=>a.data===t && a.statusIdx<5);
  const concluidos=WORK.agenda.filter(a=>a.data===t && a.statusIdx===4);
  const recDia=concluidos.reduce((s,a)=>s+agValor(a)+(a.gorjeta||0),0)
    +WORK.pedidosShop.filter(p=>p.data===t&&p.pagamento.status==='pago').reduce((s,p)=>s+p.pagamento.valor,0);
  const antecipados=WORK.agenda.filter(a=>a.data>=t && a.pagamento.forma==='antecipado' && a.pagamento.status==='pago');
  const caixaGarantido=antecipados.reduce((s,a)=>s+agValor(a),0);
  const recupe=WORK.clientes.filter(emRecuperacao);
  const aniver=WORK.clientes.filter(aniversarioHoje);
  const insCrit=WORK.insumos.filter(i=>i.estoque<i.minimo);
  const prodCrit=WORK.produtos.filter(p=>p.estoque<p.minimo);
  const kpis=[
    ['Receita de hoje',money(recDia),'up','▲ serviços + SHOP + gorjetas'],
    ['Agendamentos hoje',hoje.length,'up',concluidos.length+' concluído(s)'],
    ['Caixa garantido',money(caixaGarantido),'up','▲ pagamentos antecipados'],
    ['Clientes ativos',WORK.clientes.length,'up',WORK.clientes.filter(c=>!c.descontoPrimeiroUsado).length+' com 5% do cadastro a usar'],
    ['Em recuperação',recupe.length,recupe.length?'down':'up','sem visita há '+WORK._cfg.recuperacaoDias+'+ dias'],
    ['Estoque crítico',insCrit.length+prodCrit.length,(insCrit.length+prodCrit.length)?'down':'up','insumos + produtos abaixo do mínimo'],
  ];
  const alertas=[];
  if(aniver.length)alertas.push(['🎂','<b>'+aniver.map(c=>c.nome).join(', ')+'</b> faz aniversário hoje — mensagem pronta na Alavancagem.']);
  if(recupe.length)alertas.push(['🔔','<b>'+recupe.length+' cliente(s)</b> sumidos há '+WORK._cfg.recuperacaoDias+'+ dias — campanha de recuperação pronta para disparo.']);
  if(insCrit.length)alertas.push(['📦','<b>'+insCrit.length+' insumo(s)</b> abaixo do mínimo: '+insCrit.map(i=>i.nome).join(', ')+'.']);
  if(prodCrit.length)alertas.push(['🛍','<b>'+prodCrit.length+' produto(s) do SHOP</b> acabando: '+prodCrit.map(p=>p.nome).join(', ')+'.']);
  const pend=WORK.agenda.filter(a=>a.data===t&&a.statusIdx===0);
  if(pend.length)alertas.push(['⏰','<b>'+pend.length+' agendamento(s)</b> de hoje ainda sem confirmação do cliente.']);
  if(!alertas.length)alertas.push(['✅','Tudo em dia — nenhuma pendência crítica agora.']);
  document.getElementById('view').innerHTML=
   '<div class="kpis">'+kpis.map(k=>'<div class="kpi"><div class="lbl">'+k[0]+'</div><div class="val">'+k[1]+'</div><div class="dt '+k[2]+'">'+k[3]+'</div></div>').join('')+'</div>'+
   '<div class="grid2">'+
     '<div class="panel"><div class="head"><h3>🗓 Próximos atendimentos de hoje</h3><div class="sp"></div><button class="b b-sm" onclick="navTo(\'agenda\')">Agenda completa</button></div>'+
       (hoje.filter(a=>a.statusIdx<4).sort((a,b)=>a.hora<b.hora?-1:1).map(a=>{
         const c=cli(a.clienteId),b=brb(a.barbeiroId),s=svc(a.servicoId);
         const mins=minsUntil(a.data,a.hora);
         return '<div class="veh" onclick="abrirAgItem(\''+a.id+'\')"><div class="hourchip">'+a.hora+'</div>'+
           '<div class="info"><div class="t">'+esc(c.nome)+' · '+esc(s.nome)+'</div><div class="s">'+esc(b.apelido||b.nome)+' · '+(a.pagamento.forma==='antecipado'?'💰 pago antecipado':'pagamento na hora')+(mins>0&&mins<=60?' · começa em '+mins+' min':'')+'</div></div>'+
           '<div class="stage">'+agStatusBadge(a.statusIdx)+'</div></div>';
       }).join('')||'<div style="color:var(--muted);font-size:13px">Nenhum atendimento pendente hoje.</div>')+
     '</div>'+
     '<div class="panel"><h3>🧠 Radar Premium <span style="margin-left:auto;font-size:10px;color:var(--dim);letter-spacing:1px">IA · RECOMENDA</span></h3>'+
       alertas.map(a=>'<div class="alert"><div class="ai">'+a[0]+'</div><div class="at">'+a[1]+'</div></div>').join('')+
     '</div>'+
   '</div>';
}
function navTo(m){document.querySelectorAll('.nav a').forEach(x=>{x.classList.toggle('active',x.dataset.m===m);});go(m);}

/* ===== AGENDA ===== */
let AG_DIA=null;
function renderAgenda(q){
  const t=AG_DIA||today();
  const dias=[...new Set(WORK.agenda.map(a=>a.data))].sort();
  let list=WORK.agenda.filter(a=>a.data===t);
  if(q){const s=q.toLowerCase();list=list.filter(a=>(cli(a.clienteId).nome||'').toLowerCase().includes(s)||(brb(a.barbeiroId).nome||'').toLowerCase().includes(s));}
  list.sort((a,b)=>a.hora<b.hora?-1:1);
  const chips=dias.map(d=>'<button class="b '+(d===t?'':'b-ghost')+' b-sm" onclick="AG_DIA=\''+d+'\';renderAgenda()" style="margin:0 6px 6px 0">'+dtBR(d)+(d===today()?' · hoje':'')+'</button>').join('');
  const rows=list.map(a=>{
    const c=cli(a.clienteId),b=brb(a.barbeiroId),s=svc(a.servicoId);
    const pg=a.pagamento||{};
    const acts=[];
    if(a.statusIdx===0)acts.push('<button class="b b-ghost b-sm" onclick="agSet(\''+a.id+'\',1)">Confirmar</button>');
    if(a.statusIdx<=1)acts.push('<button class="b b-ghost b-sm" onclick="agAtraso(\''+a.id+'\')">Atraso</button>');
    if(a.statusIdx<=2)acts.push('<button class="b b-sm" onclick="agSet(\''+a.id+'\',3)">Iniciar</button>');
    if(a.statusIdx===3)acts.push('<button class="b b-sm" onclick="agConcluir(\''+a.id+'\')">Concluir</button>');
    if(a.statusIdx<=2)acts.push('<button class="b b-danger b-sm" onclick="agSet(\''+a.id+'\',5)">No-show</button>');
    return '<tr><td><span class="hourchip">'+a.hora+'</span></td><td><b>'+esc(c.nome)+'</b><br><span style="color:var(--muted);font-size:11.5px">'+esc(s.nome)+'</span></td>'+
      '<td>'+esc(b.apelido||b.nome)+'</td>'+
      '<td>'+money(agValor(a))+(pg.descontoPct?'<br><span style="color:var(--ok);font-size:11px">-'+pg.descontoPct+'% '+(pg.forma==='antecipado'?'antecipado':'cadastro')+'</span>':'')+'</td>'+
      '<td><span class="badge '+(pg.status==='pago'?'b-ok':'b-warn')+'">'+(pg.status==='pago'?'Pago':'Pendente')+'</span></td>'+
      '<td>'+agStatusBadge(a.statusIdx)+'</td>'+
      '<td style="text-align:right;white-space:nowrap">'+acts.join(' ')+'</td></tr>';
  }).join('');
  document.getElementById('view').innerHTML=
   '<div class="panel"><div class="head"><h3>🗓 Agenda — '+dtBR(t)+'</h3><div class="sp"></div>'+
     '<button class="b b-sm" onclick="CRUD.novo(\'agenda\')">+ Novo agendamento</button></div>'+
     '<div style="margin-bottom:10px">'+chips+'</div>'+
     '<table class="tbl"><thead><tr><th>Hora</th><th>Cliente / Serviço</th><th>Barbeiro</th><th>Valor</th><th>Pgto</th><th>Status</th><th></th></tr></thead><tbody>'+
     (rows||'<tr><td colspan="7" style="color:var(--muted)">Nenhum agendamento neste dia.</td></tr>')+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:10px">Tolerância de atraso: '+WORK._cfg.toleranciaMin+' min · Barbeiros recebem aviso '+WORK._cfg.lembreteBarbeiroMin+' min antes do próximo cliente.</div>'+
   '</div>';
}
function agSet(id,st){const a=byId(WORK.agenda,id);a.statusIdx=st;
  if(st===1)toast('Agendamento confirmado ✓');
  if(st===5)toast('Marcado como no-show — cliente entra no radar de recuperação');
  persist('agenda','update',a);renderAgenda();}
function agAtraso(id){const a=byId(WORK.agenda,id);a.statusIdx=2;
  toast('Atraso reportado — tolerância de '+WORK._cfg.toleranciaMin+' min aplicada');
  persist('agenda','update',a);renderAgenda();}
function agConcluir(id){const a=byId(WORK.agenda,id);
  const fim=function(){
    a.statusIdx=4;a.pagamento.status='pago';
    const c=cli(a.clienteId); if(c.id){c.visitas=(c.visitas||0)+1;c.ultimaVisita=a.data;c.descontoPrimeiroUsado=true;}
    WORK.financeiro.push({id:uid('F'),data:a.data,tipo:'receita',categoria:'Serviços',desc:svc(a.servicoId).nome+' — '+cli(a.clienteId).nome,valor:agValor(a)});
    persist('agenda','update',a);toast('Atendimento concluído ✓ receita lançada no Financeiro');renderAgenda();
  };
  if(a.pagamento.status!=='pago'){
    PAYGATE.charge({desc:'Serviço: '+svc(a.servicoId).nome,valor:agValor(a),clienteId:a.clienteId}).then(fim);
  } else fim();
}
function abrirAgItem(id){navTo('agenda');}

/* ===== CLIENTES ===== */
function renderClientes(q){
  let list=WORK.clientes.slice();
  if(q){const s=q.toLowerCase();list=list.filter(c=>(c.nome||'').toLowerCase().includes(s)||(c.tel||'').includes(s));}
  const rows=list.map(c=>{
    const d=diasSem(c);
    const tags=[];
    if(aniversarioHoje(c))tags.push('<span class="badge b-warn">🎂 hoje</span>');
    else if(aniversarioMes(c))tags.push('<span class="badge b-dim">🎂 no mês</span>');
    if(emRecuperacao(c))tags.push('<span class="badge b-bad">recuperar</span>');
    if(!c.descontoPrimeiroUsado)tags.push('<span class="badge b-ok">5% 1º serviço</span>');
    return '<tr><td><b>'+esc(c.nome)+'</b><br><span style="color:var(--muted);font-size:11.5px">'+esc(c.tel||'')+'</span></td>'+
      '<td>'+(c.visitas||0)+'</td><td>'+(c.ultimaVisita?dtBR(c.ultimaVisita)+(d!=null?' <span style="color:var(--muted)">('+d+'d)</span>':''):'—')+'</td>'+
      '<td>'+(c.freqDias?('a cada ~'+c.freqDias+'d'):'—')+'</td><td>'+tags.join(' ')+'</td>'+
      '<td style="text-align:right;white-space:nowrap"><button class="b b-ghost b-sm" onclick="CRUD.editar(\'clientes\',\''+c.id+'\')">✏️</button> <button class="b b-ghost b-sm" onclick="CRUD.del(\'clientes\',\''+c.id+'\')">🗑</button></td></tr>';
  }).join('');
  document.getElementById('view').innerHTML=
   '<div class="panel"><div class="head"><h3>🤝 Clientes</h3><div class="sp"></div>'+
     '<button class="b b-sm" onclick="CRUD.novo(\'clientes\')">+ Novo cliente</button></div>'+
     '<table class="tbl"><thead><tr><th>Cliente</th><th>Visitas</th><th>Última visita</th><th>Frequência</th><th>Sinais</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:10px">Cadastro novo ganha <b>'+WORK._cfg.descontoCadastroPct+'%</b> no primeiro serviço · frequência e histórico alimentam combos, promoções e recuperação.</div>'+
   '</div>';
}

/* ===== SERVIÇOS ===== */
function renderServicos(q){
  let list=WORK.servicos.slice();
  if(q){const s=q.toLowerCase();list=list.filter(x=>(x.nome||'').toLowerCase().includes(s)||(x.categoria||'').toLowerCase().includes(s));}
  const rows=list.map(s=>'<tr><td><b>'+esc(s.nome)+'</b></td><td>'+esc(s.categoria||'')+'</td><td>'+money(s.preco)+'</td><td>'+s.tempoMin+' min</td>'+
    '<td><span class="badge '+(s.ativo?'b-ok':'b-dim')+'">'+(s.ativo?'Ativo':'Inativo')+'</span></td>'+
    '<td style="text-align:right;white-space:nowrap"><button class="b b-ghost b-sm" onclick="CRUD.editar(\'servicos\',\''+s.id+'\')">✏️</button> <button class="b b-ghost b-sm" onclick="CRUD.del(\'servicos\',\''+s.id+'\')">🗑</button></td></tr>').join('');
  document.getElementById('view').innerHTML=
   '<div class="panel"><div class="head"><h3>✂️ Gerenciador de Serviços</h3><div class="sp"></div>'+
     '<button class="b b-sm" onclick="CRUD.novo(\'servicos\')">+ Novo serviço</button></div>'+
     '<table class="tbl"><thead><tr><th>Serviço</th><th>Categoria</th><th>Preço</th><th>Duração</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:10px">Pagamento antecipado no agendamento tem <b>'+WORK._cfg.descontoAntecipadoPct+'%</b> de desconto — incentivo por garantir o caixa.</div>'+
   '</div>';
}

/* ===== BARBEIROS & PRODUTIVIDADE ===== */
function prodBarbeiro(b){
  const done=WORK.agenda.filter(a=>a.barbeiroId===b.id&&a.statusIdx===4);
  const receita=done.reduce((s,a)=>s+agValor(a),0);
  const gorjetas=done.reduce((s,a)=>s+(a.gorjeta||0),0);
  const fbs=WORK.feedbacks.filter(f=>f.barbeiroId===b.id);
  const nota=fbs.length?fbs.reduce((s,f)=>s+f.nota,0)/fbs.length:null;
  return {atend:done.length,receita:receita,gorjetas:gorjetas,nota:nota,
    comissao:receita*(b.comissaoPct||0)/100,avals:fbs.length};
}
function renderBarbeiros(){
  const rows=WORK.barbeiros.map(b=>{
    const p=prodBarbeiro(b);
    return '<tr><td><b>'+esc(b.nome)+'</b><br><span style="color:var(--muted);font-size:11.5px">'+esc(b.apelido||'')+' · desde '+dtBR(b.desde)+'</span></td>'+
      '<td>'+p.atend+'</td><td>'+money(p.receita)+'</td><td>'+money(p.comissao)+' <span style="color:var(--muted);font-size:11px">('+b.comissaoPct+'%)</span></td>'+
      '<td>'+money(p.gorjetas)+'</td><td>'+(p.nota?('⭐ '+p.nota.toFixed(1)+' <span style="color:var(--muted);font-size:11px">('+p.avals+')</span>'):'—')+'</td>'+
      '<td style="text-align:right;white-space:nowrap"><button class="b b-ghost b-sm" onclick="CRUD.editar(\'barbeiros\',\''+b.id+'\')">✏️</button></td></tr>';
  }).join('');
  const fbRows=WORK.feedbacks.slice().sort((a,b)=>a.data<b.data?1:-1).slice(0,6).map(f=>
    '<div class="alert"><div class="ai">'+'⭐'.repeat(f.nota)+'</div><div class="at"><b>'+esc(cli(f.clienteId).nome)+'</b> sobre '+esc(brb(f.barbeiroId).apelido||brb(f.barbeiroId).nome)+' — “'+esc(f.comentario)+'” <span style="color:var(--muted)">('+dtBR(f.data)+')</span></div></div>').join('');
  document.getElementById('view').innerHTML=
   '<div class="panel"><div class="head"><h3>💈 Produtividade da equipe</h3><div class="sp"></div>'+
     '<button class="b b-sm" onclick="CRUD.novo(\'barbeiros\')">+ Novo barbeiro</button></div>'+
     '<table class="tbl"><thead><tr><th>Barbeiro</th><th>Atendimentos</th><th>Receita gerada</th><th>Comissão</th><th>Gorjetas</th><th>Avaliação</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:10px">Aviso amigável '+WORK._cfg.lembreteBarbeiroMin+' min antes do próximo cliente — automático enquanto o sistema está aberto.</div>'+
   '</div>'+
   '<div class="panel"><h3>💬 Feedbacks recentes dos clientes</h3>'+(fbRows||'<div style="color:var(--muted);font-size:13px">Sem feedbacks ainda.</div>')+'</div>';
}

/* ===== modal / confirmar / toast ===== */
function modal(titulo,sub,corpo,onOk,okLabel){
  const r=document.getElementById('modal-root');
  r.innerHTML='<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">'+
    '<h3>'+titulo+'</h3><div class="msub">'+(sub||'')+'</div>'+corpo+
    '<div class="mact"><button class="b b-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="b" id="modalOk">'+(okLabel||'Salvar')+'</button></div></div></div>';
  document.getElementById('modalOk').onclick=onOk;
}
function confirmar(msg,onOk){
  modal('Confirmação','',
    '<div style="font-size:14px;line-height:1.5">'+msg+'</div>',onOk,'Confirmar');
}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
function toast(m){const t=document.createElement('div');t.textContent=m;
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99;background:var(--panel);border:1px solid var(--line);color:var(--gold-2);padding:11px 20px;border-radius:12px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:88vw;text-align:center';
  document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}

/* ===== Notificação amigável ao barbeiro (15 min antes) ===== */
const NOTIFIED={};
function tickBarbeiro(){
  if(!SESSION||SESSION.perfil==='cliente')return;
  const t=today();
  WORK.agenda.filter(a=>a.data===t&&a.statusIdx<3).forEach(a=>{
    const m=minsUntil(a.data,a.hora);
    if(m>0&&m<=WORK._cfg.lembreteBarbeiroMin&&!NOTIFIED[a.id]){
      NOTIFIED[a.id]=true;
      const b=brb(a.barbeiroId),c=cli(a.clienteId),s=svc(a.servicoId);
      if(SESSION.perfil!=='barbeiro'||SESSION.barbeiroId===a.barbeiroId)
        toast('💈 '+(b.apelido||b.nome)+', seu próximo cliente ('+c.nome+' · '+s.nome+') chega em ~'+m+' min. Prepare a cadeira! ✨');
    }
  });
}
if(!window._bpAgTimer)window._bpAgTimer=setInterval(tickBarbeiro,60000);

/* ===== ÁREA DO CLIENTE (portal interativo) ===== */
function abrirPortalCliente(cid){
  const c=cli(cid);
  document.getElementById('app').style.display='none';
  const P=document.getElementById('portal');
  P.style.display='flex';
  renderPortalCliente(cid);
}
function proximoAg(cid){
  const t=today();
  return WORK.agenda.filter(a=>a.clienteId===cid&&a.statusIdx<4&&(a.data>t||(a.data===t)))
    .sort((a,b)=>(a.data+a.hora)<(b.data+b.hora)?-1:1)[0];
}
function posicaoNaFila(a){ // quantos atendimentos do mesmo barbeiro antes do dele hoje
  if(!a)return null;
  return WORK.agenda.filter(x=>x.data===a.data&&x.barbeiroId===a.barbeiroId&&x.statusIdx<4&&x.hora<a.hora).length;
}
function renderPortalCliente(cid){
  const c=cli(cid);
  const prox=proximoAg(cid);
  const fila=posicaoNaFila(prox);
  const hist=WORK.agenda.filter(a=>a.clienteId===cid&&a.statusIdx===4).sort((a,b)=>a.data<b.data?1:-1);
  const meusPedidos=WORK.pedidosShop.filter(p=>p.clienteId===cid);
  const niver=aniversarioHoje(c);
  let nextBlock='';
  if(prox){
    const s=svc(prox.servicoId),b=brb(prox.barbeiroId);
    const mins=minsUntil(prox.data,prox.hora);
    const ehProximo=fila===0&&prox.data===today();
    nextBlock=
     '<div class="pnext">'+
       (ehProximo?'<div style="font-family:var(--display);font-weight:700;font-size:20px;color:var(--gold-2);margin-bottom:6px">🔔 VOCÊ É O PRÓXIMO!</div>':'')+
       '<div style="font-size:15px"><b>'+esc(s.nome)+'</b> com <b>'+esc(b.apelido||b.nome)+'</b></div>'+
       '<div style="color:var(--muted);font-size:13px;margin-top:4px">'+dtBR(prox.data)+' às '+prox.hora+
         (mins>0&&mins<720?' · em ~'+(mins>=60?Math.floor(mins/60)+'h'+(mins%60?(mins%60)+'min':''):mins+' min'):'')+
         (fila>0?' · '+fila+' cliente(s) antes de você':'')+'</div>'+
       '<div style="margin-top:6px">'+agStatusBadge(prox.statusIdx)+' <span class="badge '+(prox.pagamento.status==='pago'?'b-ok':'b-warn')+'">'+(prox.pagamento.status==='pago'?'Pago':'Pagamento pendente')+'</span></div>'+
       '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap">'+
        (prox.statusIdx===0?'<button class="b b-sm" onclick="pcConfirmar(\''+prox.id+'\',\''+cid+'\')">✓ Confirmar presença</button>':'')+
        (prox.statusIdx<=1?'<button class="b b-ghost b-sm" onclick="pcAtraso(\''+prox.id+'\',\''+cid+'\')">⏰ Vou atrasar (até '+WORK._cfg.toleranciaMin+' min)</button>':'')+
        (prox.pagamento.status!=='pago'?'<button class="b b-sm" onclick="pcPagar(\''+prox.id+'\',\''+cid+'\')">💳 Pagar agora</button>':'')+
       '</div>'+
     '</div>';
  } else {
    nextBlock='<div class="pbig card-glass" style="margin-bottom:14px"><div class="stt">Bora marcar o próximo?</div>'+
      '<div style="color:var(--muted);font-size:13px">Agende e ganhe <b>'+WORK._cfg.descontoAntecipadoPct+'% de desconto</b> pagando antecipado.</div></div>';
  }
  const histRows=hist.slice(0,5).map(a=>{
    const jaAvaliou=WORK.feedbacks.some(f=>f.clienteId===cid&&f.data===a.data&&f.barbeiroId===a.barbeiroId);
    return '<div class="veh"><div class="hourchip">'+dtBR(a.data).slice(0,5)+'</div>'+
    '<div class="info"><div class="t">'+esc(svc(a.servicoId).nome)+'</div><div class="s">'+esc(brb(a.barbeiroId).apelido||'')+' · '+money(agValor(a))+(a.gorjeta?' · 💛 gorjeta '+money(a.gorjeta):'')+'</div></div>'+
    '<div style="display:flex;gap:6px">'+
      (jaAvaliou?'<span class="badge b-ok">avaliado</span>':'<button class="b b-ghost b-sm" onclick="pcFeedback(\''+a.id+'\',\''+cid+'\')">⭐ Avaliar</button>')+
      '<button class="b b-ghost b-sm" onclick="pcGorjeta(\''+a.id+'\',\''+cid+'\')">💛 Gorjeta</button></div></div>';
  }).join('');
  const shopCards=WORK.produtos.filter(p=>p.ativo&&p.estoque>0).map(p=>
    '<div class="veh"><div class="info"><div class="t">'+esc(p.nome)+'</div><div class="s">'+money(p.preco)+' · retirada na unidade</div></div>'+
    '<button class="b b-sm" onclick="pcComprar(\''+p.id+'\',\''+cid+'\')">Comprar</button></div>').join('');
  const pedRows=meusPedidos.map(p=>'<div class="alert"><div class="ai">🛍</div><div class="at">'+p.itens.map(i=>esc(prd(i.produtoId).nome)).join(' + ')+' — <b>'+esc(p.status)+'</b> <span style="color:var(--muted)">('+dtBR(p.data)+')</span></div></div>').join('');
  document.getElementById('portal').innerHTML=
   '<div class="pcard">'+
     '<div class="phead"><div class="emblem" id="emblemP"></div><div class="pbrand">'+esc(WORK._cfg.barbearia).toUpperCase()+'</div>'+
       '<div style="color:var(--muted);font-size:12px;letter-spacing:2px;text-transform:uppercase">Área do cliente</div></div>'+
     (niver?'<div class="pnext" style="border-color:rgba(230,181,102,.5)"><div style="font-size:22px">🎂</div><div style="font-family:var(--display);font-weight:700;font-size:17px">Feliz aniversário, '+esc(c.nome.split(' ')[0])+'!</div><div style="color:var(--muted);font-size:13px;margin-top:4px">Hoje o presente é nosso: condição especial no seu próximo serviço. 🎁</div></div>':'')+
     '<div class="card-glass" style="padding:18px;margin-bottom:14px"><div style="font-size:15px">Olá, <b>'+esc(c.nome)+'</b> 👋</div>'+
       '<div style="color:var(--muted);font-size:12.5px;margin-top:2px">'+(c.visitas||0)+' visitas · cliente desde '+dtBR(c.cadastro)+(!c.descontoPrimeiroUsado?' · <span style="color:var(--ok)">🎁 '+WORK._cfg.descontoCadastroPct+'% no seu 1º serviço</span>':'')+'</div></div>'+
     nextBlock+
     '<div class="card-glass" style="padding:18px;margin-bottom:14px"><div class="head" style="display:flex;align-items:center;margin-bottom:12px"><h3 style="margin:0;font-family:var(--display);font-size:16px">📅 Agendar novo horário</h3></div>'+
       '<div style="display:flex;gap:8px;justify-content:flex-start"><button class="b" onclick="pcAgendar(\''+cid+'\')">Agendar agora — '+WORK._cfg.descontoAntecipadoPct+'% off no pgto antecipado</button></div></div>'+
     '<div class="card-glass" style="padding:18px;margin-bottom:14px"><h3 style="margin:0 0 12px;font-family:var(--display);font-size:16px">💈 Suas últimas visitas</h3>'+(histRows||'<div style="color:var(--muted);font-size:13px">Sua primeira visita ainda está por vir. 😉</div>')+'</div>'+
     '<div class="card-glass" style="padding:18px;margin-bottom:14px"><h3 style="margin:0 0 12px;font-family:var(--display);font-size:16px">🛍 SHOP — pague aqui, retire na unidade</h3>'+shopCards+(pedRows?'<div style="margin-top:12px">'+pedRows+'</div>':'')+'</div>'+
     '<div style="display:flex;justify-content:center;margin:10px 0 20px"><button class="b b-ghost b-sm" onclick="sair()">Sair</button></div>'+
     '<footer>'+esc(WORK._cfg.barbearia)+' · Vizio Barber — um produto <b>INPERSON</b></footer>'+
   '</div>';
  const ep=document.getElementById('emblemP'); if(ep){ep.innerHTML=emblemSVG(); if(ep.firstElementChild)ep.firstElementChild.style.maxWidth='76px';}
}
function pcConfirmar(aid,cid){const a=byId(WORK.agenda,aid);a.statusIdx=1;persist('agenda','update',a);
  toast('Presença confirmada — até já! ✂️');renderPortalCliente(cid);}
function pcAtraso(aid,cid){const a=byId(WORK.agenda,aid);a.statusIdx=2;persist('agenda','update',a);
  toast('Avisamos o barbeiro — tolerância de '+WORK._cfg.toleranciaMin+' min garantida.');renderPortalCliente(cid);}
function pcPagar(aid,cid){const a=byId(WORK.agenda,aid);
  PAYGATE.charge({desc:'Serviço: '+svc(a.servicoId).nome,valor:agValor(a),clienteId:cid}).then(()=>{
    a.pagamento.status='pago';persist('agenda','update',a);
    toast('Pagamento confirmado ✓');renderPortalCliente(cid);});}
function pcAgendar(cid){
  const c=cli(cid);
  const svcOpts=WORK.servicos.filter(s=>s.ativo).map(s=>'<option value="'+s.id+'">'+esc(s.nome)+' — '+money(s.preco)+'</option>').join('');
  const brbOpts=WORK.barbeiros.filter(b=>b.ativo).map(b=>'<option value="'+b.id+'">'+esc(b.apelido||b.nome)+'</option>').join('');
  modal('Novo agendamento','Escolha serviço, profissional, dia e horário.',
   '<label>Serviço</label><select id="ag_svc">'+svcOpts+'</select>'+
   '<div class="frow"><div><label>Barbeiro</label><select id="ag_brb">'+brbOpts+'</select></div>'+
   '<div><label>Data</label><input id="ag_data" type="date" value="'+today()+'"></div></div>'+
   '<label>Horário</label><input id="ag_hora" type="time" value="10:00">'+
   '<label>Pagamento</label><select id="ag_pgto"><option value="antecipado">Antecipado — '+WORK._cfg.descontoAntecipadoPct+'% de desconto 💰</option><option value="na hora">Na hora (sem desconto)</option></select>',
   function(){
     const sid=document.getElementById('ag_svc').value, s=svc(sid);
     const forma=document.getElementById('ag_pgto').value;
     let desc=forma==='antecipado'?WORK._cfg.descontoAntecipadoPct:0;
     if(!c.descontoPrimeiroUsado)desc=Math.max(desc,WORK._cfg.descontoCadastroPct);
     const valor=+(s.preco*(1-desc/100)).toFixed(2);
     const novo={id:uid('A'),data:document.getElementById('ag_data').value,hora:document.getElementById('ag_hora').value,
       clienteId:cid,barbeiroId:document.getElementById('ag_brb').value,servicoId:sid,statusIdx:1,
       pagamento:{forma:forma,status:forma==='antecipado'?'pendente':'pendente',valor:valor,descontoPct:desc},gorjeta:0,obs:''};
     const done=function(){WORK.agenda.push(novo);persist('agenda','create',novo);closeModal();
       toast('Agendado ✓ '+(desc?('desconto de '+desc+'% aplicado'):''));renderPortalCliente(cid);};
     if(forma==='antecipado'){PAYGATE.charge({desc:'Agendamento: '+s.nome,valor:valor,clienteId:cid}).then(()=>{novo.pagamento.status='pago';done();});}
     else done();
   },'Confirmar agendamento');
}
let _fbNota=5;
function pcFeedback(aid,cid){
  const a=byId(WORK.agenda,aid);_fbNota=5;
  const stars=function(n){return [1,2,3,4,5].map(i=>'<span class="star'+(i<=n?' on':'')+'" onclick="fbStar('+i+')">⭐</span>').join('');};
  modal('Como foi seu atendimento?','Sua opinião melhora a experiência de todos.',
   '<div id="fbStars" style="text-align:center;margin:8px 0 4px">'+stars(5)+'</div>'+
   '<label>Comentário (opcional)</label><textarea id="fb_txt" placeholder="Conte como foi…"></textarea>',
   function(){
     WORK.feedbacks.push({id:uid('FB'),data:a.data,clienteId:cid,barbeiroId:a.barbeiroId,nota:_fbNota,comentario:document.getElementById('fb_txt').value||''});
     persist('feedbacks','create',WORK.feedbacks[WORK.feedbacks.length-1]);
     closeModal();toast('Obrigado pelo feedback! ⭐');renderPortalCliente(cid);
   },'Enviar avaliação');
  window.fbStar=function(n){_fbNota=n;document.getElementById('fbStars').innerHTML=stars(n);};
}
function pcGorjeta(aid,cid){
  const a=byId(WORK.agenda,aid);const b=brb(a.barbeiroId);
  modal('Gorjeta para '+esc(b.apelido||b.nome),'Um agrado para quem cuidou de você. 💛',
   '<label>Valor</label><div style="display:flex;gap:8px;margin-bottom:6px">'+[5,10,20].map(v=>'<button type="button" class="b b-ghost b-sm" onclick="document.getElementById(\'gj_val\').value='+v+'">R$ '+v+'</button>').join('')+'</div>'+
   '<input id="gj_val" type="number" min="1" step="1" value="10">',
   function(){
     const v=+document.getElementById('gj_val').value||0; if(v<=0){toast('Informe um valor');return;}
     PAYGATE.charge({desc:'Gorjeta — '+(b.apelido||b.nome),valor:v,clienteId:cid}).then(()=>{
       a.gorjeta=(a.gorjeta||0)+v;persist('agenda','update',a);
       closeModal();toast('Gorjeta enviada — '+(b.apelido||b.nome)+' agradece! 💛');renderPortalCliente(cid);});
   },'Enviar 💛');
}
function pcComprar(pid,cid){
  const p=prd(pid);
  confirmar('Comprar <b>'+esc(p.nome)+'</b> por <b>'+money(p.preco)+'</b>?<br><span style="color:var(--muted);font-size:12px">Pagamento no sistema · retirada na unidade.</span>',
   function(){
     PAYGATE.charge({desc:'SHOP: '+p.nome,valor:p.preco,clienteId:cid}).then(()=>{
       const ped={id:uid('PS'),data:today(),clienteId:cid,itens:[{produtoId:pid,qtd:1,valor:p.preco}],status:'Separando',pagamento:{forma:'no sistema',status:'pago',valor:p.preco}};
       WORK.pedidosShop.push(ped);p.estoque=Math.max(0,p.estoque-1);
       WORK.financeiro.push({id:uid('F'),data:today(),tipo:'receita',categoria:'SHOP',desc:p.nome+' — '+cli(cid).nome,valor:p.preco});
       persist('pedidosShop','create',ped);
       closeModal();toast('Compra confirmada ✓ retire na unidade');renderPortalCliente(cid);});
   });
}

/* ===== cursor glow (Movimento Vivo) ===== */
(function(){
  var g=document.getElementById('cursor-glow');
  if(!g||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.addEventListener('mousemove',function(e){g.style.opacity=1;g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';});
  document.addEventListener('mouseleave',function(){g.style.opacity=0;});
})();
/* logo do login */
(function(){var e=document.getElementById('emblemLogin');if(e){e.innerHTML=emblemSVG();if(e.firstElementChild)e.firstElementChild.style.maxWidth='120px';}})();
