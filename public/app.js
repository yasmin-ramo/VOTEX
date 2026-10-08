const $=(s,r=document)=>r.querySelector(s),A=$('#app');
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(u,b,m){try{const r=await fetch(u,{method:m||(b?'POST':'GET'),headers:{'content-type':'application/json'},body:b?JSON.stringify(b):undefined});const j=await r.json().catch(()=>({}));if(r.status===403&&j.error)toast(j.error);return{s:r.status,...j}}catch{return{s:0}}}
const toast=t=>{const d=document.createElement('div');d.className='toast';d.setAttribute('role','status');d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),3500)};

/* ---------------- shared UI: icons, pictures, modal ---------------- */
const IC={grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
chart:'<path d="M5 21V11M12 21V3M19 21v-8"/>',box:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
sliders:'<path d="M4 6h8M20 6h-2M4 12h2M20 12H12M4 18h10M20 18h-2"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',

download:'<path d="M12 4v11m0 0-4-4m4 4 4-4M4 20h16"/>',upload:'<path d="M12 16V5m0 0-4 4m4-4 4 4M4 20h16"/>',ext:'<path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
vote:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',shield:'<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/>',full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
tv:'<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',warn:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',logout:'<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M20 12H9"/>',trophy:'<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8M10 18h4"/>',userplus:'<circle cx="10" cy="8" r="3.5"/><path d="M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',pinok:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><path d="m9 9.5 2 2 4-4"/>'};
const ic=n=>`<svg class="ic ic-${n}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${IC[n]||''}</svg>`;
const img=(i,n='')=>/^(https:\/\/|\/)/.test(i||'')?`<img src="${E(i)}" alt="${E(n)}" loading="lazy">`:`<span class="emo" role="img" aria-label="${E(n)}">${E(i||'🛠️')}</span>`;
const tint=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h%5};
const pic=(i,n='')=>`<div class="pic t${tint(n)}">${img(i,n)}</div>`;
const ini=s=>E([...String(s||'?').trim()][0]?.toUpperCase()||'?');
const empty=(i,t,p)=>`<div class="empty"><span class="ico">${ic(i)}</span><h3>${E(t)}</h3><p>${E(p)}</p></div>`;
/* accessible dialog: Escape + backdrop close, focus trap, focus restore, no background scroll */
function modal(h,o={}){const prev=document.activeElement,m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="mt">${h}</div>`;const d=m.firstChild;document.body.style.overflow='hidden';
  const close=r=>{if(m.isConnected){m.remove();document.removeEventListener('keydown',kd);document.body.style.overflow='';prev?.focus?.();o.onclose?.(r)}};
  const kd=e=>{if(d.dataset.busy)return;if(e.key==='Escape'){e.preventDefault();close()}else if(e.key==='Tab'){const f=[...d.querySelectorAll('button:not(:disabled),input,select,a[href]')];if(!f.length)return;const a=f[0],z=f.at(-1);
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}};
  m.onmousedown=e=>{if(e.target===m&&!d.dataset.busy)close()};document.addEventListener('keydown',kd);document.body.append(m);return{m,d,close}}
/* in-page replacement for confirm()/prompt() */
const ask=o=>new Promise(res=>{const {d,close}=modal(`<div class="ic-c ${o.danger?'red':'yl'}">${ic(o.icon||'warn')}</div><h2 id="mt">${E(o.title)}</h2><p>${E(o.text||'')}</p>${o.type?`<label>Type <b>${E(o.type)}</b> to confirm<input id="ai" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>`:''}<div class="acts"><button class="btn lg ${o.danger?'danger':''}" id="ay" ${o.type?'disabled':''}>${E(o.ok||'Confirm')}</button><button class="btn sec lg" id="an">Cancel</button></div>`,{onclose:r=>res(!!r)});
  const ai=$('#ai',d);if(ai){ai.oninput=()=>$('#ay',d).disabled=ai.value.trim()!==o.type;ai.focus()}else $('#an',d).focus();
  $('#an',d).onclick=()=>close(false);$('#ay',d).onclick=()=>close(true)});

/* ---------------- visitor ---------------- */
/* Footer details from the brand guidelines. Add the official page links to SOCIAL to show the round icons. */
const CONTACT={tel:'+962 79 100 0110',mail:'themakercollective@cpf.jo',fax:'+962 6 5806162'};
const SOCIAL={facebook:'',instagram:'',youtube:''};
Object.assign(IC,{play:'<path d="M8 5.5v13l11-6.5z"/>',pause:'<path d="M9 5v14M15 5v14"/>',facebook:'<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8z"/>',instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',youtube:'<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>'});
/* language (Arabic / English) — chosen on the first screen, remembered on this phone */
const arN=(n,a,b,c,d)=>n===1?a:n===2?b:n>=3&&n<=10?c(n):d(n);
const TX={en:{
 title:'The Maker Collective 2026 — Community Awards',brand:'The Maker Collective 2026',by:'organised by Crown Prince Foundation',skip:'Skip to content',home_aria:'The Maker Collective 2026 — home',lg_switch:'Change language',
 open:'Voting open',closed:'Voting closed',voted:'Voted',notyet:'Not voted yet',vote:'Vote',voteIn:n=>`Vote in ${n}`,
 w_sub:'Community Awards',w_h1:'The Maker Collective <em>2026</em>',w_lead:'Vote for the projects and makers that impressed you most.',w_s1:'Verify your phone',w_s2:'Pick a favorite in each category',w_s3:'Celebrate the makers',w_go:'Start voting',w_fine:'It only takes a minute.',w_geo:" We use your location only to confirm that you're attending the event.",
 out_h:'Voting is available at the event venue',out_p:'Visit The Maker Collective 2026 to take part in the Community Awards.',out_qr:'At the venue? Scan the QR code on the big screen to vote.',qr_ok:'Checked in at the venue ✓',qr_exp:'That code has expired — scan the big screen again.',
 step:n=>`Step ${n} of 2`,verify:'Verify',r_h:"Let's get you ready to vote",r_ok:"You're at The Maker Collective",r_name:'Name',r_phone:'Mobile number',r_send:'Send verification code',r_fine:'Your details are stored securely and only used for voting.',
 r_many:'Too many tries. Please wait a few minutes.',r_net:"We're having trouble connecting. Try again.",r_off:'Voting is available to visitors at the Maker Collective venue.',r_bad:'Please check your name and mobile number.',
 o_h:'Check your phone',o_p:'We sent a 6-digit verification code to',o_aria:'Verification code',o_digit:n=>`Code digit ${n}`,o_rs:n=>`Resend code in ${n}s`,o_rs2:'Resend code',o_change:'‹ Change phone number',
 o_wrong:"That code doesn't look right. Check the SMS and try again.",o_exp:'That code has expired. Request a new one.',o_att:'Too many attempts. Request a new code.',o_wait:'Please wait a moment, then try again.',
 cl_h:"Voting isn't open right now",cl_p:"Voting hasn't started yet — or has just closed. Check back soon.",
 h_eye:'Community Awards',h_in:"You're in! 🎉",h_back:n=>`Welcome back, <span dir="auto">${n}</span>`,h_p:'You have one vote in each award category.',h_cast:(n,t)=>`${n} of ${t} votes cast`,h_togo:n=>`${n} to go`,h_prog:'Voting progress',h_cont:'Continue',h_start:'Start voting',
 c_tabs:'Award categories',c_back:'‹ Back',c_of:(n,t)=>`Category ${n} of ${t}`,c_voted:(n,t)=>`${n} of ${t} voted`,c_done:"You've voted in this category. Thank you!",
 s_lbl:'Search teams',s_ph:'Search teams or projects',s_clr:'Clear search',s_your:'Your vote',s_mine:'You voted for this',s_already:'Already voted',s_choose:'Choose your favorite',s_chooseA:n=>`Choose ${n}`,
 s_none:q=>`No teams match “${q}”`,s_nonep:'Check the spelling or try a shorter name.',s_show:(n,m)=>`Showing ${n} of ${m} teams`,s_nf:'No teams found',c_noh:'No projects yet',c_nop:"Projects will appear here once they're added.",
 cf_h:n=>`Vote for ${n}?`,cf_p:'You can only vote once in this category.',cf_y:'Confirm vote',cf_n:'Choose another',cf_send:'Sending…',
 v_conn:'Connection interrupted. Checking your vote…',v_closed:'Voting has now closed. Thanks for taking part!',v_already:"You've already voted in this category.",v_off:'Voting is available to visitors at the Maker Collective venue.',v_slow:'Slow down a little, then try again.',
 ok_h:'Your vote is in!',ok_1:'Almost done — one category left',ok_n:n=>`${n} categories left`,ok_go:'Continue',
 dn_h:'Thanks for voting!',dn_p:n=>`Your ${n} votes have been recorded.`,dn_small:'Enjoy the rest of The Maker Collective 2026.',
 l_vote:'Vote',l_vote_p:'Support your favorite makers',l_vote_c:'Continue where you left off',l_vote_d:'See the votes you cast',l_res:'Results / Analysis',l_res_p:"Explore the community's choices",l_note:'You can change your language at any time',
 v_aria:'The Maker Collective 2026 highlights video',v_play:'Play video',v_pause:'Pause video',
 a_doc:'Results & analysis — The Maker Collective 2026',a_title:'Results &amp; analysis',a_lead:'Live from The Maker Collective 2026 — updates automatically.',a_back:'‹ Back',a_conn:'Connecting to live results…',a_re:'Reconnecting…',
 a_votes:'Votes cast',a_voters:'Voters',a_cats:'Categories',a_proj:'Projects',a_rank:'Ranking only — vote counts are hidden for now.',
 a_lead_l:'Leading',a_tied:'Tied for the lead',a_ahead:n=>`+${n} ahead`,a_vn:n=>n===1?'1 vote':`${n} votes`,a_share:p=>`<bdi dir="ltr">${p}%</bdi> of the votes`,
 a_none:'No votes yet',a_none_p:'The leader appears with the first vote.',a_noproj:'No projects in this category yet.',a_nocat:'No categories yet',a_nocat_p:'Award categories will appear here.',
 a_hid_h:'Results will be revealed soon',a_hid_p:'The organisers will share the results here. Check back later.',a_more:n=>`Show ${n} more`,a_less:'Show less',
 a_hl_busy:'Most active category',a_hl_close:'Closest race',a_apart:n=>n===0?'Tied for first place':n===1?'1 vote apart':`${n} votes apart`,
 f_tel:'Tel:',f_mail:'Email:',f_fax:'Fax:',f_po:'P.O.Box:',f_po_v:'84 Amman 11821 Jordan'},
ar:{
 title:'ملتقى الصُنّاع 2026 — جوائز المجتمع',brand:'ملتقى الصُنّاع 2026',by:'بتنظيم من مؤسسة ولي العهد',skip:'تخطَّ إلى المحتوى',home_aria:'ملتقى الصُنّاع 2026 — الرئيسية',lg_switch:'تغيير اللغة',
 open:'التصويت مفتوح',closed:'التصويت مغلق',voted:'تم التصويت',notyet:'لم تصوّت بعد',vote:'صوّت',voteIn:n=>`التصويت في ${n}`,
 w_sub:'جوائز المجتمع',w_h1:'ملتقى الصُنّاع <em>2026</em>',w_lead:'صوّت للمشاريع والصُنّاع الذين أبهروك أكثر.',w_s1:'تحقّق من رقم هاتفك',w_s2:'اختر مشروعك المفضّل في كل فئة',w_s3:'احتفِ بالصُنّاع',w_go:'ابدأ التصويت',w_fine:'لن يستغرق الأمر سوى دقيقة.',w_geo:' نستخدم موقعك فقط للتأكد من حضورك للفعالية.',
 out_h:'التصويت متاح في موقع الفعالية',out_p:'زُر ملتقى الصُنّاع 2026 للمشاركة في جوائز المجتمع.',out_qr:'هل أنت في موقع الفعالية؟ امسح رمز QR على الشاشة الكبيرة للتصويت.',qr_ok:'تم التحقق من وجودك في الموقع ✓',qr_exp:'انتهت صلاحية الرمز — امسح رمز الشاشة الكبيرة مرة أخرى.',
 step:n=>`الخطوة ${n} من 2`,verify:'التحقق',r_h:'لنجهّزك للتصويت',r_ok:'أنت في ملتقى الصُنّاع',r_name:'الاسم',r_phone:'رقم الجوال',r_send:'إرسال رمز التحقق',r_fine:'تُحفظ بياناتك بأمان وتُستخدم للتصويت فقط.',
 r_many:'محاولات كثيرة. يرجى الانتظار بضع دقائق.',r_net:'تعذّر الاتصال. حاول مرة أخرى.',r_off:'التصويت متاح للزوّار في موقع ملتقى الصُنّاع.',r_bad:'يرجى التحقق من الاسم ورقم الجوال.',
 o_h:'تحقّق من هاتفك',o_p:'أرسلنا رمز تحقق من 6 أرقام إلى',o_aria:'رمز التحقق',o_digit:n=>`الرقم ${n} من الرمز`,o_rs:n=>`إعادة إرسال الرمز بعد ${n} ث`,o_rs2:'إعادة إرسال الرمز',o_change:'‹ تغيير رقم الجوال',
 o_wrong:'الرمز غير صحيح. تحقّق من الرسالة وحاول مرة أخرى.',o_exp:'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.',o_att:'محاولات كثيرة. اطلب رمزًا جديدًا.',o_wait:'يرجى الانتظار قليلًا ثم المحاولة مجددًا.',
 cl_h:'التصويت غير متاح حاليًا',cl_p:'لم يبدأ التصويت بعد، أو أُغلق للتو. عاود الزيارة قريبًا.',
 h_eye:'جوائز المجتمع',h_in:'أهلًا بك! 🎉',h_back:n=>`أهلًا بعودتك، <span dir="auto">${n}</span>`,h_p:'لديك صوت واحد في كل فئة من فئات الجوائز.',h_cast:(n,t)=>`تم الإدلاء بـ ${n} من ${t} أصوات`,h_togo:n=>`متبقٍّ ${n}`,h_prog:'تقدّم التصويت',h_cont:'متابعة',h_start:'ابدأ التصويت',
 c_tabs:'فئات الجوائز',c_back:'‹ رجوع',c_of:(n,t)=>`الفئة ${n} من ${t}`,c_voted:(n,t)=>`تم التصويت في ${n} من ${t}`,c_done:'لقد صوّتَّ في هذه الفئة. شكرًا لك!',
 s_lbl:'ابحث عن الفرق',s_ph:'ابحث عن فريق أو مشروع',s_clr:'مسح البحث',s_your:'صوتك',s_mine:'صوّتَّ لهذا المشروع',s_already:'تم التصويت',s_choose:'اختر مشروعك المفضّل',s_chooseA:n=>`اختيار ${n}`,
 s_none:q=>`لا توجد فرق مطابقة لـ «${q}»`,s_nonep:'تحقّق من الإملاء أو جرّب اسمًا أقصر.',s_show:(n,m)=>`عرض ${n} من ${m} فريقًا`,s_nf:'لا توجد فرق',c_noh:'لا توجد مشاريع بعد',c_nop:'ستظهر المشاريع هنا فور إضافتها.',
 cf_h:n=>`التصويت لـ ${n}؟`,cf_p:'يمكنك التصويت مرة واحدة فقط في هذه الفئة.',cf_y:'تأكيد التصويت',cf_n:'اختيار آخر',cf_send:'جارٍ الإرسال…',
 v_conn:'انقطع الاتصال. جارٍ التحقق من صوتك…',v_closed:'أُغلق التصويت. شكرًا لمشاركتك!',v_already:'لقد صوّتَّ في هذه الفئة مسبقًا.',v_off:'التصويت متاح للزوّار في موقع ملتقى الصُنّاع.',v_slow:'تمهّل قليلًا ثم حاول مجددًا.',
 ok_h:'تم تسجيل صوتك!',ok_1:'اقتربت من الانتهاء — بقيت فئة واحدة',ok_n:n=>`بقيت ${arN(n,'','فئتان',x=>x+' فئات',x=>x+' فئة')}`,ok_go:'متابعة',
 dn_h:'شكرًا لتصويتك!',dn_p:n=>`تم تسجيل أصواتك (${n}).`,dn_small:'استمتع ببقية فعاليات ملتقى الصُنّاع 2026.',
 l_vote:'صوّت',l_vote_p:'ادعم صُنّاعك المفضّلين',l_vote_c:'تابع من حيث توقفت',l_vote_d:'اطّلع على الأصوات التي أدليت بها',l_res:'النتائج / التحليلات',l_res_p:'استكشف اختيارات المجتمع',l_note:'يمكنك تغيير اللغة في أي وقت',
 v_aria:'فيديو ملتقى الصُنّاع 2026',v_play:'تشغيل الفيديو',v_pause:'إيقاف الفيديو مؤقتًا',
 a_doc:'النتائج والتحليلات — ملتقى الصُنّاع 2026',a_title:'النتائج والتحليلات',a_lead:'مباشرة من ملتقى الصُنّاع 2026 — تتحدّث تلقائيًا.',a_back:'‹ رجوع',a_conn:'جارٍ الاتصال بالنتائج المباشرة…',a_re:'جارٍ إعادة الاتصال…',
 a_votes:'الأصوات',a_voters:'المصوّتون',a_cats:'الفئات',a_proj:'المشاريع',a_rank:'الترتيب فقط — أعداد الأصوات مخفية حاليًا.',
 a_lead_l:'في الصدارة',a_tied:'تعادل على الصدارة',a_ahead:n=>`متقدّم بفارق ${n}`,a_vn:n=>n===0?'0 صوت':arN(n,'صوت واحد','صوتان',x=>x+' أصوات',x=>x+' صوتًا'),a_share:p=>`<bdi dir="ltr">${p}%</bdi> من الأصوات`,
 a_none:'لا توجد أصوات بعد',a_none_p:'يظهر المتصدّر مع أول صوت.',a_noproj:'لا توجد مشاريع في هذه الفئة بعد.',a_nocat:'لا توجد فئات بعد',a_nocat_p:'ستظهر فئات الجوائز هنا.',
 a_hid_h:'ستُعلن النتائج قريبًا',a_hid_p:'سيشارك المنظّمون النتائج هنا. عاود الزيارة لاحقًا.',a_more:n=>`عرض ${n} إضافية`,a_less:'عرض أقل',
 a_hl_busy:'الفئة الأكثر تفاعلًا',a_hl_close:'المنافسة الأشدّ',a_apart:n=>n===0?'تعادل على المركز الأول':n===1?'بفارق صوت واحد':n===2?'بفارق صوتين':`بفارق ${n} ${n<=10?'أصوات':'صوتًا'}`,
 f_tel:'هاتف:',f_mail:'البريد الإلكتروني:',f_fax:'فاكس:',f_po:'ص.ب:',f_po_v:'84 عمّان 11821 الأردن'}};
let LG='',RE=null;try{const v=localStorage.getItem('mc_lang');if(v==='ar'||v==='en')LG=v}catch{}
const t=(k,...a)=>{const v=TX[LG||'en'][k]??TX.en[k];return typeof v==='function'?v(...a):v};
const setLG=(l,keep)=>{LG=l;if(!keep)try{localStorage.setItem('mc_lang',l)}catch{}const h=document.documentElement;h.lang=l;h.dir=l==='ar'?'rtl':'ltr';document.title=t('title')};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let cfg,B,L;
const chipS=o=>`<span class="chip ${o?'ok':''}"><span class="ct">${t(o?'open':'closed')}</span></span>`;
const live=()=>B?chipS(B.open):'';
/* soft brand background — created once, fades in on first paint */
const bgOn=()=>{if($('#bg'))return;const b=document.createElement('div');b.id='bg';b.className='bg';b.setAttribute('aria-hidden','true');b.innerHTML='<i></i><i></i><i></i><i></i>';document.body.prepend(b);requestAnimationFrame(()=>requestAnimationFrame(()=>b.classList.add('on')))};
const foot=()=>{const so=Object.entries(SOCIAL).filter(([,u])=>u).map(([k,u])=>`<a class="soc" href="${E(u)}" target="_blank" rel="noopener" aria-label="${E(k)}">${ic(k)}</a>`).join('');
  return`<footer class="foot"><div class="foot-top"><img class="foot-logo" src="/brand/logo-full-white.png" alt="${E(t('brand'))} — ${E(t('by'))}">${so?`<div class="socs">${so}</div>`:''}</div><ul class="foot-strip"><li>${t('f_tel')} <a dir="ltr" href="tel:${CONTACT.tel.replace(/\s/g,'')}">${CONTACT.tel}</a></li><li>${t('f_mail')} <a dir="ltr" href="mailto:${CONTACT.mail}">${CONTACT.mail}</a></li><li>${t('f_fax')} <bdi dir="ltr">${CONTACT.fax}</bdi></li><li>${t('f_po')} <span>${t('f_po_v')}</span></li></ul></footer>`};
/* header: logo centred; status chip at the start, language switch at the end. Landing: transparent header over the video band */
const scr=(h,o={})=>{bgOn();
  A.innerHTML=`<a class="skip" href="#main">${E(t('skip'))}</a><div class="shell"><header class="top${o.land?' land':''}"><div class="top-l">${o.r||''}</div><a class="brand" href="/" aria-label="${E(t('home_aria'))}"><img src="/brand/logo-white.png" alt="${E(t('brand'))}"></a><div class="top-r">${o.pick?'':`<button class="lg-sw" id="lgs" type="button" aria-label="${E(t('lg_switch'))}"><span lang="${LG==='ar'?'en':'ar'}">${LG==='ar'?'English':'عربي'}</span></button>`}</div></header><main class="${o.land?'land':o.hero?'hero':'wrap'+(o.wide?' wide':'')}" id="main" tabindex="-1">${h}</main>${foot()}</div>`;
  RE=o.re||null;const s=$('#lgs');if(s)s.onclick=()=>{setLG(LG==='ar'?'en':'ar');RE&&RE()};if(!o.keep)scrollTo(0,0)};
const next=()=>B.cats.find(c=>!c.voted);
const nVoted=()=>B.cats.filter(c=>c.voted).length;
const pickOf=c=>c.items.find(i=>i.id===c.voted);
const list=()=>`<ul class="cl">${B.cats.map((c,k)=>`<li class="${c.voted?'v':''}"><span class="n" aria-hidden="true">${c.voted?ic('check'):k+1}</span><span class="t" dir="auto">${E(c.name)}<small>${c.voted?E(t('voted'))+(pickOf(c)?' · '+E(pickOf(c).project_name):''):E(t('notyet'))}</small></span>${B.open&&!c.voted?`<button class="btn sm sec" data-c="${c.id}" aria-label="${E(t('voteIn',c.name))}">${E(t('vote'))}</button>`:''}</li>`).join('')}</ul>`;
const wireList=()=>A.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>cat(B.cats.find(c=>c.id==b.dataset.c)));
async function visitor(){const vq=new URLSearchParams(location.search).get('vq');
  /* arrived from the big-screen QR: swap the short-lived code for a venue pass, then drop it from the address bar */
  if(vq){const q=await api('/api/qrpass',{code:vq});try{history.replaceState(null,'',location.pathname)}catch{}if(q.ok)setTimeout(()=>toast(t('qr_ok')),400);else if(q.code==='expired')setTimeout(()=>toast(t('qr_exp')),400)}
  cfg=await api('/api/config');const r=await api('/api/ballot');if(r.cats)B=r;landing(()=>B?home():welcome())}
/* step 0 — landing: event video, language (Arabic / English) and the two ways in: Vote or Results / Analysis */
const lpBody=()=>{const ar=LG==='ar',o=ar?'en':'ar',sub={en:'Community Awards',ar:'جوائز المجتمع'},hh={en:'Choose your language',ar:'اختر لغتك'};
  return`<span class="sub">${sub[LG]} <b aria-hidden="true">·</b> <span lang="${o}">${sub[o]}</span></span><h1>${hh[LG]}<span class="l2" lang="${o}" dir="${ar?'ltr':'rtl'}">${hh[o]}</span></h1>
  <div class="seg" role="radiogroup" aria-label="Language / اللغة" data-on="${LG}"><button type="button" role="radio" data-l="en" lang="en" aria-checked="${!ar}" tabindex="${ar?-1:0}">English</button><button type="button" role="radio" data-l="ar" lang="ar" aria-checked="${ar}" tabindex="${ar?0:-1}">العربية</button></div>
  <div class="lcards"><button class="go-card pri" type="button" id="gv"><span class="go-i">${ic('vote')}</span><span class="go-t"><b>${t('l_vote')}</b><small>${B?(next()?t('l_vote_c'):t('l_vote_d')):t('l_vote_p')}</small></span><span class="go-a">${ic('arrow')}</span></button><a class="go-card alt" href="/analysis" id="ga"><span class="go-i">${ic('chart')}</span><span class="go-t"><b>${t('l_res')}</b><small>${t('l_res_p')}</small></span><span class="go-a">${ic('arrow')}</span></a></div>
  <p class="lg-note">${t('l_note')}</p>`};
let hvIO=null;
const hvWire=first=>{const v=$('#hv'),b=$('#pp');if(!v||!b)return;v.muted=true;v.defaultMuted=true;v.setAttribute('aria-label',t('v_aria'));
  const lab=()=>{b.innerHTML=ic(v.paused?'play':'pause');b.setAttribute('aria-label',t(v.paused?'v_play':'v_pause'))};
  v.onplay=v.onpause=lab;v.querySelector('source:last-child')?.addEventListener('error',()=>{b.hidden=true});b.onclick=()=>{b.dataset.user=v.paused?'':'1';v.paused?v.play().catch(()=>{}):v.pause()};lab();
  v.loop=true;if(first===true)v.play().catch(lab); /* autoplay + loop (muted, so browsers allow it) */
  if(first==='resume')v.play().catch(lab); /* moving the element back into the page pauses it in some browsers */
  /* pause while scrolled out of view (battery), resume when back — unless the visitor paused it */
  hvIO?.disconnect();if('IntersectionObserver'in window){hvIO=new IntersectionObserver(([e])=>{if(!v.isConnected)return;if(!e.isIntersecting){if(!v.paused){v.pause();b.dataset.auto='1'}}else if(b.dataset.auto&&!b.dataset.user){b.dataset.auto='';v.play().catch(()=>{})}});hvIO.observe(v)}};
function landing(go,keepV){setLG(LG||'en',1);const v=keepV&&$('.hv'),was=v&&!$('#hv',v)?.paused;
  scr(`${v?'<section class="hv"></section>':'<section class="hv"><div class="hv-in"><video id="hv" poster="/media/mc2026-poster.jpg" autoplay muted loop playsinline preload="auto" disablepictureinpicture><source src="/media/mc2026.mp4" type="video/mp4"><source src="/media/mc2026.webm" type="video/webm"></video><button class="hv-pp" id="pp" type="button"></button></div></section>'}<div class="lp${keepV?' lsw':''}">${lpBody()}</div>`,{land:1,pick:1,keep:keepV,re:()=>landing(go,1)});
  if(v)$('.hv').replaceWith(v);hvWire(!v||(was?'resume':false));
  const seg=$('.seg'),setL=l=>{if(l===LG)return;setLG(l);landing(go,1);$(`.seg [data-l="${l}"]`)?.focus()};
  seg.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>setL(b.dataset.l));
  seg.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();setL(LG==='ar'?'en':'ar')}};
  $('#gv').onclick=()=>{setLG(LG);go()};$('#ga').onclick=()=>setLG(LG)}
function welcome(){scr(`<span class="sub">${t('w_sub')}</span><h1>${t('w_h1')}</h1><p>${t('w_lead')}</p><ol class="how"><li><b>1</b>${t('w_s1')}</li><li><b>2</b>${t('w_s2')}</li><li><b>3</b>${t('w_s3')}</li></ol><div class="acts"><button class="btn yel lg block" id="go">${t('w_go')} ${ic('arrow')}</button><small>${t('w_fine')}${cfg.geo?t('w_geo'):''}</small></div>`,{hero:1,re:welcome});
  $('#go').onclick=async e=>{e.currentTarget.disabled=true;(await locate())?register():outside()}}
/* venue check: venue Wi-Fi OR location OR big-screen QR pass — any one is enough; GPS is only asked for when nothing else already passes */
async function locate(){const h=await api('/api/config');if(h.here)return true;let c={};if(h.geo??cfg.geo){try{const p=await new Promise((a,b)=>navigator.geolocation.getCurrentPosition(a,b,{timeout:10000,enableHighAccuracy:true}));c={lat:p.coords.latitude,lng:p.coords.longitude}}catch{}}return!!(await api('/api/locate',c)).ok}
const outside=()=>scr(`<span class="ico-big">${ic('pin')}</span><h1>${t('out_h')}</h1><p>${t('out_p')}</p>${cfg.qr?`<p class="badge-ok qrh">${ic('tv')}${t('out_qr')}</p>`:''}`,{hero:1,re:outside});
function register(m='',v={}){scr(`<div class="steps" role="img" aria-label="${E(t('step',1))}"><i class="on"></i><i></i><span>${t('step',1)}</span></div><div class="ph"><span class="eyebrow">${t('verify')}</span><h1>${t('r_h')}</h1></div><p class="badge-ok">${ic('pinok')}${t('r_ok')}</p><form id="f" class="panel"><label>${t('r_name')}<input name="name" autocomplete="name" required minlength="2" maxlength="60" dir="auto" value="${E(v.name||'')}"></label><label>${t('r_phone')}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+962 7X XXX XXXX" required dir="ltr" value="${E(v.phone||'+962 ')}"></label><p class="err" role="alert">${E(m)}</p><button class="btn yel lg block">${t('r_send')}</button></form><p class="fine">${ic('shield')}<span>${t('r_fine')}</span></p>`,{re:()=>register(m,{name:$('#f [name=name]')?.value,phone:$('#f [name=phone]')?.value})});
  $('#f').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);L={name:f.get('name'),phone:f.get('phone')};$('#f .btn').disabled=true;const r=await api('/api/register',L);
    r.masked?otp(r.masked):register(r.s===429?t('r_many'):r.s===0?t('r_net'):r.code==='offsite'?t('r_off'):t('r_bad'),L)}}
function otp(m){let iv;scr(`<div class="steps" role="img" aria-label="${E(t('step',2))}"><i class="on"></i><i class="on"></i><span>${t('step',2)}</span></div><div class="ph"><span class="eyebrow">${t('verify')}</span><h1>${t('o_h')}</h1><p>${t('o_p')} <b dir="ltr">${E(m)}</b>.</p></div><div class="panel stack"><div class="otp" role="group" aria-label="${E(t('o_aria'))}">${[1,2,3,4,5,6].map(n=>`<input inputmode="numeric" autocomplete="one-time-code" maxlength="1" aria-label="${E(t('o_digit',n))}">`).join('')}</div><p class="err" id="e" role="alert"></p><button class="btn sec block" id="rs" disabled></button></div><button class="ghost pl" id="ch">${t('o_change')}</button>`,{re:()=>{clearInterval(iv);otp(m)}});
  const I=[...A.querySelectorAll('.otp input')];I[0].focus();
  const go=async()=>{const code=I.map(i=>i.value).join('');if(code.length<6)return;I.forEach(i=>i.disabled=true);const r=await api('/api/verify',{code});
    if(r.ok){clearInterval(iv);B=await api('/api/ballot');return home(1)}
    I.forEach(i=>{i.disabled=false;i.value=''});I[0].focus();$('#e').textContent=({wrong:t('o_wrong'),expired:t('o_exp'),attempts:t('o_att')})[r.code]||t('r_net')};
  I.forEach((x,k)=>{x.oninput=()=>{x.value=x.value.replace(/\D/g,'');if(x.value&&I[k+1])I[k+1].focus();go()};x.onkeydown=e=>{if(e.key==='Backspace'&&!x.value&&I[k-1])I[k-1].focus()};
    x.onpaste=e=>{e.preventDefault();[...(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6)].forEach((c,j)=>I[j].value=c);go()}});
  let n=30;const rs=$('#rs'),tick=()=>{if(n>0)rs.textContent=t('o_rs',n--);else{clearInterval(iv);rs.textContent=t('o_rs2');rs.disabled=false}};iv=setInterval(tick,1e3);tick();
  rs.onclick=async()=>{clearInterval(iv);const r=await api('/api/register',L);r.masked?otp(r.masked):toast(t('o_wait'))};
  $('#ch').onclick=()=>{clearInterval(iv);register('',L)}}
function home(first){if(!next())return done();
  if(!B.open)return scr(`<span class="ico-big tq">${ic('clock')}</span><h1>${t('cl_h')}</h1><p>${t('cl_p')}</p>`,{hero:1,r:live(),re:()=>home(first)});
  const n=nVoted(),tt=B.cats.length;
  scr(`<div class="ph"><span class="eyebrow">${t('h_eye')}</span><h1>${first?t('h_in'):t('h_back',E(B.name.split(' ')[0]))}</h1><p>${t('h_p')}</p></div><div class="sumb"><div><b>${t('h_cast',n,tt)}</b><span>${t('h_togo',tt-n)}</span></div><div class="pbar" role="progressbar" aria-label="${E(t('h_prog'))}" aria-valuemin="0" aria-valuemax="${tt}" aria-valuenow="${n}"><i style="width:${100*n/tt}%"></i></div></div>${list()}<button class="btn yel lg block" id="go">${n?t('h_cont'):t('h_start')} ${ic('arrow')}</button>`,{r:live(),re:()=>home(first)});wireList();$('#go').onclick=()=>cat(next())}
const nz=t=>String(t||'').normalize('NFKD').replace(/[̀-ًͯ-ٰٟ]/g,'').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase().trim();
/* category change: current page slides out, the next slides in (direction follows the reading direction) */
const swap=(go,dir)=>{const cv=$('.cv');if(!cv||reduced())return go();cv.classList.add('out',dir);setTimeout(go,150)};
function cat(c,dir){if(!c)return done();const n=B.cats.indexOf(c)+1,tt=B.cats.length,locked=!!c.voted;
  scr(`<nav class="cat-tabs" aria-label="${E(t('c_tabs'))}"><ul>${B.cats.map((x,k)=>`<li><button class="tab" data-c="${x.id}"${x===c?' aria-current="step"':''}>${x.voted?`<span class="tk">${ic('check')}<span class="sr">${E(t('voted'))}</span></span>`:`<span class="nn" aria-hidden="true">${k+1}</span>`}<span dir="auto">${E(x.name)}</span></button></li>`).join('')}</ul></nav>
  <div class="cv ${dir||'in'}">
  <div class="cat-head"><button class="ghost pl" id="bk">${t('c_back')}</button><span class="eyebrow">${t('c_of',n,tt)}</span><h1 dir="auto">${E(c.name)}</h1><p dir="auto">${E(c.description)}</p></div>
  <div class="cat-meta"><div class="pbar" role="progressbar" aria-label="${E(t('h_prog'))}" aria-valuemin="0" aria-valuemax="${tt}" aria-valuenow="${nVoted()}"><i style="width:${100*nVoted()/tt}%"></i></div><span>${t('c_voted',nVoted(),tt)}</span></div>
  ${locked?`<p class="note done" role="status">${ic('check')}${t('c_done')}</p>`:''}
  ${c.items.length>1?`<div class="srch" role="search"><label class="sr" for="ts">${E(t('s_lbl'))}</label>${ic('search')}<input id="ts" type="search" placeholder="${E(t('s_ph'))}" autocomplete="off" enterkeyhint="search" dir="auto"><button class="clr" id="tc" type="button" hidden aria-label="${E(t('s_clr'))}">${ic('x')}</button></div><p class="sr-meta" id="tm" role="status" aria-live="polite"></p>`:''}
  ${c.items.length?`<div class="grid">${c.items.map((i,k)=>{const mine=locked&&i.id===c.voted;return`<article class="proj${locked?' locked':''}${mine?' chosen':''}${mine&&B.just===c.id?' just':''}" data-i="${i.id}" data-q="${E(nz(i.project_name+' '+i.exhibitor_name))}" style="--i:${Math.min(k,10)}">${mine?`<span class="flag">${ic('star')}${t('s_your')}</span>`:''}${pic(i.image_url,i.project_name)}<div class="proj-b"><h3 dir="auto">${E(i.project_name)}</h3><p class="by" dir="auto"><span class="av" aria-hidden="true">${ini(i.exhibitor_name)}</span>${E(i.exhibitor_name)}</p><p class="ds" dir="auto">${E(i.short_description)}</p>${locked?`<button class="btn block" disabled>${ic(mine?'check':'lock')}${mine?t('s_mine'):t('s_already')}</button>`:`<button class="btn yel block" aria-label="${E(t('s_chooseA',i.project_name))}">${ic('vote')}${t('s_choose')}</button>`}</div></article>`}).join('')}</div><div class="empty" id="ne" hidden><span class="ico">${ic('search')}</span><h3 id="nh"></h3><p>${t('s_nonep')}</p><button class="btn sec sm" id="nc" type="button">${t('s_clr')}</button></div>`:empty('box',t('c_noh'),t('c_nop'))}
  </div>`,{wide:1,r:live(),re:()=>cat(c)});B.just=null;
  const u=$('.cat-tabs ul'),cur=$('[aria-current]',u);u.scrollLeft=cur.offsetLeft-u.clientWidth/2+cur.offsetWidth/2;
  $('#bk').onclick=()=>home();
  A.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{const x=B.cats.find(y=>y.id==b.dataset.c);if(x!==c){const d=B.cats.indexOf(x)>B.cats.indexOf(c)?'fwd':'back';swap(()=>cat(x,d),d)}});
  if(!locked)A.querySelectorAll('.proj').forEach(k=>k.onclick=()=>{k.classList.add('sel');confirmV(c,c.items.find(i=>i.id==k.dataset.i),()=>k.classList.remove('sel'))});
  const ts=$('#ts');if(ts){const cards=[...A.querySelectorAll('.proj')],tc=$('#tc'),tm=$('#tm'),ne=$('#ne'),grid=$('.grid');
    const run=()=>{const q=nz(ts.value),tok=q.split(/\s+/).filter(Boolean);let n=0;tc.hidden=!q;
      cards.forEach(k=>{const hit=tok.every(w=>k.dataset.q.includes(w));if(hit&&k.hidden){k.hidden=false;k.classList.remove('pop');void k.offsetWidth;k.classList.add('pop')}else if(!hit)k.hidden=true;if(hit)n++});
      grid.hidden=!n;ne.hidden=!!n;$('#nh').textContent=t('s_none',ts.value.trim());tm.textContent=q?(n?t('s_show',n,cards.length):t('s_nf')):''};
    const clear=()=>{ts.value='';run();ts.focus()};ts.oninput=run;tc.onclick=clear;$('#nc').onclick=clear;ts.onkeydown=e=>{if(e.key==='Escape'&&ts.value){e.preventDefault();clear()}else if(e.key==='Enter'){e.preventDefault();ts.blur()}}}}
function confirmV(c,i,off){const {d,close}=modal(`${pic(i.image_url,i.project_name)}<span class="chip info nodot" dir="auto">${E(c.name)}</span><h2 id="mt" dir="auto">${E(t('cf_h',i.project_name))}</h2><p>${t('cf_p')}</p><div class="acts"><button class="btn yel lg" id="y">${t('cf_y')}</button><button class="btn sec lg" id="n">${t('cf_n')}</button></div>`,{onclose:()=>off?.()});
  $('#y',d).focus();$('#n',d).onclick=()=>close();
  $('#y',d).onclick=async e=>{e.currentTarget.disabled=true;e.currentTarget.textContent=t('cf_send');d.dataset.busy=1;const ok=await cast(c,i);delete d.dataset.busy;if(ok)B.just=c.id;close();if(ok)success()}}
async function cast(c,i,retry){let r=await api('/api/vote',{category_id:c.id,exhibitor_id:i.id});
  if(r.s===0){toast(t('v_conn'));
    for(let k=0;k<5&&r.s===0;k++){await new Promise(z=>setTimeout(z,1500));const b=await api('/api/ballot');if(b.cats){B=b;if(B.cats.find(x=>x.id===c.id)?.voted)return true;r=await api('/api/vote',{category_id:c.id,exhibitor_id:i.id})}}
    if(r.s===0){toast(t('r_net'));return false}}
  if(r.code==='offsite'&&!retry&&await locate())return cast(c,i,1);
  if(r.ok){c.voted=i.id;return true}
  toast(({closed:t('v_closed'),already:t('v_already'),offsite:t('v_off'),slow:t('v_slow')})[r.code]||t('r_net'));
  if(['already','closed'].includes(r.code)){B=await api('/api/ballot');home()}return false}
function success(){const left=B.cats.filter(x=>!x.voted).length;if(!left)return done();
  scr(`<div class="stack center"><svg class="tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M14 27l9 9 16-18"/></svg><h1>${t('ok_h')}</h1><p>${left===1?t('ok_1'):t('ok_n',left)}</p><button class="btn yel lg block" id="go">${t('ok_go')} ${ic('arrow')}</button></div>`,{r:live(),re:success});$('#go').onclick=()=>cat(next());$('#go').focus()}
function done(){scr(`<div class="stack center"><div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i></div><h1>${t('dn_h')}</h1><p>${t('dn_p',B.cats.length)}</p><ul class="picks">${B.cats.map(c=>{const p=pickOf(c);return`<li>${p?pic(p.image_url,p.project_name):''}<span><small dir="auto">${E(c.name)}</small><b dir="auto">${p?E(p.project_name):E(t('voted'))}</b></span></li>`}).join('')}</ul><small>${t('dn_small')}</small></div>`,{r:live(),re:done})}

/* ---------------- public Results / Analysis (replaces the former Viewer Admin) ----------------
   Same live feed as the TV screen (/api/stream), so it follows the "Results screen" setting:
   hidden → nothing revealed · rank → order only · count → order, votes, shares, voters */
let AN=null,ES=null,ANst='';const anMore=new Set();
const anChip=()=>AN?chipS(AN.voting==='open'):'';
const sumC=c=>c.items.reduce((a,i)=>a+(i.c||0),0);
function anBody(d){const cnt=d.mode==='count',cats=d.cats;
  const tile=(ac,ico,lab,val)=>`<article class="kt" style="--ac:var(${ac})"><span class="kt-i">${ic(ico)}</span><b>${val}</b><span>${lab}</span></article>`;
  const tiles=(cnt?tile('--yellow','vote',t('a_votes'),d.total)+tile('--turq','users',t('a_voters'),d.voters):'')+tile('--purple','tag',t('a_cats'),cats.length)+tile('--blue','box',t('a_proj'),d.projects);
  let out=`<div class="an-k${cnt?'':' two'}">${tiles}</div>`;
  if(!cats.length)return out+empty('tag',t('a_nocat'),t('a_nocat_p'));
  if(d.mode==='hidden')return out+empty('clock',t('a_hid_h'),t('a_hid_p'));
  if(!cnt)out+=`<p class="an-note">${ic('lock')}<span>${t('a_rank')}</span></p>`;
  if(cnt&&d.total>0){const busy=cats.reduce((a,c)=>sumC(c)>sumC(a)?c:a,cats[0]),race=cats.filter(c=>c.items.length>1&&c.items[0].c>0).map(c=>({c,g:c.items[0].c-c.items[1].c})).sort((a,b)=>a.g-b.g)[0];
    out+=`<div class="an-hl"><article class="hl"><span class="hl-i">${ic('activity')}</span><div><small>${t('a_hl_busy')}</small><b dir="auto">${E(busy.name)}</b><span>${t('a_vn',sumC(busy))}</span></div></article>${race?`<article class="hl tq"><span class="hl-i">${ic('trophy')}</span><div><small>${t('a_hl_close')}</small><b dir="auto">${E(race.c.name)}</b><span>${t('a_apart',race.g)}</span></div></article>`:''}</div>`}
  return out+`<div class="an-g">${cats.map((c,k)=>{const it=c.items,tot=sumC(c),a=it[0],b=it[1],top=Math.max(1,a?.c||0),open=anMore.has(c.id),rest=it.slice(1),shown=open?rest:rest.slice(0,4),pc=x=>tot?Math.round(100*x/tot):0;
    const lead=!a?`<p class="an-empty">${t('a_noproj')}</p>`:cnt&&!(a.c>0)?`<div class="lead none"><span class="ico">${ic('star')}</span><div><b>${t('a_none')}</b><small>${t('a_none_p')}</small></div></div>`
      :`<div class="lead"><div class="pic t${tint(a.n)}">${img(a.img,a.n)}</div><div class="lead-b"><span class="crown">${ic('trophy')}${t('a_lead_l')}</span><b dir="auto">${E(a.n)}</b>${a.t?`<span class="gap" dir="auto">${E(a.t)}</span>`:''}${cnt?`<span class="gap">${b&&b.c===a.c?t('a_tied'):t('a_ahead',a.c-(b?.c||0))} · ${t('a_share',pc(a.c))}</span>`:''}</div>${cnt?`<strong>${a.c}</strong>`:''}</div>`;
    return`<section class="ac" style="--ac:var(${ACC[k%4]})" aria-labelledby="ac${c.id}"><header><h2 id="ac${c.id}" dir="auto">${E(c.name)}</h2>${cnt?`<span class="chip nodot">${t('a_vn',tot)}</span>`:''}</header>${lead}
    ${shown.length?`<ol class="lbr${cnt?'':' ro'}" start="2">${shown.map((i,j)=>`<li data-k="${j+1}"><span class="rb">${j+2}</span><span class="nm" dir="auto">${E(i.n)}</span>${cnt?`<b><bdi>${i.c}</bdi><small> · <bdi dir="ltr">${pc(i.c)}%</bdi></small></b><i style="width:${100*i.c/top}%"></i>`:''}</li>`).join('')}</ol>`:''}
    ${rest.length>4?`<button class="btn sec sm an-more" type="button" data-more="${c.id}" aria-expanded="${open}">${open?t('a_less'):t('a_more',rest.length-4)}</button>`:''}</section>`}).join('')}</div>`}
const anPaint=()=>{const x=$('#an');if(!x||!AN)return;const f=document.activeElement?.dataset?.more;x.innerHTML=anBody(AN);x.classList.add('ready');
  x.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{const id=+b.dataset.more;anMore.has(id)?anMore.delete(id):anMore.add(id);anPaint()});
  if(f)x.querySelector(`[data-more="${f}"]`)?.focus();const c=$('.top-l');if(c)c.innerHTML=anChip();const s=$('#an-st');if(s)s.textContent=ANst};
function analysis(){setLG(LG||'en',1);document.title=t('a_doc');
  scr(`<a class="ghost pl an-back" href="/">${t('a_back')}</a><div class="ph"><span class="eyebrow">${t('h_eye')}</span><h1>${t('a_title')}</h1><p>${t('a_lead')} <span class="an-st" id="an-st" role="status">${ANst}</span></p></div><div id="an">${AN?'':`<p class="an-wait"><span class="spin" aria-hidden="true"></span>${t('a_conn')}</p>`}</div>`,{wide:1,r:anChip(),re:analysis});
  document.title=t('a_doc');anPaint();
  if(!ES){ES=new EventSource('/api/stream');ES.onmessage=e=>{try{AN=JSON.parse(e.data)}catch{return}ANst='';anPaint()};ES.onerror=()=>{ANst=t('a_re');const s=$('#an-st');if(s)s.textContent=ANst}}}

/* minimal QR encoder — byte mode, error-correction level M, versions 1–10 (up to 213 bytes) */
const qrM=txt=>{const data=[...new TextEncoder().encode(txt)],ECC=[0,10,16,26,18,24,16,18,22,22,26],BLK=[0,1,1,1,2,2,4,4,4,5,5];
  const raw=v=>{let r=(16*v+128)*v+64;if(v>=2){const a=Math.floor(v/7)+2;r-=(25*a-10)*a-55;if(v>=7)r-=36}return r};
  let ver=1;for(;ver<=10;ver++){if(4+(ver<10?8:16)+8*data.length<=(Math.floor(raw(ver)/8)-ECC[ver]*BLK[ver])*8)break}if(ver>10)return null;
  const cap=(Math.floor(raw(ver)/8)-ECC[ver]*BLK[ver])*8,bits=[],put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push(v>>>i&1)};
  put(4,4);put(data.length,ver<10?8:16);data.forEach(b=>put(b,8));put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
  for(let p=0xEC;bits.length<cap;p^=0xEC^0x11)put(p,8);
  const cw=[];for(let i=0;i<bits.length;i+=8)cw.push(bits.slice(i,i+8).reduce((a,b)=>a<<1|b,0));
  const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=(y>>>i&1)*x}return z&255};
  const deg=ECC[ver],dv=Array(deg).fill(0);dv[deg-1]=1;let root=1;for(let i=0;i<deg;i++){for(let j=0;j<deg;j++){dv[j]=mul(dv[j],root);if(j+1<deg)dv[j]^=dv[j+1]}root=mul(root,2)}
  const rs=d=>{const r=Array(deg).fill(0);for(const b of d){const f=b^r.shift();r.push(0);dv.forEach((c,i)=>r[i]^=mul(c,f))}return r};
  const nb=BLK[ver],rawCw=Math.floor(raw(ver)/8),ns=nb-rawCw%nb,sl=Math.floor(rawCw/nb),blocks=[];
  for(let i=0,k=0;i<nb;i++){const d=cw.slice(k,k+sl-deg+(i<ns?0:1));k+=d.length;const e=rs(d);if(i<ns)d.push(0);blocks.push(d.concat(e))}
  const all=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==sl-deg||j>=ns)all.push(b[i])});
  const n=ver*4+17,M=[...Array(n)].map(()=>Array(n).fill(false)),F=[...Array(n)].map(()=>Array(n).fill(false));
  const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
  for(let i=0;i<n;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
  const finder=(x,y)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),a=x+dx,b=y+dy;if(a>=0&&a<n&&b>=0&&b<n)set(a,b,d!==2&&d!==4)}};
  finder(3,3);finder(n-4,3);finder(3,n-4);
  if(ver>=2){const na=Math.floor(ver/7)+2,step=Math.ceil((ver*4+4)/(na*2-2))*2,pos=[6];for(let p=n-7;pos.length<na;p-=step)pos.splice(1,0,p);
    pos.forEach((a,i)=>pos.forEach((b,j)=>{if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0))return;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}))}
  const fmt=mask=>{const d=mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=(d<<10|r)^0x5412,g=i=>(b>>>i&1)===1;
    for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
    for(let i=0;i<8;i++)set(n-1-i,8,g(i));for(let i=8;i<15;i++)set(8,n-15+i,g(i));set(8,n-8,true)};
  fmt(0);
  if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=ver<<12|r;for(let i=0;i<18;i++){const v=(b>>>i&1)===1,a=n-11+i%3,c=Math.floor(i/3);set(a,c,v);set(c,a,v)}}
  let bi=0;for(let right=n-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<n;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?n-1-v:v;
    if(!F[y][x]&&bi<all.length*8){M[y][x]=(all[bi>>>3]>>>(7-(bi&7))&1)===1;bi++}}}
  const MK=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,x=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  const flip=k=>{for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!F[y][x]&&MK[k](x,y))M[y][x]=!M[y][x]};
  const pen=()=>{let p=0;const line=g=>{for(let i=0;i<n;i++){let run=1;for(let j=1;j<=n;j++){if(j<n&&g(i,j)===g(i,j-1))run++;else{if(run>=5)p+=run-2;run=1}}
      for(let j=0;j+11<=n;j++){const s=[...Array(11)].map((_,k)=>g(i,j+k)?1:0).join('');if(s==='10111010000'||s==='00001011101')p+=40}}};
    line((i,j)=>M[i][j]);line((i,j)=>M[j][i]);
    for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3}
    const dark=M.flat().filter(Boolean).length;p+=Math.floor(Math.abs(dark*20-n*n*10)/(n*n))*10;return p};
  let best=0,bp=Infinity;for(let k=0;k<8;k++){flip(k);fmt(k);const p=pen();if(p<bp){bp=p;best=k}flip(k)}
  flip(best);fmt(best);return M};
const qrSvg=txt=>{const m=qrM(txt);if(!m)return'';const n=m.length,q=4;let d='';m.forEach((r,y)=>r.forEach((v,x)=>{if(v)d+=`M${x+q} ${y+q}h1v1h-1z`}));
  return`<svg class="qr-svg" viewBox="0 0 ${n+2*q} ${n+2*q}" shape-rendering="crispEdges" role="img" aria-label="QR code for ${E(txt)}"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#00007b"/></svg>`};

/* ---------------- live results (big screen / TV) ----------------
   One live feed (/api/stream, the same payload the public pages use). Every number and state comes from it:
   wait  — no votes yet: "opens soon" (closed) or "voting is open" with the QR (open). Finalists only — no ranks, no implied winners
   live  — voting open with votes: leader spotlight, race bars, QR "Scan to vote"
   final — voting closed with votes: winners revealed category by category
   Settings → Results screen still applies: hidden = no results shown, rank = order only, count = order + votes.
   The QR points to this server's voting page; add ?vote=https://your-public-link to /results to override it. */
const TVAC=['--yellow','--turq','--purple'],TVAT=['var(--yellow)','var(--turq)','#c39bf5']; /* accent for text on navy (purple lightened for contrast) */
const voteURL=(()=>{const q=new URLSearchParams(location.search).get('vote');try{if(q){const u=new URL(q,location.origin);if(/^https?:$/.test(u.protocol))return u.href}}catch{}return location.origin+'/'})();
const voteHost=voteURL.replace(/^https?:\/\//,'').replace(/\/$/,'');
const tvState=d=>d.voting==='open'?(d.any?'live':'open0'):(d.any?'final':'wait');
const tvPh=i=>`<span class="tph">${/^(https:\/\/|\/)\S+$/.test(i.img||'')?`<img src="${E(i.img)}" alt="">`:`<span class="tmono" aria-hidden="true">${ini(i.n)}</span>`}</span>`;
const vw=n=>n===1?'vote':'votes';
function results(){document.body.classList.add('tv');document.title='Live results — The Maker Collective 2026';
  A.innerHTML='<div class="tvw" id="tvw"><header class="tvh"><div class="tvl"><a class="brand" href="/" aria-label="The Maker Collective 2026"><img src="/brand/logo-white.png" alt="The Maker Collective 2026"></a><div class="tvt"><h1>Community Awards</h1><h2 id="tsub">Live results</h2></div></div><div id="st" class="tst" aria-live="polite"></div></header><main class="tvm" id="tvm"><p class="tv-conn"><span class="tspin" aria-hidden="true"></span>Connecting to live results…</p></main></div>';
  const W=$('#tvw'),M=$('#tvm'),ST=$('#st'),SUB=$('#tsub'),RM=()=>reduced();
  /* rotating venue QR: the code comes from /api/admin/qr, which only answers a browser signed in to the dashboard */
  let VQ=null,VQleft=0,VQend=0,VQmsg='',qrT=0;const qrURL=()=>{if(!VQ)return voteURL;const u=new URL(voteURL);u.searchParams.set('vq',VQ);return u.href};
  const qrNote=()=>VQ?`New code in ${Math.max(1,Math.ceil((VQend-Date.now())/1e3))} s`:VQmsg;
  const paintQR=flip=>M.querySelectorAll('.tqr').forEach(q=>{const c=$('.tqr-c',q);c.innerHTML=qrSvg(qrURL());
    if(flip&&!RM()){c.classList.remove('flip');void c.offsetWidth;c.classList.add('flip')}
    const tb=$('.tqr-t',q),nt=$('.tqr-n',q);tb.hidden=!VQ;if(VQ){const i=document.createElement('i');i.style.animationDuration=VQleft+'ms';tb.replaceChildren(i)}nt.textContent=qrNote();nt.hidden=!nt.textContent});
  /* the screen says why the code is not rotating: setting off, or this browser not signed in to the dashboard (same address as the TV) */
  const pollQR=async()=>{clearTimeout(qrT);const r=await api('/api/admin/qr');
    if(r.s===200&&r.on&&r.code){const ch=r.code!==VQ;VQ=r.code;VQleft=r.expires_in;VQend=Date.now()+r.expires_in;VQmsg='';if(ch)paintQR(true);qrT=setTimeout(pollQR,Math.max(400,r.expires_in+150));return}
    const was=VQ,old=VQmsg;VQ=null;
    VQmsg=r.s===200?'Venue QR is off — turn it on in Admin → Settings':r.s===401&&(await api('/api/config')).qr?`Organizers: sign in at ${location.host}/admin in this browser to show the rotating code`:'';
    if(was!==null||VQmsg!==old)paintQR(false);qrT=setTimeout(pollQR,3000)};
  setInterval(()=>{if(VQ)M.querySelectorAll('.tqr-n').forEach(n=>n.textContent=qrNote())},1000);
  let last=null,sig='',stSig='',prevState='',conn=true,revealT=0;const rows=new Map();
  /* count-up for changed numbers (instant with reduced motion) */
  const tw=(el,to)=>{if(!el)return;const from=el.dataset.v===undefined?null:+el.dataset.v;el.dataset.v=to;cancelAnimationFrame(el._r);
    if(from===null||from===to||RM()){el.textContent=to;return}const t0=performance.now(),f=t=>{const k=Math.min(1,(t-t0)/750);el.textContent=Math.round(from+(to-from)*(1-(1-k)**3));if(k<1)el._r=requestAnimationFrame(f)};el._r=requestAnimationFrame(f)};
  const qrCard=big=>`<aside class="tqr${big?' big':''}" aria-label="Scan to vote"><span class="tqr-k">${ic('vote')}Scan to vote</span><div class="tqr-c">${qrSvg(qrURL())}</div><span class="tqr-t"${VQ?'':' hidden'}>${VQ?`<i style="animation-duration:${VQleft}ms"></i>`:''}</span><b class="tqr-u">${E(voteHost)}</b><small>Point your phone camera at the code · one vote in each category</small><small class="tqr-n"${VQ||VQmsg?'':' hidden'}>${E(qrNote())}</small></aside>`;
  const status=(d,s)=>{const hid=d.mode==='hidden',k=[s,d.total!=null,d.mode,conn].join();
    if(k!==stSig){stSig=k;ST.innerHTML=(s==='live'||s==='open0'?'<span class="tpill live"><i aria-hidden="true"></i>Live voting</span>':s==='final'?(hid?'<span class="tpill">Voting closed</span>':`<span class="tpill fin">${ic('trophy')}Final results</span>`):'<span class="tpill pre">Voting opens soon</span>')
      +(d.total!=null&&s!=='wait'?'<span class="tpill"><b data-tt>0</b><span data-tl>votes</span></span>':'')+(d.mode==='rank'&&s!=='wait'&&s!=='open0'?'<span class="tpill pre">Ranking only</span>':'')+(conn?'':'<span class="tpill warn">Reconnecting…</span>')}
    const tt=ST.querySelector('[data-tt]');if(tt){tw(tt,d.total);ST.querySelector('[data-tl]').textContent=vw(d.total)}
    SUB.textContent={live:hid?'Results hidden':'Live results',open0:'Voting is open',final:hid?'Results coming soon':'Final results',wait:hid&&d.any?'Results coming soon':'Starting soon'}[s]};
  /* waiting state: finalists in name order, no numbers that look like rankings */
  const waitView=(d,s)=>{const open=d.voting==='open',hid=d.mode==='hidden',hv=hid&&d.any;
    const h=open?(hv?'Voting is live':'Voting is open'):(hv?'Results coming soon':'Voting opens soon');
    const p=open?(hv?'Results stay hidden until the reveal — scan the code to add your vote.':'Be the first to vote — scan the code with your phone camera.'):(hv?'Voting has closed. The winners will be revealed shortly.':'Get ready to choose your favorite makers in each category.');
    return`<div class="tww${open?' q':''}${d.cats.some(c=>c.items.length)?'':' sparse'}"><div class="tww-l"><div class="twt"><span class="twt-e">The Maker Collective 2026</span><h2>${h}</h2><p>${p}</p></div>
    <div class="twc" style="--n:${Math.min(4,d.cats.length)||1}">${d.cats.map((c,k)=>{const names=[...c.items].sort((a,b)=>a.n.localeCompare(b.n));
      return`<section class="twk" style="--ac:var(${TVAC[k%3]});--act:${TVAT[k%3]}"><h3 dir="auto">${E(c.name)}</h3>${names.length?`<p class="twk-n">${names.length} ${names.length===1?'finalist':'finalists'}</p><ul>${names.map(i=>`<li>${tvPh(i)}<span dir="auto">${E(i.n)}</span></li>`).join('')}</ul>`:`<p class="twk-n">${hid?'Finalists revealed with the results':'Finalists coming soon'}</p>`}</section>`}).join('')||'<p class="tv-conn">Award categories will appear here.</p>'}</div></div>${open?qrCard(1):''}</div>`};
  /* board: one column per category — spotlight for the leader(s), every other finalist as a row with a race bar */
  const boardView=(d,s)=>`<div class="tbd${s==='live'?' has-qr':''}"><div class="tcols${d.cats.length>4?' dense':''}" style="--n:${Math.min(4,d.cats.length)}">${d.cats.map((c,k)=>`<section class="tcol" data-c="${c.id}" style="--ac:var(${TVAC[k%3]});--k:${k%4}"><header class="tch"><h3 dir="auto">${E(c.name)}</h3><span class="tct"></span></header><div class="tsp"></div><div class="trs"></div><p class="tmore" hidden></p></section>`).join('')}</div>${s==='live'?qrCard(0):''}</div>`;
  const spot=(c,cnt,fin,L)=>{if(!L.length)return`<div class="tsc none"><span class="tsl">${ic('clock')}No votes yet</span><div class="tsb"><b class="tsn">This race hasn't started</b><span class="tsx">All finalists are listed below</span></div></div>`;
    const a=L[0],tie=L.length>1,lab=fin?(tie?'Joint winners':'Winner'):(tie?'Tied for 1st':'Leading');
    const nm=tie?(L.length===2?`${E(L[0].n)} &amp; ${E(L[1].n)}`:`${L.length}-way tie`):E(a.n),sub=tie?(L.length===2?'Level on votes':L.map(i=>E(i.n)).join(' · ')):E(a.t||'');
    return`<div class="tsc${tie?' tie':''}${L.length>2?' tie3':''}${fin?' win':''}"><span class="tsph">${L.slice(0,3).map(tvPh).join('')}</span><span class="tsl">${ic('trophy')}${lab}</span><div class="tsb"><b class="tsn" dir="auto">${nm}</b>${sub?`<span class="tsx" dir="auto">${sub}</span>`:''}</div>${cnt?`<div class="tsv"><b data-sv>0</b><small data-sl>votes</small></div><span class="tsbar" aria-hidden="true"><i></i></span>`:''}</div>`};
  const split=c=>{const cnt=last.mode==='count',it=c.items,L=c.any?it.filter(i=>i.r===1&&(!cnt||i.c>0)):[];return{it,L,rest:it.filter(i=>!L.includes(i))}};
  const spotCol=(el,c,cnt,fin)=>{const sp=$('.tsp',el),{it,L}=split(c);
    const sum=cnt?it.reduce((x,i)=>x+i.c,0):null,ct=$('.tct',el);
    if(cnt){if(!ct.firstChild)ct.innerHTML='<b>0</b> <span></span>';tw(ct.firstChild,sum);ct.lastChild.textContent=vw(sum)}else ct.textContent='';
    const key=L.map(i=>i.id).join(',')+(fin?'f':'')+(cnt?'c':'');
    if(sp.dataset.k!==key){const had=sp.dataset.k!==undefined;sp.dataset.k=key;sp.innerHTML=spot(c,cnt,fin,L);if(had&&!RM()){sp.classList.remove('swap');void sp.offsetWidth;sp.classList.add('swap')}}
    if(cnt&&L.length){tw($('[data-sv]',sp),L[0].c);$('[data-sl]',sp).textContent=vw(L[0].c);$('.tsbar i',sp).style.width='100%'}};
  /* one row height for every column (the tightest fit), so the race reads as one table across the screen */
  const fitH=cols=>{const fs=parseFloat(getComputedStyle(M).fontSize),base=fs*3.7;if(matchMedia('(max-aspect-ratio: 1/1)').matches)return base;
    return Math.min(base,...cols.map(([el,c])=>{const n=split(c).rest.length;return n?$('.trs',el).clientHeight/n:base}))};
  const rowsCol=(el,c,cnt,fin,hh)=>{const rs=$('.trs',el),more=$('.tmore',el),{it,L,rest}=split(c),top=cnt?Math.max(0,...it.map(i=>i.c)):0;
    /* rows: fixed slots so updates never shift the layout; rank changes glide */
    const fs=parseFloat(getComputedStyle(rs).fontSize),fit=!matchMedia('(max-aspect-ratio: 1/1)').matches,base=fs*3.7,min=fs*2.2;
    const avail=fit?rs.clientHeight:Infinity;let h=hh,show=rest.length;
    if(h<min){h=min;show=Math.max(0,Math.floor((avail-fs*1.8)/min))}
    rs.style.setProperty('--rh',h+'px');rs.style.setProperty('--rf',Math.max(.8,Math.min(1,h/(fs*3.2))));if(!fit)rs.style.height=rest.length*h+'px';
    more.hidden=show>=rest.length;if(!more.hidden)more.textContent=`+${rest.length-show} more ${rest.length-show===1?'finalist':'finalists'}`;
    const keep=new Set();
    rest.forEach((i,k)=>{const id=c.id+'-'+i.id;keep.add(id);let r=rows.get(id);const fresh=!r;
      if(!r){r=document.createElement('div');r.className='trw';r.innerHTML='<span class="trk"></span><div class="trm"><span class="trn" dir="auto"></span>'+(cnt?'<span class="trb" aria-hidden="true"><i></i></span>':'')+'</div>'+(cnt?'<b class="trc">0</b>':'');rs.append(r);rows.set(id,r)}
      const tied=it.filter(x=>x.r===i.r).length>1,zero=cnt&&!(i.c>0);
      r.hidden=k>=show;r.classList.toggle('zero',zero||!c.any);r.style.transform=`translateY(${k*h}px)`;if(fresh)r.style.transition='none';
      $('.trk',r).textContent=!c.any||zero?'–':(tied?'=':'')+i.r;$('.trn',r).textContent=i.n;
      if(cnt){const cv=$('.trc',r),old=cv.dataset.v===undefined?null:+cv.dataset.v;tw(cv,i.c);$('.trb i',r).style.width=(top?100*i.c/top:0)+'%';
        if(old!==null&&i.c>old&&!RM()){r.classList.remove('tup');void r.offsetWidth;r.classList.add('tup')}}
      if(fresh)requestAnimationFrame(()=>requestAnimationFrame(()=>{r.style.transition=''}))});
    rows.forEach((r,id)=>{if(id.startsWith(c.id+'-')&&!keep.has(id)){r.remove();rows.delete(id)}})};
  const draw=d=>{last=d;const s=tvState(d),hid=d.mode==='hidden',view=(s==='wait'||s==='open0'||hid)?'wait':'board',cnt=d.mode==='count',fin=s==='final';
    W.dataset.state=s;status(d,s);
    const k=view==='wait'?'w|'+s+'|'+hid+'|'+JSON.stringify(d.cats.map(c=>[c.id,c.name,c.items.map(i=>[i.id,i.n,i.img])])):'b|'+s+'|'+d.mode+'|'+JSON.stringify(d.cats.map(c=>[c.id,c.name]));
    if(k!==sig){sig=k;rows.clear();M.innerHTML=view==='wait'?waitView(d,s):boardView(d,s);M.classList.remove('in');void M.offsetWidth;M.classList.add('in');
      /* winners are revealed category by category when results become final (once per reveal) */
      if(view==='board'&&fin&&prevState!=='final'&&!RM()){W.classList.add('reveal');clearTimeout(revealT);revealT=setTimeout(()=>W.classList.remove('reveal'),1200*Math.min(4,d.cats.length)+1600)}else if(!fin)W.classList.remove('reveal')}
    prevState=s;
    if(view==='board'){const tc=M.querySelector('.tcol'),cs=M.querySelector('.tcols');if(tc&&cs)cs.classList.toggle('narrow',tc.clientWidth/parseFloat(getComputedStyle(tc).fontSize)<26)}
    if(view==='board'){const cols=d.cats.map(c=>[M.querySelector(`.tcol[data-c="${c.id}"]`),c]).filter(([el])=>el);
      cols.forEach(([el,c])=>spotCol(el,c,cnt,fin));
      /* equal spotlight heights keep the rows aligned across columns */
      const cs=M.querySelector('.tcols');cs.style.removeProperty('--sph');cs.style.removeProperty('--chh');cs.style.setProperty('--chh',Math.max(...cols.map(([el])=>$('.tch',el).offsetHeight))+'px');const hs=cols.map(([el])=>$('.tsc',el)?.offsetHeight||0);cs.style.setProperty('--sph',Math.max(...hs)+'px');
      const h=fitH(cols);cols.forEach(([el,c])=>rowsCol(el,c,cnt,fin,h))}};
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>last&&draw(last),120)});
  pollQR();
  const es=new EventSource('/api/stream');es.onmessage=e=>{let d;try{d=JSON.parse(e.data)}catch{return}conn=true;draw(d)};
  es.onerror=()=>{conn=false;if(last)status(last,tvState(last))}}

/* ---------------- admin ---------------- */
let T='ov',D,poll,lastSig='';const V={},W={};
const NAV={ov:['Overview','grid','view'],rt:['Results','chart','view'],ex:['Exhibitors','box','content'],ca:['Categories','tag','content'],vi:['Visitors','users','visitors'],us:['Team access','shield','users'],se:['Settings','sliders','settings']};
const ROLE_L={super_admin:'Super Admin',admin:'Admin'},ROLE_C={super_admin:'info',admin:'ok'};
const skel=()=>{document.body.classList.remove('is-dark');A.innerHTML='<div class="admin"><aside class="side"><div class="side-in"><span class="brand"><img src="/brand/logo-white.png" alt="The Maker Collective 2026"></span></div></aside><div class="mainc" role="status" aria-label="Loading dashboard"><div class="sk-h shimmer"></div><div class="sk-b shimmer"></div><div class="mcs">'+'<div class="sk-c shimmer"></div>'.repeat(6)+'</div></div></div>'};
async function admin(){document.title='Admin — The Maker Collective 2026';skel();const d=await api('/api/admin/data');d.s===401?login():dash(d)}
function login(m=''){scr(`<div class="login stack"><div class="ph"><span class="eyebrow">Organizers</span><h1>Organizer sign in</h1><p>Manage voting for The Maker Collective 2026.</p></div><form id="f" class="panel"><label>Username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><p class="err" role="alert">${E(m)}</p><button class="btn lg block">Sign in</button></form></div>`);
  $('#f').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),r=await api('/api/admin/login',{username:f.get('username'),password:f.get('password')});T='ov';r.ok?admin():login(r.s===429?'Too many attempts. Wait a few minutes.':'Wrong username or password.')}}
const re=async()=>dash(await api('/api/admin/data'));
const nowT=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
async function toggleVoting(){const d=D,o=d.voting==='open';if(await ask({title:o?'Close voting?':'Open voting?',text:o?'Visitors will immediately stop being able to submit votes.':'Visitors will be able to submit votes right away.',ok:o?'Close voting':'Open voting',danger:o,icon:o?'lock':'vote'})){const r=await api('/api/admin/voting',{open:!o});if(r.s===200)re()}}
const vsHtml=d=>{const o=d.voting==='open';return`<div class="vs ${o?'on':''}" role="group" aria-label="Voting status"><span class="dot" aria-hidden="true"></span><span>${o?'Voting open':'Voting closed'}</span>${d.me.can.voting?`<button class="btn sm ${o?'dng-o':'yel'}" data-tg>${o?'Close voting':'Open voting'}</button>`:''}</div>`};
function dash(d){document.body.classList.remove('is-dark');D=d;clearInterval(poll);lastSig='';if(!NAV[T]||!d.me.can[NAV[T][2]])T='ov';const me=d.me;
  A.innerHTML=`<a class="skip" href="#pane">Skip to content</a><div class="admin"><aside class="side"><div class="side-in"><a class="brand" href="/admin" aria-label="The Maker Collective 2026 — Admin"><img src="/brand/logo-white.png" alt="The Maker Collective 2026"></a><div class="side-mob"><a class="btn sm on-dark" href="/results" target="_blank" rel="noopener">${ic('tv')}Live screen</a><button class="btn sm on-dark" data-out>${ic('logout')}<span class="sr">Sign out</span></button></div></div><nav aria-label="Admin sections"><ul>${Object.entries(NAV).filter(([,[,,p]])=>me.can[p]).map(([k,[v,i]])=>`<li><button class="nv" data-t="${k}"${k===T?' aria-current="page"':''}>${ic(i)}${v}</button></li>`).join('')}</ul></nav><div class="side-ft"><a class="nv" href="/results" target="_blank" rel="noopener">${ic('tv')}Live screen</a><a class="nv" href="/" target="_blank" rel="noopener">${ic('vote')}Voting page</a><div class="me"><span class="av" aria-hidden="true">${ini(me.username)}</span><div><b>${E(me.username)}</b><small>${E(me.label)}</small></div><button class="ib dk" data-out aria-label="Sign out">${ic('logout')}</button></div></div></aside>
  <div class="mainc"><header class="bar-h"><div><h1>${NAV[T][0]}</h1><p class="sub">${E(d.settings.event)} · <span class="chip nodot ${ROLE_C[me.role]}">${E(me.label)}</span></p></div>${T==='ov'?'':vsHtml(d)}</header><section id="pane" tabindex="-1">${V[T](d)}</section><footer class="afoot">The Maker Collective 2026 · By The Makerspace — a program by Crown Prince Foundation</footer></div></div>`;
  A.querySelectorAll('.side nav .nv').forEach(b=>b.onclick=()=>{T=b.dataset.t;dash(d);$(`.side nav .nv[data-t="${T}"]`)?.focus();scrollTo(0,0);if(T==='ov')refresh()});
  A.querySelectorAll('[data-tg]').forEach(b=>b.onclick=toggleVoting);
  A.querySelectorAll('[data-out]').forEach(b=>b.onclick=async()=>{clearInterval(poll);await api('/api/admin/logout',{});D=null;login()});
  W[T](d);if(T==='ov')poll=setInterval(refresh,5000)}

/* ---- Overview = live dashboard ---- */
const hasPhoto=x=>/^(https:\/\/|\/)/.test(x.image_url||'');
const ACC=['--yellow','--turq','--purple','--blue'];
const resFor=(d,c,k)=>d.res.find(r=>r.name===c.name)||d.res[k];
const exOf=(d,id)=>d.ex.find(x=>x.id===id);
function ovBanner(d){const open=d.voting==='open',c=d.me.can;
  return`<section class="cmd ${open?'on':'off'}" aria-labelledby="cmd-h"><div class="cmd-art" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="cmd-l"><span class="cmd-st">${open?'LIVE':'CLOSED'}</span><h2 id="cmd-h">${open?'Voting is open':'Voting is closed'}</h2><p>${open?'Visitors can vote right now.':"Visitors can't vote until voting is opened."}</p><p class="cmd-up" id="upd">Updated ${nowT()}</p></div>
  <div class="cmd-r">${c.voting?`<button class="btn lg ${open?'on-dark':'yel'}" data-tg>${ic(open?'lock':'vote')}${open?'Close voting':'Open voting'}</button>`:`<span class="chip nodot ro">${ic('lock')}View only</span>`}<a class="btn lg on-dark" href="/results" target="_blank" rel="noopener">${ic('tv')}Open TV screen</a></div></section>`}
function ovMetrics(d){const act=d.ex.filter(x=>x.active),ph=act.filter(hasPhoto),miss=act.length-ph.length;
  const card=(cls,ico,label,val,sub,extra='')=>`<article class="mc ${cls}"><span class="mc-i">${ic(ico)}</span><span class="mc-l">${label}</span>${val}<small>${sub}</small>${extra}</article>`;
  return`<div class="mcs">${[
    card('m-pu','users','Voters',`<b data-n="voters">${d.verified}</b>`,d.me.can.visitors?`${d.visitors.length} registered`:'verified by SMS'),
    card('m-ye','vote','Votes cast',`<b data-n="votes">${d.votes}</b>`,`across ${d.perCat.length} ${d.perCat.length===1?'category':'categories'}`),
    card('m-tq','activity','Votes this minute',`<b data-n="min">${d.perMin}</b>`,d.perMin?'Voting is busy':'Quiet right now'),
    card('m-bl','check','Finished voting',`<b data-v="done">${d.completion}%</b>`,'voted in every category',`<span class="ring" style="--p:${Math.min(100,d.completion)}" aria-hidden="true"></span>`),
    card('m-nv','box','Projects',`<b data-n="proj">${act.length}</b>`,d.ex.length>act.length?`${d.ex.length-act.length} hidden from voters`:'all visible to voters'),
    card('m-pk','image','Project photos',`<b data-v="photos">${ph.length}<span class="of">/${act.length}</span></b>`,miss?(d.me.can.content?`<button class="chip warn nodot" data-go="ex">${miss} need${miss===1?'s':''} a photo →</button>`:`${miss} still need a photo`):'Every project has a photo ✓',
      `<div class="pbar tq" role="img" aria-label="${ph.length} of ${act.length} projects have a photo"><i style="width:${act.length?100*ph.length/act.length:0}%"></i></div>${ph.length?`<div class="thumbs" aria-hidden="true">${ph.slice(0,6).map(x=>`<span class="pic">${img(x.image_url,'')}</span>`).join('')}${ph.length>6?`<span class="more">+${ph.length-6}</span>`:''}</div>`:''}`)
  ].join('')}</div>`}
function ovBoard(d){const cats=d.cats.filter(c=>c.active),mx=Math.max(1,d.verified);
  return`<section class="panel board" aria-labelledby="lbh"><div class="sec-h"><div><h2 id="lbh">Live leaderboard</h2><p class="hint"><span class="lv"><i></i>Live</span> Updates automatically every few seconds.</p></div><span class="chip nodot"><b data-n="allv">${d.votes}</b>&nbsp;${d.votes===1?'vote':'votes'} in total</span></div>
  ${cats.length?`<div class="lb">${cats.map((c,k)=>{const r=resFor(d,c,k),it=r?.items||[],tot=it.reduce((a,i)=>a+i.c,0),a=it[0],b=it[1],top=Math.max(1,a?.c||0),part=(d.perCat.find(p=>p.name===c.name)||{n:tot}).n,pct=Math.min(100,Math.round(100*part/mx)),ex=a&&exOf(d,a.id);
    return`<article class="lbc" style="--ac:var(${ACC[k%4]})"><header><h3 dir="auto">${E(c.name)}</h3><div class="lbc-t"><b data-n="t${c.id}">${tot}</b><small>${tot===1?'vote':'votes'}</small></div></header>
    ${a&&a.c>0?`<div class="lead"><div class="pic t${tint(a.n)}">${img(ex?.image_url,a.n)}</div><div class="lead-b"><span class="crown">${ic('trophy')}Leading</span><b dir="auto">${E(a.n)}</b><span class="gap">${b&&b.c===a.c?'Tied for the lead':`+${a.c-(b?.c||0)} ahead`}</span></div><strong data-n="l${c.id}">${a.c}</strong></div>`:`<div class="lead none"><span class="ico">${ic('star')}</span><div><b>No votes yet</b><small>The leader appears with the first vote.</small></div></div>`}
    ${it.length>1?`<ol class="lbr" start="2">${it.slice(1,5).map((i,j)=>`<li data-k="${j+1}"><span class="rb">${j+2}</span><span class="nm" dir="auto">${E(i.n)}</span><b data-n="r${c.id}-${i.id}">${i.c}</b><i style="width:${100*i.c/top}%"></i></li>`).join('')}</ol>${it.length>5?`<p class="more-r">+${it.length-5} more in Results</p>`:''}`:''}
    <footer><div class="pbar" role="img" aria-label="${pct}% of voters took part"><i style="width:${pct}%"></i></div><small>${pct}% of voters took part (${part} of ${d.verified})</small></footer></article>`}).join('')}</div>`:empty('tag','No categories yet','Add a category to start collecting votes.')}</section>`}
function ovPreview(d){const mode={hidden:'Hidden — the TV shows “Results coming soon”',rank:'Ranking only — vote counts are hidden on the TV',count:'Ranking + vote counts'}[d.settings.results]||'';
  const cats=d.cats.filter(c=>c.active).slice(0,3);
  return`<section class="panel" aria-labelledby="pvh"><div class="sec-h"><div><h2 id="pvh">Big screen preview</h2><p class="hint">What the audience sees on the TV, live.</p></div><a class="btn sm" href="/results" target="_blank" rel="noopener">${ic('tv')}Open TV screen</a></div>
  <div class="tvp"><div class="tvp-in"><header><img src="/brand/logo-white.png" alt=""><div><b>Community Awards</b><span>Live results</span></div><span class="tvp-live">LIVE</span></header>
  <div class="tvp-cols">${cats.map((c,k)=>{const r=resFor(d,c,k),it=(r?.items||[]).slice(0,5),mx=Math.max(1,...it.map(i=>i.c));return`<div class="tvp-col a${k}"><h4 dir="auto">${E(c.name)}</h4>${it.length?it.map((i,j)=>`<div class="tvp-row" data-k="${j}"><span class="rk">${j+1}</span><span class="nm" dir="auto">${E(i.n)}</span><b>${i.c}</b><i style="width:${Math.max(3,100*i.c/mx)}%"></i></div>`).join(''):'<p class="tvp-none">No votes yet</p>'}</div>`}).join('')||'<p class="tvp-none">Add a category to see results.</p>'}</div></div></div>
  <p class="hint" style="margin-top:12px"><b>Big screen mode:</b> ${mode}.${d.me.can.settings?' <button class="ghost" data-go="se" style="min-height:32px;padding:0 4px">Change in Settings</button>':''}</p></section>`}
function ovFeed(d){return`<section class="panel" aria-labelledby="fh"><div class="sec-h"><h2 id="fh">Latest votes</h2></div>${d.recent.length?`<ul class="feed">${d.recent.slice(0,8).map(r=>`<li><span class="av" aria-hidden="true">${ini(r.name)}</span><div><b dir="auto">${E(r.name)}</b> <small>${r.phone?E(r.phone)+' ':''}voted in <span dir="auto">${E(r.cat)}</span></small></div></li>`).join('')}</ul>`:empty('activity','No votes yet','New votes will show up here.')}</section>`}
const ovTools=d=>d.me.can.export||d.me.can.reset?`<section class="panel zone" aria-labelledby="zh"><h2 id="zh">${d.me.can.reset?'Reset &amp; export':'Export'}</h2><p class="hint" style="margin:6px 0 14px">${d.me.can.reset?'Export the results first — deleting every vote cannot be undone.':'Download the final counts per category.'}</p><div class="acts inl">${d.me.can.export?`<a class="btn sec" href="/api/admin/export.csv">${ic('download')}Export results (CSV)</a>`:''}${d.me.can.reset?`<button class="btn dng-o" id="rs">${ic('trash')}Reset all votes</button>`:''}</div></section>`:'';
V.ov=d=>`<div class="stack"><div id="lv1" class="stack">${ovBanner(d)}${ovMetrics(d)}</div><div id="lv2">${ovBoard(d)}</div><div class="dgrid c2"><div id="lv3">${ovPreview(d)}</div><div class="stack"><div id="lv4">${ovFeed(d)}</div>${ovTools(d)}</div></div></div>`;
const wireOv=()=>{A.querySelectorAll('[data-tg]').forEach(b=>b.onclick=toggleVoting);A.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{T=b.dataset.go;dash(D);scrollTo(0,0)})};
const tween=(el,a,b)=>{if(a===b)return;el.classList.add('flash');if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const t0=performance.now(),f=t=>{const k=Math.min(1,(t-t0)/800);el.textContent=Math.round(a+(b-a)*(1-(1-k)**3));if(k<1)requestAnimationFrame(f)};el.textContent=a;requestAnimationFrame(f)};
function paintOv(d){const old={};A.querySelectorAll('[data-n]').forEach(e=>old[e.dataset.n]=+e.textContent);const oldV={};A.querySelectorAll('[data-v]').forEach(e=>oldV[e.dataset.v]=e.textContent);
  $('#lv1').innerHTML=ovBanner(d)+ovMetrics(d);$('#lv2').innerHTML=ovBoard(d);$('#lv3').innerHTML=ovPreview(d);$('#lv4').innerHTML=ovFeed(d);
  A.querySelectorAll('[data-n]').forEach(e=>{const k=e.dataset.n;if(old[k]!==undefined)tween(e,old[k],+e.textContent)});
  A.querySelectorAll('[data-v]').forEach(e=>{if(oldV[e.dataset.v]!==undefined&&oldV[e.dataset.v]!==e.textContent)e.classList.add('flash')});wireOv()}
const sigOf=d=>JSON.stringify([d.voting,d.votes,d.perMin,d.verified,d.completion,d.res,d.perCat,d.recent,d.ex.map(x=>[x.id,x.active,x.image_url]),d.settings.results]);
async function refresh(){if(T!=='ov'||document.hidden||!$('#lv1'))return;const d=await api('/api/admin/data');if(d.s===401){clearInterval(poll);return login('Your session ended. Please sign in again.')}if(d.s!==200||T!=='ov')return;D=d;const u=$('#upd');if(u)u.textContent='Updated '+nowT();const g=sigOf(d);if(g===lastSig)return;lastSig=g;paintOv(d)}
W.ov=d=>{lastSig=sigOf(d);wireOv();const r=$('#rs');if(r)r.onclick=async()=>{if(await ask({title:'Reset all votes?',text:'This permanently deletes every vote and cannot be undone.',type:'RESET',ok:'Reset all votes',danger:true,icon:'warn'})){const x=await api('/api/admin/reset',{confirm:'RESET'});if(x.s===200){toast('All votes were reset');re()}}}};
V.rt=d=>`<div class="sec-h"><p class="hint">Totals update whenever you reload this tab.</p>${d.me.can.export?`<a class="btn sec sm" href="/api/admin/export.csv">${ic('download')}Export results (CSV)</a>`:''}</div>${d.res.length?`<div class="rcg">${d.res.map(c=>{const t=c.items.reduce((a,i)=>a+i.c,0);return`<section class="panel rcat"><div class="sec-h" style="margin:0"><h2 dir="auto">${E(c.name)}</h2><span class="chip nodot">${t} ${t===1?'vote':'votes'}</span></div>${c.items.map((i,k)=>`<div class="rr${k===0&&i.c>0?' lead':''}" data-k="${k}"><span class="rb">${k+1}</span><b dir="auto">${E(i.n)}</b><em><strong>${i.c}</strong> ${i.c===1?'vote':'votes'} · ${t?Math.round(100*i.c/t):0}%</em><i style="width:${t?100*i.c/t:0}%"></i></div>`).join('')||empty('chart','No votes yet','Results appear as soon as votes come in.')}</section>`}).join('')}</div>`:empty('chart','No categories yet','Add a category to see results here.')}`;
W.rt=()=>{};
const RQ='<i class="req" aria-hidden="true" title="Required">*</i><span class="sr"> (required)</span>';
V.ex=d=>`<div class="stack"><section class="panel" aria-labelledby="xh"><div class="sec-h"><h2 id="xh">Add or edit an exhibitor</h2></div><div id="eb" class="edit-b" hidden></div>
<form id="xf" novalidate><input type="hidden" name="id"><div class="fgrid c2"><label><span>Project name${RQ}</span><input name="project_name" maxlength="80" aria-describedby="e-project_name"><small class="fe" id="e-project_name" role="alert"></small></label><label><span>Team / exhibitor${RQ}</span><input name="exhibitor_name" maxlength="80" aria-describedby="e-exhibitor_name"><small class="fe" id="e-exhibitor_name" role="alert"></small></label>
<label class="full"><span class="field-h"><span>Short description${RQ}</span><small id="cc">0/140</small></span><input name="short_description" maxlength="140" aria-describedby="e-short_description"><small class="fe" id="e-short_description" role="alert"></small></label>
<div class="full lbl" id="g-image_url"><span>Photo${RQ}</span><div class="up" id="upb"><div class="up-pv" id="pv"></div><div class="up-c"><input type="file" id="up" class="sr" accept="image/jpeg,image/png,image/webp"><label class="btn sec sm" for="up">${ic('upload')}Choose photo</label><button type="button" class="btn dng-o sm" id="ux" hidden>${ic('trash')}Remove photo</button><p class="up-st" id="ust" role="status">JPG, PNG or WEBP. Large photos are resized automatically.</p></div></div><small class="fe" id="e-image_url" role="alert"></small></div>
<label class="full">…or paste an image link<input name="image_url" placeholder="https://…" inputmode="url" autocomplete="off"></label>
<fieldset class="full" id="g-cats"><legend>Categories${RQ}</legend><div class="cbs">${d.cats.map(c=>`<label class="cbx"><input type="checkbox" name="cat" value="${c.id}"><span dir="auto">${E(c.name)}</span></label>`).join('')||'<small>No categories available yet.</small>'}</div><small class="fe" id="e-cats" role="alert"></small></fieldset>
<label class="sw-row full"><span>Active<small>Inactive projects are hidden from voters.</small></span><input type="checkbox" class="sw" name="active" checked role="switch"></label></div>
<div class="acts"><button class="btn lg">Save exhibitor</button><button type="button" class="btn sec lg" id="xc" hidden>Cancel edit</button></div></form></section>
<section class="panel" aria-labelledby="xl"><div class="sec-h"><h2 id="xl">Exhibitors <span class="chip nodot">${d.ex.length}</span></h2></div>${d.ex.length?`<ul class="rows">${d.ex.map(x=>`<li class="item${x.active?'':' off'}">${pic(x.image_url,x.project_name)}<div class="main"><b dir="auto">${E(x.project_name)}</b><small dir="auto">${E(x.exhibitor_name)}</small><div class="chips">${x.cats.map(i=>`<span class="chip info nodot" dir="auto">${E(d.cats.find(c=>c.id===i)?.name)}</span>`).join('')}${x.active?'':'<span class="chip bad nodot">Inactive</span>'}</div></div><div class="acts"><button class="btn sec sm" data-e="${x.id}">${ic('edit')}Edit</button><button class="btn dng-o sm" data-d="${x.id}">${ic('trash')}Delete</button></div></li>`).join('')}</ul>`:empty('box','No exhibitors yet','Add your first project using the form above.')}</section></div>`;
W.ex=d=>{const f=$('#xf'),el=f.elements,st=$('#ust'),dflt=st.textContent;
  const pv=()=>{const v=el.image_url.value.trim();$('#pv').innerHTML=v?img(v,'Photo preview'):`<span class="ph-t">${ic('image')}No photo yet</span>`;$('#ux').hidden=!v};pv();
  const sd=()=>$('#cc').textContent=`${el.short_description.value.length}/140`;sd();el.short_description.addEventListener('input',sd);el.image_url.addEventListener('input',()=>{pv();st.className='up-st';st.textContent=dflt});
  $('#ux').onclick=()=>{fe('image_url','');el.image_url.value='';$('#up').value='';pv();st.className='up-st';st.textContent=dflt};
  $('#up').onchange=async e=>{const file=e.target.files[0];if(!file)return;const bm=await createImageBitmap(file).catch(()=>0);if(!bm){st.className='up-st bad';st.textContent='Please pick a JPG, PNG or WEBP image.';return toast('Please pick a JPG, PNG or WEBP image.')}
    const k=Math.min(1,900/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);
    $('#pv').innerHTML=img(c.toDataURL('image/jpeg',.82),'Photo preview');$('#ux').hidden=false;$('#upb').classList.add('busy');st.className='up-st';st.textContent=`Uploading ${file.name}…`;
    const bl=await new Promise(r=>c.toBlob(r,'image/jpeg',.82)),r=await fetch('/api/admin/upload',{method:'POST',headers:{'content-type':'application/octet-stream'},body:bl}).then(x=>x.json()).catch(()=>({}));
    $('#upb').classList.remove('busy');
    if(r.url){el.image_url.value=r.url;fe('image_url','');pv();st.className='up-st ok';st.textContent='Photo uploaded — now save the exhibitor.';toast('Photo uploaded — now save the exhibitor')}else{pv();st.className='up-st bad';st.textContent='Upload failed. Try a smaller image.';toast('Upload failed. Try a smaller image.')}};
  const stop=()=>{f.reset();el.id.value='';pv();sd();clr();$('#eb').hidden=true;$('#xc').hidden=true;st.className='up-st';st.textContent=dflt};$('#xc').onclick=stop;
  const fe=(k,m)=>{const e=$('#e-'+k);if(e)e.textContent=m||'';const c=k==='cats'?$('#g-cats'):k==='image_url'?$('#g-image_url'):el[k];if(c)c.classList.toggle('bad',!!m);if(c&&c.setAttribute)m?c.setAttribute('aria-invalid','true'):c.removeAttribute('aria-invalid')};
  const KEYS=['project_name','exhibitor_name','short_description','image_url','cats'],clr=()=>KEYS.forEach(k=>fe(k,''));
  const check=g=>{const o={};if(!String(g.get('project_name')).trim())o.project_name='Please enter the project name.';if(!String(g.get('exhibitor_name')).trim())o.exhibitor_name='Please enter the team or exhibitor name.';
    if(!String(g.get('short_description')).trim())o.short_description='Please add a short description.';if(!/^(https:\/\/|\/)\S+$/.test(String(g.get('image_url')).trim()))o.image_url='Please add a photo — upload one or paste an image link.';
    if(!g.getAll('cat').length)o.cats='Please choose at least one category.';return o};
  const show=o=>{clr();let first;for(const k of KEYS)if(o[k]){fe(k,o[k]);first=first||k}
    if(first){const t=first==='cats'?$('#g-cats'):first==='image_url'?$('#up').closest('.lbl'):el[first];t.scrollIntoView({block:'center',behavior:'smooth'});(first==='cats'?f.querySelector('[name=cat]'):first==='image_url'?$('label[for=up]'):el[first])?.focus({preventScroll:true});toast('Please fill in the highlighted fields.')}return first};
  f.addEventListener('input',e=>{const k=e.target.name==='cat'?'cats':e.target.name;if(KEYS.includes(k))fe(k,'')});el.image_url.addEventListener('input',()=>fe('image_url',''));
  f.onsubmit=async e=>{e.preventDefault();const g=new FormData(f);if(show(check(g)))return;const btn=f.querySelector('.acts .btn');btn.disabled=true;
    const r=await api('/api/admin/exhibitor',{id:g.get('id')||null,project_name:String(g.get('project_name')).trim(),exhibitor_name:String(g.get('exhibitor_name')).trim(),short_description:String(g.get('short_description')).trim(),image_url:String(g.get('image_url')).trim(),cats:g.getAll('cat').map(Number),active:!!g.get('active')});btn.disabled=false;
    if(r.s===200){toast('Saved');re()}else if(r.code==='invalid'&&r.field){show({[r.field]:r.error})}else if(r.s!==403)toast('Could not save. Please try again.')};
  A.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const x=d.ex.find(i=>i.id==b.dataset.e);for(const k of['id','project_name','exhibitor_name','short_description','image_url'])el[k].value=x[k]??'';f.querySelectorAll('[name=cat]').forEach(c=>c.checked=x.cats.includes(+c.value));el.active.checked=!!x.active;
    pv();sd();clr();const eb=$('#eb');eb.innerHTML=`<span>Editing <b dir="auto">${E(x.project_name)}</b></span>`;eb.hidden=false;$('#xc').hidden=false;scrollTo({top:0,behavior:'smooth'});el.project_name.focus({preventScroll:true})});
  A.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{if(await ask({title:'Remove this exhibitor?',text:'If it already has votes it is deactivated instead.',ok:'Remove',danger:true,icon:'trash'})){await api('/api/admin/exhibitor/delete',{id:+b.dataset.d});re()}})};
V.ca=d=>`<div class="stack"><section class="panel" id="cp" aria-labelledby="ah" hidden><div class="sec-h"><h2 id="ah">Edit category</h2></div><div id="eb" class="edit-b" hidden></div><form id="cf"><input type="hidden" name="id"><div class="fgrid c2"><label class="full">Category name<input name="name" required></label><label class="full">Short description<input name="description"></label>
<label class="sw-row full"><span>Enabled<small>Disabled categories are hidden from voters.</small></span><input type="checkbox" class="sw" name="active" checked role="switch"></label></div><div class="acts"><button class="btn lg">Save category</button><button type="button" class="btn sec lg" id="cx" hidden>Cancel edit</button></div></form></section>
<section class="panel" aria-labelledby="al"><div class="sec-h"><h2 id="al">Categories <span class="chip nodot">${d.cats.length}</span></h2></div>${d.cats.length?`<ul class="rows">${d.cats.map(c=>`<li class="item cat${c.active?'':' off'}"><span class="num" aria-hidden="true">${ic('tag')}</span><div class="main"><b dir="auto">${E(c.name)}</b><small dir="auto">${E(c.description)}</small><div class="chips"><span class="chip info nodot">${d.ex.filter(x=>x.cats.includes(c.id)).length} teams</span>${c.active?'':'<span class="chip bad nodot">Disabled</span>'}</div></div><div class="acts"><button class="btn sec sm" data-e="${c.id}">${ic('edit')}Edit</button><button class="btn dng-o sm" data-d="${c.id}">${ic('trash')}Delete</button></div></li>`).join('')}</ul>`:empty('tag','No categories yet','Categories will appear here once they are set up.')}</section></div>`;
W.ca=d=>{const f=$('#cf'),el=f.elements;
  const stop=()=>{f.reset();el.id.value='';$('#eb').hidden=true;$('#cx').hidden=true;$('#cp').hidden=true};$('#cx').onclick=stop;
  f.onsubmit=async e=>{e.preventDefault();const g=new FormData(f);if(!g.get('id'))return;await api('/api/admin/category',{id:g.get('id')||null,name:g.get('name'),description:g.get('description'),active:!!g.get('active')});toast('Saved');re()};
  A.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const c=d.cats.find(i=>i.id==b.dataset.e);for(const k of['id','name','description'])el[k].value=c[k]??'';el.active.checked=!!c.active;
    $('#cp').hidden=false;const eb=$('#eb');eb.innerHTML=`<span>Editing <b dir="auto">${E(c.name)}</b></span>`;eb.hidden=false;$('#cx').hidden=false;scrollTo({top:0,behavior:'smooth'});el.name.focus({preventScroll:true})});
  A.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{if(await ask({title:'Delete this category?',text:'If it has votes it is disabled instead.',ok:'Delete',danger:true,icon:'trash'})){await api('/api/admin/category/delete',{id:+b.dataset.d});re()}})};
V.vi=d=>`<section class="panel"><div class="srch">${ic('search')}<input id="q" type="search" placeholder="Search visitors by name or number" aria-label="Search visitors"></div><p class="hint" id="vc" role="status" style="margin-bottom:12px"></p><ul class="rows" id="vt"></ul></section>`;
W.vi=d=>{const q=$('#q'),r=()=>{const L=d.visitors.filter(v=>(v.name+v.phone).toLowerCase().includes(q.value.toLowerCase()));$('#vc').textContent=`${L.length} of ${d.visitors.length} visitors`;
  $('#vt').innerHTML=L.map(v=>`<li class="item vis"><span class="av" aria-hidden="true">${ini(v.name)}</span><div class="main"><b dir="auto">${E(v.name)}</b><small>${E(v.phone)}</small></div><div class="side-r"><span class="chip ${v.verified_at?'ok':'warn'}">${v.verified_at?'Verified':'Pending'}</span><span>${v.n} ${v.n===1?'vote':'votes'}</span><span>${new Date(v.created_at).toLocaleTimeString()}</span></div></li>`).join('')||`<li>${empty('users','No visitors found',q.value?'Try a different search.':'Visitors appear here once they register.')}</li>`};q.oninput=r;r()};
V.us=d=>`<div class="stack"><section class="panel" aria-labelledby="uh"><div class="sec-h"><h2 id="uh">Add or edit a user</h2></div><div id="eb" class="edit-b" hidden></div><form id="uf"><input type="hidden" name="id"><div class="fgrid c2"><label>Username<input name="username" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="e.g. sara.m"></label><label>Role<select name="role">${Object.entries(ROLE_L).map(([k,v])=>`<option value="${k}"${k==='admin'?' selected':''}>${v}</option>`).join('')}</select></label><label class="full"><span class="field-h">Password<small id="ph">Required for new users</small></span><input name="password" type="password" autocomplete="new-password" maxlength="128" placeholder="At least 8 characters"></label></div><p class="err" id="ue" role="alert"></p><div class="acts"><button class="btn lg">${ic('userplus')}Save user</button><button type="button" class="btn sec lg" id="uc" hidden>Cancel edit</button></div></form></section>
<section class="panel" aria-labelledby="ul"><div class="sec-h"><h2 id="ul">Users <span class="chip nodot">${d.users.length}</span></h2></div><ul class="rows">${d.users.map(u=>`<li class="item vis"><span class="av" aria-hidden="true">${ini(u.username)}</span><div class="main"><b>${E(u.username)}${u.id===d.me.id?' <small>(you)</small>':''}</b><div class="chips"><span class="chip nodot ${ROLE_C[u.role]}">${ROLE_L[u.role]}</span></div></div><div class="acts"><button class="btn sec sm" data-e="${u.id}">${ic('edit')}Edit</button>${u.id===d.me.id?'':`<button class="btn dng-o sm" data-d="${u.id}">${ic('trash')}Delete</button>`}</div></li>`).join('')}</ul></section></div>`;
W.us=d=>{const f=$('#uf'),el=f.elements,er=$('#ue');
  const stop=()=>{f.reset();el.id.value='';el.username.disabled=false;el.role.disabled=false;$('#eb').hidden=true;$('#uc').hidden=true;$('#ph').textContent='Required for new users';er.textContent=''};$('#uc').onclick=stop;
  f.onsubmit=async e=>{e.preventDefault();er.textContent='';const id=+el.id.value,b={id:id||null,username:el.username.value,role:el.role.value,password:el.password.value};
    if(!id&&!b.password)return er.textContent='Please choose a password (at least 8 characters).';
    const r=await api('/api/admin/user',b);if(r.s===200){toast(id?'User updated':'User added');re()}else er.textContent=r.error||'Could not save this user.'};
  A.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const u=d.users.find(x=>x.id==b.dataset.e);el.id.value=u.id;el.username.value=u.username;el.username.disabled=true;el.role.value=u.role;el.role.disabled=u.id===d.me.id;el.password.value='';$('#ph').textContent='Leave empty to keep the current password';
    const eb=$('#eb');eb.innerHTML=`<span>Editing <b>${E(u.username)}</b>${u.id===d.me.id?' — you can’t change your own role':''}</span>`;eb.hidden=false;$('#uc').hidden=false;scrollTo({top:0,behavior:'smooth'});el.password.focus({preventScroll:true})});
  A.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{const u=d.users.find(x=>x.id==b.dataset.d);if(await ask({title:`Delete ${u.username}?`,text:'They will be signed out and can no longer access the dashboard.',ok:'Delete user',danger:true,icon:'trash'})){const r=await api('/api/admin/user/delete',{id:u.id});if(r.s===200){toast('User deleted');re()}else toast(r.error||'Could not delete this user.')}})};
V.se=d=>{const s=d.settings;return`<form id="sf" class="panel"><div class="set-sec"><h3>${ic('star')}Event</h3><div class="fgrid c2"><label>Event name<input name="event" value="${E(s.event)}"></label><label>Results screen<select name="results">${[['hidden','Hidden'],['rank','Ranking only'],['count','Ranking + vote count']].map(([k,v])=>`<option value="${k}" ${s.results===k?'selected':''}>${v}</option>`).join('')}</select></label></div></div>
<div class="set-sec"><h3>${ic('pin')}Location</h3><label class="sw-row"><span>Require location (geofence)<small>Visitors must be at the venue to vote.</small></span><input type="checkbox" class="sw" name="geo_on" role="switch" ${+s.geo_on?'checked':''}></label><div class="fgrid c2"><label>Venue latitude<input name="lat" value="${E(s.lat)}"></label><label>Venue longitude<input name="lng" value="${E(s.lng)}"></label><label>Allowed radius (meters)<input name="radius" value="${E(s.radius)}"></label></div></div>
<div class="set-sec"><h3>${ic('shield')}Network</h3><label class="sw-row"><span>Require venue network (IP ranges)<small>Only devices on the venue Wi-Fi can vote.</small></span><input type="checkbox" class="sw" name="ip_on" role="switch" ${+s.ip_on?'checked':''}></label><label>Allowed IP ranges (comma-separated CIDR)<input name="ips" value="${E(s.ips)}" placeholder="203.0.113.0/24"></label></div>
<div class="set-sec"><h3>${ic('tv')}Venue QR on the big screen</h3><label class="sw-row"><span>Rotating venue QR<small>The live screen (/results) shows a QR that changes every 15 seconds. Scanning it lets a phone vote without GPS or the venue Wi-Fi. The screen's browser must be signed in to this dashboard.</small></span><input type="checkbox" class="sw" name="qr_on" role="switch" ${+s.qr_on?'checked':''}></label><p class="hint">When several checks are on, passing <b>any one</b> is enough: venue Wi-Fi, location, or the big-screen QR.</p></div>
<div class="foot-act"><button class="btn lg">Save settings</button></div></form>`};
W.se=()=>{$('#sf').onsubmit=async e=>{e.preventDefault();const f=$('#sf').elements,b={};for(const k of['event','results','lat','lng','radius','ips'])b[k]=f[k].value;b.geo_on=f.geo_on.checked;b.ip_on=f.ip_on.checked;b.qr_on=f.qr_on.checked;await api('/api/admin/settings',b);toast('Settings saved')}};

/* ---------------- start ---------------- */
const P=location.pathname;(P==='/results'?results:P==='/admin'?admin:P==='/analysis'?analysis:visitor)();
