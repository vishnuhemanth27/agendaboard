import { useState, useEffect, useRef, useCallback } from "react";
import { signInWithGoogle, signOutUser, onAuthChange, loadUserData, saveUserData } from "./firebase.js";

const PRIORITIES = ["High","Medium","Low"];
function strToColor(str){const p=["#a78bfa","#34d399","#f472b6","#60a5fa","#fb923c","#f87171","#4ade80","#fbbf24","#38bdf8"];let h=0;for(let i=0;i<str.length;i++)h=str.charCodeAt(i)+((h<<5)-h);return p[Math.abs(h)%p.length];}
function getDaysLeft(d){if(!d)return null;const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+"T00:00:00")-t)/86400000);}
function fmtDate(d){if(!d)return"";return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
function fmtMin(m){const h=Math.floor(m/60),mn=m%60;return h?`${h}h ${mn}m`:`${mn}m`;}
function today(){return new Date().toISOString().split("T")[0];}
function addHour(t){const[h,m]=(t||"09:00").split(":").map(Number);return`${String((h+1)%24).padStart(2,"0")}:${String(m).padStart(2,"0")}`;}
function buildGCalURL(title,deadline,time,notes){if(!deadline)return null;const ts=(time||"09:00").replace(":",""),te=addHour(time||"09:00").replace(":",""),d=deadline.replace(/-/g,"");return`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("📋 "+title)}&dates=${d}T${ts}00/${d}T${te}00&details=${encodeURIComponent(notes||"")}&ctz=Asia/Calcutta`;}

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080810;--surface:rgba(255,255,255,0.03);--surface-hover:rgba(255,255,255,0.055);--surface-solid:#0f0f1a;
  --glass:rgba(255,255,255,0.04);--glass-border:rgba(255,255,255,0.08);--glass-border-hover:rgba(255,255,255,0.15);
  --indigo:#818cf8;--indigo-bright:#a5b4fc;--indigo-glow:rgba(129,140,248,0.15);--indigo-dim:rgba(129,140,248,0.08);--indigo-mid:rgba(129,140,248,0.2);
  --green:#34d399;--green-dim:rgba(52,211,153,0.1);--green-glow:rgba(52,211,153,0.15);
  --amber:#fbbf24;--amber-dim:rgba(251,191,36,0.1);--red:#f87171;--red-dim:rgba(248,113,113,0.1);
  --text:#f1f5f9;--text2:#94a3b8;--text3:#475569;--text4:#2a3548;
  --font:'Outfit',sans-serif;--mono:'DM Mono',monospace;--display:'Syne',sans-serif;--radius:12px;--radius-sm:8px;
}
::placeholder{color:var(--text3)}input,select,textarea{outline:none}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
input[type="date"]::-webkit-calendar-picker-indicator,input[type="time"]::-webkit-calendar-picker-indicator{filter:invert(.35);cursor:pointer}
.app-shell{min-height:100vh;background:var(--bg);color:var(--text);font-family:var(--font);position:relative;overflow-x:hidden}
.app-shell::before{content:'';position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse 60% 40% at 20% 10%,rgba(129,140,248,0.07) 0%,transparent 70%),radial-gradient(ellipse 50% 35% at 80% 80%,rgba(52,211,153,0.05) 0%,transparent 70%),radial-gradient(ellipse 40% 30% at 60% 30%,rgba(244,114,182,0.04) 0%,transparent 60%);pointer-events:none}
.app-content{position:relative;z-index:1}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:rgba(8,8,16,0.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--glass-border);position:sticky;top:0;z-index:100}
.logo-icon{display:flex;align-items:center;justify-content:center;background:var(--indigo-dim);border:1px solid var(--indigo-mid);box-shadow:0 0 16px var(--indigo-glow)}
.logo-text{font-family:var(--display);font-size:1.1rem;font-weight:800;letter-spacing:-0.5px;color:var(--text)}
.logo-text span{color:var(--indigo)}
.sync-dot{width:5px;height:5px;border-radius:50%;animation:pulse-dot 2.5s ease-in-out infinite}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}
.user-avatar{width:28px;height:28px;border-radius:50%;background:var(--indigo-dim);border:1px solid var(--indigo-mid);display:flex;align-items:center;justify-content:center;font-size:0.68rem;font-weight:600;color:var(--indigo-bright);cursor:pointer}
.signout-btn{background:transparent;border:1px solid var(--glass-border);color:var(--text3);border-radius:6px;padding:3px 9px;font-family:var(--mono);font-size:0.62rem;cursor:pointer;transition:all .15s}
.signout-btn:hover{border-color:var(--glass-border-hover);color:var(--text2)}
.nav-tabs{display:flex;gap:2px;background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:3px}
.nav-tab{padding:5px 14px;border-radius:7px;border:none;background:transparent;color:var(--text3);font-family:var(--mono);font-size:0.72rem;cursor:pointer;transition:all .2s;position:relative;white-space:nowrap}
.nav-tab.active{background:rgba(129,140,248,0.12);color:var(--indigo-bright);box-shadow:0 0 12px var(--indigo-glow)}
.nav-tab .dot{position:absolute;top:3px;right:4px;width:5px;height:5px;border-radius:50%;background:var(--red);box-shadow:0 0 5px rgba(248,113,113,0.5)}
.page{padding:20px 24px;max-width:860px}
.card{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);transition:border-color .2s}
.card:hover{border-color:var(--glass-border-hover)}
.section-label{font-family:var(--mono);font-size:0.6rem;color:var(--text3);letter-spacing:.1em;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.badge{display:inline-flex;align-items:center;font-family:var(--mono);font-size:0.62rem;border-radius:5px;padding:2px 8px;white-space:nowrap}
.badge-red{background:var(--red-dim);color:var(--red);border:1px solid rgba(248,113,113,0.2)}
.badge-amber{background:var(--amber-dim);color:var(--amber);border:1px solid rgba(251,191,36,0.2)}
.badge-green{background:var(--green-dim);color:var(--green);border:1px solid rgba(52,211,153,0.2)}
.badge-indigo{background:var(--indigo-dim);color:var(--indigo-bright);border:1px solid var(--indigo-mid)}
.badge-gray{background:rgba(71,85,105,0.15);color:var(--text3);border:1px solid rgba(71,85,105,0.25)}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
.stat-card{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);padding:12px 14px}
.stat-label{font-family:var(--mono);font-size:0.57rem;color:var(--text3);letter-spacing:.07em;margin-bottom:5px}
.stat-value{font-size:1.5rem;font-weight:700;line-height:1;font-family:var(--display)}
.stat-sub{font-size:0.62rem;color:var(--text3);margin-top:3px}
.today-task{display:flex;align-items:center;gap:11px;padding:10px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm);margin-bottom:6px;cursor:pointer;transition:all .15s}
.today-task:hover{background:var(--surface-hover);border-color:var(--glass-border-hover)}
.today-task.overdue{border-color:rgba(248,113,113,0.2)}
.task-check{width:16px;height:16px;border-radius:5px;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s}
.task-check.done{background:var(--text3);border-color:var(--text3)}
.agenda-card{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);margin-bottom:10px;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.agenda-card:hover{border-color:var(--glass-border-hover)}
.agenda-card.done-card{opacity:0.5}
.agenda-header{padding:13px 15px;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;cursor:pointer}
.agenda-tasks-panel{border-top:1px solid var(--glass-border);background:rgba(0,0,0,0.2);animation:slide-down .2s ease}
@keyframes slide-down{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.task-row{display:flex;align-items:center;gap:10px;padding:8px 15px;transition:background .1s;cursor:pointer}
.task-row+.task-row{border-top:1px solid rgba(255,255,255,0.04)}
.task-row:hover{background:rgba(255,255,255,0.025)}
.task-check2{width:14px;height:14px;border-radius:4px;border:1.5px solid rgba(255,255,255,0.12);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
.task-check2.done{background:var(--text4);border-color:var(--text4)}
.add-task-row{padding:7px 15px;border-top:1px solid rgba(255,255,255,0.04)}
.add-task-btn{background:transparent;border:1px dashed rgba(255,255,255,0.08);color:var(--text3);border-radius:5px;padding:4px 10px;font-family:var(--mono);font-size:0.68rem;cursor:pointer;transition:all .15s;width:100%}
.add-task-btn:hover{border-color:var(--indigo-mid);color:var(--indigo-bright)}
.ring-wrap{position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ring-pct{position:absolute;font-family:var(--mono);font-size:0.46rem;color:var(--text3)}
.btn{cursor:pointer;border:none;border-radius:var(--radius-sm);font-family:var(--font);font-weight:500;transition:all .15s}
.btn:active{transform:scale(0.97)}
.btn-primary{background:var(--indigo);color:#fff;padding:7px 16px;font-size:0.8rem;box-shadow:0 0 20px rgba(129,140,248,0.25)}
.btn-primary:hover{background:var(--indigo-bright);box-shadow:0 0 28px rgba(165,180,252,0.3)}
.btn-ghost{background:var(--glass);color:var(--text2);border:1px solid var(--glass-border);padding:7px 14px;font-size:0.8rem}
.btn-ghost:hover{border-color:var(--glass-border-hover);color:var(--text)}
.btn-success{background:rgba(52,211,153,0.1);color:var(--green);border:1px solid rgba(52,211,153,0.2);padding:5px 12px;font-size:0.74rem}
.btn-success:hover{background:rgba(52,211,153,0.18)}
.btn-danger-ghost{background:transparent;color:var(--red);border:1px solid rgba(248,113,113,0.2);padding:7px 14px;font-size:0.8rem}
.btn-sm{padding:4px 10px!important;font-size:0.72rem!important}
.btn-icon{background:transparent;border:1px solid var(--glass-border);color:var(--text3);border-radius:5px;padding:3px 8px;font-family:var(--mono);font-size:0.7rem;cursor:pointer;transition:all .15s}
.btn-icon:hover{border-color:var(--glass-border-hover);color:var(--text2)}
.cal-btn{display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid rgba(52,211,153,0.2);color:var(--green);border-radius:5px;padding:3px 8px;font-family:var(--mono);font-size:0.67rem;cursor:pointer;transition:all .15s;white-space:nowrap}
.cal-btn:hover{background:rgba(52,211,153,0.08)}
.inp{background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:var(--radius-sm);color:var(--text);padding:9px 13px;font-family:var(--font);font-size:0.88rem;transition:border-color .15s;width:100%}
.inp:focus{border-color:var(--indigo-mid)}
.fb{cursor:pointer;border:1px solid var(--glass-border);background:transparent;color:var(--text3);padding:4px 13px;border-radius:20px;font-size:.75rem;font-family:var(--mono);transition:all .15s;white-space:nowrap}
.fb:hover{border-color:var(--glass-border-hover);color:var(--text2)}
.fb.act{background:var(--indigo-dim);color:var(--indigo-bright);border-color:var(--indigo-mid)}
.study-subnav{display:flex;gap:2px;margin-bottom:16px;border-bottom:1px solid var(--glass-border);overflow-x:auto}
.snav-btn{background:transparent;border:none;color:var(--text3);font-family:var(--mono);font-size:0.74rem;padding:6px 13px;cursor:pointer;transition:all .15s;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
.snav-btn.active{color:var(--indigo-bright);border-bottom-color:var(--indigo)}
.study-card{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);overflow:hidden;transition:border-color .2s}
.study-card:hover{border-color:var(--glass-border-hover)}
.video-row{display:flex;align-items:flex-start;gap:11px;padding:9px 15px;border-top:1px solid rgba(255,255,255,0.04)}
.video-num{font-family:var(--mono);font-size:0.6rem;color:var(--text3);min-width:14px;padding-top:2px}
.video-title{font-size:0.85rem;color:#cbd5e1;margin-bottom:2px}
.video-url{font-family:var(--mono);font-size:0.62rem;color:#4a7fc1;cursor:pointer;word-break:break-all}
.video-dur{font-family:var(--mono);font-size:0.7rem;color:var(--text3);white-space:nowrap;flex-shrink:0}
.progress-bar-wrap{flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden}
.progress-bar-fill{height:100%;border-radius:2px;transition:width .4s}
.heatmap-grid{display:flex;flex-wrap:wrap;gap:3px}
.heatmap-cell{width:15px;height:15px;border-radius:3px;cursor:default;transition:transform .1s}
.heatmap-cell:hover{transform:scale(1.3)}
.sched-row{border:1px solid var(--glass-border);border-radius:var(--radius-sm);margin-bottom:6px;background:var(--glass);transition:border-color .15s}
.sched-row:hover{border-color:var(--glass-border-hover)}
.sched-row.drag-over{border-color:var(--indigo);background:var(--indigo-dim)}
.signin-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--font);padding:24px;position:relative}
.signin-screen::before{content:'';position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse 60% 50% at 30% 20%,rgba(129,140,248,0.12) 0%,transparent 70%),radial-gradient(ellipse 50% 40% at 70% 75%,rgba(52,211,153,0.08) 0%,transparent 65%);pointer-events:none}
.signin-card{position:relative;z-index:1;background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);border-radius:20px;padding:40px 44px;text-align:center;max-width:380px;width:100%;backdrop-filter:blur(20px);box-shadow:0 32px 64px rgba(0,0,0,0.4)}
.google-btn{display:flex;align-items:center;gap:12px;background:#fff;color:#1f2937;border:none;border-radius:12px;padding:13px 26px;font-size:0.95rem;font-weight:600;cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,0.35);transition:transform .15s,box-shadow .15s;font-family:var(--font);width:100%;justify-content:center}
.google-btn:hover{transform:scale(1.02);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
.loading-spinner{width:28px;height:28px;border-radius:50%;border:2px solid var(--glass-border);border-top-color:var(--indigo);animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadein{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.fadein{animation:fadein .2s ease}
.empty-state{text-align:center;color:var(--text3);padding:40px 0;font-family:var(--mono);font-size:0.8rem}
`;

const PCOLOR={High:"#f87171",Medium:"#818cf8",Low:"#34d399"};

function DeadlineBadge({dateStr,done,sm}){
  const days=getDaysLeft(dateStr);if(days===null)return null;
  let cls="badge-green",label=`${days}d left`;
  if(done){cls="badge-gray";label=fmtDate(dateStr);}
  else if(days<0){cls="badge-red";label=`${Math.abs(days)}d overdue`;}
  else if(days===0){cls="badge-amber";label="Due today";}
  else if(days<=3){cls="badge-amber";label=`${days}d left`;}
  return<span className={`badge ${cls}`} style={sm?{fontSize:"0.58rem",padding:"1px 6px"}:{}}>{label}</span>;
}

function ProgressRing({pct,size=36,stroke=2.5,color="#818cf8"}){
  const r=(size-stroke*2)/2,c=2*Math.PI*r;
  return(
    <div className="ring-wrap" style={{width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c-(pct/100)*c} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.5s ease",filter:`drop-shadow(0 0 4px ${color}66)`}}/>
      </svg>
      <span className="ring-pct">{pct===null?"–":`${pct}%`}</span>
    </div>
  );
}

function AppIcon({size=36}){
  return(
    <div className="logo-icon" style={{width:size,height:size,borderRadius:size*.28}}>
      <svg width={size*.54} height={size*.54} viewBox="0 0 44 44" fill="none">
        <rect x="4" y="8" width="36" height="30" rx="4" stroke="#818cf8" strokeWidth="2.5"/>
        <line x1="4" y1="16" x2="40" y2="16" stroke="#818cf8" strokeWidth="2.5"/>
        <line x1="14" y1="8" x2="14" y2="4" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="30" y1="8" x2="30" y2="4" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="10" y="22" width="10" height="3" rx="1.5" fill="#34d399"/>
        <rect x="10" y="29" width="16" height="3" rx="1.5" fill="#475569"/>
        <circle cx="34" cy="31" r="7" fill="#080810" stroke="#818cf8" strokeWidth="1.5"/>
        <path d="M31 31l2 2 4-4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function SignInScreen({onSignIn,loading}){
  return(
    <div className="signin-screen" style={{background:"#080810"}}>
      <style>{GLOBAL_CSS}</style>
      <div className="signin-card">
        <div style={{marginBottom:24,display:"flex",justifyContent:"center"}}><AppIcon size={64}/></div>
        <div className="logo-text" style={{fontSize:"1.7rem",marginBottom:6}}>AGENDA<span>BOARD</span></div>
        <div style={{fontSize:"0.82rem",color:"var(--text3)",marginBottom:8}}>Agendas · Tasks · YouTube Study Plan</div>
        <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:32,flexWrap:"wrap"}}>
          {["✦ Cloud sync","✦ Google Calendar","✦ Study tracker"].map(f=>(
            <span key={f} style={{fontSize:"0.68rem",color:"var(--text4)",fontFamily:"var(--mono)"}}>{f}</span>
          ))}
        </div>
        <button className="google-btn" onClick={onSignIn} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1L6 34.2C9.3 39.8 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C41.1 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {loading?"Signing in…":"Continue with Google"}
        </button>
      </div>
    </div>
  );
}

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
  const sorted=[...agendas].filter(ag=>{
    const done=isDone(ag);
    const mf=filter==="All"||(filter==="Active"&&!done)||(filter==="Done"&&done)||ag.category===filter;
    const ms=!search||ag.title.toLowerCase().includes(search.toLowerCase())||(ag.notes||"").toLowerCase().includes(search.toLowerCase())||(ag.tasks||[]).some(t=>t.title.toLowerCase().includes(search.toLowerCase()));
    return mf&&ms;
  }).sort((a,b)=>{const da=isDone(a),db=isDone(b);if(da!==db)return da?1:-1;const pd=PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority);if(pd)return pd;if(a.deadline&&b.deadline)return a.deadline.localeCompare(b.deadline);return a.deadline?-1:b.deadline?1:0;});

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"var(--mono)",fontSize:"0.65rem",color:"var(--text3)"}}>{agendas.filter(a=>!isDone(a)).length} active · {agendas.filter(a=>isDone(a)).length} done</div>
        <button className="btn btn-primary btn-sm" onClick={()=>{setShowForm(s=>!s);setShowManage(false);setEditId(null);setForm(blankAg(categories));setTimeout(()=>titleRef.current?.focus(),60);}}>{showForm?"✕ Cancel":"+ New Agenda"}</button>
      </div>
      {showForm&&(
        <div className="card fadein" style={{padding:16,marginBottom:14}}>
          <div style={{display:"grid",gap:10}}>
            <input ref={titleRef} className="inp" style={{fontSize:"0.95rem"}} placeholder="Agenda title…" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveAg()}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{display:"flex",gap:6}}>
                <select className="inp" style={{flex:1,minWidth:0}} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{categories.length===0&&<option value="">No categories</option>}{categories.map(c=><option key={c}>{c}</option>)}</select>
                <button className="btn-icon" onClick={()=>{setShowInlineCat(s=>!s);setTimeout(()=>inlineRef.current?.focus(),50);}}>+</button>
              </div>
              <select className="inp" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
            </div>
            {showInlineCat&&(
              <div className="fadein" style={{display:"flex",gap:7,alignItems:"center",background:"rgba(255,255,255,0.03)",border:"1px solid var(--glass-border)",borderRadius:8,padding:"8px 12px"}}>
                <span style={{fontSize:"0.65rem",color:"var(--text3)",fontFamily:"var(--mono)",whiteSpace:"nowrap"}}>NEW CAT</span>
                <input ref={inlineRef} className="inp" style={{fontSize:"0.85rem",padding:"5px 9px"}} placeholder="Category name…" value={inlineCatVal} onChange={e=>setInlineCatVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCat(inlineCatVal,"inline");if(e.key==="Escape"){setShowInlineCat(false);setInlineCatVal("");}}}/>
                <button className="btn btn-primary btn-sm" onClick={()=>addCat(inlineCatVal,"inline")}>Add</button>
                <button className="btn-icon" onClick={()=>{setShowInlineCat(false);setInlineCatVal("");}}>✕</button>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <div><div style={{fontSize:"0.6rem",color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:4}}>DEADLINE</div><input type="date" className="inp" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}/></div>
              <div><div style={{fontSize:"0.6rem",color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:4}}>TIME</div><input type="time" className="inp" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></div>
              <div><div style={{fontSize:"0.6rem",color:"var(--green)",fontFamily:"var(--mono)",marginBottom:4}}>🔔 REMINDER</div><select className="inp" value={form.reminderMins} onChange={e=>setForm(f=>({...f,reminderMins:e.target.value}))}><option value="0">At time</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hour</option><option value="1440">1 day</option></select></div>
            </div>
            <textarea className="inp" rows={2} placeholder="Notes…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{resize:"vertical"}}/>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-primary" onClick={saveAg}>{editId?"Update":"Create Agenda"}</button>
              <button className="btn btn-ghost" onClick={cancelForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1}}>{["All","Active","Done",...categories].map(f=><button key={f} className={`fb ${filter===f?"act":""}`} onClick={()=>setFilter(f)}>{f}</button>)}</div>
        <button className="btn-icon" onClick={()=>{setShowManage(s=>!s);setShowForm(false);}}>⚙</button>
        <input className="inp" style={{width:140,fontSize:"0.8rem",padding:"5px 10px"}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {showManage&&(
        <div className="card fadein" style={{padding:14,marginBottom:12}}>
          <div style={{fontSize:"0.62rem",fontFamily:"var(--mono)",color:"var(--text3)",marginBottom:10,letterSpacing:".08em"}}>MANAGE CATEGORIES</div>
          {categories.length===0&&<div style={{fontSize:"0.76rem",color:"var(--text3)",marginBottom:10,fontFamily:"var(--mono)"}}>No categories yet.</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{categories.map(cat=>{const c=strToColor(cat);return<span key={cat} style={{display:"inline-flex",alignItems:"center",fontSize:"0.72rem",fontFamily:"var(--mono)",background:c+"18",color:c,border:`1px solid ${c}33`,borderRadius:5,padding:"3px 9px"}}>{cat}<button style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"0.6rem",marginLeft:5,opacity:.45,color:c}} onClick={()=>delCat(cat)}>✕</button></span>;})}</div>
          <div style={{display:"flex",gap:7}}><input className="inp" style={{fontSize:"0.82rem",padding:"6px 10px"}} placeholder="New category…" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat(newCat,"manage")}/><button className="btn btn-primary btn-sm" onClick={()=>addCat(newCat,"manage")}>+ Add</button></div>
        </div>
      )}
      {sorted.length===0&&<div className="empty-state">{agendas.length===0?"No agendas yet. Create your first one ↑":"No agendas match the filter."}</div>}
      {sorted.map(ag=>{
        const tasks=ag.tasks||[],p=pct(ag),done=isDone(ag),cc=ag.category?strToColor(ag.category):"var(--text3)",isOpen=expanded[ag.id]!==false,cs=calStatus[ag.id];
        return(
          <div key={ag.id} className={`agenda-card${done?" done-card":""}`}>
            <div className="agenda-header" onClick={()=>setExpanded(e=>({...e,[ag.id]:!isOpen}))}>
              <ProgressRing pct={p??0} size={36} stroke={2.5} color={done?"var(--text4)":PCOLOR[ag.priority]}/>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                  <span style={{fontSize:"0.92rem",fontWeight:600,color:done?"var(--text3)":"var(--text)",textDecoration:done?"line-through":"none"}}>{ag.title}</span>
                  {ag.category&&<span style={{fontSize:"0.63rem",fontFamily:"var(--mono)",background:cc+"18",color:cc,border:`1px solid ${cc}33`,borderRadius:4,padding:"1px 6px"}}>{ag.category}</span>}
                  <span style={{fontSize:"0.63rem",fontFamily:"var(--mono)",color:PCOLOR[ag.priority],opacity:.7}}>{ag.priority}</span>
                  {ag.deadline&&<DeadlineBadge dateStr={ag.deadline} done={done}/>}
                </div>
                <div style={{fontSize:"0.65rem",color:"var(--text3)",fontFamily:"var(--mono)",marginTop:3}}>{tasks.length===0?"No tasks yet":`${tasks.filter(t=>t.done).length}/${tasks.length} tasks`}{ag.notes&&<span style={{color:"var(--text4)"}}> · {ag.notes.slice(0,36)}{ag.notes.length>36?"…":""}</span>}</div>
              </div>
              <div style={{display:"flex",gap:5,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                {ag.deadline&&!done&&<button className="cal-btn" onClick={()=>calClick(ag)}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>GCal</button>}
                <button className="btn-icon" onClick={()=>startEdit(ag)}>edit</button>
                <button className="btn-icon" style={{color:"var(--text4)"}} onClick={()=>delAg(ag.id)}>✕</button>
                <span style={{color:"var(--text3)",fontSize:"0.7rem"}}>{isOpen?"▲":"▼"}</span>
              </div>
            </div>
            {cs&&<div style={{padding:"0 15px 8px",fontSize:"0.65rem",fontFamily:"var(--mono)",color:cs==="ok"?"var(--green)":"var(--red)"}}>{cs==="ok"?"✓ Opened in Google Calendar":"✗ Set a deadline first"}</div>}
            {isOpen&&(
              <div className="agenda-tasks-panel">
                {tasks.length===0&&addingTaskFor!==ag.id&&<div style={{padding:"8px 15px 4px",fontSize:"0.68rem",color:"var(--text4)",fontFamily:"var(--mono)"}}>No tasks yet</div>}
                {tasks.map(task=>{
                  const editing=editTaskRef?.agId===ag.id&&editTaskRef?.taskId===task.id;
                  return(
                    <div key={task.id} className="task-row">
                      <div className={`task-check2${task.done?" done":""}`} onClick={()=>toggleTask(ag.id,task.id)}>{task.done&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
                      {editing?(
                        <div style={{flex:1,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                          <input ref={taskRef} className="inp" style={{flex:1,minWidth:120,fontSize:"0.82rem",padding:"4px 8px"}} value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")saveTask();if(e.key==="Escape"){setEditTaskRef(null);setAddingTaskFor(null);}}}/>
                          <input type="date" className="inp" style={{width:138,fontSize:"0.78rem",padding:"4px 8px"}} value={taskForm.deadline} onChange={e=>setTaskForm(f=>({...f,deadline:e.target.value}))}/>
                          <button className="btn btn-primary btn-sm" onClick={saveTask}>Save</button>
                          <button className="btn-icon" onClick={()=>{setEditTaskRef(null);setAddingTaskFor(null);}}>✕</button>
                        </div>
                      ):(
                        <div style={{flex:1,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                          <span style={{fontSize:"0.84rem",color:task.done?"var(--text3)":"#cbd5e1",textDecoration:task.done?"line-through":"none",flex:1,minWidth:80}}>{task.title}</span>
                          {task.deadline?<DeadlineBadge dateStr={task.deadline} done={task.done} sm/>:<span style={{fontSize:"0.6rem",color:"var(--text4)",fontFamily:"var(--mono)"}}>no deadline</span>}
                          <button className="btn-icon" style={{fontSize:"0.65rem"}} onClick={()=>openEditTask(ag.id,task)}>edit</button>
                          <button className="btn-icon" style={{fontSize:"0.65rem",color:"var(--text4)"}} onClick={()=>delTask(ag.id,task.id)}>✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {addingTaskFor===ag.id&&!editTaskRef?(
                  <div style={{padding:"7px 12px",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                    <input ref={taskRef} className="inp" style={{flex:1,minWidth:120,fontSize:"0.82rem",padding:"5px 8px"}} placeholder="Task title…" value={taskForm.title} onChange={e=>setTaskForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")saveTask();if(e.key==="Escape")setAddingTaskFor(null);}}/>
                    <input type="date" className="inp" style={{width:138,fontSize:"0.78rem",padding:"5px 8px"}} value={taskForm.deadline} onChange={e=>setTaskForm(f=>({...f,deadline:e.target.value}))}/>
                    <button className="btn btn-primary btn-sm" onClick={saveTask}>Add</button>
                    <button className="btn-icon" onClick={()=>setAddingTaskFor(null)}>✕</button>
                  </div>
                ):(
                  <div className="add-task-row"><button className="add-task-btn" onClick={()=>openAddTask(ag.id)}>+ add task</button></div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function parseISO8601(d){const m=d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);return(parseInt(m[1]||0)*60)+parseInt(m[2]||0)+Math.round(parseInt(m[3]||0)/60);}
function extractPlaylistId(url){const m=url.match(/[?&]list=([^&]+)/);return m?m[1]:null;}

function StudySection({study,setStudy}){
  const [tab,setTab]=useState("today");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [apiKey,setApiKey]=useState(study.apiKey||"");
  const [plUrls,setPlUrls]=useState(study.playlists?.map(p=>p.url||"").join("\n")||"");
  const [maxLen,setMaxLen]=useState(study.maxLen||65);
  const [startDate,setStartDate]=useState(study.startDate||today());
  const [editingEntry,setEditingEntry]=useState(null);
  const [dragIdx,setDragIdx]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const [showAddVideo,setShowAddVideo]=useState(null);
  const [manualUrl,setManualUrl]=useState("");
  const [manualTitle,setManualTitle]=useState("");
  const [manualDur,setManualDur]=useState("");
  const entries=study.entries||[];
  const completed=study.completed||{};
  const updateStudy=(patch)=>setStudy(s=>({...s,...patch}));

  async function fetchPlaylist(key,plId){
    let videos=[],pageToken="";
    do{
      const r=await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${plId}&key=${key}${pageToken?"&pageToken="+pageToken:""}`);
      if(!r.ok)throw new Error("Playlist fetch failed: "+r.status);
      const d=await r.json();if(d.error)throw new Error(d.error.message);
      const ids=d.items.map(i=>i.snippet.resourceId.videoId).join(",");
      const vr=await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${ids}&key=${key}`);
      const vd=await vr.json();
      vd.items.forEach(v=>videos.push({title:v.snippet.title,dur:parseISO8601(v.contentDetails.duration),url:`https://youtube.com/watch?v=${v.id}`}));
      pageToken=d.nextPageToken||"";
    }while(pageToken);
    return videos;
  }
  function greedyGroup(videos,ml){const res=[];let i=0;while(i<videos.length){const e=[],total=0;let t=0;while(i<videos.length){const v=videos[i];if(e.length===0||t+v.dur<=ml){e.push(v);t+=v.dur;i++;}else break;}res.push({id:Date.now()+i,videos:e,total:t});}return res;}
  async function buildFromPlaylists(){
    setErr("");setLoading(true);
    try{
      const lines=plUrls.split("\n").map(l=>l.trim()).filter(Boolean);
      if(!lines.length)throw new Error("Enter at least one playlist URL");
      let allVideos=[];const pls=[];
      for(const url of lines){const id=extractPlaylistId(url);if(!id)throw new Error("Invalid playlist URL: "+url);const vids=await fetchPlaylist(apiKey,id);pls.push({url,name:"Playlist",total:vids.length,done:0});allVideos=allVideos.concat(vids);}
      const newEntries=greedyGroup(allVideos,maxLen);
      updateStudy({entries:newEntries,completed:{},startDate,maxLen,apiKey,playlists:pls});setTab("today");
    }catch(e){setErr("Error: "+e.message);}
    setLoading(false);
  }
  const markDone=(idx)=>updateStudy({completed:{...completed,[idx]:true}});
  const markUndone=(idx)=>{const c={...completed};delete c[idx];updateStudy({completed:c});};
  const isDone=(idx)=>!!completed[idx];
  const handleDragStart=(idx)=>setDragIdx(idx);
  const handleDragOver=(e,idx)=>{e.preventDefault();setDragOver(idx);};
  const handleDrop=(toIdx)=>{if(dragIdx===null||dragIdx===toIdx){setDragIdx(null);setDragOver(null);return;}const arr=[...entries];const[item]=arr.splice(dragIdx,1);arr.splice(toIdx,0,item);const oldComp={...completed};const newComp={};arr.forEach((e,newI)=>{const oldI=entries.indexOf(e);if(oldComp[oldI])newComp[newI]=true;});updateStudy({entries:arr,completed:newComp});setDragIdx(null);setDragOver(null);};
  function addManualVideo(entryIdx){if(!manualUrl.trim()&&!manualTitle.trim())return;const dur=parseInt(manualDur)||0;const vid={title:manualTitle||manualUrl,url:manualUrl,dur};const arr=[...entries];arr[entryIdx]={...arr[entryIdx],videos:[...arr[entryIdx].videos,vid],total:arr[entryIdx].total+dur};updateStudy({entries:arr});setManualUrl("");setManualTitle("");setManualDur("");setShowAddVideo(null);}
  function removeVideo(entryIdx,vidIdx){const arr=[...entries];const e=arr[entryIdx];const vids=e.videos.filter((_,i)=>i!==vidIdx);arr[entryIdx]={...e,videos:vids,total:vids.reduce((s,v)=>s+v.dur,0)};if(vids.length===0)arr.splice(entryIdx,1);updateStudy({entries:arr});}
  function deleteEntry(idx){const arr=entries.filter((_,i)=>i!==idx);const newComp={};Object.keys(completed).forEach(k=>{const ki=parseInt(k);if(ki<idx)newComp[k]=completed[k];else if(ki>idx)newComp[ki-1]=completed[k];});updateStudy({entries:arr,completed:newComp});}
  const totalDone=Object.values(completed).filter(Boolean).length;
  const totalTime=Object.keys(completed).filter(k=>completed[k]).reduce((s,k)=>s+(entries[parseInt(k)]?.total||0),0);
  const streak=(()=>{let s=0;for(let i=totalDone-1;i>=0;i--){if(completed[i])s++;else break;}return s;})();
  const todayIdx=entries.findIndex((_,i)=>!isDone(i));

  return(
    <div>
      <div className="study-subnav">
        {[["today","Today"],["schedule","Schedule"],["progress","Progress"],["setup","⚙ Setup"]].map(([t,l])=>(
          <button key={t} className={`snav-btn${tab===t?" active":""}`} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>
      {tab==="today"&&<div>
        {entries.length===0?<div className="empty-state">No study entries yet. Go to ⚙ Setup to load your playlists.</div>:<>
          <div className="stat-grid">
            {[["Streak",streak,"days","var(--amber)"],["Done",totalDone,"entries","var(--green)"],["Time",fmtMin(totalTime),"total","var(--indigo)"],["Left",entries.length-totalDone,"entries","var(--text2)"]].map(([l,v,s,c])=>(
              <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className="stat-value" style={{color:c}}>{v}</div><div className="stat-sub">{s}</div></div>
            ))}
          </div>
          {todayIdx===-1?<div className="study-card" style={{padding:20,textAlign:"center",color:"var(--green)",fontFamily:"var(--mono)",fontSize:"0.9rem",borderColor:"rgba(52,211,153,0.2)"}}>🎉 All entries completed!</div>
            :<EntryCard entry={entries[todayIdx]} idx={todayIdx} done={isDone(todayIdx)} onDone={()=>markDone(todayIdx)} onUndone={()=>markUndone(todayIdx)} onAddVideo={()=>setShowAddVideo(todayIdx)} onRemoveVideo={(vi)=>removeVideo(todayIdx,vi)} showAddVideo={showAddVideo===todayIdx} manualUrl={manualUrl} setManualUrl={setManualUrl} manualTitle={manualTitle} setManualTitle={setManualTitle} manualDur={manualDur} setManualDur={setManualDur} onSaveVideo={()=>addManualVideo(todayIdx)} onCancelVideo={()=>setShowAddVideo(null)} label="Today's session"/>}
        </>}
      </div>}
      {tab==="schedule"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontFamily:"var(--mono)",fontSize:"0.65rem",color:"var(--text3)"}}>Drag rows to reorder · click to expand</div>
          <button className="btn btn-primary btn-sm" onClick={()=>{const arr=[...entries,{id:Date.now(),videos:[],total:0}];updateStudy({entries:arr});}}>+ New entry</button>
        </div>
        {entries.length===0?<div className="empty-state">No entries. Load a playlist in Setup or add entries manually.</div>:
          entries.map((e,i)=>{
            const done=isDone(i);const isEditing=editingEntry===i;
            return(
              <div key={e.id||i} draggable onDragStart={()=>handleDragStart(i)} onDragOver={(ev)=>handleDragOver(ev,i)} onDrop={()=>handleDrop(i)} onDragEnd={()=>{setDragIdx(null);setDragOver(null);}} className={`sched-row${dragOver===i?" drag-over":""}`} style={{opacity:done?.6:1}}>
                <div style={{padding:"9px 13px",display:"flex",alignItems:"center",gap:10,cursor:"grab"}} onClick={()=>setEditingEntry(isEditing?null:i)}>
                  <span style={{fontSize:"0.62rem",color:"var(--text3)",userSelect:"none"}}>⠿</span>
                  <span style={{fontFamily:"var(--mono)",fontSize:"0.65rem",color:"var(--text3)",minWidth:50}}>Entry {i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"0.85rem",color:done?"var(--text3)":"var(--text)",textDecoration:done?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.videos[0]?.title||"Empty entry"}{e.videos.length>1?` + ${e.videos.length-1} more`:""}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:"0.63rem",color:"var(--text3)"}}>{fmtMin(e.total)} · {e.videos.length} video{e.videos.length!==1?"s":""}</div>
                  </div>
                  <div style={{display:"flex",gap:5,alignItems:"center"}} onClick={ev=>ev.stopPropagation()}>
                    {done?<button className="btn-icon btn-sm" onClick={()=>markUndone(i)}>Undo</button>:<button className="btn btn-success btn-sm" onClick={()=>markDone(i)}>✓ Done</button>}
                    <button className="btn-icon btn-sm" style={{color:"var(--text4)"}} onClick={()=>deleteEntry(i)}>✕</button>
                  </div>
                  <span style={{color:"var(--text3)",fontSize:"0.7rem"}}>{isEditing?"▲":"▼"}</span>
                </div>
                {isEditing&&<div style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"8px 13px"}}>
                  {e.videos.map((v,vi)=>(
                    <div key={vi} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderTop:vi>0?"1px solid rgba(255,255,255,0.04)":"none"}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text3)",minWidth:16}}>{vi+1}</span>
                      <div style={{flex:1,minWidth:0}}><div style={{fontSize:"0.83rem",color:"#cbd5e1",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div><div style={{fontFamily:"var(--mono)",fontSize:"0.62rem",color:"#4a7fc1",cursor:"pointer"}} onClick={()=>window.open(v.url,"_blank")}>{v.url}</div></div>
                      <span style={{fontFamily:"var(--mono)",fontSize:"0.7rem",color:"var(--text3)",whiteSpace:"nowrap"}}>{fmtMin(v.dur)}</span>
                      <button className="btn-icon btn-sm" style={{color:"var(--text4)"}} onClick={()=>removeVideo(i,vi)}>✕</button>
                    </div>
                  ))}
                  {showAddVideo===i?(
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:8}}>
                      <input className="inp" style={{flex:2,minWidth:160,fontSize:"0.8rem",padding:"5px 8px"}} placeholder="YouTube URL" value={manualUrl} onChange={e=>setManualUrl(e.target.value)}/>
                      <input className="inp" style={{flex:2,minWidth:140,fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Title (optional)" value={manualTitle} onChange={e=>setManualTitle(e.target.value)}/>
                      <input className="inp" style={{width:80,fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Min" type="number" value={manualDur} onChange={e=>setManualDur(e.target.value)}/>
                      <button className="btn btn-primary btn-sm" onClick={()=>addManualVideo(i)}>Add</button>
                      <button className="btn-icon btn-sm" onClick={()=>setShowAddVideo(null)}>✕</button>
                    </div>
                  ):<button className="add-task-btn" style={{marginTop:8}} onClick={()=>setShowAddVideo(i)}>+ add video</button>}
                </div>}
              </div>
            );
          })
        }
      </div>}
      {tab==="progress"&&<div>
        <div className="study-card" style={{padding:14,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:"0.88rem",fontWeight:600}}>Overall</span><span style={{fontSize:"0.88rem",fontWeight:600,color:"var(--indigo)"}}>{entries.length?Math.round(totalDone/entries.length*100):0}%</span></div>
          <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",background:"var(--indigo)",borderRadius:3,width:`${entries.length?Math.round(totalDone/entries.length*100):0}%`,transition:"width .5s",boxShadow:"0 0 10px var(--indigo-glow)"}}/></div>
          <div style={{fontSize:"0.7rem",color:"var(--text3)"}}>{totalDone} of {entries.length} entries · {fmtMin(totalTime)} studied</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {[["Streak",streak+" days","var(--amber)"],["Completed",totalDone+" entries","var(--green)"],["Remaining",(entries.length-totalDone)+" entries","var(--indigo)"]].map(([l,v,c])=>(
            <div key={l} className="stat-card"><div className="stat-label">{l}</div><div style={{fontSize:"1rem",fontWeight:600,color:c,marginTop:4}}>{v}</div></div>
          ))}
        </div>
        <div className="study-card" style={{padding:14}}>
          <div className="section-label" style={{marginBottom:10}}>COMPLETION HEATMAP</div>
          <div className="heatmap-grid">{entries.map((_,i)=><div key={i} title={`Entry ${i+1} · ${isDone(i)?"Done":"Pending"}`} className="heatmap-cell" style={{background:isDone(i)?"var(--green)":"rgba(255,255,255,0.05)",boxShadow:isDone(i)?"0 0 6px var(--green-glow)":"none"}}/>)}</div>
          <div style={{display:"flex",gap:12,marginTop:10}}>{[["var(--green)","Done"],["rgba(255,255,255,0.05)","Pending"]].map(([c,l])=><div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.64rem",color:"var(--text3)"}}><div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}</div>)}</div>
        </div>
      </div>}
      {tab==="setup"&&<div style={{display:"grid",gap:12}}>
        <div className="study-card" style={{padding:14}}>
          <div className="section-label" style={{marginBottom:8}}>YOUTUBE API KEY</div>
          <input className="inp" type="password" placeholder="AIza…" value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
          <div style={{fontSize:"0.65rem",color:"var(--text3)",marginTop:5}}>Get a free key at <span style={{color:"var(--indigo)",cursor:"pointer"}} onClick={()=>window.open("https://console.cloud.google.com","_blank")}>console.cloud.google.com</span> → APIs → YouTube Data API v3 → Credentials</div>
        </div>
        <div className="study-card" style={{padding:14}}>
          <div className="section-label" style={{marginBottom:8}}>PLAYLIST URLS <span style={{color:"var(--text4)",fontWeight:400}}>(one per line)</span></div>
          <textarea className="inp" rows={4} style={{resize:"vertical",fontSize:"0.83rem"}} placeholder={"https://youtube.com/playlist?list=PLxxx\nhttps://youtube.com/playlist?list=PLyyy"} value={plUrls} onChange={e=>setPlUrls(e.target.value)}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div className="study-card" style={{padding:14}}><div className="section-label" style={{marginBottom:8}}>MAX ENTRY LENGTH (min)</div><select className="inp" value={maxLen} onChange={e=>setMaxLen(parseInt(e.target.value))}>{[45,60,65,75,90].map(v=><option key={v} value={v}>{v} min</option>)}</select></div>
          <div className="study-card" style={{padding:14}}><div className="section-label" style={{marginBottom:8}}>START DATE</div><input type="date" className="inp" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
        </div>
        {err&&<div style={{fontSize:"0.78rem",color:"var(--red)",padding:"8px 12px",background:"var(--red-dim)",borderRadius:8,border:"1px solid rgba(248,113,113,0.2)"}}>{err}</div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-primary" onClick={buildFromPlaylists} disabled={loading}>{loading?"Fetching…":"Fetch & build schedule ↗"}</button>
          <button className="btn btn-danger-ghost" onClick={()=>{if(confirm("Reset all study progress?"))updateStudy({entries:[],completed:{},playlists:[]});}}>Reset all</button>
        </div>
        <div className="study-card" style={{padding:14}}>
          <div className="section-label" style={{marginBottom:10}}>ADD A SINGLE VIDEO MANUALLY</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <input className="inp" style={{flex:2,minWidth:160,fontSize:"0.82rem",padding:"6px 10px"}} placeholder="YouTube URL" value={manualUrl} onChange={e=>setManualUrl(e.target.value)}/>
            <input className="inp" style={{flex:2,minWidth:140,fontSize:"0.82rem",padding:"6px 10px"}} placeholder="Title" value={manualTitle} onChange={e=>setManualTitle(e.target.value)}/>
            <input className="inp" style={{width:80,fontSize:"0.82rem",padding:"6px 10px"}} placeholder="Min" type="number" value={manualDur} onChange={e=>setManualDur(e.target.value)}/>
            <button className="btn btn-primary btn-sm" onClick={()=>{if(!manualUrl.trim()&&!manualTitle.trim())return;const dur=parseInt(manualDur)||0;const vid={title:manualTitle||manualUrl,url:manualUrl,dur};const arr=[...entries,{id:Date.now(),videos:[vid],total:dur}];updateStudy({entries:arr});setManualUrl("");setManualTitle("");setManualDur("");}}>Add as new entry</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

function EntryCard({entry,idx,done,onDone,onUndone,onAddVideo,onRemoveVideo,showAddVideo,manualUrl,setManualUrl,manualTitle,setManualTitle,manualDur,setManualDur,onSaveVideo,onCancelVideo,label}){
  const pct=Math.min(100,Math.round((entry.total/65)*100));
  return(
    <div className="study-card">
      <div style={{padding:"12px 15px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <span style={{fontFamily:"var(--mono)",fontSize:"0.68rem",color:"var(--text3)"}}>{label||`Entry ${idx+1}`}</span>
          <span className={`badge ${done?"badge-green":"badge-amber"}`}>{done?"✓ Done":"Pending"}</span>
        </div>
        <div style={{fontFamily:"var(--mono)",fontSize:"0.65rem",color:"var(--text3)"}}>{entry.videos.length} video{entry.videos.length!==1?"s":""} · {fmtMin(entry.total)}</div>
      </div>
      {entry.videos.map((v,i)=>(
        <div key={i} className="video-row">
          <span className="video-num">{i+1}</span>
          <div style={{flex:1,minWidth:0}}><div className="video-title">{v.title}</div><div className="video-url" onClick={()=>window.open(v.url,"_blank")}>{v.url}</div></div>
          <span className="video-dur">{fmtMin(v.dur)}</span>
          <button className="btn-icon btn-sm" style={{color:"var(--text4)"}} onClick={()=>onRemoveVideo(i)}>✕</button>
        </div>
      ))}
      {showAddVideo&&(
        <div style={{padding:"8px 15px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:6,flexWrap:"wrap"}}>
          <input className="inp" style={{flex:2,minWidth:160,fontSize:"0.8rem",padding:"5px 8px"}} placeholder="YouTube URL" value={manualUrl} onChange={e=>setManualUrl(e.target.value)}/>
          <input className="inp" style={{flex:2,minWidth:130,fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Title (optional)" value={manualTitle} onChange={e=>setManualTitle(e.target.value)}/>
          <input className="inp" style={{width:76,fontSize:"0.8rem",padding:"5px 8px"}} placeholder="Min" type="number" value={manualDur} onChange={e=>setManualDur(e.target.value)}/>
          <button className="btn btn-primary btn-sm" onClick={onSaveVideo}>Add</button>
          <button className="btn-icon btn-sm" onClick={onCancelVideo}>✕</button>
        </div>
      )}
      <div style={{padding:"10px 15px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontFamily:"var(--mono)",fontSize:"0.8rem",fontWeight:500,color:"var(--text)",whiteSpace:"nowrap"}}>{fmtMin(entry.total)}</span>
        <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{width:`${pct}%`,background:entry.total>65?"var(--amber)":"var(--green)",boxShadow:`0 0 8px ${entry.total>65?"var(--amber-dim)":"var(--green-glow)"}`}}/></div>
        <button className="btn-icon btn-sm" onClick={onAddVideo}>+ video</button>
        {done?<button className="btn btn-ghost btn-sm" onClick={onUndone}>Undo</button>:<button className="btn btn-success btn-sm" onClick={onDone}>Mark done</button>}
      </div>
    </div>
  );
}

function TodayDashboard({agendas,setAgendas,study,setStudy}){
  const pendingTasks=[];
  (agendas||[]).forEach(ag=>{
    const agDone=ag.tasks?.length>0&&ag.tasks.every(t=>t.done);if(agDone)return;
    (ag.tasks||[]).forEach(task=>{if(task.done)return;const days=getDaysLeft(task.deadline);if(!task.deadline||(days!==null&&days<=0))pendingTasks.push({agendaTitle:ag.title,agendaId:ag.id,task,days});});
    if(ag.tasks?.length===0&&ag.deadline){const days=getDaysLeft(ag.deadline);if(days!==null&&days<=0)pendingTasks.push({agendaTitle:ag.title,agendaId:ag.id,task:{title:"(Agenda deadline)",id:"ag-"+ag.id,done:false,deadline:ag.deadline},days,isAgenda:true});}
  });
  const entries=study?.entries||[];const completed=study?.completed||{};
  const todayStudyIdx=entries.findIndex((_,i)=>!completed[i]);
  const todayStudyEntry=todayStudyIdx>=0?entries[todayStudyIdx]:null;
  const markStudyDone=()=>setStudy(s=>({...s,completed:{...s.completed,[todayStudyIdx]:true}}));
  const markStudyUndone=()=>setStudy(s=>{const c={...s.completed};delete c[todayStudyIdx];return{...s,completed:c};});
  const toggleAgendaTask=(agendaId,taskId)=>setAgendas(a=>a.map(ag=>ag.id===agendaId?{...ag,tasks:ag.tasks.map(t=>t.id===taskId?{...t,done:!t.done}:t)}:ag));
  const todayStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const totalAgendas=(agendas||[]).length;
  const doneAgendas=(agendas||[]).filter(ag=>ag.tasks?.length>0&&ag.tasks.every(t=>t.done)).length;
  const totalStudyDone=Object.values(completed).filter(Boolean).length;
  const studyStreak=(()=>{let s=0;for(let i=totalStudyDone-1;i>=0;i--){if(completed[i])s++;else break;}return s;})();

  return(
    <div>
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text3)",letterSpacing:".08em",marginBottom:4}}>TODAY</div>
        <div style={{fontSize:"1.2rem",fontWeight:700,color:"var(--text)"}}>{todayStr}</div>
      </div>
      <div className="stat-grid" style={{marginBottom:18}}>
        {[["Pending",pendingTasks.filter(p=>!p.task.done).length,"tasks","var(--red)"],["Agendas",doneAgendas+"/"+totalAgendas,"completed","var(--indigo)"],["Streak",studyStreak,"study days","var(--amber)"],["Study",totalStudyDone,"entries done","var(--green)"]].map(([l,v,s,c])=>(
          <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className="stat-value" style={{color:c}}>{v}</div><div className="stat-sub">{s}</div></div>
        ))}
      </div>
      <div style={{marginBottom:18}}>
        <div className="section-label">PENDING TASKS<span>{pendingTasks.filter(p=>!p.task.done).length} remaining</span></div>
        {pendingTasks.length===0
          ?<div className="study-card" style={{padding:14,textAlign:"center",color:"var(--green)",fontFamily:"var(--mono)",fontSize:"0.8rem",borderColor:"rgba(52,211,153,0.15)"}}>✓ No pending tasks for today</div>
          :pendingTasks.map((p,i)=>(
            <div key={i} className={`today-task${p.days!==null&&p.days<0?" overdue":""}`} onClick={()=>!p.isAgenda&&toggleAgendaTask(p.agendaId,p.task.id)}>
              <div className={`task-check${p.task.done?" done":""}`}>{p.task.done&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"0.85rem",color:p.task.done?"var(--text3)":"var(--text)",textDecoration:p.task.done?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.task.title}</div>
                <div style={{fontSize:"0.65rem",color:"var(--text3)",marginTop:2}}>{p.agendaTitle}</div>
              </div>
              {p.task.deadline&&<DeadlineBadge dateStr={p.task.deadline} done={p.task.done} sm/>}
            </div>
          ))
        }
      </div>
      <div>
        <div className="section-label" style={{marginBottom:8}}>TODAY'S STUDY SESSION</div>
        {!todayStudyEntry
          ?<div className="study-card" style={{padding:14,color:"var(--text3)",fontFamily:"var(--mono)",fontSize:"0.8rem",textAlign:"center"}}>{entries.length===0?"No study plan yet — go to Study Tracker → ⚙ Setup":"🎉 All study entries completed!"}</div>
          :<EntryCard entry={todayStudyEntry} idx={todayStudyIdx} done={!!completed[todayStudyIdx]} onDone={markStudyDone} onUndone={markStudyUndone} onAddVideo={()=>{}} onRemoveVideo={()=>{}} showAddVideo={false} manualUrl="" setManualUrl={()=>{}} manualTitle="" setManualTitle={()=>{}} manualDur="" setManualDur={()=>{}} onSaveVideo={()=>{}} onCancelVideo={()=>{}} label={`Study entry ${todayStudyIdx+1}`}/>
        }
      </div>
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(undefined);
  const [authLoading,setAuthLoading]=useState(false);
  const [agendas,setAgendas]=useState([]);
  const [categories,setCategories]=useState([]);
  const [study,setStudy]=useState({entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});
  const [loaded,setLoaded]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [lastSaved,setLastSaved]=useState(null);
  const [tab,setTab]=useState("today");
  const saveTimer=useRef();

  useEffect(()=>{
    const unsub=onAuthChange(async(u)=>{
      setUser(u);
      if(u){const data=await loadUserData(u.uid);if(data){setAgendas(data.agendas||[]);setCategories(data.categories||[]);setStudy(data.study||{entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});}setLoaded(true);}
      else{setLoaded(false);setAgendas([]);setCategories([]);setStudy({entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});}
    });
    return unsub;
  },[]);

  const persist=useCallback((ag,cats,st)=>{
    if(!user)return;clearTimeout(saveTimer.current);setSyncing(true);
    saveTimer.current=setTimeout(async()=>{try{await saveUserData(user.uid,{agendas:ag,categories:cats,study:st});setLastSaved(new Date());}catch(e){console.error(e);}setSyncing(false);},1500);
  },[user]);

  useEffect(()=>{if(loaded)persist(agendas,categories,study);},[agendas,categories,study,loaded]);

  const handleSignIn=async()=>{setAuthLoading(true);try{await signInWithGoogle();}catch(e){console.error(e);}setAuthLoading(false);};
  const handleSignOut=async()=>{await signOutUser();setAgendas([]);setCategories([]);setStudy({entries:[],completed:{},playlists:[],maxLen:65,startDate:today(),apiKey:""});setLoaded(false);};

  if(user===undefined)return<div style={{minHeight:"100vh",background:"#080810",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{GLOBAL_CSS}</style><div className="loading-spinner"/></div>;
  if(!user)return<SignInScreen onSignIn={handleSignIn} loading={authLoading}/>;

  const overdueCount=(()=>{let n=0;(agendas||[]).forEach(ag=>{(ag.tasks||[]).forEach(t=>{if(!t.done&&t.deadline&&getDaysLeft(t.deadline)<=0)n++;});});return n;})();

  return(
    <div className="app-shell">
      <style>{GLOBAL_CSS}</style>
      <div className="app-content">
        <div className="header">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <AppIcon size={32}/>
            <div>
              <div className="logo-text">AGENDA<span>BOARD</span></div>
              <div style={{fontFamily:"var(--mono)",fontSize:"0.56rem",color:"var(--text4)",marginTop:1}}>{agendas.length} agendas · {(study.entries||[]).length} study entries</div>
            </div>
          </div>
          <div className="nav-tabs">
            {[["today","Today"],["agendas","Agendas"],["study","Study"]].map(([t,l])=>(
              <button key={t} className={`nav-tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>
                {l}{t==="today"&&overdueCount>0&&<span className="dot"/>}
              </button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:5,fontFamily:"var(--mono)",fontSize:"0.6rem",color:"var(--text3)"}}>
              <div className="sync-dot" style={{background:syncing?"var(--amber)":lastSaved?"var(--green)":"var(--text3)",boxShadow:syncing?"0 0 6px rgba(251,191,36,0.4)":lastSaved?"0 0 6px var(--green-glow)":"none"}}/>
              {syncing?"saving…":lastSaved?"synced":"ready"}
            </div>
            {user.photoURL?<img src={user.photoURL} alt="" style={{width:28,height:28,borderRadius:"50%",border:"1px solid var(--glass-border)",flexShrink:0}}/>
              :<div className="user-avatar">{user.displayName?.[0]||"?"}</div>}
            <button className="signout-btn" onClick={handleSignOut}>out</button>
          </div>
        </div>
        <div className="page">
          {tab==="today"&&<TodayDashboard agendas={agendas} setAgendas={setAgendas} study={study} setStudy={setStudy}/>}
          {tab==="agendas"&&<AgendaSection agendas={agendas} setAgendas={setAgendas} categories={categories} setCategories={setCategories}/>}
          {tab==="study"&&<StudySection study={study} setStudy={setStudy}/>}
        </div>
      </div>
    </div>
  );
}
