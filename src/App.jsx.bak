import { useState, useEffect, useRef, useCallback } from "react";
import { signInWithGoogle, signOutUser, onAuthChange, loadUserData, saveUserData } from "./firebase.js";

// ─── Helpers ────────────────────────────────────────────────────────────────
const PRIORITIES = ["High","Medium","Low"];
function strToColor(str){const p=["#818cf8","#34d399","#f472b6","#60a5fa","#a78bfa","#fb923c","#f87171","#4ade80","#fbbf24","#38bdf8"];let h=0;for(let i=0;i<str.length;i++)h=str.charCodeAt(i)+((h<<5)-h);return p[Math.abs(h)%p.length];}
function getDaysLeft(d){if(!d)return null;const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+"T00:00:00")-t)/86400000);}
function fmtDate(d){if(!d)return"";return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
function fmtMin(m){const h=Math.floor(m/60),mn=m%60;return h?`${h}h ${mn}m`:`${mn}m`;}
function today(){return new Date().toISOString().split("T")[0];}
function addHour(t){const[h,m]=(t||"09:00").split(":").map(Number);return`${String((h+1)%24).padStart(2,"0")}:${String(m).padStart(2,"0")}`;}
function buildGCalURL(title,deadline,time,notes){if(!deadline)return null;const ts=(time||"09:00").replace(":",""),te=addHour(time||"09:00").replace(":",""),d=deadline.replace(/-/g,"");return`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("📋 "+title)}&dates=${d}T${ts}00/${d}T${te}00&details=${encodeURIComponent(notes||"")}&ctz=Asia/Calcutta`;}

function DeadlineBadge({dateStr,done,sm}){
  const days=getDaysLeft(dateStr);if(days===null)return null;
  let color="#4ade80",label=`${days}d left`;
  if(done){color="#6b7280";label=fmtDate(dateStr);}
  else if(days<0){color="#f87171";label=`${Math.abs(days)}d overdue`;}
  else if(days===0){color="#fbbf24";label="Due today";}
  else if(days<=3){color="#fb923c";label=`${days}d left`;}
  return<span style={{fontSize:sm?"0.64rem":"0.7rem",fontFamily:"'IBM Plex Mono',monospace",background:color+"22",color,border:`1px solid ${color}55`,borderRadius:"4px",padding:sm?"1px 5px":"2px 7px",whiteSpace:"nowrap"}}>{label}</span>;
}

function ProgressRing({pct,size=36,stroke=3,color="#818cf8"}){
  const r=(size-stroke*2)/2,c=2*Math.PI*r;
  return<svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}><circle cx={size/2} cy={size/2} r={r} stroke="#1e293b" strokeWidth={stroke} fill="none"/><circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c-(pct/100)*c} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.4s"}}/></svg>;
}

function AppIcon({size=36}){return(
  <div style={{width:size,height:size,borderRadius:size*.25,background:"linear-gradient(135deg,#1e1b4b,#0f172a)",border:"1px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <svg width={size*.54} height={size*.54} viewBox="0 0 44 44" fill="none">
      <rect x="4" y="8" width="36" height="30" rx="4" stroke="#818cf8" strokeWidth="2.5"/>
      <line x1="4" y1="16" x2="40" y2="16" stroke="#818cf8" strokeWidth="2.5"/>
      <line x1="14" y1="8" x2="14" y2="4" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="30" y1="8" x2="30" y2="4" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="10" y="22" width="10" height="3" rx="1.5" fill="#34d399"/>
      <rect x="10" y="29" width="16" height="3" rx="1.5" fill="#475569"/>
      <circle cx="34" cy="31" r="7" fill="#0a0a0f" stroke="#818cf8" strokeWidth="1.5"/>
      <path d="M31 31l2 2 4-4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);}

// ─── Sign-In Screen ──────────────────────────────────────────────────────────
function SignInScreen({onSignIn,loading}){
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Sans',sans-serif",padding:"24px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 #818cf833}50%{box-shadow:0 0 0 16px transparent}}`}</style>
      <div style={{marginBottom:"28px",animation:"pulse 3s ease-in-out infinite"}}><AppIcon size={72}/></div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:"2rem",fontWeight:800,letterSpacing:"-1px",color:"#f8fafc",marginBottom:"6px"}}>AGENDA<span style={{color:"#818cf8"}}>BOARD</span></div>
      <div style={{fontSize:"0.82rem",color:"#475569",marginBottom:"10px",textAlign:"center"}}>Agendas · Tasks · YouTube Study Plan</div>
      <div style={{display:"flex",gap:"16px",marginBottom:"44px",flexWrap:"wrap",justifyContent:"center"}}>
        {["✓ Cloud sync","✓ Google Calendar","✓ Study tracker"].map(f=><span key={f} style={{fontSize:"0.7rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace"}}>{f}</span>)}
      </div>
      <button onClick={onSignIn} disabled={loading}
        style={{display:"flex",alignItems:"center",gap:"12px",background:"#fff",color:"#1f2937",border:"none",borderRadius:"12px",padding:"13px 26px",fontSize:"0.95rem",fontWeight:600,cursor:loading?"wait":"pointer",boxShadow:"0 4px 32px #00000044",transition:"transform .15s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1L6 34.2C9.3 39.8 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C41.1 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
        {loading?"Signing in…":"Continue with Google"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENDA SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const blankAg=(cats)=>({title:"",category:cats[0]||"",priority:"Medium",deadline:"",time:"09:00",reminderMins:"30",notes:""});
const blankTsk=()=>({title:"",deadline:""});

function AgendaSection({agendas,setAgendas,categories,setCategories}){
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [newCat,setNewCat]=useState("");
  const [showManage,setShowManage]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState(blankAg(categories));
  const [showInlineCat,setShowInlineCat]=useState(false);
  const [inlineCatVal,setInlineCatVal]=useState("");
  const [addingTaskFor,setAddingTaskFor]=useState(null);
  const [taskForm,setTaskForm]=useState(blankTsk());
  const [editTaskRef,setEditTaskRef]=useState(null);
  const [expanded,setExpanded]=useState({});
  const [calStatus,setCalStatus]=useState({});
  const titleRef=useRef(),inlineRef=useRef(),taskRef=useRef();

  const addCat=(name,src)=>{const n=(name||newCat).trim();if(!n||categories.map(c=>c.toLowerCase()).includes(n.toLowerCase())){setNewCat("");setInlineCatVal("");if(src==="inline")setShowInlineCat(false);return;}const u=[...categories,n];setCategories(u);setForm(f=>({...f,category:n}));setNewCat("");setInlineCatVal("");if(src==="inline")setShowInlineCat(false);};
  const delCat=(cat)=>{const u=categories.filter(c=>c!==cat);setCategories(u);setAgendas(a=>a.map(x=>x.category===cat?{...x,category:u[0]||""}:x));if(filter===cat)setFilter("All");};

  const saveAg=()=>{if(!form.title.trim())return;if(editId){setAgendas(a=>a.map(x=>x.id===editId?{...x,...form}:x));setEditId(null);}else{const id=Date.now();setAgendas(a=>[...a,{...form,id,tasks:[],createdAt:new Date().toISOString()}]);setExpanded(e=>({...e,[id]:true}));}setForm(blankAg(categories));setShowForm(false);};
  const delAg=(id)=>setAgendas(a=>a.filter(x=>x.id!==id));
  const startEdit=(ag)=>{setForm({title:ag.title,category:ag.category||"",priority:ag.priority,deadline:ag.deadline||"",time:ag.time||"09:00",reminderMins:ag.reminderMins||"30",notes:ag.notes||""});setEditId(ag.id);setShowForm(true);setShowManage(false);setTimeout(()=>titleRef.current?.focus(),50);};
  const cancelForm=()=>{setForm(blankAg(categories));setEditId(null);setShowForm(false);};

  const openAddTask=(agId)=>{setAddingTaskFor(agId);setEditTaskRef(null);setTaskForm(blankTsk());setTimeout(()=>taskRef.current?.focus(),50);};
  const openEditTask=(agId,task)=>{setAddingTaskFor(agId);setEditTaskRef({agId,taskId:task.id});setTaskForm({title:task.title,deadline:task.deadline||""});setTimeout(()=>taskRef.current?.focus(),50);};
  const saveTask=()=>{if(!taskForm.title.trim()){setAddingTaskFor(null);setEditTaskRef(null);return;}if(editTaskRef){setAgendas(a=>a.map(ag=>ag.id===editTaskRef.agId?{...ag,tasks:ag.tasks.map(t=>t.id===editTaskRef.taskId?{...t,...taskForm}:t)}:ag));setEditTaskRef(null);}else{setAgendas(a=>a.map(ag=>ag.id===addingTaskFor?{...ag,tasks:[...(ag.tasks||[]),{...taskForm,id:Date.now(),done:false}]}:ag));}setTaskForm(blankTsk());setAddingTaskFor(null);};
  const toggleTask=(agId,taskId)=>setAgendas(a=>a.map(ag=>ag.id===agId?{...ag,tasks:ag.tasks.map(t=>t.id===taskId?{...t,done:!t.done}:t)}:ag));
  const delTask=(agId,taskId)=>setAgendas(a=>a.map(ag=>ag.id===agId?{...ag,tasks:ag.tasks.filter(t=>t.id!==taskId)}:ag));

  const calClick=(ag)=>{const url=buildGCalURL(ag.title,ag.deadline,ag.time,ag.notes);if(url){window.open(url,"_blank");setCalStatus(s=>({...s,[ag.id]:"ok"}));setTimeout(()=>setCalStatus(s=>{const n={...s};delete n[ag.id];return n;}),3500);}else{setCalStatus(s=>({...s,[ag.id]:"err"}));setTimeout(()=>setCalStatus(s=>{const n={...s};delete n[ag.id];return n;}),2500);}};

  const isDone=(ag)=>{const t=ag.tasks||[];return t.length>0&&t.every(x=>x.done);};
  const pct=(ag)=>{const t=ag.tasks||[];return t.length?Math.round(t.filter(x=>x.done).length/t.length*100):null;};
  const pColor={High:"#f87171",Medium:"#fbbf24",Low:"#4ade80"};

  const sorted=[...agendas].filter(ag=>{
    const done=isDone(ag);
    const mf=filter==="All"||(filter==="Active"&&!done)||(filter==="Done"&&done)||ag.category===filter;
    const ms=!search||ag.title.toLowerCase().includes(search.toLowerCase())||(ag.notes||"").toLowerCase().includes(search.toLowerCase())||(ag.tasks||[]).some(t=>t.title.toLowerCase().includes(search.toLowerCase()));
    return mf&&ms;
  }).sort((a,b)=>{const da=isDone(a),db=isDone(b);if(da!==db)return da?1:-1;const pd=PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority);if(pd)return pd;if(a.deadline&&b.deadline)return a.deadline.localeCompare(b.deadline);return a.deadline?-1:b.deadline?1:0;});

  return(
    <div>
      {/* Toolbar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <div style={{fontSize:"0.68rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace"}}>{agendas.filter(a=>!isDone(a)).length} active · {agendas.filter(a=>isDone(a)).length} done</div>
        <button className="btn" onClick={()=>{setShowForm(s=>!s);setShowManage(false);setEditId(null);setForm(blankAg(categories));setTimeout(()=>titleRef.current?.focus(),60);}}
          style={{background:showForm?"#1e293b":"#818cf8",color:showForm?"#94a3b8":"#fff",padding:"6px 14px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.76rem",fontWeight:600}}>
          {showForm?"✕ Cancel":"+ New Agenda"}
        </button>
      </div>

      {/* Agenda Form */}
      {showForm&&<div style={{background:"#07070d",border:"1px solid #1e293b",borderRadius:"10px",padding:"16px",marginBottom:"14px",animation:"fadein .2s ease"}}>
        <div style={{display:"grid",gap:"10px"}}>
          <input ref={titleRef} className="inp" style={{fontSize:"0.95rem"}} placeholder="Agenda title…" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveAg()}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <div style={{display:"flex",gap:"6px"}}><select className="inp" style={{flex:1,minWidth:0}} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{categories.length===0&&<option value="">No categories</option>}{categories.map(c=><option key={c}>{c}</option>)}</select><button className="btn" onClick={()=>{setShowInlineCat(s=>!s);setTimeout(()=>inlineRef.current?.focus(),50);}} style={{background:showInlineCat?"#334155":"#1e293b",color:"#818cf8",border:"1px solid #1e293b",borderRadius:"6px",padding:"0 10px",fontSize:"1.1rem",fontWeight:700,flexShrink:0}}>+</button></div>
            <select className="inp" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
          </div>
          {showInlineCat&&<div style={{display:"flex",gap:"7px",alignItems:"center",background:"#0c1220",border:"1px solid #1e293b",borderRadius:"7px",padding:"8px 12px"}}><span style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>NEW CAT</span><input ref={inlineRef} className="inp" style={{fontSize:"0.85rem",padding:"5px 8px"}} placeholder="Category name…" value={inlineCatVal} onChange={e=>setInlineCatVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCat(inlineCatVal,"inline");if(e.key==="Escape"){setShowInlineCat(false);setInlineCatVal("");}}} /><button className="btn" onClick={()=>addCat(inlineCatVal,"inline")} style={{background:"#818cf8",color:"#fff",padding:"5px 10px",borderRadius:"5px",fontSize:"0.75rem",whiteSpace:"nowrap",flexShrink:0}}>Add</button><button className="btn" onClick={()=>{setShowInlineCat(false);setInlineCatVal("");}} style={{background:"#1e293b",color:"#64748b",padding:"5px 7px",borderRadius:"5px",flexShrink:0}}>✕</button></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
            <div><div style={{fontSize:"0.6rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px"}}>DEADLINE</div><input type="date" className="inp" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}/></div>
            <div><div style={{fontSize:"0.6rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px"}}>TIME</div><input type="time" className="inp" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></div>
            <div><div style={{fontSize:"0.6rem",color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px"}}>🔔 REMINDER</div><select className="inp" value={form.reminderMins} onChange={e=>setForm(f=>({...f,reminderMins:e.target.value}))}><option value="0">At time</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hour</option><option value="1440">1 day</option></select></div>
          </div>
          <textarea className="inp" rows={2} placeholder="Notes…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{resize:"vertical"}}/>
          <div style={{display:"flex",gap:"8px"}}><button className="btn" onClick={saveAg} style={{background:"#818cf8",color:"#fff",padding:"7px 18px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.8rem",fontWeight:600}}>{editId?"Update":"Create Agenda"}</button><button className="btn" onClick={cancelForm} style={{background:"#1e293b",color:"#64748b",padding:"7px 12px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.8rem"}}>Cancel</button></div>
        </div>
      </div>}

      {/* Filters */}
      <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"12px",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:"5px",flexWrap:"wrap",flex:1}}>{["All","Active","Done",...categories].map(f=><button key={f} className={`fb ${filter===f?"act":""}`} onClick={()=>setFilter(f)}>{f}</button>)}</div>
        <button className="btn" onClick={()=>{setShowManage(s=>!s);setShowForm(false);}} style={{background:showManage?"#1e293b":"transparent",color:"#475569",border:"1px solid #1e293b",padding:"4px 9px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.68rem"}}>⚙</button>
        <input className="inp" style={{width:"140px",fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {showManage&&<div style={{background:"#07070d",border:"1px solid #1e293b",borderRadius:"8px",padding:"14px",marginBottom:"12px",animation:"fadein .15s ease"}}>
        <div style={{fontSize:"0.64rem",fontFamily:"'IBM Plex Mono',monospace",color:"#475569",marginBottom:"10px",letterSpacing:"0.08em"}}>MANAGE CATEGORIES</div>
        {categories.length===0&&<div style={{fontSize:"0.76rem",color:"#334155",marginBottom:"10px",fontFamily:"'IBM Plex Mono',monospace"}}>No categories yet.</div>}
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>{categories.map(cat=>{const c=strToColor(cat);return<span key={cat} style={{display:"inline-flex",alignItems:"center",fontSize:"0.73rem",fontFamily:"'IBM Plex Mono',monospace",background:c+"18",color:c,border:`1px solid ${c}44`,borderRadius:"4px",padding:"3px 8px"}}>{cat}<button style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.62rem",marginLeft:"4px",opacity:0.45,color:c}} onClick={()=>delCat(cat)}>✕</button></span>})}</div>
        <div style={{display:"flex",gap:"7px"}}><input className="inp" style={{fontSize:"0.82rem",padding:"6px 9px"}} placeholder="New category…" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat(newCat,"manage")}/><button className="btn" onClick={()=>addCat(newCat,"manage")} style={{background:"#818cf8",color:"#fff",padding:"6px 12px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.76rem",whiteSpace:"nowrap",flexShrink:0}}>+ Add</button></div>
      </div>}

      {/* Agenda List */}
      {sorted.length===0&&<div style={{textAlign:"center",color:"#334155",padding:"40px 0",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.82rem"}}>{agendas.length===0?"No agendas yet. Create your first one ↑":"No agendas match the filter."}</div>}
      {sorted.map(ag=>{
        const tasks=ag.tasks||[],p=pct(ag),done=isDone(ag),cc=ag.category?strToColor(ag.category):"#475569",isOpen=expanded[ag.id]!==false,cs=calStatus[ag.id];
        return<div key={ag.id} className="agenda-card" style={{background:"#07070d",opacity:done?.6:1}}>
          <div style={{padding:"11px 13px",display:"grid",gridTemplateColumns:"auto 1fr auto",gap:"11px",alignItems:"center",cursor:"pointer"}} onClick={()=>setExpanded(e=>({...e,[ag.id]:!isOpen}))}>
            <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <ProgressRing pct={p??0} size={34} stroke={3} color={done?"#334155":pColor[ag.priority]}/>
              <span style={{position:"absolute",fontSize:"0.48rem",fontFamily:"'IBM Plex Mono',monospace",color:done?"#334155":pColor[ag.priority]}}>{p===null?"–":`${p}%`}</span>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                <span style={{fontSize:"0.93rem",fontWeight:600,color:done?"#475569":"#f1f5f9",textDecoration:done?"line-through":"none"}}>{ag.title}</span>
                {ag.category&&<span style={{fontSize:"0.65rem",fontFamily:"'IBM Plex Mono',monospace",background:cc+"22",color:cc,border:`1px solid ${cc}44`,borderRadius:"3px",padding:"1px 5px"}}>{ag.category}</span>}
                <span style={{fontSize:"0.65rem",fontFamily:"'IBM Plex Mono',monospace",color:pColor[ag.priority],opacity:0.7}}>{ag.priority}</span>
                {ag.deadline&&<DeadlineBadge dateStr={ag.deadline} done={done}/>}
              </div>
              <div style={{fontSize:"0.67rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace",marginTop:"2px"}}>{tasks.length===0?"No tasks yet":`${tasks.filter(t=>t.done).length}/${tasks.length} tasks`}{ag.notes&&<span style={{color:"#1e293b"}}> · {ag.notes.slice(0,36)}{ag.notes.length>36?"…":""}</span>}</div>
            </div>
            <div style={{display:"flex",gap:"5px",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
              {ag.deadline&&!done&&<button className="cal-btn" onClick={()=>calClick(ag)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>GCal</button>}
              <button className="btn" onClick={()=>startEdit(ag)} style={{background:"transparent",color:"#475569",fontSize:"0.73rem",padding:"3px 7px",borderRadius:"4px",border:"1px solid #1e293b"}}>edit</button>
              <button className="btn" onClick={()=>delAg(ag.id)} style={{background:"transparent",color:"#374151",fontSize:"0.73rem",padding:"3px 7px",borderRadius:"4px",border:"1px solid #111827"}}>✕</button>
              <span style={{color:"#334155",fontSize:"0.7rem"}}>{isOpen?"▲":"▼"}</span>
            </div>
          </div>
          {cs&&<div style={{padding:"0 13px 7px",fontSize:"0.66rem",fontFamily:"'IBM Plex Mono',monospace",color:cs==="ok"?"#34d399":"#f87171"}}>{cs==="ok"?"✓ Opened in Google Calendar":"✗ Set a deadline first"}</div>}
          {isOpen&&<div style={{borderTop:"1px solid #0f172a",background:"#050509"}}>
            {tasks.length===0&&addingTaskFor!==ag.id&&<div style={{padding:"8px 13px 4px",fontSize:"0.69rem",color:"#1e293b",fontFamily:"'IBM Plex Mono',monospace"}}>No tasks yet</div>}
            {tasks.map(task=>{
              const editing=editTaskRef?.agId===ag.id&&editTaskRef?.taskId===task.id;
              return<div key={task.id} style={{display:"flex",alignItems:"flex-start",gap:"9px",padding:"6px 12px",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="#ffffff06"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <div onClick={()=>toggleTask(ag.id,task.id)} style={{width:"14px",height:"14px",borderRadius:"3px",marginTop:"3px",flexShrink:0,border:`1.5px solid ${task.done?"#334155":"#293548"}`,background:task.done?"#334155":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {task.done&&<span style={{color:"#64748b",fontSize:"0.52rem"}}>✓</span>}
                </div>
                {editing?<div style={{flex:1,display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
                  <input ref={taskRef} className="inp" style={{flex:1,minWidth:"120px",fontSize:"0.82rem",padding:"4px 7px"}} value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")saveTask();if(e.key==="Escape"){setEditTaskRef(null);setAddingTaskFor(null);}}}/>
                  <input type="date" className="inp" style={{width:"138px",fontSize:"0.78rem",padding:"4px 7px"}} value={taskForm.deadline} onChange={e=>setTaskForm(f=>({...f,deadline:e.target.value}))}/>
                  <button className="btn" onClick={saveTask} style={{background:"#818cf8",color:"#fff",padding:"4px 9px",borderRadius:"4px",fontSize:"0.73rem",whiteSpace:"nowrap",flexShrink:0}}>Save</button>
                  <button className="btn" onClick={()=>{setEditTaskRef(null);setAddingTaskFor(null);}} style={{background:"#1e293b",color:"#64748b",padding:"4px 7px",borderRadius:"4px",fontSize:"0.73rem",flexShrink:0}}>✕</button>
                </div>:<div style={{flex:1,display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                  <span style={{fontSize:"0.84rem",color:task.done?"#475569":"#cbd5e1",textDecoration:task.done?"line-through":"none",flex:1,minWidth:"80px"}}>{task.title}</span>
                  {task.deadline?<DeadlineBadge dateStr={task.deadline} done={task.done} sm/>:<span style={{fontSize:"0.61rem",color:"#1e293b",fontFamily:"'IBM Plex Mono',monospace"}}>no deadline</span>}
                  <button className="btn" onClick={()=>openEditTask(ag.id,task)} style={{background:"transparent",color:"#293548",fontSize:"0.67rem",padding:"2px 5px",borderRadius:"3px",border:"1px solid #111827"}}>edit</button>
                  <button className="btn" onClick={()=>delTask(ag.id,task.id)} style={{background:"transparent",color:"#1e293b",fontSize:"0.67rem",padding:"2px 5px",borderRadius:"3px",border:"1px solid #0f172a"}}>✕</button>
                </div>}
              </div>;
            })}
            {addingTaskFor===ag.id&&!editTaskRef?<div style={{padding:"6px 11px",display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap",borderTop:"1px solid #0c1220"}}>
              <div style={{width:"14px",height:"14px",borderRadius:"3px",border:"1.5px dashed #293548",flexShrink:0}}/>
              <input ref={taskRef} className="inp" style={{flex:1,minWidth:"120px",fontSize:"0.82rem",padding:"5px 7px"}} placeholder="Task title…" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")saveTask();if(e.key==="Escape")setAddingTaskFor(null);}}/>
              <input type="date" className="inp" style={{width:"138px",fontSize:"0.78rem",padding:"5px 7px"}} value={taskForm.deadline} onChange={e=>setTaskForm(f=>({...f,deadline:e.target.value}))}/>
              <button className="btn" onClick={saveTask} style={{background:"#818cf8",color:"#fff",padding:"5px 10px",borderRadius:"4px",fontSize:"0.74rem",whiteSpace:"nowrap",flexShrink:0}}>Add</button>
              <button className="btn" onClick={()=>setAddingTaskFor(null)} style={{background:"#1e293b",color:"#64748b",padding:"5px 7px",borderRadius:"4px",flexShrink:0}}>✕</button>
            </div>:<div style={{padding:"4px 11px 7px"}}><button className="btn" onClick={()=>openAddTask(ag.id)} style={{background:"transparent",color:"#293548",fontSize:"0.7rem",padding:"3px 9px",borderRadius:"4px",border:"1px dashed #1e293b",fontFamily:"'IBM Plex Mono',monospace"}} onMouseEnter={e=>{e.currentTarget.style.color="#818cf8";e.currentTarget.style.borderColor="#818cf8";}} onMouseLeave={e=>{e.currentTarget.style.color="#293548";e.currentTarget.style.borderColor="#1e293b";}}>+ add task</button></div>}
          </div>}
        </div>;
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY TRACKER SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function parseISO8601(d){const m=d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);return(parseInt(m[1]||0)*60)+parseInt(m[2]||0)+Math.round(parseInt(m[3]||0)/60);}
function extractPlaylistId(url){const m=url.match(/[?&]list=([^&]+)/);return m?m[1]:null;}
function extractVideoId(url){const m=url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);return m?m[1]:null;}

function StudySection({study,setStudy}){
  const [tab,setTab]=useState("today"); // today | schedule | progress | setup
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  // Setup form
  const [apiKey,setApiKey]=useState(study.apiKey||"");
  const [plUrls,setPlUrls]=useState(study.playlists?.map(p=>p.url||"").join("\n")||"");
  const [maxLen,setMaxLen]=useState(study.maxLen||65);
  const [startDate,setStartDate]=useState(study.startDate||today());
  // Schedule editing
  const [editingEntry,setEditingEntry]=useState(null); // idx
  const [dragIdx,setDragIdx]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  // Manual video add
  const [showAddVideo,setShowAddVideo]=useState(null); // entry idx
  const [manualUrl,setManualUrl]=useState("");
  const [manualTitle,setManualTitle]=useState("");
  const [manualDur,setManualDur]=useState("");
  // Add entry
  const [showAddEntry,setShowAddEntry]=useState(false);

  const entries=study.entries||[];
  const completed=study.completed||{};

  const updateStudy=(patch)=>setStudy(s=>({...s,...patch}));

  // ── Fetch playlist ──
  async function fetchPlaylist(key,plId){
    let videos=[],pageToken="";
    do{
      const r=await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${plId}&key=${key}${pageToken?"&pageToken="+pageToken:""}`);
      if(!r.ok)throw new Error("Playlist fetch failed: "+r.status);
      const d=await r.json();
      if(d.error)throw new Error(d.error.message);
      const ids=d.items.map(i=>i.snippet.resourceId.videoId).join(",");
      const vr=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${ids}&key=${key}`);
      const vd=await vr.json();
      vd.items.forEach(v=>videos.push({title:v.snippet.title,dur:parseISO8601(v.contentDetails.duration),url:`https://youtube.com/watch?v=${v.id}`}));
      pageToken=d.nextPageToken||"";
    }while(pageToken);
    return videos;
  }

  function greedyGroup(videos,ml){
    const res=[];let i=0;
    while(i<videos.length){const e=[],total=0;let t=0;while(i<videos.length){const v=videos[i];if(e.length===0||t+v.dur<=ml){e.push(v);t+=v.dur;i++;}else break;}res.push({id:Date.now()+i,videos:e,total:t});}
    return res;
  }

  async function buildFromPlaylists(){
    setErr("");setLoading(true);
    try{
      const lines=plUrls.split("\n").map(l=>l.trim()).filter(Boolean);
      if(!lines.length)throw new Error("Enter at least one playlist URL");
      let allVideos=[];
      const pls=[];
      for(const url of lines){
        const id=extractPlaylistId(url);
        if(!id)throw new Error("Invalid playlist URL: "+url);
        const vids=await fetchPlaylist(apiKey,id);
        pls.push({url,name:"Playlist",total:vids.length,done:0});
        allVideos=allVideos.concat(vids);
      }
      const newEntries=greedyGroup(allVideos,maxLen);
      updateStudy({entries:newEntries,completed:{},startDate,maxLen,apiKey,playlists:pls});
      setTab("today");
    }catch(e){setErr("Error: "+e.message);}
    setLoading(false);
  }

  // ── Completed helpers ──
  const markDone=(idx)=>updateStudy({completed:{...completed,[idx]:true}});
  const markUndone=(idx)=>{const c={...completed};delete c[idx];updateStudy({completed:c});};
  const isDone=(idx)=>!!completed[idx];

  // ── Schedule reorder (drag) ──
  const handleDragStart=(idx)=>setDragIdx(idx);
  const handleDragOver=(e,idx)=>{e.preventDefault();setDragOver(idx);};
  const handleDrop=(toIdx)=>{
    if(dragIdx===null||dragIdx===toIdx){setDragIdx(null);setDragOver(null);return;}
    const arr=[...entries];const[item]=arr.splice(dragIdx,1);arr.splice(toIdx,0,item);
    // Remap completed keys
    const oldComp={...completed};const newComp={};
    arr.forEach((e,newI)=>{const oldI=entries.indexOf(e);if(oldComp[oldI])newComp[newI]=true;});
    updateStudy({entries:arr,completed:newComp});
    setDragIdx(null);setDragOver(null);
  };

  // ── Add/remove videos from entry ──
  function addManualVideo(entryIdx){
    if(!manualUrl.trim()&&!manualTitle.trim())return;
    const dur=parseInt(manualDur)||0;
    const vid={title:manualTitle||manualUrl,url:manualUrl,dur};
    const arr=[...entries];arr[entryIdx]={...arr[entryIdx],videos:[...arr[entryIdx].videos,vid],total:arr[entryIdx].total+dur};
    updateStudy({entries:arr});setManualUrl("");setManualTitle("");setManualDur("");setShowAddVideo(null);
  }
  function removeVideo(entryIdx,vidIdx){
    const arr=[...entries];const e=arr[entryIdx];const vids=e.videos.filter((_,i)=>i!==vidIdx);
    arr[entryIdx]={...e,videos:vids,total:vids.reduce((s,v)=>s+v.dur,0)};
    if(vids.length===0)arr.splice(entryIdx,1);
    updateStudy({entries:arr});
  }
  function addNewEntry(){
    const arr=[...entries,{id:Date.now(),videos:[],total:0}];
    updateStudy({entries:arr});
  }
  function deleteEntry(idx){
    const arr=entries.filter((_,i)=>i!==idx);
    const newComp={};Object.keys(completed).forEach(k=>{const ki=parseInt(k);if(ki<idx)newComp[k]=completed[k];else if(ki>idx)newComp[ki-1]=completed[k];});
    updateStudy({entries:arr,completed:newComp});
  }

  // ── Stats ──
  const totalDone=Object.values(completed).filter(Boolean).length;
  const totalTime=Object.keys(completed).filter(k=>completed[k]).reduce((s,k)=>s+(entries[parseInt(k)]?.total||0),0);
  const streak=(()=>{let s=0;for(let i=totalDone-1;i>=0;i--){if(completed[i])s++;else break;}return s;})();

  // ── Today entry: first incomplete ──
  const todayIdx=entries.findIndex((_,i)=>!isDone(i));

  const pColor={done:"#34d399",pending:"#fbbf24",upcoming:"#475569"};

  return(
    <div>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:"4px",marginBottom:"14px",borderBottom:"1px solid #0f172a",paddingBottom:"10px",overflowX:"auto"}}>
        {[["today","Today"],["schedule","Schedule"],["progress","Progress"],["setup","⚙ Setup"]].map(([t,l])=>(
          <button key={t} className={`nav-btn${tab===t?" active":""}`} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {/* TODAY */}
      {tab==="today"&&<div>
        {entries.length===0?<div style={{textAlign:"center",color:"#334155",padding:"40px 0",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.82rem"}}>No study entries yet. Go to ⚙ Setup to load your playlists.</div>:<>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"14px"}}>
            {[["Streak",streak,"days"],["Done",totalDone,"entries"],["Time",fmtMin(totalTime),"total"],["Left",entries.length-totalDone,"entries"]].map(([l,v,s])=>(
              <div key={l} style={{background:"#07070d",border:"1px solid #111827",borderRadius:"8px",padding:"10px 12px"}}>
                <div style={{fontSize:"0.62rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"3px"}}>{l}</div>
                <div style={{fontSize:"1.4rem",fontWeight:600,color:"#f1f5f9",lineHeight:1}}>{v}</div>
                <div style={{fontSize:"0.62rem",color:"#334155"}}>{s}</div>
              </div>
            ))}
          </div>
          {todayIdx===-1?<div style={{background:"#07070d",border:"1px solid #1e3a2f",borderRadius:"10px",padding:"20px",textAlign:"center",color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.9rem"}}>🎉 All entries completed!</div>:<EntryCard entry={entries[todayIdx]} idx={todayIdx} done={isDone(todayIdx)} onDone={()=>markDone(todayIdx)} onUndone={()=>markUndone(todayIdx)} onAddVideo={()=>setShowAddVideo(todayIdx)} onRemoveVideo={(vi)=>removeVideo(todayIdx,vi)} showAddVideo={showAddVideo===todayIdx} manualUrl={manualUrl} setManualUrl={setManualUrl} manualTitle={manualTitle} setManualTitle={setManualTitle} manualDur={manualDur} setManualDur={setManualDur} onSaveVideo={()=>addManualVideo(todayIdx)} onCancelVideo={()=>setShowAddVideo(null)} label="Today's session"/>}
        </>}
      </div>}

      {/* SCHEDULE */}
      {tab==="schedule"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <div style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace"}}>Drag rows to reorder · click entry to expand</div>
          <button className="btn" onClick={addNewEntry} style={{background:"#818cf8",color:"#fff",padding:"5px 12px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.74rem"}}>+ New entry</button>
        </div>
        {entries.length===0?<div style={{textAlign:"center",color:"#334155",padding:"40px 0",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.82rem"}}>No entries. Load a playlist in Setup or add entries manually.</div>:
        entries.map((e,i)=>{
          const done=isDone(i);
          const isEditing=editingEntry===i;
          return<div key={e.id||i} draggable onDragStart={()=>handleDragStart(i)} onDragOver={(ev)=>handleDragOver(ev,i)} onDrop={()=>handleDrop(i)} onDragEnd={()=>{setDragIdx(null);setDragOver(null);}}
            style={{border:`1px solid ${dragOver===i?"#818cf8":"#111827"}`,borderRadius:"8px",marginBottom:"6px",background:done?"#050509":"#07070d",opacity:done?.7:1,transition:"border-color .15s",cursor:"grab"}}>
            <div style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:"10px"}} onClick={()=>setEditingEntry(isEditing?null:i)}>
              <span style={{fontSize:"0.62rem",color:"#293548",userSelect:"none"}}>⠿</span>
              <span style={{fontSize:"0.68rem",fontFamily:"'IBM Plex Mono',monospace",color:"#475569",minWidth:"50px"}}>Entry {i+1}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:"0.85rem",color:done?"#475569":"#f1f5f9",textDecoration:done?"line-through":"none"}}>{e.videos[0]?.title||"Empty entry"}{e.videos.length>1?` + ${e.videos.length-1} more`:""}</div>
                <div style={{fontSize:"0.65rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace"}}>{fmtMin(e.total)} · {e.videos.length} video{e.videos.length!==1?"s":""}</div>
              </div>
              <div style={{display:"flex",gap:"5px",alignItems:"center"}} onClick={ev=>ev.stopPropagation()}>
                {done?<button className="btn" onClick={()=>markUndone(i)} style={{background:"transparent",color:"#334155",fontSize:"0.68rem",padding:"3px 7px",borderRadius:"4px",border:"1px solid #1e293b"}}>Undo</button>
                      :<button className="btn" onClick={()=>markDone(i)} style={{background:"#1e3a2f",color:"#34d399",fontSize:"0.68rem",padding:"3px 7px",borderRadius:"4px",border:"1px solid #1e3a2f"}}>✓ Done</button>}
                <button className="btn" onClick={()=>deleteEntry(i)} style={{background:"transparent",color:"#374151",fontSize:"0.68rem",padding:"3px 7px",borderRadius:"4px",border:"1px solid #111827"}}>✕</button>
              </div>
              <span style={{color:"#293548",fontSize:"0.7rem"}}>{isEditing?"▲":"▼"}</span>
            </div>
            {isEditing&&<div style={{borderTop:"1px solid #0f172a",padding:"8px 12px"}}>
              {e.videos.map((v,vi)=><div key={vi} style={{display:"flex",alignItems:"center",gap:"8px",padding:"5px 0",borderTop:vi>0?"1px solid #0a0a14":"none"}}>
                <span style={{fontSize:"0.62rem",color:"#293548",minWidth:"16px",fontFamily:"'IBM Plex Mono',monospace"}}>{vi+1}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"0.83rem",color:"#cbd5e1"}}>{v.title}</div>
                  <div style={{fontSize:"0.65rem",color:"#185FA5",fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer"}} onClick={()=>window.open(v.url,"_blank")}>{v.url}</div>
                </div>
                <span style={{fontSize:"0.7rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>{fmtMin(v.dur)}</span>
                <button className="btn" onClick={()=>removeVideo(i,vi)} style={{background:"transparent",color:"#374151",fontSize:"0.68rem",padding:"2px 6px",borderRadius:"3px",border:"1px solid #111827"}}>✕</button>
              </div>)}
              {showAddVideo===i?<div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"8px",borderTop:"1px solid #0f172a",paddingTop:"8px"}}>
                <input className="inp" style={{flex:2,minWidth:"160px",fontSize:"0.8rem",padding:"5px 8px"}} placeholder="YouTube URL" value={manualUrl} onChange={e=>setManualUrl(e.target.value)}/>
                <input className="inp" style={{flex:2,minWidth:"140px",fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Title (optional)" value={manualTitle} onChange={e=>setManualTitle(e.target.value)}/>
                <input className="inp" style={{width:"80px",fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Min" type="number" value={manualDur} onChange={e=>setManualDur(e.target.value)}/>
                <button className="btn" onClick={()=>addManualVideo(i)} style={{background:"#818cf8",color:"#fff",padding:"5px 10px",borderRadius:"5px",fontSize:"0.75rem",whiteSpace:"nowrap"}}>Add</button>
                <button className="btn" onClick={()=>setShowAddVideo(null)} style={{background:"#1e293b",color:"#64748b",padding:"5px 7px",borderRadius:"5px",fontSize:"0.75rem"}}>✕</button>
              </div>:<button className="btn" onClick={()=>setShowAddVideo(i)} style={{marginTop:"8px",background:"transparent",color:"#293548",fontSize:"0.7rem",padding:"3px 9px",borderRadius:"4px",border:"1px dashed #1e293b",fontFamily:"'IBM Plex Mono',monospace"}} onMouseEnter={e=>{e.currentTarget.style.color="#818cf8";e.currentTarget.style.borderColor="#818cf8";}} onMouseLeave={e=>{e.currentTarget.style.color="#293548";e.currentTarget.style.borderColor="#1e293b";}}>+ add video</button>}
            </div>}
          </div>;
        })}
      </div>}

      {/* PROGRESS */}
      {tab==="progress"&&<div>
        <div style={{background:"#07070d",border:"1px solid #111827",borderRadius:"10px",padding:"14px",marginBottom:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <span style={{fontSize:"0.88rem",fontWeight:600,color:"#f1f5f9"}}>Overall</span>
            <span style={{fontSize:"0.88rem",fontWeight:600,color:"#818cf8"}}>{entries.length?Math.round(totalDone/entries.length*100):0}%</span>
          </div>
          <div style={{height:"7px",background:"#1e293b",borderRadius:"4px",overflow:"hidden",marginBottom:"6px"}}><div style={{height:"100%",background:"#818cf8",borderRadius:"4px",width:`${entries.length?Math.round(totalDone/entries.length*100):0}%`,transition:"width .4s"}}/></div>
          <div style={{fontSize:"0.7rem",color:"#475569"}}>{totalDone} of {entries.length} entries · {fmtMin(totalTime)} studied</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
          {[["Streak",streak+" days","#fbbf24"],["Completed",totalDone+" entries","#34d399"],["Remaining",(entries.length-totalDone)+" entries","#818cf8"]].map(([l,v,c])=>(
            <div key={l} style={{background:"#07070d",border:"1px solid #111827",borderRadius:"8px",padding:"12px"}}>
              <div style={{fontSize:"0.62rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px"}}>{l}</div>
              <div style={{fontSize:"1.1rem",fontWeight:600,color:c}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Calendar heatmap */}
        <div style={{marginTop:"14px",background:"#07070d",border:"1px solid #111827",borderRadius:"10px",padding:"14px"}}>
          <div style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"10px",letterSpacing:"0.06em"}}>COMPLETION HEATMAP</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"3px"}}>
            {entries.map((_,i)=>{
              const done=isDone(i);
              return<div key={i} title={`Entry ${i+1} · ${done?"Done":"Pending"}`} style={{width:"16px",height:"16px",borderRadius:"3px",background:done?"#34d399":i<(totalDone)?"#f87171":"#1e293b",opacity:done?1:.6,cursor:"default"}}/>;
            })}
          </div>
          <div style={{display:"flex",gap:"12px",marginTop:"8px"}}>
            {[["#34d399","Done"],["#1e293b","Pending"]].map(([c,l])=><div key={l} style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"0.64rem",color:"#475569"}}><div style={{width:"10px",height:"10px",borderRadius:"2px",background:c}}/>{l}</div>)}
          </div>
        </div>
      </div>}

      {/* SETUP */}
      {tab==="setup"&&<div style={{display:"grid",gap:"12px"}}>
        <div style={{background:"#07070d",border:"1px solid #111827",borderRadius:"10px",padding:"14px"}}>
          <div style={{fontSize:"0.72rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"10px",letterSpacing:"0.06em"}}>YOUTUBE API KEY</div>
          <input className="inp" type="password" placeholder="AIza…" value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
          <div style={{fontSize:"0.66rem",color:"#334155",marginTop:"5px"}}>Get a free key at <span style={{color:"#60a5fa",cursor:"pointer"}} onClick={()=>window.open("https://console.cloud.google.com","_blank")}>console.cloud.google.com</span> → APIs → YouTube Data API v3 → Credentials</div>
        </div>
        <div style={{background:"#07070d",border:"1px solid #111827",borderRadius:"10px",padding:"14px"}}>
          <div style={{fontSize:"0.72rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"10px",letterSpacing:"0.06em"}}>PLAYLIST URLs <span style={{color:"#334155",fontWeight:400}}>(one per line)</span></div>
          <textarea className="inp" rows={4} style={{resize:"vertical",fontSize:"0.83rem"}} placeholder={"https://youtube.com/playlist?list=PLxxx\nhttps://youtube.com/playlist?list=PLyyy"} value={plUrls} onChange={e=>setPlUrls(e.target.value)}/>
          <div style={{fontSize:"0.66rem",color:"#334155",marginTop:"5px"}}>Add as many public playlists as you want — all videos will be merged into the schedule.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          <div style={{background:"#07070d",border:"1px solid #111827",borderRadius:"10px",padding:"14px"}}>
            <div style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"8px"}}>MAX ENTRY LENGTH (min)</div>
            <select className="inp" value={maxLen} onChange={e=>setMaxLen(parseInt(e.target.value))}><option value="45">45 min</option><option value="60">60 min</option><option value="65">65 min</option><option value="75">75 min</option><option value="90">90 min</option></select>
          </div>
          <div style={{background:"#07070d",border:"1px solid #111827",borderRadius:"10px",padding:"14px"}}>
            <div style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"8px"}}>START DATE</div>
            <input type="date" className="inp" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
          </div>
        </div>
        {err&&<div style={{fontSize:"0.78rem",color:"#f87171",padding:"6px 10px",background:"#f8717111",borderRadius:"6px",border:"1px solid #f8717133"}}>{err}</div>}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <button className="btn" onClick={buildFromPlaylists} disabled={loading} style={{background:"#818cf8",color:"#fff",padding:"8px 18px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.8rem",fontWeight:600}}>{loading?"Fetching…":"Fetch & build schedule ↗"}</button>
          <button className="btn" onClick={()=>{if(confirm("Reset all study progress?"))updateStudy({entries:[],completed:{},playlists:[]});}} style={{background:"transparent",color:"#f87171",border:"1px solid #f8717133",padding:"8px 14px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.8rem"}}>Reset all</button>
        </div>
        {/* Manual add single video */}
        <div style={{background:"#07070d",border:"1px solid #111827",borderRadius:"10px",padding:"14px"}}>
          <div style={{fontSize:"0.72rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"10px",letterSpacing:"0.06em"}}>ADD A SINGLE VIDEO MANUALLY</div>
          <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
            <input className="inp" style={{flex:2,minWidth:"160px",fontSize:"0.82rem",padding:"6px 9px"}} placeholder="YouTube URL" value={manualUrl} onChange={e=>setManualUrl(e.target.value)}/>
            <input className="inp" style={{flex:2,minWidth:"140px",fontSize:"0.82rem",padding:"6px 9px"}} placeholder="Title" value={manualTitle} onChange={e=>setManualTitle(e.target.value)}/>
            <input className="inp" style={{width:"80px",fontSize:"0.82rem",padding:"6px 9px"}} placeholder="Min" type="number" value={manualDur} onChange={e=>setManualDur(e.target.value)}/>
            <button className="btn" onClick={()=>{if(!manualUrl.trim()&&!manualTitle.trim())return;const dur=parseInt(manualDur)||0;const vid={title:manualTitle||manualUrl,url:manualUrl,dur};const arr=[...entries,{id:Date.now(),videos:[vid],total:dur}];updateStudy({entries:arr});setManualUrl("");setManualTitle("");setManualDur("");}} style={{background:"#818cf8",color:"#fff",padding:"6px 12px",borderRadius:"5px",fontSize:"0.78rem",whiteSpace:"nowrap"}}>Add as new entry</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

function EntryCard({entry,idx,done,onDone,onUndone,onAddVideo,onRemoveVideo,showAddVideo,manualUrl,setManualUrl,manualTitle,setManualTitle,manualDur,setManualDur,onSaveVideo,onCancelVideo,label}){
  const pct=Math.min(100,Math.round((entry.total/65)*100));
  return<div style={{background:"#07070d",border:`1px solid ${done?"#1e3a2f":"#1e293b"}`,borderRadius:"10px",overflow:"hidden"}}>
    <div style={{padding:"12px 14px",borderBottom:"1px solid #0f172a"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
        <div><span style={{fontSize:"0.72rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace"}}>{label||`Entry ${idx+1}`}</span></div>
        <span style={{fontSize:"0.72rem",padding:"2px 9px",borderRadius:"4px",background:done?"#1e3a2f":"#1e2d1a",color:done?"#34d399":"#fbbf24",fontFamily:"'IBM Plex Mono',monospace"}}>{done?"✓ Done":"Pending"}</span>
      </div>
      <div style={{fontSize:"0.7rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace"}}>{entry.videos.length} video{entry.videos.length!==1?"s":""} · {fmtMin(entry.total)}</div>
    </div>
    {entry.videos.map((v,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 14px",borderTop:"1px solid #0a0a14"}}>
      <span style={{fontSize:"0.62rem",color:"#293548",minWidth:"16px",fontFamily:"'IBM Plex Mono',monospace",paddingTop:"2px"}}>{i+1}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:"0.85rem",color:"#cbd5e1",marginBottom:"2px"}}>{v.title}</div>
        <div style={{fontSize:"0.68rem",color:"#185FA5",fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer",wordBreak:"break-all"}} onClick={()=>window.open(v.url,"_blank")}>{v.url}</div>
      </div>
      <span style={{fontSize:"0.72rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>{fmtMin(v.dur)}</span>
      <button className="btn" onClick={()=>onRemoveVideo(i)} style={{background:"transparent",color:"#293548",fontSize:"0.66rem",padding:"2px 5px",border:"1px solid #111827",borderRadius:"3px"}}>✕</button>
    </div>)}
    {showAddVideo&&<div style={{padding:"8px 14px",borderTop:"1px solid #0f172a",display:"flex",gap:"6px",flexWrap:"wrap"}}>
      <input className="inp" style={{flex:2,minWidth:"160px",fontSize:"0.8rem",padding:"5px 8px"}} placeholder="YouTube URL" value={manualUrl} onChange={e=>setManualUrl(e.target.value)}/>
      <input className="inp" style={{flex:2,minWidth:"130px",fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Title (optional)" value={manualTitle} onChange={e=>setManualTitle(e.target.value)}/>
      <input className="inp" style={{width:"76px",fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Min" type="number" value={manualDur} onChange={e=>setManualDur(e.target.value)}/>
      <button className="btn" onClick={onSaveVideo} style={{background:"#818cf8",color:"#fff",padding:"5px 10px",borderRadius:"5px",fontSize:"0.75rem",whiteSpace:"nowrap"}}>Add</button>
      <button className="btn" onClick={onCancelVideo} style={{background:"#1e293b",color:"#64748b",padding:"5px 7px",borderRadius:"5px",fontSize:"0.75rem"}}>✕</button>
    </div>}
    <div style={{padding:"10px 14px",borderTop:"1px solid #0f172a",display:"flex",alignItems:"center",gap:"10px"}}>
      <span style={{fontSize:"0.8rem",fontWeight:500,color:"#f1f5f9",whiteSpace:"nowrap"}}>{fmtMin(entry.total)}</span>
      <div style={{flex:1,height:"5px",background:"#1e293b",borderRadius:"3px",overflow:"hidden"}}><div style={{height:"100%",background:entry.total>65?"#fbbf24":"#34d399",width:`${pct}%`,borderRadius:"3px",transition:"width .3s"}}/></div>
      <button className="btn" onClick={onAddVideo} style={{background:"transparent",color:"#475569",fontSize:"0.72rem",padding:"3px 8px",border:"1px solid #1e293b",borderRadius:"4px",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>+ video</button>
      {done?<button className="btn" onClick={onUndone} style={{background:"transparent",color:"#475569",fontSize:"0.72rem",padding:"4px 10px",border:"1px solid #1e293b",borderRadius:"5px"}}>Undo</button>
           :<button className="btn" onClick={onDone} style={{background:"#1e3a2f",color:"#34d399",fontSize:"0.72rem",padding:"4px 10px",border:"1px solid #1e3a2f",borderRadius:"5px"}}>Mark done</button>}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TODAY DASHBOARD (main section)
// ═══════════════════════════════════════════════════════════════════════════════
function TodayDashboard({agendas,setAgendas,study,setStudy}){
  // Agenda tasks due today or overdue and not done
  const pendingTasks=[];
  (agendas||[]).forEach(ag=>{
    const agDone=ag.tasks?.length>0&&ag.tasks.every(t=>t.done);
    if(agDone)return;
    (ag.tasks||[]).forEach(task=>{
      if(task.done)return;
      const days=getDaysLeft(task.deadline);
      if(!task.deadline||(days!==null&&days<=0)){
        pendingTasks.push({agendaTitle:ag.title,agendaId:ag.id,task,days});
      }
    });
    // Also show agenda itself if deadline is today/overdue and no specific tasks
    if(ag.tasks?.length===0&&ag.deadline){
      const days=getDaysLeft(ag.deadline);
      if(days!==null&&days<=0)pendingTasks.push({agendaTitle:ag.title,agendaId:ag.id,task:{title:"(Agenda deadline)",id:"ag-"+ag.id,done:false,deadline:ag.deadline},days,isAgenda:true});
    }
  });

  // Today's study entry
  const entries=study?.entries||[];
  const completed=study?.completed||{};
  const todayStudyIdx=entries.findIndex((_,i)=>!completed[i]);
  const todayStudyEntry=todayStudyIdx>=0?entries[todayStudyIdx]:null;

  const markStudyDone=()=>setStudy(s=>({...s,completed:{...s.completed,[todayStudyIdx]:true}}));
  const markStudyUndone=()=>setStudy(s=>{const c={...s.completed};delete c[todayStudyIdx];return{...s,completed:c};});

  const toggleAgendaTask=(agendaId,taskId)=>setAgendas(a=>a.map(ag=>ag.id===agendaId?{...ag,tasks:ag.tasks.map(t=>t.id===taskId?{...t,done:!t.done}:t)}:ag));

  const todayStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  return<div>
    <div style={{marginBottom:"16px"}}>
      <div style={{fontSize:"0.68rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px",letterSpacing:"0.06em"}}>TODAY</div>
      <div style={{fontSize:"1.1rem",fontWeight:600,color:"#f1f5f9"}}>{todayStr}</div>
    </div>

    {/* Pending agenda tasks */}
    <div style={{marginBottom:"16px"}}>
      <div style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"8px",letterSpacing:"0.06em",display:"flex",justifyContent:"space-between"}}>
        <span>PENDING TASKS</span>
        <span style={{color:"#334155"}}>{pendingTasks.filter(p=>!p.task.done).length} remaining</span>
      </div>
      {pendingTasks.length===0?<div style={{background:"#07070d",border:"1px solid #1e3a2f",borderRadius:"8px",padding:"14px",textAlign:"center",color:"#34d399",fontSize:"0.8rem",fontFamily:"'IBM Plex Mono',monospace"}}>✓ No pending tasks for today</div>:
      pendingTasks.map((p,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:"9px",padding:"8px 12px",background:"#07070d",border:`1px solid ${p.days!==null&&p.days<0?"#f8717122":"#111827"}`,borderRadius:"8px",marginBottom:"5px"}}>
        <div onClick={()=>!p.isAgenda&&toggleAgendaTask(p.agendaId,p.task.id)} style={{width:"16px",height:"16px",borderRadius:"4px",marginTop:"2px",flexShrink:0,border:`1.5px solid ${p.task.done?"#334155":"#293548"}`,background:p.task.done?"#334155":"transparent",cursor:p.isAgenda?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {p.task.done&&<span style={{color:"#64748b",fontSize:"0.55rem"}}>✓</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:"0.85rem",color:p.task.done?"#475569":"#f1f5f9",textDecoration:p.task.done?"line-through":"none"}}>{p.task.title}</div>
          <div style={{fontSize:"0.65rem",color:"#475569",marginTop:"2px"}}>{p.agendaTitle}</div>
        </div>
        {p.task.deadline&&<DeadlineBadge dateStr={p.task.deadline} done={p.task.done} sm/>}
      </div>)}
    </div>

    {/* Today's study */}
    <div>
      <div style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"8px",letterSpacing:"0.06em"}}>TODAY'S STUDY SESSION</div>
      {!todayStudyEntry?<div style={{background:"#07070d",border:"1px solid #111827",borderRadius:"8px",padding:"14px",color:"#334155",fontSize:"0.8rem",fontFamily:"'IBM Plex Mono',monospace",textAlign:"center"}}>
        {entries.length===0?"No study plan yet — go to Study Tracker → ⚙ Setup":"🎉 All study entries completed!"}
      </div>:<EntryCard entry={todayStudyEntry} idx={todayStudyIdx} done={!!completed[todayStudyIdx]} onDone={markStudyDone} onUndone={markStudyUndone} onAddVideo={()=>{}} onRemoveVideo={()=>{}} showAddVideo={false} manualUrl="" setManualUrl={()=>{}} manualTitle="" setManualTitle={()=>{}} manualDur="" setManualDur={()=>{}} onSaveVideo={()=>{}} onCancelVideo={()=>{}} label={`Study entry ${todayStudyIdx+1}`}/>}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [user,setUser]=useState(undefined);
  const [authLoading,setAuthLoading]=useState(false);
  const [agendas,setAgendas]=useState([]);
  const [categories,setCategories]=useState([]);
  const [study,setStudy]=useState({entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});
  const [loaded,setLoaded]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [lastSaved,setLastSaved]=useState(null);
  const [tab,setTab]=useState("today"); // today | agendas | study
  const saveTimer=useRef();

  useEffect(()=>{
    const unsub=onAuthChange(async(u)=>{
      setUser(u);
      if(u){
        const data=await loadUserData(u.uid);
        if(data){
          setAgendas(data.agendas||[]);
          setCategories(data.categories||[]);
          setStudy(data.study||{entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});
        }
        setLoaded(true);
      }else{setLoaded(false);setAgendas([]);setCategories([]);setStudy({entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});}
    });
    return unsub;
  },[]);

  const persist=useCallback((ag,cats,st)=>{
    if(!user)return;
    clearTimeout(saveTimer.current);
    setSyncing(true);
    saveTimer.current=setTimeout(async()=>{
      try{await saveUserData(user.uid,{agendas:ag,categories:cats,study:st});setLastSaved(new Date());}catch(e){console.error(e);}
      setSyncing(false);
    },1500);
  },[user]);

  useEffect(()=>{if(loaded)persist(agendas,categories,study);},[agendas,categories,study,loaded]);

  const handleSignIn=async()=>{setAuthLoading(true);try{await signInWithGoogle();}catch(e){console.error(e);}setAuthLoading(false);};
  const handleSignOut=async()=>{await signOutUser();setAgendas([]);setCategories([]);setStudy({entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});setLoaded(false);};

  if(user===undefined)return<div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:"30px",height:"30px",borderRadius:"50%",border:"2px solid #1e293b",borderTopColor:"#818cf8",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if(!user)return<SignInScreen onSignIn={handleSignIn} loading={authLoading}/>;

  const totalPending=(()=>{let n=0;(agendas||[]).forEach(ag=>{(ag.tasks||[]).forEach(t=>{if(!t.done&&t.deadline&&getDaysLeft(t.deadline)<=0)n++;});});return n;})();
  const studyDoneToday=!!(study.completed&&Object.keys(study.completed).some(k=>!!study.completed[k]&&study.entries[parseInt(k)]));

  return<div style={{minHeight:"100vh",background:"#0a0a0f",color:"#e2e8f0",fontFamily:"'IBM Plex Sans',sans-serif"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}::placeholder{color:#4b5563}input,select,textarea{outline:none}
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#111}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
      .btn{cursor:pointer;border:none;transition:all .15s}.btn:hover{opacity:.8}
      .fb{cursor:pointer;border:1px solid #1e293b;background:transparent;color:#64748b;padding:4px 12px;border-radius:20px;font-size:.78rem;font-family:'IBM Plex Mono',monospace;transition:all .15s}
      .fb:hover{border-color:#334155;color:#94a3b8}.fb.act{background:#1e293b;color:#e2e8f0;border-color:#334155}
      .inp{background:#0f172a;border:1px solid #1e293b;border-radius:6px;color:#e2e8f0;padding:8px 12px;font-family:'IBM Plex Sans',sans-serif;font-size:.9rem;transition:border-color .15s;width:100%}
      .inp:focus{border-color:#334155}
      input[type="date"]::-webkit-calendar-picker-indicator,input[type="time"]::-webkit-calendar-picker-indicator{filter:invert(.4);cursor:pointer}
      .agenda-card{border:1px solid #111827;border-radius:10px;margin-bottom:8px;overflow:hidden;transition:border-color .2s}
      .agenda-card:hover{border-color:#1e293b}
      .cal-btn{display:inline-flex;align-items:center;gap:5px;cursor:pointer;background:transparent;border:1px solid #1a3328;color:#34d399;font-size:.67rem;padding:3px 7px;border-radius:4px;font-family:'IBM Plex Mono',monospace;transition:all .15s;white-space:nowrap}
      .cal-btn:hover{background:#1a332844}
      .nav-btn{font-size:0.78rem;padding:5px 13px;border-radius:6px;border:none;background:transparent;color:#64748b;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:all .15s;white-space:nowrap}
      .nav-btn.active{background:#1e293b;color:#e2e8f0}
      @keyframes spin{to{transform:rotate(360deg)}}@keyframes fadein{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
    `}</style>

    {/* ── Header ── */}
    <div style={{borderBottom:"1px solid #0f172a",padding:"11px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#05050a",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <AppIcon size={32}/>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.05rem",fontWeight:800,letterSpacing:"-0.5px",color:"#f8fafc",lineHeight:1}}>AGENDA<span style={{color:"#818cf8"}}>BOARD</span></div>
          <div style={{fontSize:"0.58rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace",marginTop:"1px"}}>
            {syncing?<span style={{color:"#818cf855"}}>⟳ saving</span>:lastSaved?<span style={{color:"#1e3a2f"}}>✓ synced</span>:<span>cloud ready</span>}
          </div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        {/* Main tab nav */}
        <div style={{display:"flex",gap:"3px",background:"#07070d",border:"1px solid #1e293b",borderRadius:"8px",padding:"3px"}}>
          {[["today","Today"+(totalPending>0?` (${totalPending})`:"")],["agendas","Agendas"],["study","Study"]].map(([t,l])=>(
            <button key={t} className={`nav-btn${tab===t?" active":""}`} onClick={()=>setTab(t)} style={{fontSize:"0.72rem",padding:"4px 10px"}}>{l}</button>
          ))}
        </div>
        {user.photoURL?<img src={user.photoURL} alt="" style={{width:"26px",height:"26px",borderRadius:"50%",border:"1px solid #1e293b",flexShrink:0}}/>
          :<div style={{width:"26px",height:"26px",borderRadius:"50%",background:"#1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",color:"#818cf8",flexShrink:0}}>{user.displayName?.[0]||"?"}</div>}
        <button className="btn" onClick={handleSignOut} style={{background:"transparent",color:"#334155",border:"1px solid #1e293b",padding:"3px 8px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.63rem"}}>out</button>
      </div>
    </div>

    {/* ── Content ── */}
    <div style={{padding:"16px 20px",maxWidth:"820px"}}>
      {tab==="today"&&<TodayDashboard agendas={agendas} setAgendas={setAgendas} study={study} setStudy={setStudy}/>}
      {tab==="agendas"&&<AgendaSection agendas={agendas} setAgendas={setAgendas} categories={categories} setCategories={setCategories}/>}
      {tab==="study"&&<StudySection study={study} setStudy={setStudy}/>}
    </div>

    <div style={{padding:"4px 34px 24px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",color:"#1e293b"}}>
      {agendas.length} agendas · {(study.entries||[]).length} study entries · {user.displayName||user.email}
    </div>
  </div>;
}
