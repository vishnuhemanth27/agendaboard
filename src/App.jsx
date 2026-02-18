import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInWithGoogle, signOutUser, onAuthChange,
  loadUserData, saveUserData
} from "./firebase.js";

const PRIORITIES = ["High", "Medium", "Low"];

function strToColor(str) {
  const palette = ["#818cf8","#34d399","#f472b6","#60a5fa","#a78bfa","#fb923c","#f87171","#4ade80","#fbbf24","#38bdf8","#e879f9","#94a3b8"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((new Date(dateStr + "T00:00:00") - today) / 86400000);
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function DeadlineBadge({ dateStr, done, small }) {
  const days = getDaysLeft(dateStr);
  if (days === null) return null;
  let color="#4ade80", label=`${days}d left`;
  if (done)       { color="#6b7280"; label=formatDate(dateStr); }
  else if(days<0) { color="#f87171"; label=`${Math.abs(days)}d overdue`; }
  else if(days===0){ color="#fbbf24"; label="Due today"; }
  else if(days<=3) { color="#fb923c"; label=`${days}d left`; }
  return <span style={{fontSize:small?"0.65rem":"0.7rem",fontFamily:"'IBM Plex Mono',monospace",background:color+"22",color,border:`1px solid ${color}55`,borderRadius:"4px",padding:small?"1px 5px":"2px 7px",whiteSpace:"nowrap"}}>{label}</span>;
}
function addHour(t){const[h,m]=(t||"09:00").split(":").map(Number);return`${String((h+1)%24).padStart(2,"0")}:${String(m).padStart(2,"0")}`;}
function buildGCalURL(title,deadline,time,notes,priority){
  if(!deadline)return null;
  const ts=(time||"09:00").replace(":",""),te=addHour(time||"09:00").replace(":",""),d=deadline.replace(/-/g,"");
  const det=encodeURIComponent(`Priority: ${priority||""}${notes?"\nNotes: "+notes:""}\n\nCreated from AgendaBoard`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("📋 "+title)}&dates=${d}T${ts}00/${d}T${te}00&details=${det}&ctz=Asia/Calcutta`;
}
function ProgressRing({pct,size=38,stroke=3,color="#818cf8"}){
  const r=(size-stroke*2)/2,circ=2*Math.PI*r;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}><circle cx={size/2} cy={size/2} r={r} stroke="#1e293b" strokeWidth={stroke} fill="none"/><circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.4s ease"}}/></svg>;
}

// ── App Icon SVG ──────────────────────────────────────────────
function AppIcon({size=36}){
  return(
    <div style={{width:size,height:size,borderRadius:size*0.25,background:"linear-gradient(135deg,#1e1b4b,#0f172a)",border:"1px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 12px #818cf818"}}>
      <svg width={size*0.54} height={size*0.54} viewBox="0 0 44 44" fill="none">
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
  );
}

// ── Sign-In Screen ────────────────────────────────────────────
function SignInScreen({onSignIn,loading}){
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Sans',sans-serif",padding:"24px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 #818cf833}50%{box-shadow:0 0 0 16px #818cf800}}`}</style>
      <div style={{marginBottom:"32px",animation:"pulse 3s ease-in-out infinite"}}><AppIcon size={72}/></div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:"2.2rem",fontWeight:800,letterSpacing:"-1px",color:"#f8fafc",marginBottom:"8px"}}>AGENDA<span style={{color:"#818cf8"}}>BOARD</span></div>
      <div style={{fontSize:"0.88rem",color:"#475569",marginBottom:"12px",textAlign:"center",lineHeight:1.7}}>Your personal agenda &amp; task tracker</div>
      <div style={{display:"flex",gap:"20px",marginBottom:"48px"}}>
        {["✓ Sync across devices","✓ Google Calendar","✓ Free forever"].map(f=>(
          <span key={f} style={{fontSize:"0.72rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace"}}>{f}</span>
        ))}
      </div>
      <button onClick={onSignIn} disabled={loading}
        style={{display:"flex",alignItems:"center",gap:"12px",background:"#fff",color:"#1f2937",border:"none",borderRadius:"12px",padding:"14px 28px",fontSize:"0.97rem",fontWeight:600,cursor:loading?"wait":"pointer",boxShadow:"0 4px 32px #00000044",transition:"transform .15s,box-shadow .15s",transform:"scale(1)"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <svg width="22" height="22" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1L6 34.2C9.3 39.8 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C41.1 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
        {loading?"Signing in…":"Continue with Google"}
      </button>
      <div style={{marginTop:"36px",fontSize:"0.7rem",color:"#1e293b",fontFamily:"'IBM Plex Mono',monospace",textAlign:"center",lineHeight:1.8}}>
        Your data is stored securely in your personal cloud<br/>and is only visible to you
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
const blankAgenda=(cats)=>({title:"",category:cats[0]||"",priority:"Medium",deadline:"",time:"09:00",reminderMins:"30",notes:""});
const blankTask=()=>({title:"",deadline:""});

export default function App(){
  const [user,setUser]=useState(undefined);
  const [authLoading,setAuthLoading]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [lastSaved,setLastSaved]=useState(null);
  const [agendas,setAgendas]=useState([]);
  const [categories,setCategories]=useState([]);
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [newCat,setNewCat]=useState("");
  const [showManage,setShowManage]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [showAgendaForm,setShowAgendaForm]=useState(false);
  const [editAgendaId,setEditAgendaId]=useState(null);
  const [agendaForm,setAgendaForm]=useState(blankAgenda([]));
  const [showInlineCat,setShowInlineCat]=useState(false);
  const [inlineCatVal,setInlineCatVal]=useState("");
  const [addingTaskFor,setAddingTaskFor]=useState(null);
  const [taskForm,setTaskForm]=useState(blankTask());
  const [editTaskRef,setEditTaskRef]=useState(null);
  const [expanded,setExpanded]=useState({});
  const [calStatus,setCalStatus]=useState({});
  const agendaTitleRef=useRef(),inlineCatRef=useRef(),taskInputRef=useRef(),saveTimer=useRef();

  useEffect(()=>{
    const unsub=onAuthChange(async(u)=>{
      setUser(u);
      if(u){
        const data=await loadUserData(u.uid);
        if(data){const cats=data.categories||[];setAgendas(data.agendas||[]);setCategories(cats);setAgendaForm(blankAgenda(cats));}
        setLoaded(true);
      }else{setLoaded(false);setAgendas([]);setCategories([]);}
    });
    return unsub;
  },[]);

  const persist=useCallback((ag,cats)=>{
    if(!user)return;
    clearTimeout(saveTimer.current);
    setSyncing(true);
    saveTimer.current=setTimeout(async()=>{
      try{await saveUserData(user.uid,{agendas:ag,categories:cats});setLastSaved(new Date());}catch(e){console.error(e);}
      setSyncing(false);
    },1500);
  },[user]);

  useEffect(()=>{if(loaded)persist(agendas,categories);},[agendas,categories,loaded]);

  const handleSignIn=async()=>{setAuthLoading(true);try{await signInWithGoogle();}catch(e){console.error(e);}setAuthLoading(false);};
  const handleSignOut=async()=>{await signOutUser();setAgendas([]);setCategories([]);setLoaded(false);};

  const addCategory=(name,source)=>{
    const n=(name||newCat).trim();
    if(!n||categories.map(c=>c.toLowerCase()).includes(n.toLowerCase())){setNewCat("");setInlineCatVal("");if(source==="inline")setShowInlineCat(false);return;}
    const updated=[...categories,n];setCategories(updated);setAgendaForm(f=>({...f,category:n}));
    setNewCat("");setInlineCatVal("");if(source==="inline")setShowInlineCat(false);
  };
  const deleteCategory=(cat)=>{
    const updated=categories.filter(c=>c!==cat);setCategories(updated);
    setAgendas(a=>a.map(x=>x.category===cat?{...x,category:updated[0]||""}:x));
    if(filter===cat)setFilter("All");
  };

  const saveAgenda=()=>{
    if(!agendaForm.title.trim())return;
    if(editAgendaId){setAgendas(a=>a.map(x=>x.id===editAgendaId?{...x,...agendaForm}:x));setEditAgendaId(null);}
    else{const id=Date.now();setAgendas(a=>[...a,{...agendaForm,id,tasks:[],createdAt:new Date().toISOString()}]);setExpanded(e=>({...e,[id]:true}));}
    setAgendaForm(blankAgenda(categories));setShowAgendaForm(false);
  };
  const deleteAgenda=(id)=>setAgendas(a=>a.filter(x=>x.id!==id));
  const startEditAgenda=(ag)=>{
    setAgendaForm({title:ag.title,category:ag.category||"",priority:ag.priority,deadline:ag.deadline||"",time:ag.time||"09:00",reminderMins:ag.reminderMins||"30",notes:ag.notes||""});
    setEditAgendaId(ag.id);setShowAgendaForm(true);setShowManage(false);setTimeout(()=>agendaTitleRef.current?.focus(),50);
  };
  const cancelAgendaForm=()=>{setAgendaForm(blankAgenda(categories));setEditAgendaId(null);setShowAgendaForm(false);};

  const openAddTask=(agendaId)=>{setAddingTaskFor(agendaId);setEditTaskRef(null);setTaskForm(blankTask());setTimeout(()=>taskInputRef.current?.focus(),50);};
  const openEditTask=(agendaId,task)=>{setAddingTaskFor(agendaId);setEditTaskRef({agendaId,taskId:task.id});setTaskForm({title:task.title,deadline:task.deadline||""});setTimeout(()=>taskInputRef.current?.focus(),50);};
  const saveTask=()=>{
    if(!taskForm.title.trim()){setAddingTaskFor(null);setEditTaskRef(null);return;}
    if(editTaskRef){setAgendas(a=>a.map(ag=>ag.id===editTaskRef.agendaId?{...ag,tasks:ag.tasks.map(t=>t.id===editTaskRef.taskId?{...t,...taskForm}:t)}:ag));setEditTaskRef(null);}
    else{setAgendas(a=>a.map(ag=>ag.id===addingTaskFor?{...ag,tasks:[...(ag.tasks||[]),{...taskForm,id:Date.now(),done:false}]}:ag));}
    setTaskForm(blankTask());setAddingTaskFor(null);
  };
  const toggleTask=(agendaId,taskId)=>setAgendas(a=>a.map(ag=>ag.id===agendaId?{...ag,tasks:ag.tasks.map(t=>t.id===taskId?{...t,done:!t.done}:t)}:ag));
  const deleteTask=(agendaId,taskId)=>setAgendas(a=>a.map(ag=>ag.id===agendaId?{...ag,tasks:ag.tasks.filter(t=>t.id!==taskId)}:ag));

  const addToCalendar=(ag)=>{
    const url=buildGCalURL(ag.title,ag.deadline,ag.time,ag.notes,ag.priority);
    if(url){window.open(url,"_blank");setCalStatus(s=>({...s,[ag.id]:{state:"ok"}}));setTimeout(()=>setCalStatus(s=>{const n={...s};delete n[ag.id];return n;}),4000);}
    else{setCalStatus(s=>({...s,[ag.id]:{state:"err"}}));setTimeout(()=>setCalStatus(s=>{const n={...s};delete n[ag.id];return n;}),3000);}
  };

  const agendaProgress=(ag)=>{const t=ag.tasks||[];return t.length?Math.round(t.filter(x=>x.done).length/t.length*100):null;};
  const isAgendaDone=(ag)=>{const t=ag.tasks||[];return t.length>0&&t.every(x=>x.done);};

  const sorted=[...agendas]
    .filter(ag=>{
      const done=isAgendaDone(ag);
      const mf=filter==="All"||(filter==="Active"&&!done)||(filter==="Done"&&done)||ag.category===filter;
      const ms=!search||ag.title.toLowerCase().includes(search.toLowerCase())||(ag.notes||"").toLowerCase().includes(search.toLowerCase())||(ag.tasks||[]).some(t=>t.title.toLowerCase().includes(search.toLowerCase()));
      return mf&&ms;
    })
    .sort((a,b)=>{
      const da=isAgendaDone(a),db=isAgendaDone(b);if(da!==db)return da?1:-1;
      const pd=PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority);if(pd)return pd;
      if(a.deadline&&b.deadline)return a.deadline.localeCompare(b.deadline);
      return a.deadline?-1:b.deadline?1:0;
    });

  const totalActive=agendas.filter(ag=>!isAgendaDone(ag)).length;
  const totalOverdue=agendas.filter(ag=>!isAgendaDone(ag)&&ag.deadline&&getDaysLeft(ag.deadline)<0).length;
  const totalDueToday=agendas.filter(ag=>!isAgendaDone(ag)&&ag.deadline&&getDaysLeft(ag.deadline)===0).length;
  const pColor={High:"#f87171",Medium:"#fbbf24",Low:"#4ade80"};

  if(user===undefined)return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"32px",height:"32px",borderRadius:"50%",border:"2px solid #1e293b",borderTopColor:"#818cf8",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if(!user)return <SignInScreen onSignIn={handleSignIn} loading={authLoading}/>;

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#e2e8f0",fontFamily:"'IBM Plex Sans',sans-serif"}}>
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
        .delx{background:transparent;border:none;cursor:pointer;font-size:.65rem;margin-left:5px;opacity:.4;transition:opacity .15s;color:inherit}.delx:hover{opacity:1}
        .agenda-card{border:1px solid #111827;border-radius:10px;margin-bottom:10px;overflow:hidden;transition:border-color .2s}
        .agenda-card:hover{border-color:#1e293b}
        .task-row{display:flex;align-items:flex-start;gap:10px;padding:7px 12px;border-radius:6px;transition:background .12s}
        .task-row:hover{background:#ffffff06}
        .cal-btn{display:inline-flex;align-items:center;gap:5px;cursor:pointer;background:transparent;border:1px solid #1a3328;color:#34d399;font-size:.68rem;padding:3px 8px;border-radius:4px;font-family:'IBM Plex Mono',monospace;transition:all .15s;white-space:nowrap}
        .cal-btn:hover{background:#1a332844;border-color:#34d39966}
        @keyframes spin{to{transform:rotate(360deg)}}@keyframes fadein{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Header */}
      <div style={{borderBottom:"1px solid #0f172a",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#05050a",gap:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <AppIcon size={34}/>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800,letterSpacing:"-0.5px",color:"#f8fafc",lineHeight:1}}>AGENDA<span style={{color:"#818cf8"}}>BOARD</span></div>
            <div style={{fontSize:"0.62rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace",marginTop:"2px"}}>
              {totalActive} active{totalOverdue>0&&<> · <span style={{color:"#f87171"}}>{totalOverdue} overdue</span></>}{totalDueToday>0&&<> · <span style={{color:"#fbbf24"}}>{totalDueToday} today</span></>}
              {" · "}{syncing?<span style={{color:"#818cf855"}}>⟳ saving</span>:lastSaved?<span style={{color:"#1e3a2f"}}>✓ synced</span>:<span style={{color:"#1e293b"}}>cloud ready</span>}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <button className="btn" onClick={()=>{setShowAgendaForm(s=>!s);setShowManage(false);setEditAgendaId(null);setAgendaForm(blankAgenda(categories));setTimeout(()=>agendaTitleRef.current?.focus(),60);}}
            style={{background:showAgendaForm?"#1e293b":"#818cf8",color:showAgendaForm?"#94a3b8":"#fff",padding:"7px 13px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.76rem",fontWeight:600,whiteSpace:"nowrap"}}>
            {showAgendaForm?"✕":"+ New Agenda"}
          </button>
          {user.photoURL
            ?<img src={user.photoURL} alt="" style={{width:"28px",height:"28px",borderRadius:"50%",border:"1px solid #1e293b",flexShrink:0}}/>
            :<div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#1e293b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",color:"#818cf8",flexShrink:0}}>{user.displayName?.[0]||"?"}</div>
          }
          <button className="btn" onClick={handleSignOut}
            style={{background:"transparent",color:"#334155",border:"1px solid #1e293b",padding:"4px 8px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.65rem",whiteSpace:"nowrap"}}>
            sign out
          </button>
        </div>
      </div>

      {/* Agenda Form */}
      {showAgendaForm&&(
        <div style={{background:"#07070d",borderBottom:"1px solid #0f172a",padding:"16px 20px",animation:"fadein .2s ease"}}>
          <div style={{maxWidth:"680px",display:"grid",gap:"11px"}}>
            <input ref={agendaTitleRef} className="inp" style={{fontSize:"1rem"}} placeholder="Agenda title…" value={agendaForm.title}
              onChange={e=>setAgendaForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveAgenda()}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              <div style={{display:"flex",gap:"6px"}}>
                <select className="inp" style={{flex:1,minWidth:0}} value={agendaForm.category} onChange={e=>setAgendaForm(f=>({...f,category:e.target.value}))}>
                  {categories.length===0&&<option value="">No categories</option>}
                  {categories.map(c=><option key={c}>{c}</option>)}
                </select>
                <button className="btn" onClick={()=>{setShowInlineCat(s=>!s);setTimeout(()=>inlineCatRef.current?.focus(),50);}}
                  style={{background:showInlineCat?"#334155":"#1e293b",color:"#818cf8",border:"1px solid #1e293b",borderRadius:"6px",padding:"0 11px",fontSize:"1.1rem",fontWeight:700,flexShrink:0}}>+</button>
              </div>
              <select className="inp" value={agendaForm.priority} onChange={e=>setAgendaForm(f=>({...f,priority:e.target.value}))}>
                {PRIORITIES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            {showInlineCat&&(
              <div style={{display:"flex",gap:"7px",alignItems:"center",background:"#0c1220",border:"1px solid #1e293b",borderRadius:"7px",padding:"8px 12px"}}>
                <span style={{fontSize:"0.68rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>NEW CATEGORY</span>
                <input ref={inlineCatRef} className="inp" style={{fontSize:"0.86rem",padding:"5px 8px"}} placeholder="e.g. Research, Grants…"
                  value={inlineCatVal} onChange={e=>setInlineCatVal(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")addCategory(inlineCatVal,"inline");if(e.key==="Escape"){setShowInlineCat(false);setInlineCatVal("");}}}/>
                <button className="btn" onClick={()=>addCategory(inlineCatVal,"inline")}
                  style={{background:"#818cf8",color:"#fff",padding:"5px 11px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.76rem",whiteSpace:"nowrap",flexShrink:0}}>Add</button>
                <button className="btn" onClick={()=>{setShowInlineCat(false);setInlineCatVal("");}}
                  style={{background:"#1e293b",color:"#64748b",padding:"5px 7px",borderRadius:"5px",flexShrink:0}}>✕</button>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
              <div><div style={{fontSize:"0.62rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px"}}>DEADLINE</div><input type="date" className="inp" value={agendaForm.deadline} onChange={e=>setAgendaForm(f=>({...f,deadline:e.target.value}))}/></div>
              <div><div style={{fontSize:"0.62rem",color:"#475569",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px"}}>TIME (IST)</div><input type="time" className="inp" value={agendaForm.time} onChange={e=>setAgendaForm(f=>({...f,time:e.target.value}))}/></div>
              <div>
                <div style={{fontSize:"0.62rem",color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"4px"}}>🔔 REMINDER</div>
                <select className="inp" value={agendaForm.reminderMins} onChange={e=>setAgendaForm(f=>({...f,reminderMins:e.target.value}))}>
                  <option value="0">At event time</option><option value="5">5 min before</option><option value="10">10 min before</option>
                  <option value="15">15 min before</option><option value="30">30 min before</option><option value="60">1 hour before</option>
                  <option value="120">2 hours before</option><option value="1440">1 day before</option>
                </select>
              </div>
            </div>
            <textarea className="inp" rows={2} placeholder="Notes (optional)…" value={agendaForm.notes}
              onChange={e=>setAgendaForm(f=>({...f,notes:e.target.value}))} style={{resize:"vertical"}}/>
            <div style={{display:"flex",gap:"10px"}}>
              <button className="btn" onClick={saveAgenda} style={{background:"#818cf8",color:"#fff",padding:"8px 20px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.82rem",fontWeight:600}}>
                {editAgendaId?"Update Agenda":"Create Agenda"}
              </button>
              <button className="btn" onClick={cancelAgendaForm} style={{background:"#1e293b",color:"#64748b",padding:"8px 14px",borderRadius:"6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.82rem"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{padding:"11px 20px",borderBottom:"1px solid #0a0a14"}}>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap",flex:1}}>
            {["All","Active","Done",...categories].map(f=>(
              <button key={f} className={`fb ${filter===f?"act":""}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:"7px",alignItems:"center"}}>
            <button className="btn" onClick={()=>{setShowManage(s=>!s);setShowAgendaForm(false);}}
              style={{background:showManage?"#1e293b":"transparent",color:"#475569",border:"1px solid #1e293b",padding:"4px 9px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.68rem"}}>
              ⚙ categories
            </button>
            <input className="inp" style={{width:"155px",fontSize:"0.8rem",padding:"5px 9px"}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        {showManage&&(
          <div style={{background:"#07070d",border:"1px solid #1e293b",borderRadius:"8px",padding:"15px",marginTop:"10px",maxWidth:"540px",animation:"fadein .15s ease"}}>
            <div style={{fontSize:"0.65rem",fontFamily:"'IBM Plex Mono',monospace",color:"#475569",marginBottom:"10px",letterSpacing:"0.08em"}}>MANAGE CATEGORIES</div>
            {categories.length===0&&<div style={{fontSize:"0.76rem",color:"#334155",marginBottom:"10px",fontFamily:"'IBM Plex Mono',monospace"}}>No categories yet.</div>}
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"}}>
              {categories.map(cat=>{const c=strToColor(cat);return(
                <span key={cat} style={{display:"inline-flex",alignItems:"center",fontSize:"0.73rem",fontFamily:"'IBM Plex Mono',monospace",background:c+"18",color:c,border:`1px solid ${c}44`,borderRadius:"4px",padding:"3px 8px"}}>
                  {cat}<button className="delx" onClick={()=>deleteCategory(cat)}>✕</button>
                </span>
              );})}
            </div>
            <div style={{display:"flex",gap:"7px"}}>
              <input className="inp" style={{fontSize:"0.83rem",padding:"6px 9px"}} placeholder="New category…"
                value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory(newCat,"manage")}/>
              <button className="btn" onClick={()=>addCategory(newCat,"manage")}
                style={{background:"#818cf8",color:"#fff",padding:"6px 13px",borderRadius:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.77rem",whiteSpace:"nowrap",flexShrink:0}}>+ Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Agenda List */}
      <div style={{padding:"12px 20px",maxWidth:"840px"}}>
        {sorted.length===0&&(
          <div style={{textAlign:"center",color:"#334155",padding:"60px 0",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.83rem"}}>
            {agendas.length===0?"No agendas yet. Create your first one ↑":"No agendas match the current filter."}
          </div>
        )}
        {sorted.map(ag=>{
          const tasks=ag.tasks||[],pct=agendaProgress(ag),done=isAgendaDone(ag);
          const cc=ag.category?strToColor(ag.category):"#475569";
          const isOpen=expanded[ag.id]!==false,cs=calStatus[ag.id];
          return(
            <div key={ag.id} className="agenda-card" style={{background:"#07070d",opacity:done?0.6:1}}>
              <div style={{padding:"11px 13px",display:"grid",gridTemplateColumns:"auto 1fr auto",gap:"11px",alignItems:"center",cursor:"pointer"}}
                onClick={()=>setExpanded(e=>({...e,[ag.id]:!isOpen}))}>
                <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <ProgressRing pct={pct??0} size={36} stroke={3} color={done?"#334155":pColor[ag.priority]}/>
                  <span style={{position:"absolute",fontSize:"0.5rem",fontFamily:"'IBM Plex Mono',monospace",color:done?"#334155":pColor[ag.priority]}}>{pct===null?"–":`${pct}%`}</span>
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                    <span style={{fontSize:"0.95rem",fontWeight:600,color:done?"#475569":"#f1f5f9",textDecoration:done?"line-through":"none"}}>{ag.title}</span>
                    {ag.category&&<span style={{fontSize:"0.66rem",fontFamily:"'IBM Plex Mono',monospace",background:cc+"22",color:cc,border:`1px solid ${cc}44`,borderRadius:"3px",padding:"1px 5px"}}>{ag.category}</span>}
                    <span style={{fontSize:"0.66rem",fontFamily:"'IBM Plex Mono',monospace",color:pColor[ag.priority],opacity:0.7}}>{ag.priority}</span>
                    {ag.deadline&&<DeadlineBadge dateStr={ag.deadline} done={done}/>}
                    {ag.time&&ag.deadline&&<span style={{fontSize:"0.62rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace"}}>@ {ag.time}</span>}
                  </div>
                  <div style={{fontSize:"0.68rem",color:"#334155",fontFamily:"'IBM Plex Mono',monospace",marginTop:"2px"}}>
                    {tasks.length===0?"No tasks yet":`${tasks.filter(t=>t.done).length}/${tasks.length} tasks done`}
                    {ag.notes&&<span style={{color:"#1e293b"}}> · {ag.notes.slice(0,40)}{ag.notes.length>40?"…":""}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:"5px",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                  {ag.deadline&&!done&&(
                    <button className="cal-btn" onClick={()=>addToCalendar(ag)}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      GCal
                    </button>
                  )}
                  <button className="btn" onClick={()=>startEditAgenda(ag)} style={{background:"transparent",color:"#475569",fontSize:"0.74rem",padding:"3px 7px",borderRadius:"4px",border:"1px solid #1e293b"}}>edit</button>
                  <button className="btn" onClick={()=>deleteAgenda(ag.id)} style={{background:"transparent",color:"#374151",fontSize:"0.74rem",padding:"3px 7px",borderRadius:"4px",border:"1px solid #111827"}}>✕</button>
                  <span style={{color:"#334155",fontSize:"0.72rem",padding:"0 2px"}}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>
              {cs&&<div style={{padding:"0 13px 8px",fontSize:"0.67rem",fontFamily:"'IBM Plex Mono',monospace",color:cs.state==="ok"?"#34d399":"#f87171"}}>{cs.state==="ok"?"✓ Opened in Google Calendar":"✗ Set a deadline first"}</div>}
              {isOpen&&(
                <div style={{borderTop:"1px solid #0f172a",background:"#050509"}}>
                  {tasks.length===0&&addingTaskFor!==ag.id&&<div style={{padding:"8px 13px 4px",fontSize:"0.7rem",color:"#1e293b",fontFamily:"'IBM Plex Mono',monospace"}}>No tasks yet</div>}
                  {tasks.map(task=>{
                    const isEditingThis=editTaskRef?.agendaId===ag.id&&editTaskRef?.taskId===task.id;
                    return(
                      <div key={task.id} className="task-row">
                        <div onClick={()=>toggleTask(ag.id,task.id)} style={{width:"15px",height:"15px",borderRadius:"4px",marginTop:"3px",flexShrink:0,border:`1.5px solid ${task.done?"#334155":"#293548"}`,background:task.done?"#334155":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                          {task.done&&<span style={{color:"#64748b",fontSize:"0.55rem"}}>✓</span>}
                        </div>
                        {isEditingThis?(
                          <div style={{flex:1,display:"flex",gap:"7px",alignItems:"center",flexWrap:"wrap"}}>
                            <input ref={taskInputRef} className="inp" style={{flex:1,minWidth:"130px",fontSize:"0.83rem",padding:"4px 7px"}}
                              value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}
                              onKeyDown={e=>{if(e.key==="Enter")saveTask();if(e.key==="Escape"){setEditTaskRef(null);setAddingTaskFor(null);}}}/>
                            <input type="date" className="inp" style={{width:"140px",fontSize:"0.79rem",padding:"4px 7px"}}
                              value={taskForm.deadline} onChange={e=>setTaskForm(f=>({...f,deadline:e.target.value}))}/>
                            <button className="btn" onClick={saveTask} style={{background:"#818cf8",color:"#fff",padding:"4px 10px",borderRadius:"4px",fontSize:"0.74rem",whiteSpace:"nowrap",flexShrink:0}}>Save</button>
                            <button className="btn" onClick={()=>{setEditTaskRef(null);setAddingTaskFor(null);}} style={{background:"#1e293b",color:"#64748b",padding:"4px 7px",borderRadius:"4px",fontSize:"0.74rem",flexShrink:0}}>✕</button>
                          </div>
                        ):(
                          <div style={{flex:1,display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                            <span style={{fontSize:"0.85rem",color:task.done?"#475569":"#cbd5e1",textDecoration:task.done?"line-through":"none",flex:1,minWidth:"100px"}}>{task.title}</span>
                            {task.deadline?<DeadlineBadge dateStr={task.deadline} done={task.done} small/>:<span style={{fontSize:"0.62rem",color:"#1e293b",fontFamily:"'IBM Plex Mono',monospace"}}>no deadline</span>}
                            <button className="btn" onClick={()=>openEditTask(ag.id,task)} style={{background:"transparent",color:"#293548",fontSize:"0.68rem",padding:"2px 5px",borderRadius:"3px",border:"1px solid #111827"}}>edit</button>
                            <button className="btn" onClick={()=>deleteTask(ag.id,task.id)} style={{background:"transparent",color:"#1e293b",fontSize:"0.68rem",padding:"2px 5px",borderRadius:"3px",border:"1px solid #0f172a"}}>✕</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {addingTaskFor===ag.id&&!editTaskRef?(
                    <div style={{padding:"6px 11px",display:"flex",gap:"7px",alignItems:"center",flexWrap:"wrap",borderTop:"1px solid #0c1220"}}>
                      <div style={{width:"15px",height:"15px",borderRadius:"4px",border:"1.5px dashed #293548",flexShrink:0}}/>
                      <input ref={taskInputRef} className="inp" style={{flex:1,minWidth:"130px",fontSize:"0.83rem",padding:"5px 8px"}}
                        placeholder="Task title…" value={taskForm.title}
                        onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))}
                        onKeyDown={e=>{if(e.key==="Enter")saveTask();if(e.key==="Escape")setAddingTaskFor(null);}}/>
                      <input type="date" className="inp" style={{width:"140px",fontSize:"0.79rem",padding:"5px 7px"}}
                        value={taskForm.deadline} onChange={e=>setTaskForm(f=>({...f,deadline:e.target.value}))}/>
                      <button className="btn" onClick={saveTask} style={{background:"#818cf8",color:"#fff",padding:"5px 11px",borderRadius:"4px",fontSize:"0.75rem",whiteSpace:"nowrap",flexShrink:0}}>Add</button>
                      <button className="btn" onClick={()=>setAddingTaskFor(null)} style={{background:"#1e293b",color:"#64748b",padding:"5px 7px",borderRadius:"4px",flexShrink:0}}>✕</button>
                    </div>
                  ):(
                    <div style={{padding:"5px 11px 8px"}}>
                      <button className="btn" onClick={()=>openAddTask(ag.id)}
                        style={{background:"transparent",color:"#293548",fontSize:"0.71rem",padding:"3px 10px",borderRadius:"4px",border:"1px dashed #1e293b",fontFamily:"'IBM Plex Mono',monospace"}}
                        onMouseEnter={e=>{e.currentTarget.style.color="#818cf8";e.currentTarget.style.borderColor="#818cf8";}}
                        onMouseLeave={e=>{e.currentTarget.style.color="#293548";e.currentTarget.style.borderColor="#1e293b";}}>
                        + add task
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {agendas.length>0&&(
        <div style={{padding:"6px 34px 28px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.66rem",color:"#1e293b"}}>
          {agendas.filter(ag=>isAgendaDone(ag)).length}/{agendas.length} agendas completed · {user.displayName||user.email}
        </div>
      )}
    </div>
  );
}
