/* ================= VERSIÓN WEB: cuentas, datos en Supabase y grupos ================= */
const SB_OK=!!(window.supabase&&window.SUPA_URL&&window.SUPA_KEY&&!/TU_PROYECTO|TU_CLAVE/.test(window.SUPA_URL+window.SUPA_KEY));
const SB=SB_OK?window.supabase.createClient(window.SUPA_URL,window.SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const MEDIA_BASE=(window.SUPA_URL||"").replace(/\/$/,"")+"/storage/v1/object/public/media/";
function blobUrl(id){id=String(id||"");return id.includes("/")?MEDIA_BASE+id.split("/").map(encodeURIComponent).join("/"):"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="}
Object.assign(S,{uid:null,email:"",metaName:"",groups:[],groupsLoaded:false,gid:null,gtab:"resumen",gData:null,gLoading:false,gMember:null,gNew:false});
const myName=()=>String(S.plan.displayName||S.metaName||(S.email||"").split("@")[0]||"Trader").trim().slice(0,40)||"Trader";
const fin=x=>typeof x==="number"&&isFinite(x)?Math.round(x*1000)/1000:null;
const ago=t=>{const s=(Date.now()-new Date(t).getTime())/1000;if(!isFinite(s))return "";if(s<60)return "ahora";if(s<3600)return `hace ${Math.floor(s/60)} min`;if(s<86400)return `hace ${Math.floor(s/3600)} h`;return `hace ${Math.floor(s/86400)} d`};
const initial=n=>esc((String(n||"?").trim()[0]||"?").toUpperCase());

/* ---------- acceso ---------- */
function authHTML(mode,msg,err){
  const m=mode||"login";
  return `<div class="authbox" role="dialog" aria-modal="true" aria-labelledby="authTitle">
    <div class="authbrand"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--surface2)"/><path d="M9 8v16M16 6v20M23 10v12" stroke="var(--accent)" stroke-width="2"/><rect x="6.5" y="12" width="5" height="8" rx="1" fill="var(--win)"/><rect x="13.5" y="9" width="5" height="9" rx="1" fill="var(--loss)"/><rect x="20.5" y="13" width="5" height="6" rx="1" fill="var(--win)"/></svg><span>Bitácora de Trading</span></div>
    <h1 id="authTitle">${m==="signup"?"Crea tu cuenta":m==="reset"?"Recupera tu contraseña":m==="newpass"?"Elige una contraseña nueva":"Entra en tu bitácora"}</h1>
    <p class="hint">${m==="signup"?"Tu diario, tu plan y tu camino hacia la rentabilidad. Solo tú ves tus datos, salvo lo que decidas compartir con tus grupos.":m==="reset"?"Te enviaremos un enlace a tu correo para elegir una nueva.":m==="newpass"?"Escríbela dos veces para no equivocarte.":"Registra cada día, cumple tus normas y compártelo con tus amigos."}</p>
    <form id="authForm" class="authform" data-mode="${m}" novalidate>
      ${m==="signup"?`<label class="field"><span>Tu nombre</span><input type="text" id="aName" autocomplete="name" placeholder="Cómo te verán en tus grupos" required></label>`:""}
      ${m!=="newpass"?`<label class="field"><span>Correo</span><input type="email" id="aEmail" autocomplete="email" placeholder="tu@correo.com" required></label>`:""}
      ${m!=="reset"?`<label class="field"><span>Contraseña</span><input type="password" id="aPass" autocomplete="${m==="login"?"current-password":"new-password"}" placeholder="${m==="login"?"":"Mínimo 8 caracteres"}" required></label>`:""}
      ${m==="newpass"?`<label class="field"><span>Repite la contraseña</span><input type="password" id="aPass2" autocomplete="new-password" required></label>`:""}
      ${msg?`<p class="authmsg ${err?"err":""}" role="status">${esc(msg)}</p>`:""}
      <button type="submit" class="btn primary authgo">${m==="signup"?"Crear cuenta":m==="reset"?"Enviar enlace":m==="newpass"?"Guardar contraseña":"Entrar"}</button>
    </form>
    <div class="authalt">${m==="login"?`<button type="button" class="linkbtn" data-auth="signup">Crear una cuenta</button><button type="button" class="linkbtn" data-auth="reset">He olvidado mi contraseña</button>`:m==="newpass"?"":`<button type="button" class="linkbtn" data-auth="login">Ya tengo cuenta: entrar</button>`}</div>
  </div>`;
}
function showAuth(mode,msg,err){const el=$("#auth");el.innerHTML=authHTML(mode,msg,err);el.hidden=false;const f=el.querySelector("input");if(f)setTimeout(()=>f.focus(),30)}
function hideAuth(){$("#auth").hidden=true;$("#auth").innerHTML=""}
function authError(e){const m=String(e&&e.message||e||"");
  if(/Invalid login/i.test(m))return "Correo o contraseña incorrectos.";
  if(/Email not confirmed/i.test(m))return "Tienes que confirmar tu correo: abre el enlace que te hemos enviado.";
  if(/already registered|already exists/i.test(m))return "Ya hay una cuenta con ese correo. Prueba a entrar.";
  if(/Password should be|at least/i.test(m))return "La contraseña es demasiado corta: usa al menos 8 caracteres.";
  if(/rate limit|too many/i.test(m))return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
  if(/fetch|network/i.test(m))return "No hay conexión con el servidor. Revisa tu internet.";
  return "No se ha podido completar: "+m;}
function waitForLogin(initialMode){
  return new Promise(resolve=>{
    showAuth(initialMode||"login");
    const el=$("#auth");
    el.addEventListener("click",e=>{const b=e.target.closest("[data-auth]");if(b)showAuth(b.dataset.auth)});
    el.addEventListener("submit",async e=>{
      e.preventDefault();const f=e.target,mode=f.dataset.mode,btn=f.querySelector(".authgo");
      const v=id=>{const x=document.getElementById(id);return x?x.value.trim():""};
      const email=v("aEmail"),pass=document.getElementById("aPass")?document.getElementById("aPass").value:"";
      btn.disabled=true;btn.textContent="Un momento…";
      try{
        if(mode==="login"){const {data,error}=await SB.auth.signInWithPassword({email,password:pass});if(error)throw error;hideAuth();resolve(data.session)}
        else if(mode==="signup"){const name=v("aName");if(!name||!email||pass.length<8){showAuth("signup","Rellena tu nombre, tu correo y una contraseña de al menos 8 caracteres.",true);return}
          const {data,error}=await SB.auth.signUp({email,password:pass,options:{data:{name},emailRedirectTo:location.origin+location.pathname}});if(error)throw error;
          if(data.session){hideAuth();resolve(data.session)}else showAuth("login","Cuenta creada. Te hemos enviado un correo: abre el enlace para confirmarla y después entra aquí.")}
        else if(mode==="reset"){const {error}=await SB.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;showAuth("login","Si existe una cuenta con ese correo, te llegará un enlace en unos minutos.")}
        else if(mode==="newpass"){const p2=document.getElementById("aPass2").value;if(pass.length<8||pass!==p2){showAuth("newpass","Las contraseñas no coinciden o tienen menos de 8 caracteres.",true);return}
          const {error}=await SB.auth.updateUser({password:pass});if(error)throw error;const {data}=await SB.auth.getSession();hideAuth();resolve(data.session)}
      }catch(err){showAuth(mode,authError(err),true)}
    });
  });
}
async function webBoot(){
  if(!SB){showAuth("login","Falta conectar la base de datos: rellena config.js con los datos de tu proyecto de Supabase.",true);$("#auth").querySelector("form").hidden=true;return new Promise(()=>{})}
  let recovering=false;
  SB.auth.onAuthStateChange((ev)=>{if(ev==="PASSWORD_RECOVERY"){recovering=true;showAuth("newpass")}else if(ev==="SIGNED_OUT"&&S.uid)location.reload()});
  let {data:{session}}=await SB.auth.getSession();
  if(!session||/type=recovery/.test(location.hash)||recovering)session=await waitForLogin(/type=recovery/.test(location.hash)||recovering?"newpass":"login");
  if(location.hash&&/access_token|type=/.test(location.hash))history.replaceState(null,"",location.pathname);
  S.uid=session.user.id;S.email=session.user.email||"";S.metaName=(session.user.user_metadata||{}).name||"";
  const db=makeDB(S.uid);
  db.ready().then(()=>{setTimeout(async()=>{await loadGroups();S.groupsLoaded=true;if(S.view==="grupo")render();publishAll()},1500)}).catch(()=>{});
  return {db,assets:makeAssets(S.uid)};
}

/* ---------- guardado: misma interfaz que usaba la bitácora ---------- */
function makeDB(me){
  const store={},listeners={},docListeners={};
  const mkErr=e=>({code:/JWT|auth|permission|row-level/i.test(e&&e.message||"")?"invalid_argument":"unavailable",message:(e&&e.message)||String(e)});
  const snap=(id,data)=>({id,exists:data!==undefined,data:()=>data,metadata:{fromCache:false,hasPendingWrites:false}});
  const loaded=(async()=>{let from=0;const size=1000;for(;;){const {data,error}=await SB.from("docs").select("col,id,data").range(from,from+size-1);if(error)throw mkErr(error);data.forEach(r=>{(store[r.col]=store[r.col]||{})[r.id]=r.data});if(data.length<size)break;from+=size}})();
  const emit=(col,changes)=>(listeners[col]||[]).forEach(fn=>fn({docChanges:()=>changes,metadata:{hasPendingWrites:false}}));
  const fireDoc=(col,id)=>(docListeners[col+"/"+id]||[]).forEach(fn=>fn(snap(id,(store[col]||{})[id])));
  try{SB.channel("docs-"+me).on("postgres_changes",{event:"*",schema:"public",table:"docs",filter:`user_id=eq.${me}`},p=>{
    const row=(p.new&&p.new.col)?p.new:p.old;if(!row||!row.col||(row.user_id&&row.user_id!==me))return;
    if(p.eventType==="DELETE"){if(store[row.col])delete store[row.col][row.id];emit(row.col,[{type:"removed",doc:snap(row.id,undefined)}])}
    else{(store[row.col]=store[row.col]||{})[row.id]=p.new.data;emit(row.col,[{type:"modified",doc:snap(row.id,p.new.data)}])}
    fireDoc(row.col,row.id);
  }).subscribe()}catch(e){}
  const ref=(col,id)=>({id,path:col+"/"+id,
    async set(data){const {error}=await SB.from("docs").upsert({user_id:me,col,id,data,updated_at:new Date().toISOString()});if(error)throw mkErr(error);(store[col]=store[col]||{})[id]=data},
    async update(data){const cur=(store[col]||{})[id]||{};return this.set(Object.assign({},cur,data))},
    async delete(){const {error}=await SB.from("docs").delete().eq("user_id",me).eq("col",col).eq("id",id);if(error)throw mkErr(error);if(store[col])delete store[col][id]},
    async get(){await loaded;return snap(id,(store[col]||{})[id])},
    onSnapshot(next,onErr){const k=col+"/"+id;(docListeners[k]=docListeners[k]||[]).push(next);loaded.then(()=>next(snap(id,(store[col]||{})[id]))).catch(e=>onErr&&onErr(e));return()=>{}}});
  return{
    doc(path){const [c,i]=String(path).split("/");return ref(c,i)},
    collection(col){return{path:col,doc:id=>ref(col,id||uid()),onSnapshot(next,onErr){(listeners[col]=listeners[col]||[]).push(next);loaded.then(()=>next({docChanges:()=>Object.entries(store[col]||{}).map(([id,d])=>({type:"added",doc:snap(id,d)})),metadata:{hasPendingWrites:false}})).catch(e=>onErr&&onErr(e));return()=>{}}}},
    ready:()=>loaded,all:()=>store,
    async bulk(rows){for(let i=0;i<rows.length;i+=200){const {error}=await SB.from("docs").upsert(rows.slice(i,i+200).map(r=>Object.assign({user_id:me,updated_at:new Date().toISOString()},r)));if(error)throw mkErr(error)}}
  };
}
function makeAssets(uid){
  const EXT={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","video/mp4":"mp4","video/webm":"webm"};
  return{
    async upload(blob,opts){const type=(opts&&opts.type)||blob.type||"image/jpeg";if(!EXT[type])throw{code:"unsupported_type",message:type};if(blob.size>20*1024*1024)throw{code:"too_large",message:"20 MB"};
      const path=`${uid}/${(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))}.${EXT[type]}`;
      const {error}=await SB.storage.from("media").upload(path,blob,{contentType:type,upsert:false,cacheControl:"31536000"});
      if(error)throw{code:/size|large|exceed/i.test(error.message)?"too_large":/quota/i.test(error.message)?"quota_or_state":"upstream_error",message:error.message};
      return{id:path,url:blobUrl(path),sizeBytes:blob.size,contentType:type}},
    async delete(id){if(!String(id).startsWith(uid+"/"))return{deleted:false};const {error}=await SB.storage.from("media").remove([id]);return{deleted:!error}},
    async list(){return{assets:[],usage:{}}}
  };
}

/* ---------- qué comparto con cada grupo ---------- */
const SHARE_DEFAULTS={stats:true,streaks:true,discipline:true,trades:true,tradeNotes:false,shots:false,amounts:false,lessons:false,goals:false,vision:false};
const SHARE_OPTS=[
  ["stats","Resultados","Número de operaciones, % de ganadas y tu resultado"],
  ["streaks","Constancia","Días seguidos apuntando, días cumpliendo tus normas y tu camino"],
  ["discipline","Normas","Días perfectos y las normas que más te saltas"],
  ["trades","Operaciones","Qué operaste, si ganaste o perdiste y si cumpliste tus normas"],
  ["tradeNotes","Notas de las operaciones","Por qué entraste, cómo te sentías y qué salió mal"],
  ["shots","Capturas de las operaciones","Las fotos que subes en cada operación"],
  ["amounts","Resultados en dinero","Los € de cada operación"],
  ["lessons","Mis apuntes","Lo que vas aprendiendo"],
  ["goals","Mis metas","Tus 3 metas y el porcentaje de tu camino"],
  ["vision","Tablero de sueños","Las fotos de tus sueños"]];
const shareCfg=gid=>Object.assign({},SHARE_DEFAULTS,S.share[gid]||{});
function buildSnapshot(gid){
  const c=shareCfg(gid),out={name:myName(),updatedAt:Date.now(),cfg:c},ph=phases(),all=allTrades();
  if(c.streaks)out.streaks={log:ph.logStreak,clean:ph.cleanStreak,ritual:streak(readOn),day:Math.max(1,diffDays(S.plan.startDate||todayStr(),todayStr())+1),phase:{n:ph.cur+1,of:ph.P.length,name:ph.P[ph.cur].name,done:ph.road.done,total:ph.road.total}};
  if(c.stats){const m=metrics(all),t=todayStr(),wk=metrics(all.filter(x=>x.date>=mondayOf(t))),mo=metrics(all.filter(x=>x.date.slice(0,7)===t.slice(0,7)));const eq=[];let cum=0;all.forEach(x=>{const r=tradeR(x);if(r!=null){cum+=r;eq.push(Math.round(cum*100)/100)}});
    const rt=x=>c.amounts&&x.hasMoney?fmtMoney(x.money):x.nr?fmtR(x.total):(x.wins||x.losses)?`${plural(x.wins,"ganada","ganadas")}, ${plural(x.losses,"perdida","perdidas")}`:"—",rv=x=>c.amounts&&x.hasMoney?x.money:x.nr?x.total:x.wins-x.losses;
    out.stats={n:m.n,nr:m.nr,total:fin(m.total),win:fin(m.win),exp:fin(m.exp),follow:fin(m.followRate),week:fin(wk.total),weekN:wk.n,month:fin(mo.total),monthN:mo.n,equity:eq.slice(-80),
      wins:m.wins,losses:m.losses,winPct:fin(m.winPct),resTxt:rt(m),resV:fin(rv(m)),monthTxt:rt(mo),monthV:fin(rv(mo)),weekTxt:rt(wk),weekV:fin(rv(wk)),outs:all.slice(-30).map(outcome)}}
  if(c.discipline){const lg=Object.keys(S.days).filter(isLogged),br={};lg.forEach(d=>brokenIds(S.days[d]).forEach(id=>br[id]=(br[id]||0)+1));out.discipline={clean:lg.filter(isClean).length,logged:lg.length,broken:Object.entries(br).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,n])=>[ruleText(id),n])}}
  if(c.trades)out.trades=all.slice(-40).reverse().map(t=>{const o={id:t.id||[t.date,t.time,t.asset].join("-"),date:t.date,time:t.time||"",asset:t.asset||"",dir:t.dir||"",account:t.account||"Demo",setup:t.setup||"",r:fin(tradeR(t)),outcome:outcome(t),followed:t.followed||""};
    if(c.tradeNotes){o.why=cut(t.why,600);o.emotion=t.emotion||"";o.errors=t.errors||[];o.mistakes=cut(t.mistakes,400)}
    if(c.amounts&&money(t)!=null)o.money=money(t);
    if(c.shots)o.shots=(t.media||[]).filter(m=>String(m.id).includes("/")&&m.type!=="video").slice(0,4).map(m=>blobUrl(m.id));
    return o});
  if(c.lessons)out.lessons=lessons().slice(0,12).map(l=>({title:l.title||"",course:l.course||"",num:l.num||"",date:l.date||"",level:l.level||"",tags:l.tags||[],concepts:cut(l.concepts,500)}));
  if(c.goals){const R=roadState();out.goals={long:S.plan.goals.long.filter(x=>x.trim()),done:R.done,total:R.total}}
  if(c.vision)out.vision=S.plan.vision.filter(v=>String(v.id).includes("/")).slice(0,8).map(v=>({url:blobUrl(v.id),caption:v.caption||""}));
  return out;
}
let pubTimer=null;
function schedulePublish(){if(!SB||!S.uid)return;clearTimeout(pubTimer);pubTimer=setTimeout(publishAll,5000)}
async function publishAll(only){if(!SB||!S.uid)return;for(const g of S.groups){if(only&&g.id!==only)continue;try{await SB.from("shares").upsert({group_id:g.id,user_id:S.uid,data:buildSnapshot(g.id),updated_at:new Date().toISOString()})}catch(e){}}}

/* ---------- grupos ---------- */
async function loadGroups(){
  if(!SB)return;
  const {data,error}=await SB.from("group_members").select("group_id,display_name,groups(id,name,invite_code,created_by)").eq("user_id",S.uid);
  if(error){setStatus("No se han podido cargar tus grupos",true);return}
  S.groups=(data||[]).filter(r=>r.groups).map(r=>({id:r.groups.id,name:r.groups.name,code:r.groups.invite_code,owner:r.groups.created_by===S.uid,myName:r.display_name}));
  if(!S.groups.find(g=>g.id===S.gid))S.gid=S.groups.length?S.groups[0].id:null;
}
async function loadGroupData(gid){
  const [m,s,c]=await Promise.all([
    SB.from("group_members").select("user_id,display_name,joined_at").eq("group_id",gid),
    SB.from("shares").select("user_id,data,updated_at").eq("group_id",gid),
    SB.from("comments").select("id,author,target_user,target_ref,body,created_at").eq("group_id",gid).order("created_at",{ascending:true}).limit(500)]);
  S.gData={gid,members:m.data||[],shares:Object.fromEntries((s.data||[]).map(r=>[r.user_id,r])),comments:c.data||[],at:Date.now(),error:!!(m.error||s.error)};
}
const curGroup=()=>S.groups.find(g=>g.id===S.gid)||null;
const memberName=uid=>{if(uid===S.uid)return myName();const m=(S.gData&&S.gData.members||[]).find(x=>x.user_id===uid);return m?m.display_name:"Alguien"};
function shareOf(uid){if(uid===S.uid)return{data:buildSnapshot(S.gid),updated_at:new Date().toISOString(),me:true};return S.gData&&S.gData.shares[uid]||null}
function sparkSVG(eq,big){
  if(!eq||eq.length<2)return big?`<p class="empty">La curva aparece con 2 operaciones o más.</p>`:"";
  const pts=[0].concat(eq),W=big?640:220,H=big?200:56,P=big?28:4;let mn=Math.min(...pts),mx=Math.max(...pts);if(mx-mn<1){mx+=.5;mn-=.5}
  const x=i=>P+(W-2*P)*i/(pts.length-1),y=v=>P/2+(H-P)*(mx-v)/(mx-mn);
  const line=pts.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" "),last=pts[pts.length-1],col=last>=0?"var(--win)":"var(--loss)";
  return `<svg class="spark${big?" big":""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de resultado: ${fmtR(last)}">${big?`<line x1="${P}" x2="${W-P}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line-strong)" stroke-dasharray="3 4"/><text x="${P}" y="${H-4}" font-size="11" fill="var(--muted)">Operación 1</text><text x="${W-P}" y="${H-4}" font-size="11" fill="var(--muted)" text-anchor="end">Operación ${pts.length-1} · ${fmtR(last)}</text>`:""}<path d="${line} L${x(pts.length-1)} ${y(mn)} L${x(0)} ${y(mn)} Z" fill="${col}" fill-opacity=".1"/><path d="${line}" fill="none" stroke="${col}" stroke-width="${big?2:1.6}" stroke-linejoin="round"/><circle cx="${x(pts.length-1)}" cy="${y(last)}" r="${big?4:2.6}" fill="${col}"/></svg>`;
}
const rTxt=v=>v==null?"—":fmtR(v);
function memberCard(uid){
  const sh=shareOf(uid),d=sh&&sh.data||null,nm=memberName(uid),me=uid===S.uid;
  const kv=[];
  if(d&&d.streaks)kv.push(["Días seguidos apuntando",d.streaks.log],["Días cumpliendo normas",d.streaks.clean],["Camino",`Fase ${d.streaks.phase.n}/${d.streaks.phase.of}`]);
  if(d&&d.stats)kv.push(["Operaciones",d.stats.n],["Ganadas",d.stats.winPct==null?"—":Math.round(d.stats.winPct*100)+"%"],["Este mes",d.stats.monthTxt||rTxt(d.stats.month),d.stats.monthV!=null?d.stats.monthV:d.stats.month]);
  return `<button type="button" class="mcard" data-act="gMember" data-u="${uid}">
    <div class="mhead"><span class="avatar">${initial(nm)}</span><span class="mname"><b>${esc(nm)}</b>${me?`<span class="youchip">Tú</span>`:""}<span class="hint">${me?"Así te ven":sh?"Actualizado "+ago(sh.updated_at):"Aún no ha compartido nada"}</span></span></div>
    ${d&&d.stats&&d.stats.outs&&d.stats.outs.length?`<div class="dots">${d.stats.outs.map(o=>`<i class="dot ${o||"none"}"></i>`).join("")}</div>`:""}
    ${kv.length?`<div class="mkv">${kv.map(([k,v,n])=>`<span><i>${k}</i><b class="${typeof n==="number"?(n>0?"pos":n<0?"neg":""):""}">${v}</b></span>`).join("")}</div>`:`<p class="hint" style="margin:0">${me?"No compartes datos con este grupo. Cámbialo en «Qué comparto».":"Este miembro no comparte estadísticas."}</p>`}
  </button>`;
}
function tradeFeedItem(t,owner,showOwner){
  const o=t.outcome||(t.r>0?"win":t.r<0?"loss":t.r===0?"be":""),r=o==="win"?1:o==="loss"?-1:0,cms=(S.gData.comments||[]).filter(c=>c.target_user===owner&&c.target_ref===t.id),key=owner+"|"+t.id;
  return `<article class="fitem ${r>0?"w":r<0?"l":""}">
    <header class="fhead">${showOwner?`<span class="avatar sm">${initial(memberName(owner))}</span><b>${esc(memberName(owner))}</b>`:""}<span class="hint">${esc(fmtDM(t.date))}${t.time?" · "+esc(t.time):""}</span></header>
    <div class="ftrade"><b class="fasset">${esc(t.asset||"Operación")}</b>${t.dir?`<span class="dirchip ${t.dir==="Long"?"up":"down"}">${t.dir==="Long"?"Compra":"Venta"}</span>`:""}<span class="gt">${esc(ACC_LABEL[t.account]||t.account)}</span>${t.setup?`<span class="gt">${esc(t.setup)}</span>`:""}<span class="rpill ${r>0?"w":r<0?"l":""}">${o?OUT_LABEL[o]:"Sin resultado"}</span>${t.r!=null?`<span class="mono hint">${fmtR(t.r)}</span>`:""}${t.money!=null?`<span class="mono hint">${fmtMoney(t.money)}</span>`:""}${t.followed==="si"?`<span class="planok">Cumplió sus normas</span>`:t.followed==="no"?`<span class="planko">Se saltó sus normas</span>`:""}</div>
    ${t.why?`<p class="fnote"><i>Por qué entró</i>${esc(t.why)}</p>`:""}
    ${t.emotion||(t.errors&&t.errors.length)?`<div class="chips">${t.emotion?`<span class="gt">Se sentía: ${esc((EMO_SIMPLE.find(x=>x[0]===t.emotion)||[0,t.emotion])[1])}</span>`:""}${(t.errors||[]).map(e=>`<span class="gt err">${esc(ERR_LABEL[e]||e)}</span>`).join("")}</div>`:""}
    ${t.mistakes?`<p class="fnote"><i>Qué haría distinto</i>${esc(t.mistakes)}</p>`:""}
    ${t.shots&&t.shots.length?`<div class="media sm">${t.shots.map(u=>`<div class="mitem"><img src="${esc(u)}" alt="Captura de la operación" data-act="zoom" loading="lazy"></div>`).join("")}</div>`:""}
    <div class="fcomments">${cms.map(c=>`<div class="cmt"><span class="avatar xs">${initial(memberName(c.author))}</span><div><b>${esc(memberName(c.author))}</b> <span class="hint">${ago(c.created_at)}</span>${c.author===S.uid?` <button type="button" class="linkbtn sm" data-act="gDelComment" data-id="${c.id}">Borrar</button>`:""}<p>${esc(c.body)}</p></div></div>`).join("")}
      <div class="cmtnew"><input type="text" data-cm="${esc(key)}" placeholder="Comenta esta operación…" maxlength="1000" aria-label="Escribe un comentario"><button type="button" class="btn sm" data-act="gComment" data-u="${owner}" data-r="${esc(t.id)}">Enviar</button></div></div>
  </article>`;
}
function groupIntro(){
  return `<section class="card ghero"><div class="card-h"><span class="when">Grupos con amigos</span><h2>Entrenad juntos, cada uno a su ritmo</h2></div>
    <p class="hint">Comparte con tus amigos tus resultados, tus operaciones y lo que quieras. Tú eliges qué se ve y qué no en cada grupo; tu diario sigue siendo privado.</p>
    <div class="gforms">
      <div class="gform"><h3 class="sub">Crear un grupo</h3><input type="text" id="gName" placeholder="Ej.: Traders del barrio" maxlength="60"><button type="button" class="btn primary" data-act="gCreate">Crear grupo</button></div>
      <div class="gform"><h3 class="sub">Unirme con un código</h3><input type="text" id="gCode" placeholder="Ej.: 7F3K9QXA" maxlength="12" style="text-transform:uppercase"><button type="button" class="btn" data-act="gJoin">Unirme</button></div>
    </div>
    <p class="hint">Te unirás con el nombre «${esc(myName())}». Puedes cambiarlo en «Mi plan» → Cuenta.</p></section>`;
}
function viewGroup(){
  if(!SB)return `<section class="card"><p class="empty">Los grupos necesitan la base de datos conectada.</p></section>`;
  if(!S.groupsLoaded){if(!S.gLoading){S.gLoading=true;loadGroups().then(()=>{S.groupsLoaded=true;S.gLoading=false;render()})}return `<section class="card"><p class="hint">Cargando tus grupos…</p></section>`}
  if(!S.groups.length||S.gNew)return (S.groups.length?`<div class="row"><button type="button" class="btn sm ghost" data-act="gNewToggle">← Volver a mis grupos</button></div>`:"")+groupIntro();
  const g=curGroup();
  const stale=!S.gData||S.gData.gid!==g.id||Date.now()-S.gData.at>45000;
  if(stale&&!S.gLoading){S.gLoading=true;loadGroupData(g.id).catch(()=>{S.gData={gid:g.id,members:[],shares:{},comments:[],at:Date.now(),error:true}}).finally(()=>{S.gLoading=false;render()})}
  let h=`${S.groups.length>1?`<div class="chips">${S.groups.map(x=>`<button type="button" class="chipbtn tagf" data-act="gPick" data-id="${x.id}" aria-pressed="${x.id===g.id}">${esc(x.name)}</button>`).join("")}</div>`:""}
  <section class="card ghead"><div class="card-h"><span class="when">Grupo${g.owner?" · lo creaste tú":""}</span><h2>${esc(g.name)}</h2><span class="aside">${S.gData&&S.gData.gid===g.id?S.gData.members.length+" miembro"+(S.gData.members.length===1?"":"s"):""}</span></div>
    <div class="invite"><span class="hint">Código para invitar</span><code id="inviteCode">${esc(g.code)}</code><button type="button" class="btn sm" data-act="gCopy">Copiar</button><span class="hint">Pásaselo a tu amigo: entra en «Grupo» → «Unirme con un código».</span></div>
    <div class="row"><button type="button" class="btn sm" data-act="gRefresh">Actualizar</button><button type="button" class="btn sm ghost" data-act="gNewToggle">Crear o unirme a otro grupo</button><button type="button" class="btn sm ghost danger" style="margin-left:auto" data-act="gLeave">${S.confirm==="gleave"?"¿Salir del grupo? Sí":"Salir del grupo"}</button></div>
  </section>`;
  if(!S.gData||S.gData.gid!==g.id)return h+`<section class="card"><p class="hint">Cargando el grupo…</p></section>`;
  if(S.gMember)return h+memberDetail(S.gMember);
  h+=`<div class="subnav" role="tablist">${[["resumen","Resumen"],["ops","Operaciones"],["comparto","Qué comparto"]].map(([k,l])=>`<button type="button" role="tab" data-act="gTab" data-v="${k}" aria-selected="${S.gtab===k}">${l}</button>`).join("")}</div>`;
  const uids=S.gData.members.map(m=>m.user_id);if(!uids.includes(S.uid))uids.push(S.uid);
  if(S.gtab==="resumen"){
    const sorted=uids.slice().sort((a,b)=>{const A=(shareOf(a)||{}).data||{},B=(shareOf(b)||{}).data||{};return ((B.streaks||{}).clean||0)-((A.streaks||{}).clean||0)||((B.stats||{}).month||0)-((A.stats||{}).month||0)});
    h+=`<div class="mgrid">${sorted.map(memberCard).join("")}</div>`;
    if(uids.length<2)h+=`<section class="card"><p class="hint" style="margin:0">Todavía estás solo en este grupo. Pásale el código <b class="mono">${esc(g.code)}</b> a tu amigo para que se una.</p></section>`;
  }else if(S.gtab==="ops"){
    const items=[];uids.forEach(u=>{const d=(shareOf(u)||{}).data;(d&&d.trades||[]).forEach(t=>items.push([t,u]))});
    items.sort((a,b)=>(b[0].date+b[0].time).localeCompare(a[0].date+a[0].time));
    h+=items.length?`<div class="feed">${items.slice(0,60).map(([t,u])=>tradeFeedItem(t,u,true)).join("")}</div>`:`<section class="card"><p class="empty">Nadie ha compartido operaciones todavía. Las tuyas aparecerán aquí si activas «Operaciones» en «Qué comparto».</p></section>`;
  }else{
    const c=shareCfg(g.id);
    h+=`<section class="card"><div class="card-h"><span class="when">Privacidad</span><h2>Qué comparto con «${esc(g.name)}»</h2></div>
      <p class="hint">Tu diario completo es privado. Al grupo solo le llega lo que actives aquí, y puedes cambiarlo cuando quieras. Cada grupo tiene sus propios ajustes.</p>
      <div class="toggles">${SHARE_OPTS.map(([k,l,d])=>`<label class="tgl"><span><b>${l}</b><span class="hint">${d}</span></span><input type="checkbox" role="switch" data-share="${k}" ${c[k]?"checked":""}><i aria-hidden="true"></i></label>`).join("")}</div>
      ${fld("Mi nombre en este grupo",`<input type="text" data-gname="1" value="${esc(g.myName)}" maxlength="40">`)}
      <div class="row"><button type="button" class="btn" data-act="gMember" data-u="${S.uid}">Ver cómo me ven</button></div>
    </section>`;
  }
  return h;
}
function memberDetail(uid){
  const sh=shareOf(uid),d=sh&&sh.data||{},nm=memberName(uid);
  let h=`<div class="row"><button type="button" class="btn sm ghost" data-act="gBack">← Volver al grupo</button></div>
  <section class="card"><div class="mhead big"><span class="avatar lg">${initial(nm)}</span><span class="mname"><b>${esc(nm)}</b><span class="hint">${uid===S.uid?"Así te ve tu grupo con tus ajustes actuales":sh?"Actualizado "+ago(sh.updated_at):"Aún no ha compartido nada"}</span></span></div>`;
  if(d.streaks)h+=`<div class="stats"><div class="stat"><span class="k">Días seguidos apuntando</span><span class="v">${d.streaks.log}</span><span class="s">días</span></div><div class="stat"><span class="k">Días seguidos cumpliendo normas</span><span class="v">${d.streaks.clean}</span></div><div class="stat"><span class="k">Leyendo sus metas</span><span class="v">${d.streaks.ritual}</span><span class="s">días seguidos</span></div><div class="stat"><span class="k">Camino</span><span class="v">${d.streaks.phase.n}/${d.streaks.phase.of}</span><span class="s">${esc(d.streaks.phase.name)} · ${d.streaks.phase.done} de ${d.streaks.phase.total} pasos</span></div></div>`;
  h+=`</section>`;
  if(d.stats)h+=`<section class="card"><div class="card-h"><h2>Resultados</h2></div><div class="stats">
    <div class="stat"><span class="k">Operaciones</span><span class="v">${d.stats.n}</span></div>
    <div class="stat"><span class="k">Resultado total</span><span class="v ${(d.stats.resV||0)>0?"pos":(d.stats.resV||0)<0?"neg":""}">${d.stats.resTxt||rTxt(d.stats.total)}</span></div>
    <div class="stat"><span class="k">Este mes</span><span class="v ${(d.stats.monthV||0)>0?"pos":(d.stats.monthV||0)<0?"neg":""}">${d.stats.monthTxt||rTxt(d.stats.month)}</span><span class="s">${d.stats.monthN} operaciones</span></div>
    <div class="stat"><span class="k">Ganadas</span><span class="v">${d.stats.winPct==null?"—":Math.round(d.stats.winPct*100)+"%"}</span><span class="s">${d.stats.wins||0} ganadas · ${d.stats.losses||0} perdidas</span></div>
    <div class="stat"><span class="k">Cumpliendo sus normas</span><span class="v">${d.stats.follow==null?"—":Math.round(d.stats.follow*100)+"%"}</span></div></div>${sparkSVG(d.stats.equity,true)}</section>`;
  if(d.discipline)h+=`<section class="card"><div class="card-h"><h2>Normas</h2><span class="aside">${d.discipline.clean} días perfectos de ${d.discipline.logged}</span></div>${d.discipline.broken.length?`<ul class="plainlist">${d.discipline.broken.map(([t,n])=>`<li>${esc(t)} <b class="mono">×${n}</b></li>`).join("")}</ul>`:`<p class="empty">No se ha saltado ninguna norma.</p>`}</section>`;
  if(d.goals&&d.goals.long.length)h+=`<section class="card"><div class="card-h"><h2>Sus metas</h2><span class="aside">${d.goals.done} de ${d.goals.total} pasos del camino</span></div><ol class="g-long">${d.goals.long.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></section>`;
  if(d.vision&&d.vision.length)h+=`<section class="card"><div class="card-h"><h2>Su tablero de sueños</h2></div><div class="gvision">${d.vision.map(v=>`<figure><img src="${esc(v.url)}" alt="${esc(v.caption||"Sueño")}" data-act="zoom" loading="lazy">${v.caption?`<figcaption>${esc(v.caption)}</figcaption>`:""}</figure>`).join("")}</div></section>`;
  if(d.trades&&d.trades.length)h+=`<section class="card"><div class="card-h"><h2>Operaciones</h2><span class="aside">${d.trades.length} últimas</span></div><div class="feed">${d.trades.map(t=>tradeFeedItem(t,uid,false)).join("")}</div></section>`;
  if(d.lessons&&d.lessons.length)h+=`<section class="card"><div class="card-h"><h2>Sus apuntes</h2></div><div class="feed">${d.lessons.map(l=>`<article class="fitem"><div class="ftrade"><b>${esc(l.title||"Lección")}</b>${l.level?`<span class="gt">${esc(l.level)}</span>`:""}${(l.tags||[]).slice(0,3).map(t=>`<span class="gt">${esc(t)}</span>`).join("")}<span class="hint">${esc([l.course,l.num?"#"+l.num:"",l.date?fmtDM(l.date):""].filter(Boolean).join(" · "))}</span></div>${l.concepts?`<p class="fnote">${esc(l.concepts)}</p>`:""}</article>`).join("")}</div></section>`;
  if(!d.streaks&&!d.stats&&!d.trades&&!d.lessons&&!d.goals&&!d.vision&&!d.discipline)h+=`<section class="card"><p class="empty">${uid===S.uid?"No compartes nada con este grupo. Actívalo en «Qué comparto».":"Este miembro no comparte nada todavía."}</p></section>`;
  return h;
}

/* ---------- cuenta ---------- */
function viewCuenta(){
  return `<section class="card"><div class="card-h"><span class="when">Tu cuenta</span><h2>${esc(myName())}</h2><span class="aside">${esc(S.email)}</span></div>
    ${fld("Tu nombre (lo verán tus grupos)",txt("displayName",S.plan.displayName||S.metaName||"","Tu nombre","data-pk",'maxlength="40"'))}
    <div class="row"><button type="button" class="btn" data-act="logout">Cerrar sesión</button></div></section>
  <section class="card"><div class="card-h"><span class="when">Tus datos</span><h2>Importar y exportar</h2></div>
    <p class="hint">Trae aquí los datos de tu bitácora anterior con el archivo que te preparé, o descarga una copia de seguridad de todo.</p>
    <div class="row"><label class="btn primary upl">Importar archivo de datos<input type="file" accept="application/json,.json" id="importFile"></label><button type="button" class="btn" data-act="exportData">Descargar copia de seguridad</button></div>
    ${S.importMsg?`<p class="hint" role="status">${esc(S.importMsg)}</p>`:""}</section>`;
}
async function importData(obj){
  const db=S.db,map={};let n=0;
  if(obj.media&&typeof obj.media==="object"){const ids=Object.keys(obj.media);for(let i=0;i<ids.length;i++){S.importMsg=`Subiendo fotos ${i+1} de ${ids.length}…`;render();try{const blob=await (await fetch(obj.media[ids[i]])).blob();const r=await S.assets.upload(blob,{type:blob.type||"image/jpeg"});map[ids[i]]=r.id}catch(e){}}}
  const fix=x=>JSON.parse(JSON.stringify(x).replace(/"id":"([0-9a-f]{32})"/g,(m,id)=>map[id]?`"id":"${map[id]}"`:m));
  const rows=[];
  if(obj.plan)rows.push({col:"config",id:"plan",data:fix(obj.plan)});
  ["days","weeks","ritual","learn","ideas","mentor"].forEach(col=>{const o=obj[col]||{};Object.keys(o).forEach(id=>rows.push({col,id,data:fix(o[id])}))});
  n=rows.length;S.importMsg=`Guardando ${n} registros…`;render();
  await db.bulk(rows);
  S.importMsg=`Listo: ${n} registros importados. Recargando…`;render();setTimeout(()=>location.reload(),1200);
}
function exportData(){
  const all=S.db.all(),out={exportedAt:new Date().toISOString(),plan:(all.config||{}).plan||S.plan};
  ["days","weeks","ritual","learn","ideas","mentor","share"].forEach(c=>out[c]=all[c]||{});
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,1)],{type:"application/json"}));a.download=`bitacora-copia-${todayStr()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}

/* ---------- eventos de la capa web ---------- */
$("#main").addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  const val=id=>{const x=document.getElementById(id);return x?x.value.trim():""};
  if(a==="gCreate"){const name=val("gName");if(!name){$("#gName").focus();return}b.disabled=true;const {data,error}=await SB.rpc("create_group",{p_name:name,p_display:myName()});if(error){setStatus("No se ha podido crear el grupo: "+error.message,true);b.disabled=false;return}const row=Array.isArray(data)?data[0]:data;S.gid=row&&row.id;S.gNew=false;await loadGroups();S.gData=null;await publishAll(S.gid);setStatus("Grupo creado ✓");render()}
  else if(a==="gJoin"){const code=val("gCode");if(!code){$("#gCode").focus();return}b.disabled=true;const {data,error}=await SB.rpc("join_group",{p_code:code,p_display:myName()});if(error){setStatus(/no válido/i.test(error.message)?"Ese código no existe. Revísalo con tu amigo.":"No te has podido unir: "+error.message,true);b.disabled=false;return}S.gid=data;S.gNew=false;await loadGroups();S.gData=null;await publishAll(S.gid);setStatus("Te has unido al grupo ✓");render()}
  else if(a==="gPick"){S.gid=b.dataset.id;S.gData=null;S.gMember=null;S.confirm=null;render()}
  else if(a==="gTab"){S.gtab=b.dataset.v;render()}
  else if(a==="gNewToggle"){S.gNew=!S.gNew;render()}
  else if(a==="gRefresh"){S.gData=null;await publishAll(S.gid);render()}
  else if(a==="gMember"){S.gMember=b.dataset.u;render();window.scrollTo({top:0})}
  else if(a==="gBack"){S.gMember=null;render()}
  else if(a==="gCopy"){const code=(curGroup()||{}).code||"";try{await navigator.clipboard.writeText(code);setStatus("Código copiado ✓")}catch(err){const r=document.createRange();r.selectNodeContents($("#inviteCode"));const sel=getSelection();sel.removeAllRanges();sel.addRange(r);setStatus("Código seleccionado: cópialo")}}
  else if(a==="gLeave"){if(S.confirm!=="gleave"){S.confirm="gleave";render();return}S.confirm=null;const gid=S.gid;await SB.from("shares").delete().eq("group_id",gid).eq("user_id",S.uid);await SB.from("group_members").delete().eq("group_id",gid).eq("user_id",S.uid);S.gData=null;S.gid=null;await loadGroups();setStatus("Has salido del grupo");render()}
  else if(a==="gComment"){const key=b.dataset.u+"|"+b.dataset.r,inp=[...document.querySelectorAll("[data-cm]")].find(x=>x.dataset.cm===key),body=inp?inp.value.trim():"";if(!body){if(inp)inp.focus();return}b.disabled=true;const {data,error}=await SB.from("comments").insert({group_id:S.gid,target_user:b.dataset.u,target_ref:b.dataset.r,body}).select().single();if(error){setStatus("No se ha podido enviar el comentario",true);b.disabled=false;return}S.gData.comments.push(data);render()}
  else if(a==="gDelComment"){const id=b.dataset.id;await SB.from("comments").delete().eq("id",id);S.gData.comments=S.gData.comments.filter(c=>c.id!==id);render()}
  else if(a==="logout"){await SB.auth.signOut();location.reload()}
  else if(a==="exportData")exportData();
});
$("#main").addEventListener("change",async e=>{
  const el=e.target;
  if(el.dataset.share){const gid=S.gid,c=shareCfg(gid);c[el.dataset.share]=el.checked;S.share[gid]=c;touch("share",gid);await publishAll(gid);setStatus("Ajustes del grupo guardados ✓");render()}
  else if(el.dataset.gname){const v=el.value.trim().slice(0,40);if(!v)return;await SB.from("group_members").update({display_name:v}).eq("group_id",S.gid).eq("user_id",S.uid);await loadGroups();S.gData=null;setStatus("Nombre actualizado ✓");render()}
  else if(el.id==="importFile"&&el.files&&el.files[0]){try{const obj=JSON.parse(await el.files[0].text());await importData(obj)}catch(err){S.importMsg="Ese archivo no es una copia válida de la bitácora.";render()}}
});
$("#main").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.cm){const [u,...r]=e.target.dataset.cm.split("|");const b=[...document.querySelectorAll('[data-act="gComment"]')].find(x=>x.dataset.u===u&&x.dataset.r===r.join("|"));if(b)b.click()}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&S.view==="grupo"&&S.gData&&Date.now()-S.gData.at>20000){S.gData.at=0;render()}});
