/* ============================================================
   Barber Premium · VIZIO — theme.js (White-label / Camaleão)
   Aplica a identidade de cada barbearia (cor de acento, logo, nome).
   Padrão = VIZIO. Cada barbearia veste a própria marca (multi-tenant).
   Persistência local no piloto (bp_brand_v1); no go-live, backend.
   Depende de app.js (emblemSVG, toast, modal). Tema claro/escuro incluso.
   ============================================================ */
const VIZIO_BRAND={nome:"Barber Premium",accent:"#5aa0ff",logo:"vizio-symbol.png"};
const BKEY="bp_brand_v1";
/* logo VIZIO por tema: clara (traços claros) no escuro; navy no fundo branco */
function vizioLogo(){ return document.documentElement.classList.contains('theme-light')?'vizio-symbol-light.png':'vizio-symbol.png'; }
function reRenderEmblems(){ ['emblemLogin','emblemSide','emblemP'].forEach(function(id){
  var e=document.getElementById(id);
  if(e&&typeof emblemSVG==='function'&&(e.innerHTML||'').trim()){ e.innerHTML=emblemSVG();
    var c=e.firstElementChild; if(c)c.style.maxWidth=(id==='emblemSide'?'44px':id==='emblemP'?'76px':'120px'); }}); }

function shade(hex,pct){
  hex=(hex||'#5aa0ff').replace('#','');
  if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  let r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
  const f=pct/100, adj=v=> pct>=0 ? Math.round(v+(255-v)*f) : Math.round(v*(1+f));
  return '#'+[adj(r),adj(g),adj(b)].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
}

function applyTheme(b){
  b=b||VIZIO_BRAND;
  const acc=b.accent||VIZIO_BRAND.accent;
  const rs=document.documentElement.style;
  rs.setProperty('--gold-1',shade(acc,45));
  rs.setProperty('--gold-2',acc);
  rs.setProperty('--gold-3',shade(acc,-6));
  rs.setProperty('--gold-4',shade(acc,-30));
  rs.setProperty('--gold-5',shade(acc,-48));
  var custom=(b&&b.logo&&b.logo!==VIZIO_BRAND.logo&&b.logo!=='vizio-symbol-light.png'); window.__brandCustom=!!custom;
  window.BRAND_LOGO=custom?b.logo:vizioLogo();
  window.BRAND_NAME=b.nome||VIZIO_BRAND.nome;
  if(typeof WORK!=='undefined'&&WORK._cfg&&b.nome)WORK._cfg.barbearia=b.nome;
  reRenderEmblems();
  var bn=document.querySelector('.brand-name'); if(bn)bn.textContent=(window.BRAND_NAME||'Barber Premium').toUpperCase();
  var nm=document.querySelector('.side .logo-row .nm'); if(nm)nm.textContent=window.BRAND_NAME||'Barber Premium';
}
window.applyTheme=applyTheme;

/* ---------- tela de Identidade / Camaleão (admin master) ---------- */
function abrirMarca(){
  document.querySelectorAll('.nav a').forEach(function(x){x.classList.remove('active');});
  document.getElementById('pageTitle').textContent="Identidade da barbearia";
  document.getElementById('side').classList.remove('open');
  var q=document.getElementById('q'); if(q)q.value='';
  renderMarca();
}
window.abrirMarca=abrirMarca;

function renderMarca(){
  var nome=window.BRAND_NAME||"Barber Premium";
  var accent=getComputedStyle(document.documentElement).getPropertyValue('--gold-2').trim()||"#5aa0ff";
  var logo=window.BRAND_LOGO||"vizio-symbol.png";
  document.getElementById('view').innerHTML=
   '<div class="panel"><div class="head"><h3>🦎 Identidade da barbearia (Camaleão / white-label)</h3></div>'+
     '<div style="font-size:13px;color:var(--muted);margin-bottom:14px">Como admin master, vista o sistema com a marca desta barbearia — cor, logo e nome. Padrão: VIZIO. Multi-tenant: cada unidade tem a sua identidade, sem tocar em código.</div>'+
     '<div class="frow">'+
       '<div><label>Nome de exibição</label><input id="mk_nome" value="'+nome.replace(/"/g,"&quot;")+'"></div>'+
       '<div><label>Cor de acento</label><input id="mk_accent" type="color" value="'+(accent.indexOf("#")===0?accent:"#5aa0ff")+'" oninput="applyTheme({nome:document.getElementById(\'mk_nome\').value,accent:this.value,logo:window.BRAND_LOGO})" style="height:44px;padding:4px"></div>'+
     '</div>'+
     '<label>Logo (PNG/SVG com fundo transparente)</label><input id="mk_logo" type="file" accept="image/*">'+
     '<div style="display:flex;gap:14px;align-items:center;margin-top:16px">'+
       '<div style="width:88px;height:88px;border:1px solid var(--line);border-radius:16px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25)"><img id="mk_prev" src="'+logo+'" style="max-width:70px;max-height:70px"></div>'+
       '<div style="font-size:12px;color:var(--muted)">Prévia da logo. O acento é aplicado ao vivo enquanto você escolhe a cor.</div>'+
     '</div>'+
     '<div class="mact" style="justify-content:space-between;margin-top:20px"><button class="b b-ghost" onclick="resetMarca()">Restaurar VIZIO</button>'+
       '<button class="b" onclick="salvarMarca()">Salvar identidade</button></div>'+
   '</div>';
  var f=document.getElementById('mk_logo');
  if(f)f.onchange=function(){ var file=f.files&&f.files[0]; if(!file)return;
    var rd=new FileReader(); rd.onload=function(){ window.__logoData=rd.result;
      var img=document.getElementById('mk_prev'); if(img)img.src=rd.result; };
    rd.readAsDataURL(file); };
}
window.renderMarca=renderMarca;

function resetMarca(){ try{localStorage.removeItem(BKEY);}catch(e){}
  window.__logoData=null; applyTheme(VIZIO_BRAND);
  toast('Identidade padrão VIZIO restaurada'); renderMarca(); }
window.resetMarca=resetMarca;

function salvarMarca(){
  var nome=(document.getElementById('mk_nome')||{}).value||"Barber Premium";
  var accent=(document.getElementById('mk_accent')||{}).value||"#5aa0ff";
  var logo=window.__logoData||window.BRAND_LOGO||"vizio-symbol.png";
  var brand={nome:nome,accent:accent,logo:logo};
  try{localStorage.setItem(BKEY,JSON.stringify(brand));}catch(e){}
  applyTheme(brand);
  toast('Identidade da barbearia aplicada ✓');
  renderMarca();
}
window.salvarMarca=salvarMarca;

/* ---------- tema claro/escuro (VIZIO dark ↔ VIZIO light) ---------- */
function _themeGlyph(lit){ var t=document.getElementById('themeToggle'); if(t)t.textContent=lit?'☀':'◐'; }
function toggleTheme(){
  var lit=document.documentElement.classList.toggle('theme-light');
  try{ localStorage.setItem('bp_theme', lit?'light':'dark'); }catch(e){}
  _themeGlyph(lit);
  // troca a logo VIZIO conforme o tema (a menos que haja marca de cliente carregada)
  if(!window.__brandCustom){ window.BRAND_LOGO=vizioLogo(); reRenderEmblems(); }
  // re-renderiza a view atual p/ atualizar cores dos gráficos
  var t=(document.getElementById('pageTitle')||{}).textContent;
  if(t==='Dashboard Executivo'&&typeof renderDash==='function')renderDash();
  else if(t==='Financeiro'&&typeof renderFinanceiro==='function')renderFinanceiro();
}
window.toggleTheme=toggleTheme;
(function initTheme(){ try{
  /* AURA Clara é o padrão; AURA Noturna só se o usuário escolheu */
  var lit=localStorage.getItem('bp_theme')!=='dark';
  document.documentElement.classList.toggle('theme-light',lit); _themeGlyph(lit);
  var saved=null; try{saved=JSON.parse(localStorage.getItem(BKEY)||"null");}catch(e){}
  if(saved){ applyTheme(saved); }
  else if(!window.__brandCustom){ window.BRAND_LOGO=vizioLogo(); reRenderEmblems(); }
}catch(e){} })();
