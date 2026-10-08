import{test,before,after}from'node:test';import assert from'node:assert/strict';
import{spawn}from'node:child_process';import fs from'node:fs';import os from'node:os';import path from'node:path';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mc-'));
function start(port,extra={}){const log=[];const p=spawn('node',['--disable-warning=ExperimentalWarning','server.mjs'],{env:{...process.env,NODE_ENV:'development',PORT:port,DB_FILE:path.join(tmp,port+'.db'),UPLOAD_DIR:path.join(tmp,'up'+port),...extra},cwd:path.resolve(import.meta.dirname,'..')});
  p.stdout.on('data',d=>log.push(String(d)));p.stderr.on('data',d=>log.push(String(d)));
  return{p,log,url:`http://127.0.0.1:${port}`,otp:ph=>{const m=[...log.join('').matchAll(/\[DEV OTP\] (\S+): (\d{6})/g)].filter(x=>x[1]===ph).pop();return m?.[2]}}}
const ready=async s=>{for(let i=0;i<50;i++){try{if((await fetch(s.url+'/healthz')).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw new Error('server did not start')};
// tiny cookie-jar client
const client=s=>{const jar={};return async(u,b,raw)=>{const r=await fetch(s.url+u,{method:b!==undefined?'POST':'GET',headers:{cookie:Object.entries(jar).map(([k,v])=>k+'='+v).join('; '),...(raw?{'content-type':'application/octet-stream'}:b!==undefined?{'content-type':'application/json'}:{})},body:raw?b:b!==undefined?JSON.stringify(b):undefined});
  for(const c of r.headers.getSetCookie()){const[kv]=c.split(';'),i=kv.indexOf('=');jar[kv.slice(0,i)]=kv.slice(i+1)}
  const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}return{s:r.status,text:t,...j}}};
async function visitorLoginVia(s,phone,proof,name='Test Visitor'){const c=client(s);await proof(c);const r=await c('/api/register',{name,phone});assert.equal(r.s,200);await new Promise(z=>setTimeout(z,50));
  const v=await c('/api/verify',{code:s.otp('+962'+phone.slice(1))});assert.equal(v.s,200);return c}
async function visitorLogin(s,phone,name='Test Visitor'){const c=client(s);const r=await c('/api/register',{name,phone});assert.equal(r.s,200);await new Promise(z=>setTimeout(z,50));
  const norm=phone.startsWith('07')?'+962'+phone.slice(1):phone;const v=await c('/api/verify',{code:s.otp(norm)});assert.equal(v.s,200);return c}

let S,admin;
before(async()=>{S=start(3911);await ready(S);admin=client(S);assert.equal((await admin('/api/admin/login',{username:'admin',password:'admin1234'})).s,200)});
after(()=>{S.p.kill();fs.rmSync(tmp,{recursive:true,force:true})});

test('health + config',async()=>{const c=client(S);assert.equal((await c('/healthz')).ok,1);const h=await c('/api/health');assert.equal(h.status,'ok');assert.equal(h.db,'up');assert.equal((await c('/api/config')).event,'Maker Collective 2026')});
test('SPA shell and static assets are served',async()=>{const c=client(S);for(const u of['/','/results','/admin','/analysis','/media/mc2026-poster.jpg','/app.js','/style.css','/fonts.css','/fonts/standin-outfit-var.woff2','/fonts/standin-plex-arabic-400.woff2','/brand/logo.png','/brand/logo-white.png','/brand/favicon.png'])assert.equal((await c(u)).s,200,u);assert.equal((await c('/../server.mjs')).s,200);/* falls back to index.html, never the source */assert.ok(!(await c('/..%2fserver.mjs')).text.includes('DatabaseSync'))});
test('invalid phone / name rejected',async()=>{const c=client(S);assert.equal((await c('/api/register',{name:'A',phone:'0791234567'})).s,400);assert.equal((await c('/api/register',{name:'Sam',phone:'123'})).s,400);assert.equal((await c('/api/register',{name:'Sam',phone:'+962 6 123 4567'})).s,400)});
test('cannot vote without OTP / session',async()=>{const c=client(S);assert.equal((await c('/api/vote',{category_id:1,exhibitor_id:1})).s,401);assert.equal((await c('/api/ballot')).s,401)});
test('wrong OTP rejected; 5 attempts then locked',async()=>{const c=client(S);await c('/api/register',{name:'Wrong Code',phone:'0790000001'});for(let i=0;i<5;i++)assert.equal((await c('/api/verify',{code:'000000'})).code,'wrong');
  const r=await c('/api/verify',{code:S.otp('+962790000001')});assert.equal(r.s,429);assert.equal(r.code,'attempts')});
test('expired OTP rejected',async()=>{const E=start(3912,{OTP_TTL_MS:'150'});await ready(E);const c=client(E);await c('/api/register',{name:'Slow Sam',phone:'0790000002'});await new Promise(z=>setTimeout(z,400));
  assert.equal((await c('/api/verify',{code:E.otp('+962790000002')})).code,'expired');E.p.kill()});
test('voting closed by default → vote rejected',async()=>{const c=await visitorLogin(S,'0790000010');const r=await c('/api/vote',{category_id:1,exhibitor_id:1});assert.equal(r.s,403);assert.equal(r.code,'closed')});

test('full flow: once per category, validation, results, CSV',async()=>{
  await admin('/api/admin/voting',{open:true});
  const c=await visitorLogin(S,'0790000020','Lina Haddad');
  const b=await c('/api/ballot');assert.equal(b.cats.length,3);assert.equal(b.open,true);
  assert.equal((await c('/api/vote',{category_id:1,exhibitor_id:1})).s,200);                // Category A ok
  assert.equal((await c('/api/vote',{category_id:1,exhibitor_id:1})).s,200);                // same choice = idempotent retry
  const dup=await c('/api/vote',{category_id:1,exhibitor_id:3});assert.equal(dup.s,409);assert.equal(dup.code,'already'); // different exhibitor, same category
  assert.equal((await c('/api/vote',{category_id:3,exhibitor_id:1})).code,'invalid');       // exhibitor 1 is not in category 3
  assert.equal((await c('/api/vote',{category_id:2,exhibitor_id:999})).code,'invalid');     // unknown exhibitor
  assert.equal((await c('/api/vote',{category_id:2,exhibitor_id:2})).s,200);                // B still open to this visitor
  assert.equal((await c('/api/vote',{category_id:3,exhibitor_id:2})).s,200);                // C
  const after=await c('/api/ballot');assert.ok(after.cats.every(x=>x.voted));
  // results + realtime snapshot
  const ctl=new AbortController(),sse=await fetch(S.url+'/api/stream',{signal:ctl.signal}),rd=sse.body.getReader();const first=JSON.parse(new TextDecoder().decode((await rd.read()).value).replace(/^data: /,''));ctl.abort();
  assert.equal(first.cats[0].items[0].n,'Project Nova');assert.equal(first.cats[0].items[0].c,1);assert.equal(first.total,3);
  const csv=await admin('/api/admin/export.csv');assert.match(csv.text,/^category,rank,exhibitor_id,exhibitor_name,vote_count,percentage/);assert.match(csv.text,/"Most Innovative Project",1,1,"Project Nova",1,100\.0/);
  const d=await admin('/api/admin/data');assert.equal(d.votes,3);assert.ok(d.visitors.every(v=>/•••/.test(v.phone)))});

test('inactive exhibitor cannot receive votes',async()=>{const d=await admin('/api/admin/data'),x=d.ex.find(e=>e.id===4);
  await admin('/api/admin/exhibitor',{...x,image_url:'/uploads/x.png',cats:x.cats,active:false});const c=await visitorLogin(S,'0790000030');const r=await c('/api/vote',{category_id:x.cats[0],exhibitor_id:4});assert.equal(r.code,'invalid')});

test('duplicate simultaneous submissions → exactly one vote',async()=>{const c=await visitorLogin(S,'0790000040','Racer');
  const rs=await Promise.all([...Array(25)].map((_,i)=>c('/api/vote',{category_id:2,exhibitor_id:[2,5,8,11][i%4]})));
  assert.equal(rs.filter(r=>r.s===200).length>=1,true);const d=await admin('/api/admin/data');const me=d.visitors.find(v=>v.name==='Racer');assert.equal(me.n,1)});

test('admin: create category + exhibitor, auth required',async()=>{assert.equal((await client(S)('/api/admin/data')).s,401);assert.equal((await client(S)('/api/admin/voting',{open:false})).s,401);
  assert.equal((await admin('/api/admin/category',{name:'Best Newcomer',description:'First-time makers',display_order:9,active:true})).s,200);
  assert.equal((await admin('/api/admin/exhibitor',{project_name:'Test Rig',exhibitor_name:'QA',short_description:'x',image_url:'/uploads/test.png',cats:[4],active:true})).s,200);
  const d=await admin('/api/admin/data');assert.ok(d.cats.some(c=>c.name==='Best Newcomer'));assert.ok(d.ex.some(e=>e.project_name==='Test Rig'))});
test('admin login: wrong password rejected',async()=>{assert.equal((await client(S)('/api/admin/login',{username:'admin',password:'nope'})).s,401)});
test('cross-origin POST rejected',async()=>{const r=await fetch(S.url+'/api/admin/voting',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{"open":false}'});assert.equal(r.status,403)});

test('image upload: real image accepted, other files rejected, served back',async()=>{
  const png=Buffer.concat([Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),Buffer.alloc(40)]);
  const ok=await admin('/api/admin/upload',png,true);assert.equal(ok.s,200);assert.match(ok.url,/^\/uploads\/[0-9a-f]{32}\.png$/);
  const got=await fetch(S.url+ok.url);assert.equal(got.status,200);assert.equal(got.headers.get('content-type'),'image/png');
  assert.equal((await admin('/api/admin/upload',Buffer.from('<script>alert(1)</script>'),true)).s,400);
  assert.equal((await client(S)('/api/admin/upload',png,true)).s,401)});

test('on-site check: IP restriction blocks registration, locate + vote, then allows again',async()=>{
  const c=await visitorLogin(S,'0790000050');                                  // verified while venue rules were off
  try{await admin('/api/admin/settings',{ip_on:true,ips:'203.0.113.0/24'});
    assert.equal((await c('/api/locate',{})).ok,false);
    assert.equal((await c('/api/vote',{category_id:1,exhibitor_id:1})).code,'offsite');   // session alone is not enough
    assert.equal((await client(S)('/api/register',{name:'Outsider',phone:'0790000051'})).code,'offsite')}
  finally{await admin('/api/admin/settings',{ip_on:false})}
  assert.equal((await c('/api/vote',{category_id:1,exhibitor_id:1})).s,200)});
test('on-site check: geofence needs a signed location cookie',async()=>{
  const c=await visitorLogin(S,'0790000060');
  try{await admin('/api/admin/settings',{geo_on:true,lat:'31.9539',lng:'35.9106',radius:'300'});
    assert.equal((await c('/api/vote',{category_id:1,exhibitor_id:1})).code,'offsite');   // no location proof
    assert.equal((await c('/api/locate',{lat:32.5,lng:36})).ok,false);                     // far away
    assert.equal((await c('/api/locate',{lat:31.9540,lng:35.9107})).ok,true);              // at venue
    assert.equal((await c('/api/vote',{category_id:1,exhibitor_id:1})).s,200)}
  finally{await admin('/api/admin/settings',{geo_on:false})}});

test('venue check: ANY enabled method passes — big-screen QR works without GPS or venue Wi-Fi',async()=>{
  assert.equal((await client(S)('/api/admin/qr')).s,401,'the rotating code is never given to the public');
  try{await admin('/api/admin/settings',{qr_on:false});assert.equal((await admin('/api/admin/qr')).code,null);
    await admin('/api/admin/settings',{qr_on:true,geo_on:true,ip_on:true,ips:'10.99.0.0/16',lat:'31.9539',lng:'35.9106',radius:'300'});
    const q=await admin('/api/admin/qr');assert.equal(q.on,true);assert.match(q.code,/^[\w-]{12}$/);assert.ok(q.expires_in>0&&q.expires_in<=15000);
    const c=client(S);
    assert.equal((await c('/api/register',{name:'No GPS',phone:'0790000099'})).code,'offsite');                 // no IP, no GPS, no QR → blocked
    assert.equal((await c('/api/locate',{})).ok,false);
    for(const bad of['aaaaaaaaaaaa','short','<script>xx</','ٴٴٴٴٴٴٴٴٴٴٴٴ'])assert.equal((await c('/api/qrpass',{code:bad})).ok,false,bad);
    assert.equal((await c('/api/qrpass',{code:q.code})).ok,true);                                                // scanned the big screen
    assert.equal((await c('/api/config')).here,true);assert.equal((await c('/api/locate',{})).ok,true);
    assert.equal((await c('/api/register',{name:'No GPS',phone:'0790000099'})).s,200);await new Promise(z=>setTimeout(z,50));
    assert.equal((await c('/api/verify',{code:S.otp('+962790000099')})).s,200);
    const b=await c('/api/ballot');assert.equal((await c('/api/vote',{category_id:b.cats[0].id,exhibitor_id:b.cats[0].items[0].id})).s,200);
    // GPS alone still works with the QR switched on (OR, not AND)
    const g=await visitorLoginVia(S,'0790000098',async x=>assert.equal((await x('/api/locate',{lat:31.9540,lng:35.9107})).ok,true));
    const gb=await g('/api/ballot');assert.equal((await g('/api/vote',{category_id:gb.cats[0].id,exhibitor_id:gb.cats[0].items[0].id})).s,200);
    // a phone without any proof cannot vote even with an older session
    const o=await visitorLoginVia(S,'0790000097',async x=>{await x('/api/qrpass',{code:(await admin('/api/admin/qr')).code})});
    await admin('/api/admin/settings',{qr_on:false});assert.equal((await o('/api/vote',{category_id:gb.cats[0].id,exhibitor_id:gb.cats[0].items[0].id})).code,'offsite','QR pass stops counting when the QR method is switched off');
  }finally{await admin('/api/admin/settings',{qr_on:false,geo_on:false,ip_on:false,ips:''})}});

test('rotating QR codes expire after about two slots',async()=>{const E=start(3913,{QR_SLOT_MS:'250'});await ready(E);const a=client(E);
  try{assert.equal((await a('/api/admin/login',{username:'admin',password:'admin1234'})).s,200);await a('/api/admin/settings',{qr_on:true});
    const c1=(await a('/api/admin/qr')).code,v=client(E);assert.equal((await v('/api/qrpass',{code:c1})).ok,true);
    await new Promise(z=>setTimeout(z,700));const r=await client(E)('/api/qrpass',{code:c1});assert.equal(r.ok,false);assert.equal(r.code,'expired');
    assert.notEqual((await a('/api/admin/qr')).code,c1,'a new code each slot')}finally{E.p.kill()}});

test('results modes: hidden / rank / count',async()=>{const snap=async()=>{const ctl=new AbortController(),r=await fetch(S.url+'/api/stream',{signal:ctl.signal}),v=JSON.parse(new TextDecoder().decode((await r.body.getReader().read()).value).replace(/^data: /,''));ctl.abort();return v};
  await admin('/api/admin/settings',{results:'hidden'});let v=await snap();assert.equal(v.cats[0].items.length,0);assert.equal(v.total,null);assert.equal(v.voters,null);assert.ok(v.projects>0);
  await admin('/api/admin/settings',{results:'rank'});v=await snap();assert.ok(v.cats[0].items.length>0);assert.equal(v.cats[0].items[0].c,undefined);assert.equal(v.voters,null);assert.equal(v.total,null);
  await admin('/api/admin/settings',{results:'count'});v=await snap();assert.ok(v.cats[0].items[0].c>=1);assert.ok(v.voters>=1);assert.ok(v.total>=v.cats[0].items[0].c);
  // public Results / Analysis feed: no visitor data, photos only as links
  const flat=JSON.stringify(v);assert.ok(!/\+9627|phone/.test(flat));assert.ok(v.cats.every(c=>c.items.every(i=>Object.keys(i).every(k=>['id','n','t','img','c','r'].includes(k)))));assert.ok(v.cats.every(c=>c.items.every(i=>i.img===''||/^(https:\/\/|\/)/.test(i.img))))});

test('live feed: vote presence and tie-aware ranks (used by the TV states)',async()=>{const ctl=new AbortController(),r=await fetch(S.url+'/api/stream',{signal:ctl.signal}),v=JSON.parse(new TextDecoder().decode((await r.body.getReader().read()).value).replace(/^data: /,''));ctl.abort();
  assert.equal(typeof v.any,'boolean');assert.equal(v.any,v.cats.some(c=>c.any));
  for(const c of v.cats){assert.equal(c.any,c.items.some(i=>i.c>0));for(const i of c.items){assert.equal(i.r,1+c.items.filter(x=>x.c>i.c).length)}
    const top=c.items.filter(i=>i.r===1);assert.ok(!c.items.length||top.length>=1);assert.ok(top.every(i=>i.c===c.items[0].c))}});

test('landing video is served with byte ranges (needed by iPhone Safari)',async()=>{
  const full=await fetch(S.url+'/media/mc2026.mp4',{method:'HEAD'});assert.equal(full.status,200);assert.equal(full.headers.get('content-type'),'video/mp4');assert.equal(full.headers.get('accept-ranges'),'bytes');const size=+full.headers.get('content-length');assert.ok(size>100000);
  const r=await fetch(S.url+'/media/mc2026.mp4',{headers:{range:'bytes=0-1'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),`bytes 0-1/${size}`);assert.equal((await r.arrayBuffer()).byteLength,2);
  const tail=await fetch(S.url+'/media/mc2026.mp4',{headers:{range:'bytes=-100'}});assert.equal(tail.status,206);assert.equal((await tail.arrayBuffer()).byteLength,100);
  assert.equal((await fetch(S.url+'/media/mc2026.mp4',{headers:{range:`bytes=${size}-`}})).status,416);
  const w=await fetch(S.url+'/media/mc2026.webm',{headers:{range:'bytes=0-9'}});assert.equal(w.status,206);assert.equal(w.headers.get('content-type'),'video/webm');await w.arrayBuffer();
  assert.equal((await fetch(S.url+'/media/../server.mjs')).status,200);assert.equal((await fetch(S.url+'/media/nope.mp4')).status,404)});

test('closing voting stops all votes',async()=>{const c=await visitorLogin(S,'0790000070');await admin('/api/admin/voting',{open:false});
  const r=await c('/api/vote',{category_id:1,exhibitor_id:1});assert.equal(r.s,403);assert.equal(r.code,'closed');const csv=await admin('/api/admin/export.csv');assert.equal(csv.s,200)});

test('reset requires explicit confirmation',async()=>{assert.equal((await admin('/api/admin/reset',{})).s,400);assert.equal((await admin('/api/admin/reset',{confirm:'RESET'})).s,200);assert.equal((await admin('/api/admin/data')).votes,0)});
