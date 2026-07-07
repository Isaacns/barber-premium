/* ============================================================
   Barber Premium · VIZIO — gestao.js
   Estoque · SHOP · Financeiro (Saúde do Negócio) · Nota Fiscal ·
   Dashboard Executivo · Alavancagem · Relatórios.
   Depende de app.js (WORK, helpers, modal, toast) e Chart.js.
   ============================================================ */
let _charts=[];
function killCharts(){_charts.forEach(c=>{try{c.destroy();}catch(e){}});_charts=[];}
function chartColors(){
  const cs=getComputedStyle(document.documentElement);
  return {acc:cs.getPropertyValue('--gold-2').trim()||'#5b8cff',
    muted:cs.getPropertyValue('--muted').trim()||'#79838f',
    grid:'rgba(128,140,160,.08)', ok:cs.getPropertyValue('--ok').trim()||'#54d1a6',
    bad:cs.getPropertyValue('--bad').trim()||'#e77b7b'};
}
function softChart(id,cfg){
  const el=document.getElementById(id); if(!el||typeof Chart==='undefined')return;
  const c=chartColors();
  cfg.options=Object.assign({responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false}},
    scales:{x:{grid:{color:'transparent'},ticks:{color:c.muted,font:{size:10}}},
            y:{grid:{color:c.grid},ticks:{color:c.muted,font:{size:10}},border:{display:false}}}},cfg.options||{});
  _charts.push(new Chart(el,cfg));
}

/* ===== ESTOQUE (insumos + produtos) ===== */
let _estTab='insumos';
function renderEstoque(q){
  killCharts();
  const tabs='<div style="display:flex;gap:8px;margin-bottom:14px">'+
    '<button class="b '+(_estTab==='insumos'?'':'b-ghost')+' b-sm" onclick="_estTab=\'insumos\';renderEstoque()">🧴 Insumos da barbearia</button>'+
    '<button class="b '+(_estTab==='produtos'?'':'b-ghost')+' b-sm" onclick="_estTab=\'produtos\';renderEstoque()">🛍 Produtos de venda</button></div>';
  let html;
  if(_estTab==='insumos'){
    let list=WORK.insumos.slice();
    if(q){const s=q.toLowerCase();list=list.filter(i=>(i.nome||'').toLowerCase().includes(s));}
    const rows=list.map(i=>{
      const crit=i.estoque<i.minimo;
      return '<tr><td><b>'+esc(i.nome)+'</b><br><span style="color:var(--muted);font-size:11.5px">'+esc(i.fornecedor||'')+'</span></td>'+
       '<td>'+money(i.custo)+'</td><td>'+i.estoque+' '+esc(i.unidade||'')+'</td><td>'+i.minimo+'</td>'+
       '<td><span class="badge '+(crit?'b-bad':'b-ok')+'">'+(crit?'Repor':'OK')+'</span></td>'+
       '<td style="text-align:right;white-space:nowrap"><button class="b b-ghost b-sm" onclick="CRUD.editar(\'insumos\',\''+i.id+'\')">✏️</button> <button class="b b-ghost b-sm" onclick="CRUD.del(\'insumos\',\''+i.id+'\')">🗑</button></td></tr>';}).join('');
    html='<div class="panel"><div class="head"><h3>🧴 Insumos de trabalho</h3><div class="sp"></div><button class="b b-sm" onclick="CRUD.novo(\'insumos\')">+ Novo insumo</button></div>'+
      '<table class="tbl"><thead><tr><th>Insumo</th><th>Custo</th><th>Estoque</th><th>Mínimo</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }else{
    let list=WORK.produtos.slice();
    if(q){const s=q.toLowerCase();list=list.filter(p=>(p.nome||'').toLowerCase().includes(s));}
    const rows=list.map(p=>{
      const crit=p.estoque<p.minimo;
      const mg=p.preco?Math.round((p.preco-p.custo)/p.preco*100):0;
      return '<tr><td><b>'+esc(p.nome)+'</b></td><td>'+money(p.custo)+'</td><td>'+money(p.preco)+' <span style="color:var(--muted);font-size:11px">('+mg+'%)</span></td>'+
       '<td>'+p.estoque+'</td><td><span class="badge '+(crit?'b-bad':'b-ok')+'">'+(crit?'Repor':'OK')+'</span></td>'+
       '<td style="text-align:right;white-space:nowrap"><button class="b b-ghost b-sm" onclick="CRUD.editar(\'produtos\',\''+p.id+'\')">✏️</button> <button class="b b-ghost b-sm" onclick="CRUD.del(\'produtos\',\''+p.id+'\')">🗑</button></td></tr>';}).join('');
    html='<div class="panel"><div class="head"><h3>🛍 Produtos à venda (SHOP)</h3><div class="sp"></div><button class="b b-sm" onclick="CRUD.novo(\'produtos\')">+ Novo produto</button></div>'+
      '<table class="tbl"><thead><tr><th>Produto</th><th>Custo</th><th>Preço (margem)</th><th>Estoque</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  document.getElementById('view').innerHTML=tabs+html;
}

/* ===== SHOP (pedidos) ===== */
const SHOP_FLOW=["Separando","Aguardando retirada","Retirado"];
function renderShop(){
  killCharts();
  const rows=WORK.pedidosShop.slice().sort((a,b)=>a.data<b.data?1:-1).map(p=>{
    const itens=p.itens.map(i=>esc(prd(i.produtoId).nome)+(i.qtd>1?' ×'+i.qtd:'')).join(' + ');
    const idx=SHOP_FLOW.indexOf(p.status);
    const next=idx>=0&&idx<SHOP_FLOW.length-1?SHOP_FLOW[idx+1]:null;
    const cl=cli(p.clienteId), _b=(WORK._cfg&&WORK._cfg.barbearia)||'Vizio Barber';
    const waMsg=p.status==='Aguardando retirada'
      ? 'Olá, '+((cl.nome||'').split(' ')[0])+'! Seu pedido na '+_b+' ('+itens+') está PRONTO para retirada. Pode passar quando quiser! 🛍'
      : 'Olá, '+((cl.nome||'').split(' ')[0])+'! Recebemos seu pedido ('+itens+') na '+_b+'. Avisamos assim que estiver pronto para retirada. 🛍';
    const waB=p.status!=='Retirado'?waBtn(cl.tel,waMsg)+' ':'';
    return '<tr><td>'+dtBR(p.data)+'</td><td><b>'+esc(cli(p.clienteId).nome)+'</b></td><td>'+itens+'</td>'+
     '<td>'+money(p.pagamento.valor)+'</td>'+
     '<td><span class="badge '+(p.status==='Retirado'?'b-ok':p.status==='Aguardando retirada'?'b-info':'b-warn')+'">'+esc(p.status)+'</span></td>'+
     '<td style="text-align:right;white-space:nowrap">'+waB+(next?'<button class="b b-sm" onclick="shopAvancar(\''+p.id+'\')">'+(next==='Retirado'?'✓ Entregar':next)+'</button>':'')+'</td></tr>';
  }).join('');
  const receita=WORK.pedidosShop.filter(p=>p.pagamento.status==='pago').reduce((s,p)=>s+p.pagamento.valor,0);
  document.getElementById('view').innerHTML=
   '<div class="kpis">'+
     '<div class="kpi"><div class="lbl">Pedidos</div><div class="val">'+WORK.pedidosShop.length+'</div><div class="dt">no período</div></div>'+
     '<div class="kpi"><div class="lbl">Receita SHOP</div><div class="val">'+money(receita)+'</div><div class="dt up">▲ pagamento no sistema</div></div>'+
     '<div class="kpi"><div class="lbl">Aguardando retirada</div><div class="val">'+WORK.pedidosShop.filter(p=>p.status!=='Retirado').length+'</div><div class="dt">separar e avisar o cliente</div></div>'+
   '</div>'+
   '<div class="panel"><div class="head"><h3>🛍 Pedidos do SHOP</h3><div class="sp"></div></div>'+
     '<table class="tbl"><thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>'+
     (rows||'<tr><td colspan="6" style="color:var(--muted)">Nenhum pedido ainda.</td></tr>')+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:10px">Fluxo: pagamento no sistema → separação → retirada na unidade.</div></div>';
}
function shopAvancar(id){const p=byId(WORK.pedidosShop,id);
  const idx=SHOP_FLOW.indexOf(p.status);
  if(idx<SHOP_FLOW.length-1){p.status=SHOP_FLOW[idx+1];persist('pedidosShop','update',p);toast('Pedido: '+p.status);}
  renderShop();}

/* ===== FINANCEIRO + Saúde do Negócio ===== */
function saudeDoNegocio(){
  const h=WORK.historicoMensal;
  const cur=h[h.length-1], prev=h[h.length-2]||cur;
  const mesesFechados=h.slice(0,-1);
  const margem=mesesFechados.length?mesesFechados.reduce((s,m)=>s+(m.receita-m.despesa)/Math.max(1,m.receita),0)/mesesFechados.length:0;
  const cresc=prev.receita?((h[h.length-2].receita-h[h.length-3].receita)/h[h.length-3].receita):0;
  const recorr=WORK.clientes.filter(c=>(c.visitas||0)>=3).length/Math.max(1,WORK.clientes.length);
  const recupe=WORK.clientes.filter(emRecuperacao).length/Math.max(1,WORK.clientes.length);
  // score 0–100: margem (40) + crescimento (25) + recorrência (25) − risco de churn (10)
  let score=Math.round(Math.min(40,margem*100*1.34)+Math.min(25,Math.max(0,cresc*100*2.5))+recorr*25+ (1-Math.min(1,recupe*2))*10);
  score=Math.max(0,Math.min(100,score));
  const label=score>=75?'Saudável':score>=50?'Atenção':'Crítico';
  const cor=score>=75?'var(--ok)':score>=50?'var(--warn)':'var(--bad)';
  return {score:score,label:label,cor:cor,margem:margem,cresc:cresc,recorr:recorr};
}
function renderFinanceiro(){
  killCharts();
  const rec=WORK.financeiro.filter(f=>f.tipo==='receita').reduce((s,f)=>s+f.valor,0);
  const desp=WORK.financeiro.filter(f=>f.tipo==='despesa').reduce((s,f)=>s+f.valor,0);
  const sd=saudeDoNegocio();
  const rows=WORK.financeiro.slice().sort((a,b)=>a.data<b.data?1:-1).map(f=>
    '<tr><td>'+dtBR(f.data)+'</td><td><span class="badge '+(f.tipo==='receita'?'b-ok':'b-bad')+'">'+f.tipo+'</span></td>'+
    '<td>'+esc(f.categoria)+'</td><td>'+esc(f.desc)+'</td><td style="font-variant-numeric:tabular-nums">'+(f.tipo==='despesa'?'−':'')+money(f.valor)+'</td>'+
    '<td style="text-align:right;white-space:nowrap"><button class="b b-ghost b-sm" onclick="CRUD.editar(\'financeiro\',\''+f.id+'\')">✏️</button> <button class="b b-ghost b-sm" onclick="CRUD.del(\'financeiro\',\''+f.id+'\')">🗑</button></td></tr>').join('');
  document.getElementById('view').innerHTML=
   '<div class="kpis">'+
     '<div class="kpi"><div class="lbl">Receitas (mês)</div><div class="val">'+money(rec)+'</div><div class="dt up">▲ serviços + SHOP</div></div>'+
     '<div class="kpi"><div class="lbl">Despesas (mês)</div><div class="val">'+money(desp)+'</div><div class="dt">fixas + variáveis</div></div>'+
     '<div class="kpi"><div class="lbl">Resultado</div><div class="val">'+money(rec-desp)+'</div><div class="dt '+(rec-desp>=0?'up':'down')+'">'+(rec-desp>=0?'▲ positivo':'▼ negativo')+'</div></div>'+
     '<div class="kpi"><div class="lbl">Saúde do Negócio</div><div class="val" style="color:'+sd.cor+'">'+sd.score+'<span style="font-size:16px;color:var(--muted)">/100</span></div>'+
       '<div class="dt" style="color:'+sd.cor+'">'+sd.label+'</div><div class="bar"><i style="width:'+sd.score+'%"></i></div></div>'+
   '</div>'+
   '<div class="grid2">'+
    '<div class="panel"><h3>📈 Receita × Despesa (6 meses)</h3><div style="height:210px"><canvas id="chFin"></canvas></div></div>'+
    '<div class="panel"><h3>❤️ Saúde do Negócio — leitura</h3>'+
      '<div class="alert"><div class="ai">💰</div><div class="at">Margem média: <b>'+(sd.margem*100).toFixed(1)+'%</b> — '+(sd.margem>0.3?'excelente para o setor.':'buscar 30%+ com SHOP e combos.')+'</div></div>'+
      '<div class="alert"><div class="ai">📈</div><div class="at">Crescimento da receita (último mês fechado): <b>'+(sd.cresc*100).toFixed(1)+'%</b>.</div></div>'+
      '<div class="alert"><div class="ai">🔁</div><div class="at">Clientes recorrentes (3+ visitas): <b>'+Math.round(sd.recorr*100)+'%</b> da base.</div></div>'+
    '</div>'+
   '</div>'+
   '<div class="panel"><div class="head"><h3>💳 Lançamentos</h3><div class="sp"></div><button class="b b-sm" onclick="CRUD.novo(\'financeiro\')">+ Novo lançamento</button></div>'+
     '<table class="tbl"><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const h=WORK.historicoMensal;
  softChart('chFin',{type:'line',data:{labels:h.map(m=>m.mes.slice(5)+'/'+m.mes.slice(2,4)),
    datasets:[{data:h.map(m=>m.receita),borderColor:chartColors().acc,backgroundColor:'transparent',tension:.35,pointRadius:2,borderWidth:2},
              {data:h.map(m=>m.despesa),borderColor:chartColors().bad,backgroundColor:'transparent',tension:.35,pointRadius:2,borderWidth:1.5,borderDash:[5,4]}]}});
}

/* ===== NOTA FISCAL ===== */
function renderNFe(){
  killCharts();
  const rows=WORK.notas.slice().sort((a,b)=>b.numero-a.numero).map(n=>
    '<tr><td><b>#'+n.numero+'</b></td><td>'+dtBR(n.data)+'</td><td>'+esc(cli(n.clienteId).nome)+'</td>'+
    '<td>'+money(n.valor)+'</td><td>'+esc(n.tipo)+'</td>'+
    '<td><span class="badge '+(n.status==='Emitida'?'b-ok':'b-warn')+'">'+esc(n.status)+'</span></td>'+
    '<td style="text-align:right;white-space:nowrap">'+(n.status!=='Emitida'?'<button class="b b-sm" onclick="nfeEmitir(\''+n.id+'\')">Emitir</button>':waBtn(cli(n.clienteId).tel,'Olá, '+((cli(n.clienteId).nome||'').split(' ')[0])+'! Sua nota fiscal #'+n.numero+' da '+((WORK._cfg&&WORK._cfg.barbearia)||'Vizio Barber')+' ('+money(n.valor)+') foi emitida. Obrigado pela preferência! 🧾','Enviar nota')+' <button class="b b-ghost b-sm" onclick="toast(\'DANFE simulado — provedor fiscal entra no go-live\')">DANFE</button>')+'</td></tr>').join('');
  document.getElementById('view').innerHTML=
   '<div class="panel"><div class="head"><h3>🧾 Notas fiscais</h3><div class="sp"></div><button class="b b-sm" onclick="CRUD.novo(\'notas\')">+ Nova nota</button></div>'+
     '<table class="tbl"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Valor</th><th>Tipo</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+
     '<div style="font-size:11.5px;color:var(--muted);margin-top:10px">Emissão simulada no piloto — no go-live conecta a um provedor fiscal (certificado digital A1).</div></div>';
}
function nfeEmitir(id){const n=byId(WORK.notas,id);n.status='Emitida';n.chave='29'+today().replace(/-/g,'')+'demo'+String(n.numero).padStart(6,'0');
  persist('notas','update',n);toast('NFC-e emitida ✓ (simulação)');renderNFe();}

/* ===== DASHBOARD EXECUTIVO ===== */
function renderDash(){
  killCharts();
  const h=WORK.historicoMensal;
  const cur=h[h.length-2]; // último mês fechado
  const prev=h[h.length-3];
  const varRec=prev?((cur.receita-prev.receita)/prev.receita*100):0;
  const sd=saudeDoNegocio();
  const topSvc={};
  WORK.agenda.filter(a=>a.statusIdx===4).forEach(a=>{const s=svc(a.servicoId);topSvc[s.nome]=(topSvc[s.nome]||0)+agValor(a);});
  const prod=WORK.barbeiros.map(b=>({nome:b.apelido||b.nome,receita:prodBarbeiro(b).receita}));
  document.getElementById('view').innerHTML=
   '<div class="kpis">'+
    '<div class="kpi"><div class="lbl">Receita ('+cur.mes.slice(5)+'/'+cur.mes.slice(2,4)+')</div><div class="val">'+money(cur.receita)+'</div><div class="dt '+(varRec>=0?'up':'down')+'">'+(varRec>=0?'▲':'▼')+' '+Math.abs(varRec).toFixed(1)+'% vs mês anterior</div></div>'+
    '<div class="kpi"><div class="lbl">Atendimentos</div><div class="val">'+cur.atendimentos+'</div><div class="dt up">▲ ticket médio '+money(cur.ticket)+'</div></div>'+
    '<div class="kpi"><div class="lbl">Novos clientes</div><div class="val">'+cur.novosClientes+'</div><div class="dt">no mês fechado</div></div>'+
    '<div class="kpi"><div class="lbl">Saúde do Negócio</div><div class="val" style="color:'+sd.cor+'">'+sd.score+'</div><div class="dt" style="color:'+sd.cor+'">'+sd.label+'</div></div>'+
   '</div>'+
   '<div class="grid2">'+
    '<div class="panel"><h3>📈 Receita mensal</h3><div style="height:220px"><canvas id="chRec"></canvas></div></div>'+
    '<div class="panel"><h3>💈 Receita por barbeiro</h3><div style="height:220px"><canvas id="chBrb"></canvas></div></div>'+
   '</div>'+
   '<div class="panel"><h3>✂️ Serviços que mais faturam (período)</h3>'+
     Object.entries(topSvc).sort((a,b)=>b[1]-a[1]).map(e=>{
       const max=Math.max(...Object.values(topSvc));
       return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;font-size:13px"><div style="width:200px">'+esc(e[0])+'</div>'+
        '<div class="bar" style="flex:1;margin:0"><i style="width:'+Math.round(e[1]/max*100)+'%"></i></div><div style="width:110px;text-align:right;font-variant-numeric:tabular-nums">'+money(e[1])+'</div></div>';}).join('')+
   '</div>';
  const c=chartColors();
  softChart('chRec',{type:'line',data:{labels:h.map(m=>m.mes.slice(5)+'/'+m.mes.slice(2,4)),
    datasets:[{data:h.map(m=>m.receita),borderColor:c.acc,backgroundColor:'transparent',tension:.35,pointRadius:2,borderWidth:2}]}});
  softChart('chBrb',{type:'bar',data:{labels:prod.map(p=>p.nome),
    datasets:[{data:prod.map(p=>p.receita),backgroundColor:c.acc+'55',borderColor:c.acc,borderWidth:1,borderRadius:8,maxBarThickness:34}]}});
}

/* ===== ALAVANCAGEM (retenção · recuperação · aniversários · combos) ===== */
function renderAlavancagem(){
  killCharts();
  const recupe=WORK.clientes.filter(emRecuperacao);
  const nivers=WORK.clientes.filter(aniversarioMes);
  const semDesc=WORK.clientes.filter(c=>!c.descontoPrimeiroUsado);
  const freqCli=WORK.clientes.filter(c=>c.freqDias&&c.freqDias<=21);
  const msgRec=function(c){return 'Fala, '+c.nome.split(' ')[0]+'! 👊 Sentimos sua falta na '+WORK._cfg.barbearia+'. Que tal dar um trato no visual? Agendando esta semana, o pagamento antecipado tem '+WORK._cfg.descontoAntecipadoPct+'% off. 💈';};
  const msgNiver=function(c){return 'Parabéns, '+c.nome.split(' ')[0]+'! 🎂 A '+WORK._cfg.barbearia+' te deseja um ano incrível — e o presente é nosso: condição especial no seu próximo serviço. 🎁';};
  document.getElementById('view').innerHTML=
   '<div class="kpis">'+
    '<div class="kpi"><div class="lbl">Em recuperação</div><div class="val">'+recupe.length+'</div><div class="dt down">'+WORK._cfg.recuperacaoDias+'+ dias sem visita</div></div>'+
    '<div class="kpi"><div class="lbl">Aniversariantes do mês</div><div class="val">'+nivers.length+'</div><div class="dt up">▲ mensagens prontas</div></div>'+
    '<div class="kpi"><div class="lbl">5% do cadastro a usar</div><div class="val">'+semDesc.length+'</div><div class="dt">incentivo do 1º serviço</div></div>'+
    '<div class="kpi"><div class="lbl">Clientes de alta frequência</div><div class="val">'+freqCli.length+'</div><div class="dt up">▲ candidatos a combo/assinatura</div></div>'+
   '</div>'+
   '<div class="panel"><div class="head"><h3>🔔 Recuperação de clientes</h3><div class="sp"></div>'+
     (recupe.length?'<button class="b b-sm" onclick="alavDisparar('+recupe.length+')">Disparar campanha ('+recupe.length+')</button>':'')+'</div>'+
     '<div style="font-size:12px;color:var(--muted);margin:2px 0 12px">Cada botão abre o WhatsApp com a mensagem pronta e personalizada.</div>'+
     (recupe.map(c=>'<div class="alert" style="align-items:center"><div class="ai">💤</div><div class="at"><b>'+esc(c.nome)+'</b> — '+diasSem(c)+' dias sem visita.<br><span style="color:var(--muted);font-size:12px">“'+esc(msgRec(c))+'”</span></div><div style="flex:1"></div>'+waBtn(c.tel,msgRec(c))+'</div>').join('')||
      '<div style="color:var(--muted);font-size:13px">Ninguém sumido — base saudável. 👏</div>')+
   '</div>'+
   '<div class="panel"><div class="head"><h3>🎂 Aniversariantes do mês</h3><div class="sp"></div>'+
     (nivers.length?'<button class="b b-sm" onclick="alavDisparar('+nivers.length+')">Enviar felicitações</button>':'')+'</div>'+
     (nivers.map(c=>'<div class="alert" style="border-left-color:var(--warn);align-items:center"><div class="ai">🎂</div><div class="at"><b>'+esc(c.nome)+'</b> — '+dtBR(c.nasc).slice(0,5)+(aniversarioHoje(c)?' · <b style="color:var(--warn)">É HOJE!</b>':'')+'<br><span style="color:var(--muted);font-size:12px">“'+esc(msgNiver(c))+'”</span></div><div style="flex:1"></div>'+waBtn(c.tel,msgNiver(c))+'</div>').join('')||
      '<div style="color:var(--muted);font-size:13px">Sem aniversariantes neste mês.</div>')+
   '</div>'+
   '<div class="panel"><h3>🚀 Combos & promoções sugeridas (pela frequência real)</h3>'+
     '<div class="alert"><div class="ai">✂️</div><div class="at"><b>Assinatura Premium</b> — corte quinzenal + barba mensal por valor fixo: ideal para os '+freqCli.length+' clientes de alta frequência. Receita recorrente garantida.</div></div>'+
     '<div class="alert"><div class="ai">🎁</div><div class="at"><b>Combo corte + barba</b> já é o serviço com maior ticket — destacar no agendamento do app para elevar o ticket médio.</div></div>'+
     '<div class="alert"><div class="ai">💰</div><div class="at"><b>Antecipado '+WORK._cfg.descontoAntecipadoPct+'% off</b> — manter o incentivo: reduz no-show e garante caixa antes do atendimento.</div></div>'+
   '</div>';
}
function alavDisparar(n){toast('Use o botão WhatsApp de cada cliente para enviar agora. Disparo em massa automático entra no go-live ✓');}

/* ===== RELATÓRIOS (PDF elegante via impressão) ===== */
function renderRelatorios(){
  killCharts();
  const itens=[
    ['agenda','🗓 Agenda do dia','Atendimentos, status e pagamentos de hoje'],
    ['clientes','🤝 Base de clientes','Visitas, frequência e sinais de recuperação'],
    ['barbeiros','💈 Produtividade','Receita, comissão, gorjetas e avaliação por barbeiro'],
    ['financeiro','💳 Financeiro','Lançamentos do período + resultado'],
    ['estoque','📦 Estoque','Insumos e produtos, com itens críticos'],
    ['shop','🛍 SHOP','Pedidos e receita de produtos']
  ];
  document.getElementById('view').innerHTML=
   '<div class="panel"><h3>📄 Relatórios em PDF</h3>'+
    '<div style="font-size:13px;color:var(--muted);margin-bottom:14px">Papel timbrado '+esc(WORK._cfg.barbearia)+' · gerado pelo navegador (Imprimir → Salvar como PDF).</div>'+
    itens.map(i=>'<div class="veh"><div class="info"><div class="t">'+i[1]+'</div><div class="s">'+i[2]+'</div></div>'+
      '<button class="b b-sm" onclick="CRUD.report(\''+i[0]+'\')">Gerar PDF</button></div>').join('')+
   '</div>';
}
