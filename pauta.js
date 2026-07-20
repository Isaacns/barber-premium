/* ============================================================
   Vizio Barber · pauta.js — MÓDULO AGENDA (padrão §16)
   Referência de UI e arrasto: Inovar (app-pauta.js). Aqui o módulo
   é aplicado ao dado real da barbearia: a "atividade" da pauta É o
   agendamento. Arrastar = remarcar — a ação mais cara do balcão vira
   um gesto, não um formulário (§15).

   Entrega os 6 itens da §16:
   1) semana à vista (Seg–Sáb, configurável)   2) Manhã/Tarde/Noite com contagem
   3) arrastar p/ outro dia ou período (§15)   4) clicar p/ editar, + p/ criar
   5) quadro de tarefas com cronometragem      6) faixa de foco do período atual

   Limitação assumida: o Vizio Barber ainda não tem backend (API_URL vazio),
   então a persistência é de sessão, igual ao resto do sistema. Quando entrar
   banco, `persist()` já é o ponto único de gravação — nada aqui muda.
   ============================================================ */
(function(){
"use strict";

/* ===== períodos do dia ===== */
var PERIODOS=[
  {k:'manha', nome:'Manhã', emoji:'🌅', ini:'00:00', fim:'11:59', padrao:'09:00'},
  {k:'tarde', nome:'Tarde', emoji:'☀️', ini:'12:00', fim:'17:59', padrao:'14:00'},
  {k:'noite', nome:'Noite', emoji:'🌙', ini:'18:00', fim:'23:59', padrao:'19:00'}
];
var DOW=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function hm(s){var p=String(s||'0:0').split(':');return (+p[0]||0)*60+(+p[1]||0);}
function hhmm(m){m=Math.max(0,Math.min(24*60-1,Math.round(m)));
  return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function P(k){for(var i=0;i<PERIODOS.length;i++)if(PERIODOS[i].k===k)return PERIODOS[i];return PERIODOS[0];}
function periodoDe(hora){var m=hm(hora);
  for(var i=0;i<PERIODOS.length;i++){if(m>=hm(PERIODOS[i].ini)&&m<=hm(PERIODOS[i].fim))return PERIODOS[i].k;}
  return 'noite';}
function periodoAgora(){return periodoDe(nowHM());}

/* ===== datas ===== */
function d2iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function iso2d(s){return new Date(s+'T12:00:00');}
function addDias(iso,n){var d=iso2d(iso);d.setDate(d.getDate()+n);return d2iso(d);}
function segundaDa(iso){var d=iso2d(iso),dw=d.getDay();d.setDate(d.getDate()+(dw===0?-6:1-dw));return d2iso(d);}
/* Dias exibidos: configuração, não código novo (§16). Barbearia atende sábado. */
function diasDaSemana(seg){
  var cfg=(WORK._cfg&&WORK._cfg.diasSemana)||[1,2,3,4,5,6], out=[];
  for(var i=0;i<7;i++){ var iso=addDias(seg,i), dw=iso2d(iso).getDay();
    if(cfg.indexOf(dw)>=0) out.push(iso); }
  return out;
}

/* ===== estado da visão ===== */
var AGV={view:'dia', seg:null, abertos:{}};
function chave(d,p){return d+'|'+p;}

/* ===== CSS do módulo (auto-contido, para portar a outro sistema) ===== */
function injectCSS(){
  if(document.getElementById('pauta-css'))return;
  var c=
  ".ptabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}"+
  ".pfoco{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-radius:14px;margin-bottom:14px;"+
    "background:linear-gradient(135deg,var(--halo),transparent);border:1px solid var(--line);font-size:13px}"+
  ".pfoco b{color:var(--gold-2)}"+
  ".pweek{display:grid;gap:12px;overflow-x:auto;padding-bottom:6px;grid-auto-flow:column;grid-auto-columns:minmax(210px,1fr)}"+
  "@media(max-width:760px){.pweek{grid-auto-columns:minmax(240px,86vw)}}"+
  ".pday{background:var(--panel-2);border:1px solid var(--line);border-radius:16px;padding:10px;min-width:0}"+
  ".pday.hoje{border-color:var(--gold-2);box-shadow:0 0 0 1px var(--gold-2) inset,0 10px 26px var(--halo)}"+
  ".pday-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}"+
  ".pday-h .dw{font-family:var(--display);font-weight:800;font-size:13px}"+
  ".pday-h .dd{font-size:11.5px;color:var(--muted)}"+
  ".pday-h .sp{flex:1}"+
  ".pday-add{border:1px dashed var(--line);background:transparent;color:var(--gold-2);border-radius:9px;cursor:pointer;"+
    "font:inherit;font-size:13px;font-weight:700;line-height:1;padding:5px 9px}"+
  ".pday-add:hover{border-color:var(--gold-2);background:var(--halo)}"+
  ".pper{border:1px solid transparent;border-radius:12px;margin-bottom:6px;transition:.15s}"+
  ".pper.drop-ok{border:1.5px dashed var(--gold-2);background:var(--halo)}"+
  ".pper-h{display:flex;align-items:center;gap:7px;cursor:pointer;padding:6px 8px;border-radius:9px;font-size:12px;color:var(--muted);user-select:none}"+
  ".pper-h:hover{background:var(--halo)}"+
  ".pper-h b{color:var(--txt);font-weight:700}"+
  ".pper-h .agora{font-size:9.5px;letter-spacing:.8px;text-transform:uppercase;font-weight:800;color:var(--gold-2);"+
    "border:1px solid var(--gold-1);border-radius:99px;padding:2px 7px}"+
  ".pper-h .cv{margin-left:auto;font-size:10px;opacity:.7}"+
  ".pper-b{padding:2px 4px 6px}"+
  ".pvazio{font-size:11.5px;color:var(--dim);padding:4px 6px 8px}"+
  ".pcard{position:relative;background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--gold-2);"+
    "border-radius:12px;padding:9px 30px 9px 10px;margin-bottom:7px;cursor:grab;transition:.15s}"+
  ".pcard:hover{border-color:var(--gold-1);transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.18)}"+
  ".pcard.dragging{opacity:.45;cursor:grabbing}"+
  ".pc-h{display:flex;align-items:center;gap:6px;margin-bottom:3px}"+
  ".pc-hora{font-family:var(--display);font-weight:800;font-size:12px;color:var(--gold-2)}"+
  ".pc-cli{font-weight:700;font-size:13px;line-height:1.25}"+
  ".pc-svc{font-size:11px;color:var(--muted);margin-top:2px;line-height:1.35}"+
  ".pc-mv{position:absolute;top:7px;right:6px;width:22px;height:22px;border-radius:7px;border:1px solid var(--line);"+
    "background:var(--panel-2);color:var(--muted);cursor:pointer;font-size:11px;line-height:1;padding:0}"+
  ".pc-mv:hover{color:var(--gold-2);border-color:var(--gold-2)}"+
  ".pboard{display:grid;gap:12px;grid-template-columns:repeat(3,1fr)}"+
  "@media(max-width:760px){.pboard{grid-template-columns:1fr}}"+
  ".pcol{background:var(--panel-2);border:1px solid var(--line);border-radius:16px;padding:10px;min-height:120px;transition:.15s}"+
  ".pcol.drop-ok{border:1.5px dashed var(--gold-2);background:var(--halo)}"+
  ".pcol-h{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);padding:2px 4px 8px}"+
  ".pcol-h b{color:var(--txt);font-size:13px}"+
  ".ptar{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--gold-2);border-radius:12px;"+
    "padding:10px;margin-bottom:8px;cursor:grab;transition:.15s}"+
  ".ptar:hover{border-color:var(--gold-1);transform:translateY(-1px)}"+
  ".ptar.dragging{opacity:.45;cursor:grabbing}"+
  ".ptar .t{font-weight:700;font-size:13px}"+
  ".ptar .m{font-size:11px;color:var(--muted);margin-top:3px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}"+
  ".ptar .acts{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}";
  var s=document.createElement('style');s.id='pauta-css';s.textContent=c;document.head.appendChild(s);
}

/* ===== trilha (mover é alteração de dado, não de pixel — §15) ===== */
function trilha(acao,detalhe){
  if(!WORK._trilha)WORK._trilha=[];
  WORK._trilha.push({quando:new Date().toISOString(),quem:(typeof SESSION!=='undefined'&&SESSION&&SESSION.nome)||'—',acao:acao,detalhe:detalhe});
}

/* ===== encaixe inteligente ===== */
function duracao(a){return (svc(a.servicoId).tempoMin)||30;}
function ocupado(data,barbeiroId,ini,dur,ignorar){
  return WORK.agenda.some(function(x){
    if(x.id===ignorar||x.data!==data||x.barbeiroId!==barbeiroId)return false;
    if(x.statusIdx===5||x.statusIdx===6)return false;           // no-show/cancelado não bloqueiam
    var xi=hm(x.hora),xd=(svc(x.servicoId).tempoMin)||30;
    return ini<xi+xd && xi<ini+dur;
  });
}
/* Ao mudar de período o horário é reescrito para o padrão daquele período (§15):
   o item chega coerente, não com hora da manhã dentro da noite. */
function horaDeEncaixe(a,data,pk){
  var cfg=WORK._cfg||{}, per=P(pk), dur=duracao(a);
  var abre=hm(cfg.horaAbre||'09:00'), fecha=hm(cfg.horaFecha||'20:00');
  var ini=Math.max(hm(per.padrao),abre,hm(per.ini));
  var limite=Math.min(hm(per.fim)+1,fecha);
  for(var m=ini;m+dur<=limite;m+=30){ if(!ocupado(data,a.barbeiroId,m,dur,a.id)) return {hora:hhmm(m),folga:true}; }
  return {hora:hhmm(Math.min(ini,Math.max(abre,limite-dur))),folga:false};
}

/* ===== mover (arrasto e menu compartilham o mesmo caminho) ===== */
function mover(id,data,pk){
  var a=byId(WORK.agenda,id); if(!a.id)return;
  if(a.data===data && periodoDe(a.hora)===pk) return;            // soltar no mesmo lugar não faz nada
  if(a.statusIdx>=3 && a.statusIdx!==5){ toast('Atendimento já iniciado/concluído não é remarcado por arrasto.'); return; }
  var de=dtBR(a.data)+' '+a.hora, enc=horaDeEncaixe(a,data,pk);
  var eraConfirmado=(a.statusIdx>=1);
  a.data=data; a.hora=enc.hora;
  persist('agenda','update',a);
  trilha('agenda:mover',{id:a.id,de:de,para:dtBR(data)+' '+a.hora,periodo:P(pk).nome});
  toast(enc.folga?('Remarcado para '+dtBR(data)+' às '+a.hora+' ✓'):('Remarcado para '+dtBR(data)+' às '+a.hora+' — agenda cheia neste período, confira o encaixe.'));
  render();
  if(eraConfirmado) avisarCliente(a);
}
/* Remarcou o que o cliente já tinha confirmado? O cliente precisa saber — §12 (WhatsApp). */
function avisarCliente(a){
  var c=cli(a.clienteId), b=brb(a.barbeiroId), s=svc(a.servicoId);
  var nome=(WORK._cfg&&WORK._cfg.barbearia)||'Vizio Barber';
  var msg='Olá, '+((c.nome||'').split(' ')[0])+'! Aqui é da '+nome+'. Precisamos ajustar o seu horário: '+
    'ficou para '+dtBR(a.data)+' às '+a.hora+' — '+(s.nome||'serviço')+' com '+(b.apelido||b.nome||'nosso barbeiro')+
    '. Fica bom para você? 💈';
  modal('Horário remarcado','O cliente já tinha confirmado — vale avisar agora.',
    '<div style="font-size:13.5px;line-height:1.55;color:var(--muted)">'+esc(c.nome)+' passou para <b style="color:var(--gold-2)">'+
      dtBR(a.data)+' às '+a.hora+'</b>.</div><div style="margin-top:14px">'+waBtn(c.tel,msg,'Avisar no WhatsApp')+'</div>',
    function(){closeModal();},'Fechar');
}

/* ===== drag & drop (§15) ===== */
var ARRASTANDO=null;
function limpar(){ Array.prototype.forEach.call(document.querySelectorAll('.drop-ok'),function(e){e.classList.remove('drop-ok');}); }
var PAUTA={
  /* --- agendamentos --- */
  dragAg:function(ev,id){
    ARRASTANDO={tipo:'ag',id:id};
    try{ ev.dataTransfer.setData('text/agid',id); ev.dataTransfer.setData('text/plain','agid:'+id); }catch(_){}
    ev.dataTransfer.effectAllowed='move';
    ev.currentTarget.classList.add('dragging');
  },
  dragTar:function(ev,id){
    ARRASTANDO={tipo:'tar',id:id};
    try{ ev.dataTransfer.setData('text/tarid',id); ev.dataTransfer.setData('text/plain','tarid:'+id); }catch(_){}
    ev.dataTransfer.effectAllowed='move';
    ev.currentTarget.classList.add('dragging');
  },
  dragEnd:function(ev){ ARRASTANDO=null; ev.currentTarget.classList.remove('dragging'); limpar(); },
  over:function(ev,el,tipo){ if(!ARRASTANDO||ARRASTANDO.tipo!==tipo)return; ev.preventDefault();
    ev.dataTransfer.dropEffect='move'; el.classList.add('drop-ok'); },
  leave:function(el){ el.classList.remove('drop-ok'); },
  /* A zona que recebe um tipo que não entende IGNORA o drop — nunca adivinha (§15). */
  dropAg:function(ev,el){
    ev.preventDefault(); el.classList.remove('drop-ok');
    var id=''; try{ id=ev.dataTransfer.getData('text/agid'); }catch(_){}
    if(!id){ var p=''; try{p=ev.dataTransfer.getData('text/plain')||'';}catch(_){}
      if(p.indexOf('agid:')===0) id=p.slice(5); }
    if(!id)return;
    mover(id, el.getAttribute('data-d'), el.getAttribute('data-p'));
  },
  dropTar:function(ev,el){
    ev.preventDefault(); el.classList.remove('drop-ok');
    var id=''; try{ id=ev.dataTransfer.getData('text/tarid'); }catch(_){}
    if(!id){ var p=''; try{p=ev.dataTransfer.getData('text/plain')||'';}catch(_){}
      if(p.indexOf('tarid:')===0) id=p.slice(6); }
    if(!id)return;
    tarSet(id, Number(el.getAttribute('data-s')));
  },
  /* --- caminhos equivalentes ao arrasto (o toque não dispara drag HTML5) --- */
  moverMenu:function(id){
    var a=byId(WORK.agenda,id); if(!a.id)return;
    var seg=AGV.seg||segundaDa(today()), dias=diasDaSemana(seg);
    if(dias.indexOf(a.data)<0) dias=dias.concat([a.data]).sort();
    modal('Mover atendimento','Mesmo resultado do arrastar — para quem está no celular.',
      '<label>Dia</label><select id="pmv_d">'+dias.map(function(d){
        return '<option value="'+d+'"'+(d===a.data?' selected':'')+'>'+DOW[iso2d(d).getDay()]+' · '+dtBR(d)+(d===today()?' (hoje)':'')+'</option>';}).join('')+'</select>'+
      '<label>Período</label><select id="pmv_p">'+PERIODOS.map(function(p){
        return '<option value="'+p.k+'"'+(p.k===periodoDe(a.hora)?' selected':'')+'>'+p.emoji+' '+p.nome+'</option>';}).join('')+'</select>'+
      '<div style="font-size:11.5px;color:var(--muted);margin-top:12px">O horário é reescrito para o primeiro encaixe livre do barbeiro naquele período.</div>',
      function(){ var d=document.getElementById('pmv_d').value,p=document.getElementById('pmv_p').value; closeModal(); mover(id,d,p); },'Mover');
  },
  abrir:function(id){ if(window.CRUD&&CRUD.editar)CRUD.editar('agenda',id); },
  /* o "+" do dia abre o cadastro já com aquele dia preenchido */
  novo:function(d){
    if(!(window.CRUD&&CRUD.novo))return;
    CRUD.novo('agenda');
    var el=document.getElementById('cf_data'); if(el&&d)el.value=d;
    var h=document.getElementById('cf_hora'); if(h&&!h.value)h.value=(WORK._cfg&&WORK._cfg.horaAbre)||'09:00';
  },
  toggle:function(d,p){ var k=chave(d,p); AGV.abertos[k]=!aberto(d,p); render(); },
  semana:function(n){ AGV.seg=(n===0)?segundaDa(today()):addDias(AGV.seg||segundaDa(today()),n*7); render(); },
  ver:function(v){ AGV.view=v; render(); },
  pausa:function(){ if(window.BEM&&BEM.testar)BEM.testar(); },
  tarSet:function(id,s){ tarSet(id,s); },
  tarNova:function(){
    modal('Nova tarefa','Tarefas internas da barbearia — o que precisa acontecer hoje.',
      '<label>O que precisa ser feito</label><input id="ptar_t" placeholder="Ex.: Repor lâminas e toalhas">'+
      '<label>Responsável</label><select id="ptar_r"><option value="">— sem responsável —</option>'+
        WORK.barbeiros.map(function(b){return '<option value="'+b.id+'">'+esc(b.apelido||b.nome)+'</option>';}).join('')+'</select>',
      function(){
        var t=(document.getElementById('ptar_t').value||'').trim();
        if(!t){toast('Escreva o que precisa ser feito.');return;}
        if(!WORK.tarefas)WORK.tarefas=[];
        var nova={id:uid('T'),titulo:t,respId:document.getElementById('ptar_r').value||'',status:0,
                  criado:new Date().toISOString(),inicio:null,fim:null,hist:[]};
        WORK.tarefas.push(nova); persist('tarefas','create',nova); trilha('tarefa:criar',{id:nova.id,titulo:t});
        closeModal(); toast('Tarefa criada ✓'); render();
      },'Criar');
  }
};
window.PAUTA=PAUTA;

/* ===== tarefas: status + cronometragem ===== */
var TSTATUS=['Pendente','Em andamento','Concluída'];
function tarSet(id,s){
  if(!WORK.tarefas)WORK.tarefas=[];
  var t=byId(WORK.tarefas,id); if(!t.id)return;
  if(t.status===s)return;                                        // soltar no mesmo lugar não faz nada
  var de=t.status, agora=new Date().toISOString();
  t.status=s;
  if(s===1&&!t.inicio)t.inicio=agora;
  if(s===2)t.fim=agora;
  if(s<2)t.fim=null;
  if(s===0){t.inicio=null;}
  if(!t.hist)t.hist=[];
  t.hist.push({de:TSTATUS[de],para:TSTATUS[s],quando:agora,quem:(typeof SESSION!=='undefined'&&SESSION&&SESSION.nome)||'—'});
  persist('tarefas','update',t); trilha('tarefa:mover',{id:t.id,de:TSTATUS[de],para:TSTATUS[s]});
  toast('“'+t.titulo+'” → '+TSTATUS[s]);
  render();
}
function dur2txt(ini,fim){
  if(!ini)return '';
  var ms=(fim?new Date(fim):new Date()).getTime()-new Date(ini).getTime();
  var min=Math.max(0,Math.round(ms/60000));
  return min<60?(min+' min'):(Math.floor(min/60)+'h'+(min%60?String(min%60).padStart(2,'0'):''));
}

/* ===== quem abre por padrão =====
   O período atual vem aberto; os passados recolhem. A tela abre já focada
   no que importa agora (§16), sem esconder o que ainda vai acontecer. */
function aberto(d,p){
  var k=chave(d,p);
  if(k in AGV.abertos) return AGV.abertos[k];
  var t=today();
  if(d<t) return false;
  if(d>t) return true;
  var ordem=['manha','tarde','noite'];
  return ordem.indexOf(p)>=ordem.indexOf(periodoAgora());
}

/* ===== render: semana ===== */
function cardAg(a){
  var c=cli(a.clienteId),b=brb(a.barbeiroId),s=svc(a.servicoId);
  var lc=['var(--warn)','var(--gold-2)','var(--warn)','var(--gold-2)','var(--ok)','var(--bad)','var(--dim)'][a.statusIdx]||'var(--gold-2)';
  return '<div class="pcard" style="border-left-color:'+lc+'" draggable="true"'+
    ' ondragstart="PAUTA.dragAg(event,\''+a.id+'\')" ondragend="PAUTA.dragEnd(event)"'+
    ' onclick="PAUTA.abrir(\''+a.id+'\')" title="Clique para editar · arraste para remarcar">'+
    '<button class="pc-mv" title="Mover (sem arrastar)" onclick="event.stopPropagation();PAUTA.moverMenu(\''+a.id+'\')">⇄</button>'+
    '<div class="pc-h"><span class="pc-hora">'+a.hora+'</span>'+agStatusBadge(a.statusIdx)+'</div>'+
    '<div class="pc-cli">'+esc(c.nome||'—')+'</div>'+
    '<div class="pc-svc">'+esc(s.nome||'—')+' · '+(s.tempoMin||30)+' min · 💈 '+esc(b.apelido||b.nome||'—')+'</div>'+
  '</div>';
}
function colunaDia(d,itens){
  var hoje=(d===today()), pa=periodoAgora();
  var blocos=PERIODOS.map(function(p){
    var ls=itens.filter(function(a){return periodoDe(a.hora)===p.k;}).sort(function(x,y){return x.hora<y.hora?-1:1;});
    var ab=aberto(d,p.k), agora=(hoje&&p.k===pa);
    return '<div class="pper" data-d="'+d+'" data-p="'+p.k+'"'+
      ' ondragover="PAUTA.over(event,this,\'ag\')" ondragleave="PAUTA.leave(this)" ondrop="PAUTA.dropAg(event,this)">'+
      '<div class="pper-h" onclick="PAUTA.toggle(\''+d+'\',\''+p.k+'\')">'+p.emoji+' <b>'+p.nome+'</b> '+
        (ls.length?('<span>('+ls.length+')</span>'):'<span style="opacity:.5">(0)</span>')+
        (agora?' <span class="agora">agora</span>':'')+'<span class="cv">'+(ab?'▾':'▸')+'</span></div>'+
      (ab?('<div class="pper-b">'+(ls.map(cardAg).join('')||'<div class="pvazio">Livre — solte um atendimento aqui.</div>')+'</div>'):'')+
    '</div>';
  }).join('');
  return '<div class="pday'+(hoje?' hoje':'')+'">'+
    '<div class="pday-h"><div><div class="dw">'+DOW[iso2d(d).getDay()]+(hoje?' · hoje':'')+'</div>'+
      '<div class="dd">'+dtBR(d).slice(0,5)+' · '+itens.length+' atend.</div></div><div class="sp"></div>'+
      '<button class="pday-add" title="Novo atendimento neste dia" onclick="PAUTA.novo(\''+d+'\')">+</button></div>'+
    blocos+'</div>';
}
function faixaFoco(){
  var pa=P(periodoAgora()), t=today();
  var restam=WORK.agenda.filter(function(a){return a.data===t&&a.statusIdx<4&&a.statusIdx!==5&&periodoDe(a.hora)===pa.k;}).length;
  return '<div class="pfoco">'+pa.emoji+' Agora é <b>'+pa.nome+'</b> — foque nas atividades deste período.'+
    '<span style="color:var(--muted)">'+(restam?(restam+' atendimento(s) à frente hoje neste período.'):'Nada pendente neste período. 😌')+'</span>'+
    '<div style="flex:1"></div><button class="b b-ghost b-sm" onclick="PAUTA.pausa()">🌱 Fazer uma pausa</button></div>';
}
function tabs(){
  function t(v,lbl){return '<button class="b '+(AGV.view===v?'':'b-ghost')+' b-sm" onclick="PAUTA.ver(\''+v+'\')">'+lbl+'</button>';}
  return '<div class="ptabs">'+t('dia','📋 Dia')+t('semana','🗓 Semana')+t('tarefas','✅ Tarefas')+'</div>';
}
function renderSemana(){
  var seg=AGV.seg||(AGV.seg=segundaDa(today()));
  var dias=diasDaSemana(seg);
  var ini=dias[0], fim=dias[dias.length-1];
  var cols=dias.map(function(d){
    return colunaDia(d, WORK.agenda.filter(function(a){return a.data===d;}));
  }).join('');
  document.getElementById('view').innerHTML=
    tabs()+faixaFoco()+
    '<div class="panel"><div class="head"><h3>🗓 Semana de '+dtBR(ini).slice(0,5)+' a '+dtBR(fim).slice(0,5)+'</h3><div class="sp"></div>'+
      '<button class="b b-ghost b-sm" onclick="PAUTA.semana(-1)">‹</button>'+
      '<button class="b b-sm" onclick="PAUTA.semana(0)">Hoje</button>'+
      '<button class="b b-ghost b-sm" onclick="PAUTA.semana(1)">›</button></div>'+
      '<div class="pweek">'+cols+'</div>'+
      '<div style="font-size:11.5px;color:var(--muted);margin-top:12px">Arraste o cartão para outro dia ou período para remarcar — '+
      'o horário se encaixa sozinho no primeiro espaço livre do barbeiro. No celular, use o botão <b>⇄</b> do cartão.</div>'+
    '</div>';
}

/* ===== render: quadro de tarefas ===== */
function cardTar(t){
  var r=t.respId?brb(t.respId):null;
  var acts=[];
  if(t.status!==0)acts.push('<button class="b b-ghost b-sm" onclick="PAUTA.tarSet(\''+t.id+'\','+(t.status-1)+')">↩ Voltar</button>');
  if(t.status===0)acts.push('<button class="b b-sm" onclick="PAUTA.tarSet(\''+t.id+'\',1)">▶ Iniciar</button>');
  if(t.status===1)acts.push('<button class="b b-sm" onclick="PAUTA.tarSet(\''+t.id+'\',2)">✓ Concluir</button>');
  var crono='';
  if(t.status===1&&t.inicio)crono='<span class="badge b-info">⏱ '+dur2txt(t.inicio,null)+' em andamento</span>';
  if(t.status===2&&t.inicio)crono='<span class="badge b-ok">⏱ levou '+dur2txt(t.inicio,t.fim)+'</span>';
  return '<div class="ptar" draggable="true" ondragstart="PAUTA.dragTar(event,\''+t.id+'\')" ondragend="PAUTA.dragEnd(event)">'+
    '<div class="t">'+esc(t.titulo)+'</div>'+
    '<div class="m">'+(r&&r.id?'<span>💈 '+esc(r.apelido||r.nome)+'</span>':'<span style="color:var(--dim)">sem responsável</span>')+crono+
      ((t.hist&&t.hist.length)?'<span style="color:var(--dim)">'+t.hist.length+' movimento(s)</span>':'')+'</div>'+
    '<div class="acts">'+acts.join('')+'</div></div>';
}
function renderTarefas(){
  if(!WORK.tarefas)WORK.tarefas=[];
  var cols=[0,1,2].map(function(s){
    var ls=WORK.tarefas.filter(function(t){return t.status===s;});
    return '<div class="pcol" data-s="'+s+'" ondragover="PAUTA.over(event,this,\'tar\')" ondragleave="PAUTA.leave(this)" ondrop="PAUTA.dropTar(event,this)">'+
      '<div class="pcol-h"><b>'+['🕒 Pendente','⚙️ Em andamento','✅ Concluída'][s]+'</b><span>('+ls.length+')</span></div>'+
      (ls.map(cardTar).join('')||'<div class="pvazio">Solte uma tarefa aqui.</div>')+'</div>';
  }).join('');
  var feitas=WORK.tarefas.filter(function(t){return t.status===2&&t.inicio&&t.fim;});
  var media=feitas.length?Math.round(feitas.reduce(function(s,t){return s+(new Date(t.fim)-new Date(t.inicio));},0)/feitas.length/60000):0;
  document.getElementById('view').innerHTML=
    tabs()+faixaFoco()+
    '<div class="panel"><div class="head"><h3>✅ Tarefas da barbearia</h3><div class="sp"></div>'+
      '<button class="b b-sm" onclick="PAUTA.tarNova()">+ Nova tarefa</button></div>'+
      '<div class="pboard">'+cols+'</div>'+
      '<div style="font-size:11.5px;color:var(--muted);margin-top:12px">Arraste entre as colunas — cada etapa é cronometrada e fica no histórico da tarefa. '+
      (feitas.length?('Tempo médio de execução: <b style="color:var(--gold-2)">'+(media<60?media+' min':Math.floor(media/60)+'h'+String(media%60).padStart(2,'0'))+'</b>.'):'')+
      '</div></div>';
}

/* ===== integração com a tela Agenda existente ===== */
var _agendaDia = renderAgenda;                 // guarda a visão Dia original
function render(){ renderAgenda(); }
renderAgenda = function(q){
  injectCSS();
  if(AGV.view==='semana'){ renderSemana(); return; }
  if(AGV.view==='tarefas'){ renderTarefas(); return; }
  _agendaDia(q);
  var v=document.getElementById('view');
  if(v) v.insertAdjacentHTML('afterbegin', tabs()+faixaFoco());
};
})();
