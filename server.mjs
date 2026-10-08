// MC2026 Digital Voting System — zero-dependency Node 22.13+ server (node:sqlite)
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{DatabaseSync}from 'node:sqlite';
const PROD=process.env.NODE_ENV==='production',PORT=+process.env.PORT||3000,OTP_TTL=+process.env.OTP_TTL_MS||3e5;
const SECRET=process.env.SESSION_SECRET||(PROD?(console.error('SESSION_SECRET required'),process.exit(1)):'dev-secret');
const db=new DatabaseSync(process.env.DB_FILE||'mc2026.db');
db.exec(`PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY,username TEXT UNIQUE,password_hash TEXT,mfa_enabled INT DEFAULT 0);
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY,name TEXT,description TEXT,display_order INT,active INT DEFAULT 1);
CREATE TABLE IF NOT EXISTS exhibitors(id INTEGER PRIMARY KEY,project_name TEXT,exhibitor_name TEXT,short_description TEXT,image_url TEXT,active INT DEFAULT 1);
CREATE TABLE IF NOT EXISTS exhibitor_categories(exhibitor_id INT REFERENCES exhibitors(id),category_id INT REFERENCES categories(id),PRIMARY KEY(exhibitor_id,category_id));
CREATE TABLE IF NOT EXISTS visitors(id INTEGER PRIMARY KEY,name TEXT,phone TEXT UNIQUE,verified_at INT,created_at INT);
CREATE TABLE IF NOT EXISTS otp_requests(id INTEGER PRIMARY KEY,visitor_id INT,otp_hash TEXT,expires_at INT,attempts INT DEFAULT 0,consumed_at INT);
CREATE TABLE IF NOT EXISTS votes(id INTEGER PRIMARY KEY,visitor_id INT NOT NULL REFERENCES visitors(id),category_id INT NOT NULL REFERENCES categories(id),exhibitor_id INT NOT NULL REFERENCES exhibitors(id),created_at INT,UNIQUE(visitor_id,category_id));
CREATE INDEX IF NOT EXISTS votes_cat_ex ON votes(category_id,exhibitor_id);
CREATE TABLE IF NOT EXISTS admin_audit_logs(id INTEGER PRIMARY KEY,admin_id INT,action TEXT,meta TEXT,created_at INT);`);
db.exec('PRAGMA foreign_keys=ON');
// roles (migration for databases created before role-based access: existing admins keep full access)
if(!db.prepare('PRAGMA table_info(admins)').all().some(c=>c.name==='role'))db.exec("ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'super_admin'");
// Viewer Admin removed: any remaining viewer accounts are deleted (they lose dashboard access; results are public at /analysis)
db.exec("DELETE FROM admins WHERE role NOT IN ('super_admin','admin')");

// ---------- seed (demo data; admin password must come from env in production)
if(!db.prepare('SELECT 1 FROM admins').get()){
  const pw=process.env.ADMIN_PASSWORD||(PROD?(console.error('ADMIN_PASSWORD required'),process.exit(1)):'admin1234');
  db.prepare('INSERT INTO admins(username,password_hash,role) VALUES(?,?,?)').run(process.env.ADMIN_USER||'admin',hashPw(pw),'super_admin');
}
// development only: one demo account per role so every permission level can be tried (never created in production)
if(!PROD&&!db.prepare("SELECT 1 FROM settings WHERE k='demo_users'").get()){
  const u=db.prepare('INSERT OR IGNORE INTO admins(username,password_hash,role) VALUES(?,?,?)');
  u.run('manager',hashPw('manager1234'),'admin');
  db.prepare("INSERT INTO settings VALUES('demo_users','1')").run();
}
if(!PROD||process.env.SEED_DEMO==='1')if(!db.prepare('SELECT 1 FROM categories').get()){
  const c=db.prepare('INSERT INTO categories(name,description,display_order) VALUES(?,?,?)');
  [['Most Innovative Project','The boldest new idea'],['Community Choice','The crowd favorite'],['Best Maker Experience','The most fun to try']].forEach((x,i)=>c.run(x[0],x[1],i));
  const e=db.prepare('INSERT INTO exhibitors(project_name,exhibitor_name,short_description,image_url) VALUES(?,?,?,?)'),l=db.prepare('INSERT INTO exhibitor_categories VALUES(?,?)');
  [['Project Nova','Team Orbit','A palm-sized satellite you can build at home','🛰️'],['EcoBot','Green Gears','Sorts recycling with a camera and a servo','🤖'],['Smart Farm','AgriLab','Balcony garden that waters itself','🌱'],['Glow Loom','Weave Works','Fiber-optic fabric that reacts to music','🧵'],['PrintPal','Layer Crew','A 3D printer built from scrap','🖨️'],['Aqua Sense','Blue Circuit','Low-cost water quality sensor','💧'],['Beat Box 3D','Sound Shop','Drum machine with printed pads','🥁'],['RoboBarista','Brew Bots','Robot arm that pours your coffee','☕'],['SolarSketch','Sun Studio','Drawing robot powered by the sun','☀️'],['Tiny Tank','Mini Mechs','Tracked rover you drive from your phone','🚜'],['Air Canvas','Pixel Pals','Paint in the air with motion tracking','🎨'],['Wearable Wave','Loop Lab','Wristband that buzzes with the sound around you','⌚']]
   .forEach((x,i)=>{const id=Number(e.run(...x).lastInsertRowid);l.run(id,i%3+1);l.run(id,(i+1)%3+1)});
}

// ---------- helpers
const D={event:'Maker Collective 2026',voting:'closed',geo_on:'0',lat:'31.9539',lng:'35.9106',radius:'300',ip_on:'0',ips:'',qr_on:'0',results:'count'};
const S=()=>({...D,...Object.fromEntries(db.prepare('SELECT k,v FROM settings').all().map(r=>[r.k,r.v]))});
const setS=(k,v)=>db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run(k,String(v));
const sig=s=>crypto.createHmac('sha256',SECRET).update(s).digest('base64url');
const eq=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
const mk=o=>{const p=Buffer.from(JSON.stringify(o)).toString('base64url');return p+'.'+sig(p)};
const rd=s=>{if(!s)return;const[p,g]=s.split('.');if(!g||!eq(sig(p),g))return;try{const o=JSON.parse(Buffer.from(p,'base64url'));return o.exp>Date.now()?o:undefined}catch{}};
const ck=r=>Object.fromEntries((r.headers.cookie||'').split(/;\s*/).filter(Boolean).map(c=>{const i=c.indexOf('=');return[c.slice(0,i),c.slice(i+1)]}));
const setck=(res,n,v,age)=>res.setHeader('Set-Cookie',[...(res.getHeader('Set-Cookie')||[]),`${n}=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${PROD?'; Secure':''}`]);
function hashPw(p){const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(p,s,64).toString('hex')}
const pwOk=(p,h)=>{const[s,x]=h.split(':');return eq(crypto.scryptSync(String(p),s,64).toString('hex'),x)};
const hm=c=>crypto.createHmac('sha256',SECRET).update('otp'+c).digest('hex');
const rl=new Map();const limit=(k,max,ms)=>{const n=Date.now(),a=(rl.get(k)||[]).filter(t=>n-t<ms);a.push(n);rl.set(k,a);return a.length<=max};
setInterval(()=>{const n=Date.now();for(const[k,a]of rl)if(!a.some(t=>n-t<9e5))rl.delete(k)},6e4).unref();
const ipOf=r=>((process.env.TRUST_PROXY&&r.headers['x-forwarded-for']?.split(',')[0])||r.socket.remoteAddress||'').trim().replace('::ffff:','');
const ip4=s=>s.split('.').reduce((a,b)=>a*256+ +b,0);
const inCidr=(ip,c)=>{const[b,m='32']=c.trim().split('/'),sh=2**(32-+m);return Math.floor(ip4(ip)/sh)===Math.floor(ip4(b)/sh)};
const dist=(a,b,c,d)=>{const R=6371e3,r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
const ipok=(req,s)=>s.ips.split(',').some(c=>c.trim()&&inCidr(ipOf(req),c));
// ---------- venue check: ANY enabled method is enough — venue network (IP) OR location (GPS) OR the rotating QR on the big screen.
// With no method enabled, voting is open to everyone with the link (and still protected by SMS + one vote per category).
// Rotating QR: time is cut into 15-second slots; each slot's code = HMAC(secret, slot). Nothing is stored. A code is accepted
// for its own slot and the previous one (≈15–30 s), then exchanged for a signed venue pass cookie (QR_PASS_MS, default 1 h).
const QR_SLOT=+process.env.QR_SLOT_MS||15e3,QR_PASS=+process.env.QR_PASS_MS||36e5;
const qrSlot=()=>Math.floor(Date.now()/QR_SLOT),qrCode=n=>sig('venue-qr:'+n).slice(0,12);
const qrValid=c=>typeof c==='string'&&/^[\w-]{12}$/.test(c)&&[0,1].some(k=>eq(c,qrCode(qrSlot()-k)));
const methods=s=>({ip:+s.ip_on===1,geo:+s.geo_on===1,qr:+s.qr_on===1});
const onsite=req=>{const s=S(),m=methods(s),c=ck(req);if(!m.ip&&!m.geo&&!m.qr)return true;
  return(m.ip&&ipok(req,s))||(m.geo&&!!rd(c.loc))||(m.qr&&rd(c.vqp)?.t==='q')};
const norm=p=>{let s=String(p||'').replace(/[\s()-]/g,'');if(/^07\d{8}$/.test(s))s='+962'+s.slice(1);else if(/^9627/.test(s))s='+'+s;return/^\+[1-9]\d{7,14}$/.test(s)&&(!s.startsWith('+962')||/^\+9627\d{8}$/.test(s))?s:null};
const mask=s=>s.slice(0,4)+'•••••'+s.slice(-2);
// OTP provider abstraction: SMS_WEBHOOK adapter (any vendor behind a webhook) or dev console mock (never in production)
const sms=async(to,code)=>{if(process.env.SMS_WEBHOOK){const r=await fetch(process.env.SMS_WEBHOOK,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+(process.env.SMS_TOKEN||'')},body:JSON.stringify({to,text:`Your Maker Collective code: ${code}`})});if(!r.ok)throw 0}else if(!PROD)console.log(`[DEV OTP] ${to}: ${code}`);else throw 0};
const aud=(r,a,m)=>db.prepare('INSERT INTO admin_audit_logs(admin_id,action,meta,created_at) VALUES(?,?,?,?)').run(r.id,a,JSON.stringify(m||{}),Date.now());

// ---------- results + realtime (SSE). Cached ~700ms so DB aggregation is bounded under load.
let cache={t:0,v:null};
function results(){if(Date.now()-cache.t<700)return cache.v;
  const q=db.prepare('SELECT e.id,e.project_name n,e.exhibitor_name t,e.image_url img,e.active a,(SELECT COUNT(*) FROM votes v WHERE v.category_id=ec.category_id AND v.exhibitor_id=e.id) c FROM exhibitor_categories ec JOIN exhibitors e ON e.id=ec.exhibitor_id WHERE ec.category_id=? ORDER BY c DESC,n');
  const v=db.prepare('SELECT id,name FROM categories WHERE active=1 ORDER BY id').all().map(c=>({id:c.id,name:c.name,items:q.all(c.id).filter(i=>i.a||i.c).map(i=>({id:i.id,n:i.n,t:i.t,img:i.img,c:i.c}))}));
  return cache={t:Date.now(),v}.v}
// public payload for the TV screen and the public Results/Analysis page — respects the "Results screen" setting (hidden / rank / count)
let vcache={t:0,v:0};const verifiedN=()=>{if(Date.now()-vcache.t>2e3)vcache={t:Date.now(),v:db.prepare('SELECT COUNT(*) n FROM visitors WHERE verified_at IS NOT NULL').get().n};return vcache.v};
function pub(){const s=S(),m=s.results,r=results(),pic=x=>/^(https:\/\/|\/)\S+$/.test(x||'')?x:'';return{event:s.event,voting:s.voting,mode:m,total:m==='count'?r.reduce((a,c)=>a+c.items.reduce((b,i)=>b+i.c,0),0):null,voters:m==='count'?verifiedN():null,
  // any: whether at least one vote exists (lets screens show a waiting state instead of implied winners) · r: competition rank, so ties stay visible even when counts are hidden
  any:r.some(c=>c.items.some(i=>i.c>0)),projects:new Set(r.flatMap(c=>c.items.map(i=>i.id))).size,
  cats:r.map(c=>({id:c.id,name:c.name,any:c.items.some(i=>i.c>0),items:m==='hidden'?[]:c.items.map(i=>({id:i.id,n:i.n,t:i.t,img:pic(i.img),c:m==='count'?i.c:undefined,r:1+c.items.filter(x=>x.c>i.c).length}))}))}}
const subs=new Set();let tm=0;
const push=()=>{if(tm)return;tm=setTimeout(()=>{tm=0;cache.t=0;vcache.t=0;const d='data: '+JSON.stringify(pub())+'\n\n';subs.forEach(r=>r.write(d))},300)};
setInterval(()=>subs.forEach(r=>r.write(': ping\n\n')),25e3).unref();

// ---------- roles & permissions (enforced server-side on every /api/admin route)
// the former "Viewer Admin" role was removed — results are now public on the Results / Analysis page (/analysis)
const ROLES={super_admin:'Super Admin',admin:'Admin'};
const PERM={view:['super_admin','admin'],content:['super_admin','admin'],visitors:['super_admin','admin'],export:['super_admin','admin'],voting:['super_admin'],reset:['super_admin'],settings:['super_admin'],users:['super_admin']};
const LABEL={view:'view the dashboard',content:'edit teams, categories or photos',visitors:'view the visitor list',export:'export results',voting:'open or close voting',reset:'reset votes',settings:'change settings',users:'manage users'};
const can=(role,a)=>!!PERM[a]?.includes(role);
const ROUTE={'/api/admin/data':'view','/api/admin/upload':'content','/api/admin/exhibitor':'content','/api/admin/exhibitor/delete':'content','/api/admin/category':'content','/api/admin/category/delete':'content','/api/admin/voting':'voting','/api/admin/reset':'reset','/api/admin/settings':'settings','/api/admin/export.csv':'export','/api/admin/user':'users','/api/admin/user/delete':'users','/api/admin/qr':'view'};
const READ=new Set(['/api/admin/data','/api/admin/export.csv','/api/admin/qr']);
// ---------- random (but session-stable) option order for voters: seeded Fisher–Yates
const seedOf=t=>{let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const prng=a=>()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const shuffle=(arr,seed)=>{const r=prng(seedOf(seed)),a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

// ---------- http
const J=(res,s,o)=>{res.writeHead(s,{'content-type':'application/json'});res.end(JSON.stringify(o))};
const body=req=>new Promise(r=>{let d='';req.on('data',c=>{d+=c;if(d.length>2e4)req.destroy()});req.on('end',()=>{try{r(JSON.parse(d||'{}'))}catch{r({})}})});
const vis=req=>{const s=rd(ck(req).sid);if(s?.t!=='v')return;const v=db.prepare('SELECT * FROM visitors WHERE id=? AND verified_at IS NOT NULL').get(s.id);return v&&{...v,salt:s.z||String(v.id)}};
const T={'.js':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.woff':'font/woff','.otf':'font/otf','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png'};
const BIN=new Set(['.woff2','.woff','.otf','.ttf','.png']);
const PUB=path.join(import.meta.dirname,'public'),UP=path.resolve(process.env.UPLOAD_DIR||'uploads');fs.mkdirSync(UP,{recursive:true});
const file=(res,f,cc)=>{const fp=path.join(PUB,f),x=path.extname(fp);if(!fp.startsWith(PUB+path.sep)||!T[x]||!fs.existsSync(fp)){res.writeHead(404);return res.end()}
  res.writeHead(200,{'content-type':T[x]+(BIN.has(x)?'':'; charset=utf-8'),'cache-control':cc||'no-cache'});fs.createReadStream(fp).on('error',()=>res.destroy()).pipe(res)};
// landing video + poster: byte-range support (iOS Safari only plays video served with 206 partial responses)
const media=(req,res,f)=>{const fp=path.join(PUB,f),ct={'.mp4':'video/mp4','.webm':'video/webm','.jpg':'image/jpeg'}[path.extname(fp)];let st;try{st=fp.startsWith(PUB+path.sep)&&fs.statSync(fp)}catch{}
  if(!st||!st.isFile()){res.writeHead(404);return res.end()}
  const h={'content-type':ct,'accept-ranges':'bytes','cache-control':'public, max-age=3600'},m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
  if(m&&(m[1]||m[2])){let a=m[1]?+m[1]:Math.max(0,st.size-+m[2]),b=m[1]&&m[2]?Math.min(+m[2],st.size-1):st.size-1;
    if(a>=st.size||a>b){res.writeHead(416,{'content-range':`bytes */${st.size}`});return res.end()}
    res.writeHead(206,{...h,'content-range':`bytes ${a}-${b}/${st.size}`,'content-length':b-a+1});if(req.method==='HEAD')return res.end();return fs.createReadStream(fp,{start:a,end:b}).on('error',()=>res.destroy()).pipe(res)}
  res.writeHead(200,{...h,'content-length':st.size});if(req.method==='HEAD')return res.end();fs.createReadStream(fp).on('error',()=>res.destroy()).pipe(res)};
const raw=(req,max)=>new Promise((ok,no)=>{const a=[];let n=0;req.on('data',c=>{n+=c.length;if(n>max){req.destroy();no(new Error('big'))}else a.push(c)});req.on('end',()=>ok(Buffer.concat(a)));req.on('error',no)});
const MIME={jpg:'image/jpeg',png:'image/png',webp:'image/webp'};
const sniff=b=>b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF?'jpg':b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]))?'png':b.subarray(0,4).toString('latin1')==='RIFF'&&b.subarray(8,12).toString('latin1')==='WEBP'?'webp':null;

http.createServer(async(req,res)=>{
  const p=new URL(req.url,'http://x').pathname,ip=ipOf(req);
  res.setHeader('Content-Security-Policy',"default-src 'self';img-src 'self' https: data:;style-src 'self' 'unsafe-inline'");
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  if(req.method!=='GET'){const o=req.headers.origin;if(o&&new URL(o).host!==req.headers.host)return J(res,403,{})}
  try{
  if(p==='/healthz')return J(res,200,{ok:1});
  if(p==='/api/health'){let dbok=true;try{db.prepare('SELECT 1').get()}catch{dbok=false}
    return J(res,dbok?200:503,{status:dbok?'ok':'degraded',db:dbok?'up':'down',uptime_s:Math.round(process.uptime()),time:new Date().toISOString()})}
  if(/^\/(app\.js|style\.css|fonts\.css)$/.test(p))return file(res,p.slice(1));
  if(/^\/fonts\/[\w.-]+\.(woff2|woff|otf|ttf)$/.test(p))return file(res,p.slice(1),'public, max-age=31536000, immutable');
  if(/^\/brand\/[\w.-]+\.(svg|png)$/.test(p))return file(res,p.slice(1),'public, max-age=3600');
  if(/^\/media\/[\w.-]+\.(mp4|webm|jpg)$/.test(p))return media(req,res,p.slice(1));
  const um=p.match(/^\/uploads\/([0-9a-f]{32}\.(?:jpg|png|webp))$/);
  if(um){const fp=path.join(UP,um[1]);if(!fs.existsSync(fp)){res.writeHead(404);return res.end()}
    res.writeHead(200,{'content-type':MIME[um[1].slice(33)],'cache-control':'public, max-age=31536000, immutable'});return fs.createReadStream(fp).pipe(res)}
  if(!p.startsWith('/api/'))return file(res,'index.html');
  if(!limit('g'+ip,+process.env.RL_IP_PER_MIN||6000,6e4))return J(res,429,{code:'slow'});

  // ----- public
  if(p==='/api/config'){const s=S();return J(res,200,{event:s.event,geo:+s.geo_on,qr:+s.qr_on,here:onsite(req),voting:s.voting})}
  // a phone that scanned the big-screen QR exchanges the code for a venue pass (the code itself expires within ~30 s)
  if(p==='/api/qrpass'&&req.method==='POST'){const s=S(),b=await body(req);if(!limit('q'+ip,60,6e4))return J(res,429,{code:'slow'});
    if(!+s.qr_on)return J(res,200,{ok:false,code:'off'});if(!qrValid(b.code))return J(res,200,{ok:false,code:'expired'});
    setck(res,'vqp',mk({t:'q',exp:Date.now()+QR_PASS}),Math.round(QR_PASS/1e3));return J(res,200,{ok:true})}
  if(p==='/api/stream'){res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache',connection:'keep-alive'});res.write('data: '+JSON.stringify(pub())+'\n\n');subs.add(res);req.on('close',()=>subs.delete(res));return}
  if(p==='/api/locate'){const s=S(),b=await body(req);
    const m=methods(s);if(!m.ip&&!m.geo&&!m.qr)return J(res,200,{ok:true});
    if(m.geo&&b.lat!=null&&dist(+b.lat,+b.lng,+s.lat,+s.lng)<=+s.radius){setck(res,'loc',mk({exp:Date.now()+72e5}),7200);return J(res,200,{ok:true})}
    return J(res,200,{ok:(m.ip&&ipok(req,s))||(m.qr&&rd(ck(req).vqp)?.t==='q')||(m.geo&&!!rd(ck(req).loc))})}
  if(p==='/api/register'){const b=await body(req),ph=norm(b.phone),nm=String(b.name||'').trim().slice(0,60);
    if(!ph||nm.length<2)return J(res,400,{code:'invalid'});
    if(!onsite(req))return J(res,403,{code:'offsite'});
    if(!limit('r'+ip,+process.env.RL_REGISTER_PER_IP||600,6e5)||!limit('p'+ph,3,6e5))return J(res,429,{code:'slow'});
    let v=db.prepare('SELECT id FROM visitors WHERE phone=?').get(ph);
    if(!v)v={id:Number(db.prepare('INSERT INTO visitors(name,phone,created_at) VALUES(?,?,?)').run(nm,ph,Date.now()).lastInsertRowid)};
    const code=String(crypto.randomInt(1e6)).padStart(6,'0');
    db.prepare('INSERT INTO otp_requests(visitor_id,otp_hash,expires_at) VALUES(?,?,?)').run(v.id,hm(code),Date.now()+OTP_TTL);
    try{await sms(ph,code)}catch{return J(res,502,{code:'sms'})}
    setck(res,'pend',mk({id:v.id,exp:Date.now()+6e5}),600);return J(res,200,{masked:mask(ph)})}
  if(p==='/api/verify'){const pe=rd(ck(req).pend);if(!pe)return J(res,400,{code:'expired'});
    if(!limit('o'+pe.id,15,6e5))return J(res,429,{code:'attempts'});
    const b=await body(req),o=db.prepare('SELECT * FROM otp_requests WHERE visitor_id=? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1').get(pe.id);
    if(!o||o.expires_at<Date.now())return J(res,400,{code:'expired'});
    if(o.attempts>=5)return J(res,429,{code:'attempts'});
    db.prepare('UPDATE otp_requests SET attempts=attempts+1 WHERE id=?').run(o.id);
    if(!eq(hm(String(b.code)),o.otp_hash))return J(res,400,{code:'wrong'});
    db.prepare('UPDATE otp_requests SET consumed_at=? WHERE id=?').run(Date.now(),o.id);
    db.prepare('UPDATE visitors SET verified_at=COALESCE(verified_at,?) WHERE id=?').run(Date.now(),pe.id);
    setck(res,'sid',mk({t:'v',id:pe.id,z:crypto.randomBytes(6).toString('hex'),exp:Date.now()+864e5}),86400);push();return J(res,200,{ok:1})}
  if(p==='/api/ballot'){const v=vis(req);if(!v)return J(res,401,{});
    const cats=db.prepare('SELECT id,name,description FROM categories WHERE active=1 ORDER BY id').all().map(c=>({...c,
      items:shuffle(db.prepare('SELECT e.id,e.project_name,e.exhibitor_name,e.short_description,e.image_url FROM exhibitors e JOIN exhibitor_categories ec ON ec.exhibitor_id=e.id WHERE ec.category_id=? AND e.active=1 ORDER BY e.id').all(c.id),v.salt+':'+c.id),
      voted:db.prepare('SELECT exhibitor_id x FROM votes WHERE visitor_id=? AND category_id=?').get(v.id,c.id)?.x||null}));
    return J(res,200,{name:v.name,open:S().voting==='open',cats})}
  if(p==='/api/vote'){const v=vis(req);if(!v)return J(res,401,{code:'auth'});
    if(!limit('v'+v.id,30,6e4))return J(res,429,{code:'slow'});
    const b=await body(req),c=+b.category_id,x=+b.exhibitor_id;
    if(S().voting!=='open')return J(res,403,{code:'closed'});
    if(!onsite(req))return J(res,403,{code:'offsite'});
    db.exec('BEGIN IMMEDIATE'); // atomic; UNIQUE(visitor_id,category_id) is the final guarantee
    try{
      if(!db.prepare('SELECT 1 FROM categories c JOIN exhibitor_categories ec ON ec.category_id=c.id JOIN exhibitors e ON e.id=ec.exhibitor_id WHERE c.id=? AND c.active=1 AND e.id=? AND e.active=1').get(c,x)){db.exec('ROLLBACK');return J(res,400,{code:'invalid'})}
      const ex=db.prepare('SELECT exhibitor_id x FROM votes WHERE visitor_id=? AND category_id=?').get(v.id,c);
      if(ex){db.exec('ROLLBACK');return J(res,ex.x===x?200:409,{code:'already',ok:ex.x===x})} // same choice = idempotent retry
      db.prepare('INSERT INTO votes(visitor_id,category_id,exhibitor_id,created_at) VALUES(?,?,?,?)').run(v.id,c,x,Date.now());
      db.exec('COMMIT');
    }catch{try{db.exec('ROLLBACK')}catch{}return J(res,500,{code:'err'})}
    push();return J(res,200,{ok:1})}

  // ----- admin
  if(p==='/api/admin/login'){const b=await body(req);if(!limit('a'+ip,8,9e5))return J(res,429,{code:'slow'});
    const a=db.prepare('SELECT * FROM admins WHERE username=? COLLATE NOCASE').get(String(b.username||''));
    if(!a||!pwOk(b.password,a.password_hash))return J(res,401,{code:'bad'}); // TODO MFA: check a.mfa_enabled → require TOTP here
    setck(res,'asid',mk({t:'a',id:a.id,exp:Date.now()+288e5}),28800);return J(res,200,{ok:1,role:a.role})}
  if(p==='/api/admin/logout'&&req.method==='POST'){setck(res,'asid','',0);return J(res,200,{ok:1})}
  if(p.startsWith('/api/admin/')){
    const ss=rd(ck(req).asid),ad=ss?.t==='a'?db.prepare('SELECT id,username,role FROM admins WHERE id=?').get(ss.id):undefined;if(!ad)return J(res,401,{code:'auth',error:'Please sign in.'});
    const need=ROUTE[p];if(!need)return J(res,404,{});
    if(!can(ad.role,need))return J(res,403,{code:'forbidden',need,role:ad.role,error:`Your role (${ROLES[ad.role]}) can't ${LABEL[need]}.`});
    if(!READ.has(p)&&req.method!=='POST')return J(res,405,{});
    if(p==='/api/admin/upload'&&req.method==='POST'){const buf=await raw(req,2e6),ext=sniff(buf);if(!ext)return J(res,400,{code:'type'});
      const n=crypto.randomBytes(16).toString('hex')+'.'+ext;fs.writeFileSync(path.join(UP,n),buf);aud(ad,'upload',{n});return J(res,200,{url:'/uploads/'+n})}
    const b=req.method==='POST'?await body(req):{},s=S();
    if(p==='/api/admin/data'){
      const cats=db.prepare('SELECT id,name,description,active FROM categories ORDER BY id').all(),ac=cats.filter(c=>c.active).length;
      const ver=db.prepare('SELECT COUNT(*) n FROM visitors WHERE verified_at IS NOT NULL').get().n;
      const done=db.prepare('SELECT COUNT(*) n FROM (SELECT 1 FROM votes GROUP BY visitor_id HAVING COUNT(*)>=?)').get(ac).n;
      const st=can(ad.role,'settings')?Object.fromEntries(Object.keys(D).map(k=>[k,s[k]])):{event:s.event,results:s.results,voting:s.voting};
      return J(res,200,{voting:s.voting,settings:st,me:{id:ad.id,username:ad.username,role:ad.role,label:ROLES[ad.role],can:Object.fromEntries(Object.keys(PERM).map(k=>[k,can(ad.role,k)]))},users:can(ad.role,'users')?db.prepare('SELECT id,username,role FROM admins ORDER BY id').all():undefined,cats,verified:ver,completion:ver?Math.round(100*done/ver):0,
        votes:db.prepare('SELECT COUNT(*) n FROM votes').get().n,perMin:db.prepare('SELECT COUNT(*) n FROM votes WHERE created_at>?').get(Date.now()-6e4).n,
        ex:db.prepare('SELECT * FROM exhibitors ORDER BY id').all().map(x=>({...x,cats:db.prepare('SELECT category_id c FROM exhibitor_categories WHERE exhibitor_id=?').all(x.id).map(r=>r.c)})),
        res:(cache.t=0,results()),perCat:cats.map(c=>({name:c.name,n:db.prepare('SELECT COUNT(*) n FROM votes WHERE category_id=?').get(c.id).n})),
        recent:db.prepare('SELECT v.name,v.phone,c.name cat FROM votes x JOIN visitors v ON v.id=x.visitor_id JOIN categories c ON c.id=x.category_id ORDER BY x.id DESC LIMIT 8').all().map(r=>({...r,phone:can(ad.role,'visitors')?mask(r.phone):''})),
        visitors:can(ad.role,'visitors')?db.prepare('SELECT id,name,phone,verified_at,created_at,(SELECT COUNT(*) FROM votes WHERE visitor_id=visitors.id) n FROM visitors ORDER BY id DESC LIMIT 500').all().map(r=>({...r,phone:mask(r.phone)})):[]})}
    // the big screen fetches the current rotating code here — only signed-in organizers' browsers ever receive it
    if(p==='/api/admin/qr'){const n=qrSlot();return J(res,200,{on:+s.qr_on===1,code:+s.qr_on?qrCode(n):null,slot_ms:QR_SLOT,expires_in:QR_SLOT-(Date.now()%QR_SLOT)})}
    if(p==='/api/admin/voting'){setS('voting',b.open?'open':'closed');setS(b.open?'opened_at':'closed_at',Date.now());aud(ad,b.open?'open_voting':'close_voting');push();return J(res,200,{ok:1})}
    if(p==='/api/admin/exhibitor'){const f=[String(b.project_name||'').trim().slice(0,80),String(b.exhibitor_name||'').trim().slice(0,80),String(b.short_description||'').trim().slice(0,140),String(b.image_url||'').trim().slice(0,500),b.active?1:0];
      // required: name, team, short description, photo (uploaded file or image link — not an emoji), at least one existing category
      const ids=[...new Set((Array.isArray(b.cats)?b.cats:[]).map(Number).filter(Number.isInteger))],okCats=ids.filter(c=>db.prepare('SELECT 1 FROM categories WHERE id=?').get(c)),
        bad=(field,error)=>J(res,400,{code:'invalid',field,error});
      if(!f[0])return bad('project_name','Please enter the project name.');
      if(!f[1])return bad('exhibitor_name','Please enter the team or exhibitor name.');
      if(!f[2])return bad('short_description','Please add a short description.');
      if(!/^(https:\/\/|\/)\S+$/.test(f[3]))return bad('image_url','Please add a photo — upload one or paste an image link.');
      if(!okCats.length)return bad('cats','Please choose at least one category.');
      let id=+b.id;
      if(id)db.prepare('UPDATE exhibitors SET project_name=?,exhibitor_name=?,short_description=?,image_url=?,active=? WHERE id=?').run(...f,id);
      else id=Number(db.prepare('INSERT INTO exhibitors(project_name,exhibitor_name,short_description,image_url,active) VALUES(?,?,?,?,?)').run(...f).lastInsertRowid);
      db.prepare('DELETE FROM exhibitor_categories WHERE exhibitor_id=?').run(id);
      for(const c of okCats)db.prepare('INSERT OR IGNORE INTO exhibitor_categories SELECT ?,id FROM categories WHERE id=?').run(id,c);
      aud(ad,'save_exhibitor',{id});push();return J(res,200,{ok:1})}
    if(p==='/api/admin/exhibitor/delete'){const id=+b.id;
      if(db.prepare('SELECT 1 FROM votes WHERE exhibitor_id=?').get(id))db.prepare('UPDATE exhibitors SET active=0 WHERE id=?').run(id); // keep vote history
      else{db.prepare('DELETE FROM exhibitor_categories WHERE exhibitor_id=?').run(id);db.prepare('DELETE FROM exhibitors WHERE id=?').run(id)}
      aud(ad,'delete_exhibitor',{id});push();return J(res,200,{ok:1})}
    if(p==='/api/admin/category'){const f=[String(b.name||'').trim().slice(0,80),String(b.description||'').slice(0,160),b.active?1:0];if(!f[0])return J(res,400,{});
      if(+b.id)db.prepare('UPDATE categories SET name=?,description=?,active=? WHERE id=?').run(...f,+b.id);
      else db.prepare('INSERT INTO categories(name,description,active) VALUES(?,?,?)').run(...f); // no manual order: categories follow creation order
      aud(ad,'save_category',{id:b.id});push();return J(res,200,{ok:1})}
    if(p==='/api/admin/category/delete'){const id=+b.id;
      if(db.prepare('SELECT 1 FROM votes WHERE category_id=?').get(id))db.prepare('UPDATE categories SET active=0 WHERE id=?').run(id);
      else{db.prepare('DELETE FROM exhibitor_categories WHERE category_id=?').run(id);db.prepare('DELETE FROM categories WHERE id=?').run(id)}
      aud(ad,'delete_category',{id});push();return J(res,200,{ok:1})}
    if(p==='/api/admin/settings'){
      for(const k of['event','lat','lng','radius','ips'])if(b[k]!=null)setS(k,String(b[k]).slice(0,500));
      for(const k of['geo_on','ip_on','qr_on'])if(b[k]!=null)setS(k,b[k]?1:0);
      if(['hidden','rank','count'].includes(b.results))setS('results',b.results);
      aud(ad,'settings');push();return J(res,200,{ok:1})}
    if(p==='/api/admin/reset'){if(b.confirm!=='RESET')return J(res,400,{});db.exec('DELETE FROM votes');aud(ad,'reset_votes');push();return J(res,200,{ok:1})}
    if(p==='/api/admin/user'){const un=String(b.username||'').trim().toLowerCase(),role=String(b.role||''),pw=String(b.password||''),id=+b.id,bad=(c,error)=>J(res,400,{code:c,error});
      if(!ROLES[role])return bad('role','Choose a valid role.');
      if(pw&&(pw.length<8||pw.length>128))return bad('pw','Password must be 8–128 characters.');
      if(id){const t=db.prepare('SELECT * FROM admins WHERE id=?').get(id);if(!t)return J(res,404,{});
        if(t.id===ad.id&&role!==t.role)return bad('self',"You can't change your own role.");
        if(t.role==='super_admin'&&role!=='super_admin'&&db.prepare("SELECT COUNT(*) n FROM admins WHERE role='super_admin'").get().n<2)return bad('last_super','There must always be at least one Super Admin.');
        db.prepare('UPDATE admins SET role=? WHERE id=?').run(role,id);if(pw)db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(hashPw(pw),id);
        aud(ad,'update_user',{id,role,password_changed:!!pw});return J(res,200,{ok:1})}
      if(!/^[a-z0-9._-]{3,32}$/.test(un))return bad('username','Username: 3–32 letters, numbers, dot, dash or underscore.');
      if(!pw)return bad('pw','Password must be 8–128 characters.');
      if(db.prepare('SELECT 1 FROM admins WHERE username=? COLLATE NOCASE').get(un))return J(res,409,{code:'exists',error:'That username is already taken.'});
      const nid=Number(db.prepare('INSERT INTO admins(username,password_hash,role) VALUES(?,?,?)').run(un,hashPw(pw),role).lastInsertRowid);aud(ad,'create_user',{id:nid,role});return J(res,200,{ok:1,id:nid})}
    if(p==='/api/admin/user/delete'){const id=+b.id,t=db.prepare('SELECT * FROM admins WHERE id=?').get(id);if(!t)return J(res,404,{});
      if(t.id===ad.id)return J(res,400,{code:'self',error:"You can't delete your own account."});
      if(t.role==='super_admin'&&db.prepare("SELECT COUNT(*) n FROM admins WHERE role='super_admin'").get().n<2)return J(res,400,{code:'last_super',error:'There must always be at least one Super Admin.'});
      db.prepare('DELETE FROM admins WHERE id=?').run(id);aud(ad,'delete_user',{id});return J(res,200,{ok:1})}
    if(p==='/api/admin/export.csv'){cache.t=0;const q=v=>'"'+(/^[=+\-@]/.test(String(v))?"'"+v:v).toString().replace(/"/g,'""')+'"';let o='category,rank,exhibitor_id,exhibitor_name,vote_count,percentage\n';
      results().forEach(c=>{const t=c.items.reduce((a,i)=>a+i.c,0);c.items.forEach((i,k)=>o+=[q(c.name),k+1,i.id,q(i.n),i.c,t?(100*i.c/t).toFixed(1):0].join(',')+'\n')});
      res.writeHead(200,{'content-type':'text/csv','content-disposition':'attachment; filename=mc2026-results.csv'});return res.end(o)}
  }
  J(res,404,{});
  }catch(e){console.error(e.message);J(res,500,{code:'err'})}
}).listen(PORT,()=>console.log(`MC2026 voting on :${PORT}`+(PROD?'':'  (demo: admin / admin1234, OTPs print here)')));
