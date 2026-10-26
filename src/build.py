# Genera web/index.html a partir de la bitácora (bitacora-trading.html) + la capa web.
import re,sys,pathlib
SRC=pathlib.Path('/home/claude/bitacora-trading.html').read_text(encoding='utf-8')
WEB=pathlib.Path('/home/claude/web/web-layer.js').read_text(encoding='utf-8')
WEBCSS=pathlib.Path('/home/claude/web/web-layer.css').read_text(encoding='utf-8')
s=SRC
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f"MISMATCH ({n}) for: {old[:90]!r}")
    s=s.replace(old,new)
# imágenes desde Supabase Storage
s=re.sub(r'/_blob/\$\{encodeURIComponent\(([^)]+)\)\}',r'${blobUrl(\1)}',s)
rep('const src="/_blob/"+encodeURIComponent(m.id);','const src=blobUrl(m.id);')
assert '_blob' not in s.replace('fetch("/_blob/"+ids[i])',''), 'quedan /_blob'
# navegación: Mentor -> Grupo
a=s.index('<button type="button" class="navbtn" data-sec="mentor">'); b=s.index('</button>',a)+len('</button>')
s=s[:a]+'<button type="button" class="navbtn" data-sec="grupo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2c2.6-.4 4.8 1.2 5.5 4.3"/></svg><span>Grupo</span></button>'+s[b:]
rep('{id:"mentor",views:[["mentor","Mentor"]]},','{id:"grupo",views:[["grupo","Mis grupos"]]},{id:"mentor",views:[["mentor","Mentor"]]},')
rep('["sistema","Ajustes"]]}];','["sistema","Ajustes"],["cuenta","Cuenta"]]}];')
rep('mentor:viewMentor,','mentor:viewMentor,grupo:viewGroup,cuenta:viewCuenta,')
# arranque con Supabase en vez de las capacidades de Claude
rep('  const [db,assets,sample]=await Promise.all([cap("db"),cap("assets"),cap("sample")]);','  const W=await webBoot();const db=W.db,assets=W.assets,sample=null;')
rep('["days","weeks","mentor","ritual","learn","ideas"].forEach(col=>{','["days","weeks","mentor","ritual","learn","ideas","share"].forEach(col=>{')
rep('const S={plan:normPlan(null),','const S={share:{},plan:normPlan(null),')
rep('function touch(col,id){\n','function touch(col,id){\n  schedulePublish();\n')
rep('function touchPlan(){\n','function touchPlan(){\n  schedulePublish();\n')
rep('function aiUnavailable(){return S.mode!=="db"?"Disponible al abrir la bitácora desde Claude con tu sesión iniciada.":"Claude no está disponible en esta vista."}',
    'function aiUnavailable(){return "El mentor con IA llegará pronto a la versión web."}')
# capa web dentro del mismo ámbito, antes de arrancar
rep('init();\n})();','\n'+WEB+'\ninit();\n})();')
# documento completo
head_end=s.index('</style>')+len('</style>')
head=s[:head_end]; body=s[head_end:]
title_m=re.search(r'<title>.*?</title>',head)
head=head.replace('<meta name="claude:viewport-fit-sides" content="cover">','')
doc=f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#070A12">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23070A12'/%3E%3Cpath d='M9 8v16M16 6v20M23 10v12' stroke='%23D8B36A' stroke-width='2'/%3E%3Crect x='6.5' y='12' width='5' height='8' rx='1' fill='%233DD68C'/%3E%3Crect x='13.5' y='9' width='5' height='9' rx='1' fill='%23FF6B6B'/%3E%3Crect x='20.5' y='13' width='5' height='6' rx='1' fill='%233DD68C'/%3E%3C/svg%3E">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{head}
<style>{WEBCSS}</style>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js"></script>
<script src="config.js"></script>
</head>
<body>
<div id="auth" hidden></div>
{body}
</body>
</html>
'''
pathlib.Path('/home/claude/web/index.html').write_text(doc,encoding='utf-8')
print('web/index.html', len(doc))
