/* ============================================================
   Barber Premium · VIZIO — app-crud.js
   CRUD por módulo (modal Novo/Editar/Excluir) · persist() com
   hook de backend (Apps Script) · PAYGATE (gateway de pagamento
   plugável — modo simulado até definir o provedor) · Relatórios.
   ============================================================ */

/* Hook de backend (Apps Script /exec). Vazio = modo demonstração. */
var API_URL="";

function persist(modulo,acao,registro,indice){
  if(!API_URL)return; // demo: só sessão
  try{
    fetch(API_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},
      body:JSON.stringify({modulo:modulo,acao:acao,registro:registro,indice:indice})});
  }catch(e){}
}
window.persist=persist;

/* ============================================================
   PAYGATE — camada de pagamento abstraída (decisão 05/07/2026:
   mecanismo pronto desde já; provedor plugado depois).
   Para ativar um provedor real: implementar PAYGATE.providers.stripe
   (ou pix/mercadopago) e trocar DADOS._cfg.gateway.
   ============================================================ */
const PAYGATE={
  providers:{
    simulado:{
      charge:function(p){ // p:{desc,valor,clienteId}
        return new Promise(function(res){
          modal('Pagamento — modo demonstração',
            'Gateway real (Stripe · Pix · Mercado Pago) é plugado no go-live sem mudar o sistema.',
            '<div class="alert"><div class="ai">💳</div><div class="at"><b>'+esc(p.desc)+'</b><br>Valor: <b>'+money(p.valor)+'</b></div></div>'+
            '<label>Forma (simulada)</label><select id="pg_forma"><option>Pix</option><option>Cartão de crédito</option><option>Cartão de débito</option></select>',
            function(){ var f=(document.getElementById('pg_forma')||{}).value||'Pix';
              closeModal(); toast('Pagamento aprovado ✓ via '+f+' (simulação)'); res({ok:true,provider:'simulado',forma:f}); },
            'Pagar '+money(p.valor));
          // cancelar fecha o modal e interrompe o fluxo (promise não resolvida) — comportamento intencional no demo.
        });
      }
    }
    /* stripe:{charge(p){...}}, pix:{charge(p){...}} — implementar no go-live */
  },
  charge:function(p){
    var g=(WORK._cfg&&WORK._cfg.gateway)||'simulado';
    var prov=this.providers[g]||this.providers.simulado;
    return prov.charge(p);
  }
};
window.PAYGATE=PAYGATE;

/* ============================================================
   SCHEMAS — campos por módulo
   tipo: text | number | money | date | time | select | textarea | check
   ============================================================ */
const SCHEMAS={
  clientes:{titulo:"Cliente",col:"clientes",campos:[
    ["nome","Nome","text"],["tel","Telefone","text"],["email","E-mail","text"],
    ["nasc","Nascimento","date"],["obs","Observações","textarea"]],
    novo:function(){return {id:uid('C'),cadastro:today(),visitas:0,ultimaVisita:null,freqDias:null,descontoPrimeiroUsado:false};},
    aposCriar:function(c){toast('Cliente cadastrado ✓ — '+WORK._cfg.descontoCadastroPct+'% de desconto disponível no 1º serviço 🎁');}},
  servicos:{titulo:"Serviço",col:"servicos",campos:[
    ["nome","Nome","text"],["categoria","Categoria","text"],
    ["preco","Preço (R$)","money"],["tempoMin","Duração (min)","number"],["ativo","Ativo","check"]],
    novo:function(){return {id:uid('S'),ativo:true};}},
  barbeiros:{titulo:"Barbeiro",col:"barbeiros",campos:[
    ["nome","Nome","text"],["apelido","Apelido","text"],
    ["comissaoPct","Comissão (%)","number"],["desde","Na equipe desde","date"],["ativo","Ativo","check"]],
    novo:function(){return {id:uid('B'),ativo:true,desde:today()};}},
  insumos:{titulo:"Insumo",col:"insumos",campos:[
    ["nome","Nome","text"],["fornecedor","Fornecedor","text"],["custo","Custo (R$)","money"],
    ["estoque","Estoque","number"],["minimo","Mínimo","number"],["unidade","Unidade","text"]],
    novo:function(){return {id:uid('I')};}},
  produtos:{titulo:"Produto (SHOP)",col:"produtos",campos:[
    ["nome","Nome","text"],["custo","Custo (R$)","money"],["preco","Preço de venda (R$)","money"],
    ["estoque","Estoque","number"],["minimo","Mínimo","number"],["ativo","Ativo","check"]],
    novo:function(){return {id:uid('P'),ativo:true};}},
  financeiro:{titulo:"Lançamento",col:"financeiro",campos:[
    ["data","Data","date"],["tipo","Tipo","select",["receita","despesa"]],
    ["categoria","Categoria","text"],["desc","Descrição","text"],["valor","Valor (R$)","money"]],
    novo:function(){return {id:uid('F'),data:today(),tipo:'receita'};}},
  notas:{titulo:"Nota fiscal",col:"notas",campos:[
    ["data","Data","date"],["clienteId","Cliente","selectRef","clientes"],
    ["valor","Valor (R$)","money"],["tipo","Tipo","select",["NFC-e","NFS-e"]]],
    novo:function(){var n=Math.max(100,...WORK.notas.map(x=>x.numero||100))+1;
      return {id:uid('N'),numero:n,data:today(),status:'Pendente',chave:''};}},
  agenda:{titulo:"Agendamento",col:"agenda",campos:[
    ["data","Data","date"],["hora","Hora","time"],
    ["clienteId","Cliente","selectRef","clientes"],["barbeiroId","Barbeiro","selectRef","barbeiros"],
    ["servicoId","Serviço","selectRef","servicos"],["obs","Observações","textarea"]],
    novo:function(){return {id:uid('A'),statusIdx:0,gorjeta:0,
      pagamento:{forma:'na hora',status:'pendente',valor:0,descontoPct:0}};},
    aposCriar:function(a){ if(!a.pagamento.valor)a.pagamento.valor=svc(a.servicoId).preco||0; }}
};

function _campoHTML(cp,val){
  var k=cp[0],lb=cp[1],tp=cp[2];
  var v=(val==null?'':val);
  if(tp==='textarea')return '<label>'+lb+'</label><textarea id="cf_'+k+'">'+esc(v)+'</textarea>';
  if(tp==='check')return '<label style="display:flex;align-items:center;gap:8px;margin-top:16px"><input type="checkbox" id="cf_'+k+'" style="width:auto" '+(v?'checked':'')+'> '+lb+'</label>';
  if(tp==='select')return '<label>'+lb+'</label><select id="cf_'+k+'">'+cp[3].map(o=>'<option'+(o===v?' selected':'')+'>'+o+'</option>').join('')+'</select>';
  if(tp==='selectRef'){var arr=WORK[cp[3]]||[];
    return '<label>'+lb+'</label><select id="cf_'+k+'">'+arr.map(o=>'<option value="'+o.id+'"'+(o.id===v?' selected':'')+'>'+esc(o.nome)+'</option>').join('')+'</select>';}
  var t=tp==='date'?'date':tp==='time'?'time':(tp==='number'||tp==='money')?'number':'text';
  var step=tp==='money'?' step="0.01"':'';
  return '<label>'+lb+'</label><input id="cf_'+k+'" type="'+t+'"'+step+' value="'+esc(v)+'">';
}
function _lerCampos(sc,alvo){
  sc.campos.forEach(function(cp){
    var k=cp[0],tp=cp[2],el=document.getElementById('cf_'+k); if(!el)return;
    var v=tp==='check'?el.checked:el.value;
    if(tp==='number')v=+v||0; if(tp==='money')v=+(+v||0).toFixed(2);
    alvo[k]=v;
  });
}
const CRUD={
  novo:function(mod){
    var sc=SCHEMAS[mod]; if(!sc)return;
    if(window.rbacCan&&!rbacCan(mod,true)){toast('Seu perfil não pode editar este módulo');return;}
    var base=sc.novo?sc.novo():{id:uid('X')};
    modal('Novo '+sc.titulo.toLowerCase(),'',
      '<div class="frow">'+sc.campos.map(c=>'<div style="'+(c[2]==='textarea'?'grid-column:1/-1':'')+'">'+_campoHTML(c,base[c[0]])+'</div>').join('')+'</div>',
      function(){ _lerCampos(sc,base); if(sc.campos.some(c=>c[0]==='nome')&&!base.nome){toast('Informe o nome');return;}
        WORK[sc.col].push(base); if(sc.aposCriar)sc.aposCriar(base);
        persist(sc.col,'create',base); closeModal(); toast(sc.titulo+' salvo ✓'); CRUD._rerender(mod); });
  },
  editar:function(mod,id){
    var sc=SCHEMAS[mod]; if(!sc)return;
    if(window.rbacCan&&!rbacCan(mod,true)){toast('Seu perfil não pode editar este módulo');return;}
    var reg=byId(WORK[sc.col],id); if(!reg.id)return;
    modal('Editar '+sc.titulo.toLowerCase(),'',
      '<div class="frow">'+sc.campos.map(c=>'<div style="'+(c[2]==='textarea'?'grid-column:1/-1':'')+'">'+_campoHTML(c,reg[c[0]])+'</div>').join('')+'</div>',
      function(){ _lerCampos(sc,reg); persist(sc.col,'update',reg,WORK[sc.col].indexOf(reg));
        closeModal(); toast(sc.titulo+' atualizado ✓'); CRUD._rerender(mod); });
  },
  del:function(mod,id){
    var sc=SCHEMAS[mod]; if(!sc)return;
    if(window.rbacCan&&!rbacCan(mod,true)){toast('Seu perfil não pode editar este módulo');return;}
    confirmar('Excluir este registro de <b>'+sc.titulo.toLowerCase()+'</b>? Essa ação não pode ser desfeita.',
      function(){ var idx=WORK[sc.col].findIndex(x=>x.id===id);
        if(idx>=0){var reg=WORK[sc.col][idx];WORK[sc.col].splice(idx,1);persist(sc.col,'delete',reg,idx);}
        closeModal(); toast('Registro excluído'); CRUD._rerender(mod); });
  },
  _rerender:function(mod){
    var f={clientes:renderClientes,servicos:renderServicos,barbeiros:renderBarbeiros,
      insumos:renderEstoque,produtos:renderEstoque,financeiro:renderFinanceiro,
      notas:renderNFe,agenda:renderAgenda}[mod];
    if(f)f();
  },

  /* ===== Relatório PDF (papel timbrado, via impressão) ===== */
  report:function(mod){
    var t=today();
    var head,rowsHtml,titulo;
    if(mod==='agenda'){titulo='Agenda — '+dtBR(t);head=['Hora','Cliente','Serviço','Barbeiro','Valor','Pgto','Status'];
      rowsHtml=WORK.agenda.filter(a=>a.data===t).sort((a,b)=>a.hora<b.hora?-1:1).map(a=>
        [a.hora,cli(a.clienteId).nome,svc(a.servicoId).nome,brb(a.barbeiroId).apelido||'',money(agValor(a)),a.pagamento.status,AG_STATUS[a.statusIdx]]);}
    else if(mod==='clientes'){titulo='Base de clientes';head=['Cliente','Telefone','Visitas','Última visita','Frequência'];
      rowsHtml=WORK.clientes.map(c=>[c.nome,c.tel||'',c.visitas||0,c.ultimaVisita?dtBR(c.ultimaVisita):'—',c.freqDias?('~'+c.freqDias+'d'):'—']);}
    else if(mod==='barbeiros'){titulo='Produtividade da equipe';head=['Barbeiro','Atendimentos','Receita','Comissão','Gorjetas','Avaliação'];
      rowsHtml=WORK.barbeiros.map(b=>{var p=prodBarbeiro(b);return [b.nome,p.atend,money(p.receita),money(p.comissao),money(p.gorjetas),p.nota?p.nota.toFixed(1):'—'];});}
    else if(mod==='financeiro'){titulo='Financeiro — lançamentos';head=['Data','Tipo','Categoria','Descrição','Valor'];
      rowsHtml=WORK.financeiro.slice().sort((a,b)=>a.data<b.data?-1:1).map(f=>[dtBR(f.data),f.tipo,f.categoria,f.desc,(f.tipo==='despesa'?'−':'')+money(f.valor)]);}
    else if(mod==='estoque'){titulo='Estoque — insumos e produtos';head=['Item','Tipo','Custo','Estoque','Mínimo','Situação'];
      rowsHtml=WORK.insumos.map(i=>[i.nome,'Insumo',money(i.custo),i.estoque+' '+(i.unidade||''),i.minimo,i.estoque<i.minimo?'REPOR':'OK'])
        .concat(WORK.produtos.map(p=>[p.nome,'Produto',money(p.custo),p.estoque,p.minimo,p.estoque<p.minimo?'REPOR':'OK']));}
    else if(mod==='shop'){titulo='SHOP — pedidos';head=['Data','Cliente','Itens','Valor','Status'];
      rowsHtml=WORK.pedidosShop.map(p=>[dtBR(p.data),cli(p.clienteId).nome,p.itens.map(i=>prd(i.produtoId).nome).join(' + '),money(p.pagamento.valor),p.status]);}
    else return;
    var w=window.open('','_blank');
    w.document.write('<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>'+titulo+'</title><style>'+
      'body{font-family:Century Gothic,CenturyGothic,AppleGothic,Inter,sans-serif;color:#101a2b;margin:40px}'+
      '.hd{display:flex;align-items:center;gap:16px;border-bottom:3px solid #1b3170;padding-bottom:14px;margin-bottom:8px}'+
      '.hd img{width:54px;height:54px}'+
      '.hd .n{font-size:20px;font-weight:700;letter-spacing:1px;color:#1b3170}'+
      '.hd .s{font-size:11px;color:#5a6675;letter-spacing:2px;text-transform:uppercase}'+
      'h2{font-size:16px;color:#1b3170;margin:18px 0 4px}'+
      '.meta{font-size:11px;color:#5a6675;margin-bottom:14px}'+
      'table{width:100%;border-collapse:collapse;font-size:12px}'+
      'th{text-align:left;background:#eef2f8;color:#1b3170;padding:8px 10px;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px}'+
      'td{padding:8px 10px;border-bottom:1px solid #e3e9f2}'+
      'tr:nth-child(even) td{background:#f8fafd}'+
      '.ft{margin-top:26px;padding-top:12px;border-top:1px solid #e3e9f2;font-size:10px;color:#93a0b2;display:flex;justify-content:space-between}'+
      '@media print{body{margin:16mm}}'+
      '</style></head><body>'+
      '<div class="hd"><img src="vizio-symbol-light.png"><div><div class="n">'+esc(WORK._cfg.barbearia).toUpperCase()+'</div>'+
      '<div class="s">Barber Premium · VIZIO — um produto INPERSON</div></div></div>'+
      '<h2>'+titulo+'</h2><div class="meta">Gerado em '+dtBR(t)+' às '+nowHM()+' · '+rowsHtml.length+' registro(s)</div>'+
      '<table><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
      rowsHtml.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+
      '</tbody></table>'+
      '<div class="ft"><span>'+esc(WORK._cfg.barbearia)+' — relatório gerado pelo Barber Premium</span><span>VIZIO · INPERSON — assinatura digital</span></div>'+
      '<script>window.onload=function(){setTimeout(function(){window.print();},350);};<\/script></body></html>');
    w.document.close();
  }
};
window.CRUD=CRUD;
