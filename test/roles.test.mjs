// Role-based access, random option order, display-order removal, QR removal.
import{test,before,after}from'node:test';import assert from'node:assert/strict';
import{spawn}from'node:child_process';import fs from'node:fs';import os from'node:os';import path from'node:path';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mcr-')),PORT=3921,URL0=`http://127.0.0.1:${PORT}`,log=[];
const srv=spawn('node',['--disable-warning=ExperimentalWarning','server.mjs'],{env:{...process.env,NODE_ENV:'development',PORT,DB_FILE:path.join(tmp,'db'),UPLOAD_DIR:path.join(tmp,'up')},cwd:path.resolve(import.meta.dirname,'..')});
srv.stdout.on('data',d=>log.push(String(d)));srv.stderr.on('data',d=>log.push(String(d)));
const otp=ph=>[...log.join('').matchAll(/\[DEV OTP\] (\S+): (\d{6})/g)].filter(x=>x[1]===ph).pop()?.[2];
const client=()=>{const jar={};const f=async(u,b,o={})=>{const r=await fetch(URL0+u,{method:o.method||(b!==undefined?'POST':'GET'),headers:{cookie:Object.entries(jar).map(([k,v])=>k+'='+v).join('; '),...(o.raw?{'content-type':'application/octet-stream'}:b!==undefined?{'content-type':'application/json'}:{})},body:o.raw?b:b!==undefined?JSON.stringify(b):undefined});
  for(const c of r.headers.getSetCookie()){const[kv]=c.split(';'),i=kv.indexOf('=');jar[kv.slice(0,i)]=kv.slice(i+1)}
  const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}return{s:r.status,text:t,type:r.headers.get('content-type'),...j}};return f};
const login=async(u,p)=>{const c=client();assert.equal((await c('/api/admin/login',{username:u,password:p})).s,200,u);return c};
const visitor=async(phone,name='Order Tester')=>{const c=client();await c('/api/register',{name,phone});await new Promise(z=>setTimeout(z,60));
  const n='+962'+phone.slice(1);assert.equal((await c('/api/verify',{code:otp(n)})).s,200);return c};
let sup,mgr;
before(async()=>{for(let i=0;i<60;i++){try{if((await fetch(URL0+'/healthz')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  sup=await login('admin','admin1234');mgr=await login('manager','manager1234')});
after(()=>{srv.kill();fs.rmSync(tmp,{recursive:true,force:true})});
const png=Buffer.concat([Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),Buffer.alloc(40)]);

test('demo accounts: admin=Super Admin, manager=Admin (Viewer Admin no longer exists)',async()=>{
  assert.equal((await sup('/api/admin/data')).me.role,'super_admin');assert.equal((await mgr('/api/admin/data')).me.role,'admin');
  assert.equal((await client()('/api/admin/login',{username:'viewer',password:'viewer1234'})).s,401)});

test('no session → 401 on every admin route',async()=>{const c=client();
  for(const u of['/api/admin/data','/api/admin/voting','/api/admin/reset','/api/admin/settings','/api/admin/exhibitor','/api/admin/category','/api/admin/user','/api/admin/user/delete','/api/admin/export.csv'])
    assert.equal((await c(u,u.includes('data')||u.includes('csv')?undefined:{})).s,401,u)});

test('Viewer Admin role removed: cannot be created or assigned',async()=>{
  const r=await sup('/api/admin/user',{username:'view.only',password:'password123',role:'viewer'});assert.equal(r.s,400);assert.equal(r.code,'role');
  const d=await sup('/api/admin/data');assert.ok(d.users.every(u=>['super_admin','admin'].includes(u.role)));
  const m=d.users.find(u=>u.username==='manager');assert.equal((await sup('/api/admin/user',{id:m.id,role:'viewer'})).s,400);assert.equal((await mgr('/api/admin/data')).me.role,'admin')});

test('Admin: manages content, cannot open/close voting, reset, change settings or manage users',async()=>{
  const d=await mgr('/api/admin/data');assert.equal(d.s,200);assert.equal(d.settings.lat,undefined);assert.equal(d.users,undefined);assert.ok(Array.isArray(d.visitors));
  const sBefore=(await sup('/api/admin/data')).voting;
  for(const[u,b,re]of[['/api/admin/voting',{open:true},/open or close voting/],['/api/admin/reset',{confirm:'RESET'},/reset votes/],['/api/admin/settings',{event:'Hacked'},/change settings/],['/api/admin/user',{username:'x1x1',password:'password123',role:'admin'},/manage users/],['/api/admin/user/delete',{id:1},/manage users/]]){
    const r=await mgr(u,b);assert.equal(r.s,403,u);assert.match(r.error,re)}
  const after=await sup('/api/admin/data');assert.equal(after.voting,sBefore);assert.notEqual(after.settings.event,'Hacked');
  assert.equal((await mgr('/api/admin/category',{name:'Admin Category',description:'by admin',active:true})).s,200);
  assert.equal((await mgr('/api/admin/exhibitor',{project_name:'Admin Team',exhibitor_name:'Crew',short_description:'x',image_url:'/uploads/t.png',cats:[1],active:true})).s,200);
  assert.equal((await mgr('/api/admin/upload',png,{raw:true})).s,200);assert.equal((await mgr('/api/admin/export.csv')).s,200)});

test('Super Admin: voting control, settings, users, reset',async()=>{
  assert.equal((await sup('/api/admin/voting',{open:true})).s,200);assert.equal((await sup('/api/admin/data')).voting,'open');
  assert.equal((await sup('/api/admin/voting',{open:false})).s,200);assert.equal((await sup('/api/admin/data')).voting,'closed');
  assert.equal((await sup('/api/admin/settings',{event:'Maker Collective 2026'})).s,200);
  const d=await sup('/api/admin/data');assert.ok(d.settings.lat);assert.ok(d.users.length>=2);assert.equal(d.me.can.users,true)});

test('write routes accept POST only (no state change on GET)',async()=>{
  assert.equal((await sup('/api/admin/voting',undefined,{method:'GET'})).s,405);assert.equal((await mgr('/api/admin/voting',undefined,{method:'GET'})).s,403)});

test('user management rules',async()=>{
  assert.equal((await sup('/api/admin/user',{username:'ab',password:'password123',role:'admin'})).s,400);
  assert.equal((await sup('/api/admin/user',{username:'sara.m',password:'short',role:'admin'})).s,400);
  assert.equal((await sup('/api/admin/user',{username:'sara.m',password:'password123',role:'boss'})).s,400);
  const c=await sup('/api/admin/user',{username:'Sara.M',password:'password123',role:'admin'});assert.equal(c.s,200);
  assert.equal((await sup('/api/admin/user',{username:'sara.m',password:'password123',role:'admin'})).s,409);
  const sara=await login('sara.m','password123');assert.equal((await sara('/api/admin/settings',{event:'Maker Collective 2026'})).s,403);
  // promote → effective immediately on the existing session (role is read from the database on every request)
  assert.equal((await sup('/api/admin/user',{id:c.id,username:'sara.m',role:'super_admin'})).s,200);assert.equal((await sara('/api/admin/settings',{event:'Maker Collective 2026'})).s,200);
  assert.equal((await sup('/api/admin/user',{id:c.id,role:'admin'})).s,200);assert.equal((await sara('/api/admin/settings',{event:'Maker Collective 2026'})).s,403);
  // password reset
  assert.equal((await sup('/api/admin/user',{id:c.id,role:'admin',password:'newpass1234'})).s,200);assert.equal((await client()('/api/admin/login',{username:'sara.m',password:'password123'})).s,401);await login('sara.m','newpass1234');
  // guard rails
  const me=(await sup('/api/admin/data')).me;
  assert.equal((await sup('/api/admin/user',{id:me.id,role:'admin'})).code,'self');assert.equal((await sup('/api/admin/user/delete',{id:me.id})).code,'self');
  // delete → session dies
  assert.equal((await sup('/api/admin/user/delete',{id:c.id})).s,200);assert.equal((await sara('/api/admin/data')).s,401);
  // an Admin cannot promote themselves
  const mid=(await mgr('/api/admin/data')).me.id;assert.equal((await mgr('/api/admin/user',{id:mid,role:'super_admin'})).s,403)});

test('last Super Admin cannot be demoted or deleted',async()=>{
  const d=await sup('/api/admin/data'),supers=d.users.filter(u=>u.role==='super_admin');assert.equal(supers.length,1);
  const second=await sup('/api/admin/user',{username:'boss2',password:'password123',role:'super_admin'});assert.equal(second.s,200);
  const b2=await login('boss2','password123');
  assert.equal((await b2('/api/admin/user',{id:supers[0].id,role:'admin'})).s,200); // two supers → demotion allowed
  assert.equal((await b2('/api/admin/user',{id:second.id,role:'admin'})).code,'self');
  const mid=(await b2('/api/admin/data')).me.id;assert.equal((await b2('/api/admin/user/delete',{id:mid})).code,'self');
  // restore: boss2 promotes admin back, then boss2 is the only other super
  assert.equal((await b2('/api/admin/user',{id:supers[0].id,role:'super_admin'})).s,200);
  assert.equal((await sup('/api/admin/user/delete',{id:second.id})).s,200)});

test('logout ends the session',async()=>{const c=await login('manager','manager1234');assert.equal((await c('/api/admin/logout',{})).s,200);assert.equal((await c('/api/admin/data')).s,401)});

test('voters see all options in a random order that is stable within a session',async()=>{
  const adm=await sup('/api/admin/data'),want=c=>adm.ex.filter(x=>x.active&&x.cats.includes(c.id)).map(x=>x.id).sort((a,b)=>a-b);
  const people=[];for(let i=0;i<6;i++)people.push(await visitor('079660000'+i,'Order '+i));
  const ballots=[];for(const p of people){const b=await p('/api/ballot'),b2=await p('/api/ballot');ballots.push(b);
    for(const[k,c]of b.cats.entries()){assert.deepEqual(c.items.map(i=>i.id).sort((a,b)=>a-b),want(adm.cats.find(x=>x.id===c.id)),'every team appears exactly once');
      assert.deepEqual(c.items.map(i=>i.id),b2.cats[k].items.map(i=>i.id),'stable within a session')}}
  const distinct=new Set(ballots.map(b=>b.cats[0].items.map(i=>i.id).join(',')));assert.ok(distinct.size>=3,'different visitors get different orders: '+distinct.size);
  const byId=[...ballots[0].cats[0].items.map(i=>i.id)];assert.notDeepEqual(byId,[...byId].sort((a,b)=>a-b),'not simply id-ordered');
  // order is unaffected by voting
  const p=people[0],cat=ballots[0].cats[1],before=cat.items.map(i=>i.id);await sup('/api/admin/voting',{open:true});assert.equal((await p('/api/vote',{category_id:cat.id,exhibitor_id:before[0]})).s,200);
  assert.deepEqual((await p('/api/ballot')).cats[1].items.map(i=>i.id),before);await sup('/api/admin/voting',{open:false})});

test('manual display order is gone (API ignores it, categories follow creation order)',async()=>{
  const r=await sup('/api/admin/category',{name:'Zeta Last',description:'',display_order:-5,active:true});assert.equal(r.s,200);
  const d=await sup('/api/admin/data');assert.ok(d.cats.every(c=>!('display_order' in c)));assert.deepEqual(d.cats.map(c=>c.id),[...d.cats.map(c=>c.id)].sort((a,b)=>a-b));assert.equal(d.cats.at(-1).name,'Zeta Last')});

test('QR code feature removed',async()=>{
  assert.ok(!fs.existsSync(path.resolve(import.meta.dirname,'../public/qr.js')));
  const r=await client()('/qr.js');assert.match(r.type,/text\/html/); // SPA fallback, not a script
  const app=fs.readFileSync(path.resolve(import.meta.dirname,'../public/app.js'),'utf8');assert.ok(!/qrcode|loadQR|createSvgTag/i.test(app));
  const html=fs.readFileSync(path.resolve(import.meta.dirname,'../public/index.html'),'utf8');assert.ok(!/qr/i.test(html));
  assert.equal((await client()('/')).s,200)});

test('exhibitor needs name, team, short description, photo and a category',async()=>{
  const ok={project_name:'Req Team',exhibitor_name:'Crew',short_description:'Does things',image_url:'/uploads/r.png',cats:[1],active:true};
  for(const[field,bad]of[['project_name',{project_name:'  '}],['exhibitor_name',{exhibitor_name:''}],['short_description',{short_description:''}],['image_url',{image_url:''}],['image_url',{image_url:'🛠️'}],['cats',{cats:[]}],['cats',{cats:[99999]}]]){
    const r=await mgr('/api/admin/exhibitor',{...ok,...bad});assert.equal(r.s,400,field);assert.equal(r.code,'invalid');assert.equal(r.field,field);assert.ok(r.error.length>10)}
  assert.equal((await mgr('/api/admin/exhibitor',ok)).s,200);
  const d=await sup('/api/admin/data');assert.equal(d.ex.filter(e=>e.project_name==='Req Team').length,1)});
test('static UI: language picker, no "who can do what", no Add-category form, brand logo + footer',()=>{
  const app=fs.readFileSync(path.resolve(import.meta.dirname,'../public/app.js'),'utf8');
  assert.ok(!/who can do what/i.test(app));assert.ok(!/Add or edit a category/i.test(app));
  assert.match(app,/data-l="ar"/);assert.match(app,/data-l="en"/);assert.match(app,/logo-full-white\.png/);assert.match(app,/themakercollective@cpf\.jo/);
  for(const f of['logo.png','logo-white.png','logo-full-white.png','favicon.png'])assert.ok(fs.existsSync(path.resolve(import.meta.dirname,'../public/brand/'+f)),f)});

test('existing Viewer Admin accounts are removed on upgrade',async()=>{const{DatabaseSync}=await import('node:sqlite');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mcv-')),f=path.join(dir,'db');
  const d=new DatabaseSync(f);d.exec("CREATE TABLE admins(id INTEGER PRIMARY KEY,username TEXT UNIQUE,password_hash TEXT,mfa_enabled INT DEFAULT 0,role TEXT NOT NULL DEFAULT 'super_admin')");
  d.prepare('INSERT INTO admins(username,password_hash,role) VALUES(?,?,?)').run('oldview','x:y','viewer');d.prepare('INSERT INTO admins(username,password_hash,role) VALUES(?,?,?)').run('boss','x:y','super_admin');d.close();
  const P2=3923,s2=spawn('node',['--disable-warning=ExperimentalWarning','server.mjs'],{env:{...process.env,NODE_ENV:'development',PORT:P2,DB_FILE:f,UPLOAD_DIR:path.join(dir,'up')},cwd:path.resolve(import.meta.dirname,'..')});
  try{for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${P2}/healthz`)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
    const d2=new DatabaseSync(f);const roles=d2.prepare('SELECT username,role FROM admins ORDER BY id').all().map(r=>r.username+':'+r.role);d2.close();
    assert.ok(!roles.some(r=>r.endsWith(':viewer')),roles.join());assert.ok(roles.includes('boss:super_admin'))}
  finally{s2.kill();await new Promise(r=>setTimeout(r,150));fs.rmSync(dir,{recursive:true,force:true})}});
