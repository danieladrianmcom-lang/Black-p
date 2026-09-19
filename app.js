const META=20000, KEY="plano20k_blackpurple_v2";
const CATS={income:["corridas"],expense:["alimentacao","moto","manutencao","gasolina","passe","aluguel","conta","outros"]};
const LABEL={corridas:"Faturamento / corrida",alimentacao:"Alimentação",moto:"Aluguel da moto",manutencao:"Manutenção",gasolina:"Gasolina",passe:"Passe Uber",aluguel:"Aluguel",conta:"Conta fixa",outros:"Outros"};
let db=JSON.parse(localStorage.getItem(KEY)||"{}"), view=new Date(), deferred=null, selected=localDate(new Date());
function localDate(d){const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)}
function br(d){return new Date(d+"T12:00:00").toLocaleDateString("pt-BR")}
function monthName(d){return d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
function money(n){return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function allEntries(){return Object.entries(db).flatMap(([date,arr])=>arr.map((e,i)=>({...e,date,index:i}))).sort((a,b)=>(b.date.localeCompare(a.date)||b.created-a.created))}
function getDay(d){return db[d]||[]}
function totals(d){return getDay(d).reduce((a,e)=>{if(e.type==="income")a.income+=e.amount;else a.expense+=e.amount;return a},{income:0,expense:0,net:0})}
function billInfo(s){let d=new Date(s+"T12:00:00"), out=[];if(d.getDay()===4)out.push(["🏍️ Moto",365]);if(d.getDate()===10)out.push(["🏠 Aluguel",550]);if(d.getDate()===22)out.push(["📄 Conta",340]);return out}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function setCategories(){let type=document.getElementById("type").value, sel=document.getElementById("category");sel.innerHTML=CATS[type].map(x=>`<option value="${x}">${LABEL[x]}</option>`).join("");let fc=document.getElementById("filterCategory");if(!fc)return;fc.innerHTML='<option value="all">Todas as categorias</option>'+Object.keys(LABEL).map(x=>`<option value="${x}">${LABEL[x]}</option>`).join("")}
function add(date,type,cat,amount,note){if(!db[date])db[date]=[];db[date].push({type,category:cat,amount:Number(amount),note:note||"",created:Date.now()});save();render()}
function remove(date,index){if(!db[date])return;db[date].splice(index,1);if(!db[date].length)delete db[date];save();render()}
function row(e,compact=false){let r=document.createElement("div");r.className="row";let sign=e.type==="income"?"+":"-", cls=e.type==="income"?"positive":"negative";r.innerHTML=`<div class="row-main"><b>${LABEL[e.category]}</b><small>${br(e.date)}${e.note?" • "+e.note:""}</small></div><div><span class="row-value ${cls}">${sign} ${money(e.amount)}</span><button class="delete">✕</button></div>`;r.querySelector(".delete").onclick=()=>remove(e.date,e.index);return r}
function renderSummary(){let es=allEntries(), income=es.filter(e=>e.type==="income").reduce((a,e)=>a+e.amount,0), expense=es.filter(e=>e.type==="expense").reduce((a,e)=>a+e.amount,0), net=income-expense, pct=Math.max(0,Math.min(100,net/META*100));document.getElementById("totalSaved").textContent=money(net);document.getElementById("remaining").textContent="Faltam "+money(Math.max(0,META-net));document.getElementById("percent").textContent=pct.toFixed(1)+"%";document.getElementById("progressBar").style.width=pct+"%";document.getElementById("sixRevenue").textContent=money(income);document.getElementById("sixExpenses").textContent=money(expense);document.getElementById("sixNet").textContent=money(net);document.getElementById("daysUsed").textContent=new Set(es.map(e=>e.date)).size}
function renderCalendar(){let y=view.getFullYear(),m=view.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),start=first.getDay(),cal=document.getElementById("calendar");document.getElementById("monthTitle").textContent=monthName(first);cal.innerHTML="";for(let i=0;i<start;i++){let x=document.createElement("div");x.className="day empty";cal.appendChild(x)}for(let n=1;n<=days;n++){let d=new Date(y,m,n),s=localDate(d),t=totals(s),b=billInfo(s),x=document.createElement("div");x.className="day"+(s===localDate(new Date())?" today":"");x.innerHTML=`<div class="daynum">${n}</div>${b.map(q=>`<div class="daybill">${q[0]} ${money(q[1])}</div>`).join("")}${t.income||t.expense?`<div class="daydata positive">+${money(t.income)}</div><div class="daydata negative">-${money(t.expense)}</div><div class="daynet ${t.net>0?"positive":t.net<0?"negative":"neutral"}">${money(t.net)}</div>`:""}`;x.onclick=()=>openModal(s);cal.appendChild(x)}}
function openModal(s){selected=s;let t=totals(s),b=billInfo(s);document.getElementById("modalDate").textContent=br(s);document.getElementById("modalTotals").textContent=`Faturamento ${money(t.income)} • Gastos ${money(t.expense)} • Líquido ${money(t.income-t.expense)}`;document.getElementById("modalBills").innerHTML=b.map(q=>`<span class="bill-tag">${q[0]} — ${money(q[1])} (não descontado)</span>`).join("");let box=document.getElementById("modalEntries");box.innerHTML="";getDay(s).map((e,i)=>({...e,date:s,index:i})).forEach(e=>box.appendChild(row(e)));document.getElementById("dayModal").classList.remove("hidden")}
function renderRevenue(){let now=new Date(), today=localDate(now), es=allEntries(), t=totals(today);document.getElementById("revToday").textContent=money(t.income);let weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());let ws=localDate(weekStart);document.getElementById("revWeek").textContent=money(es.filter(e=>e.type==="income"&&e.date>=ws&&e.date<=today).reduce((a,e)=>a+e.amount,0));let ms=today.slice(0,7), monthEs=es.filter(e=>e.type==="income"&&e.date.startsWith(ms)), monthTotal=monthEs.reduce((a,e)=>a+e.amount,0);document.getElementById("revMonth").textContent=money(monthTotal);let days=new Set(monthEs.map(e=>e.date)).size;document.getElementById("revAvg").textContent=money(days?monthTotal/days:0);let groups={};monthEs.forEach(e=>(groups[e.date]??=[]).push(e));let list=document.getElementById("revenueList");list.innerHTML="";Object.keys(groups).sort().reverse().forEach(d=>{let total=groups[d].reduce((a,e)=>a+e.amount,0),r=document.createElement("div");r.className="row";r.innerHTML=`<div class="row-main"><b>${br(d)}</b><small>${groups[d].length} lançamento(s)</small></div><span class="row-value positive">+ ${money(total)}</span>`;r.onclick=()=>openModal(d);list.appendChild(r)});if(!Object.keys(groups).length)list.innerHTML='<div class="row"><div class="row-main"><small>Nenhum faturamento lançado neste mês.</small></div></div>'}
function renderAllEntries(){let fd=document.getElementById("filterDate").value,ft=document.getElementById("filterType").value,fc=document.getElementById("filterCategory").value,list=document.getElementById("allEntries");let es=allEntries().filter(e=>(!fd||e.date===fd)&&(ft==="all"||e.type===ft)&&(fc==="all"||e.category===fc));list.innerHTML="";es.forEach(e=>list.appendChild(row(e)));if(!es.length)list.innerHTML='<div class="row"><div class="row-main"><small>Nenhum lançamento encontrado.</small></div></div>'}
function render(){renderSummary();renderCalendar();renderRevenue();renderAllEntries()}
function showTab(name){
  document.querySelectorAll(".tab").forEach(function(btn){
    btn.classList.toggle("active", btn.getAttribute("data-tab")===name);
  });
  document.querySelectorAll(".tab-content").forEach(function(panel){
    panel.classList.toggle("active", panel.id===name+"Tab");
  });
  if(name==="calendar") renderCalendar();
  if(name==="revenue") renderRevenue();
  if(name==="entries") renderAllEntries();
}
document.querySelectorAll(".tab").forEach(function(btn){
  btn.addEventListener("click", function(ev){
    ev.preventDefault();
    showTab(btn.getAttribute("data-tab"));
  });
});
document.getElementById("type").onchange=setCategories;
document.getElementById("entryForm").onsubmit=e=>{e.preventDefault();add(document.getElementById("date").value,document.getElementById("type").value,document.getElementById("category").value,document.getElementById("amount").value,document.getElementById("note").value);e.target.reset();document.getElementById("date").value=selected;setCategories()};
document.getElementById("prev").onclick=()=>{view.setMonth(view.getMonth()-1);renderCalendar()};document.getElementById("next").onclick=()=>{view.setMonth(view.getMonth()+1);renderCalendar()};
["filterDate","filterType","filterCategory"].forEach(id=>document.getElementById(id).onchange=renderAllEntries);
document.getElementById("quickRevenue").onclick=()=>{showTab("entries");document.getElementById("type").value="income";setCategories();document.getElementById("category").value="corridas";document.getElementById("date").value=localDate(new Date());document.getElementById("amount").focus()};
document.getElementById("closeModal").onclick=()=>document.getElementById("dayModal").classList.add("hidden");
document.getElementById("modalAdd").onclick=()=>{document.getElementById("dayModal").classList.add("hidden");showTab("entries");document.getElementById("date").value=selected;document.getElementById("amount").focus()};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;document.getElementById("installBtn").classList.remove("hidden")});document.getElementById("installBtn").onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;document.getElementById("installBtn").classList.add("hidden")}};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
document.getElementById("date").value=selected;setCategories();render();