const storageKey='prepkit-progress-v2';
const notesKey='prepkit-system-notes-v1';
const today=new Date();
const dateKey=(date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayNumber=Math.floor(new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime()/86400000);
const setText=(selector,value)=>{const element=document.querySelector(selector);if(element)element.textContent=value??''};
let content,history={};

try{history=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{history={}}
// Keep completion history from the first static version of Prepkit.
if(!Object.keys(history).length){try{const old=JSON.parse(localStorage.getItem('prepkit-progress-v1')||'{}');history=Object.fromEntries(Object.entries(old).map(([date,tasks])=>[date,{tasks:(tasks||[]).map(type=>({type,title:type==='systems'?'System design practice':type==='coding'?'Coding practice':'Engineering trends'}))}]));}catch{}}

function saveHistory(){localStorage.setItem(storageKey,JSON.stringify(history));}
function completedTypes(){return (history[dateKey(today)]?.tasks||[]).map(item=>item.type);}
function dailyContent(){
  const coding=content.coding[dayNumber%content.coding.length];
  const system=content.systems[dayNumber%content.systems.length];
  return {coding,system,trend:content.trend};
}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function renderCard(type,item){
  const colors={coding:'mint',systems:'blue',trends:'violet'},icons={coding:'⌘',systems:'▤',trends:'↗'},durations={coding:'15 MIN',systems:'20 MIN',trends:'10 MIN'},kickers={coding:'CODING FUNDAMENTALS',systems:'SYSTEM DESIGN',trends:'ENGINEERING TRENDS'},taskDone=completedTypes().includes(type);
  const title=type==='trends'?item.title:item.title;
  const description=type==='coding'?`Practice a core ${item.topic.toLowerCase()} pattern with a clear, efficient solution.`:type==='systems'?`Reason through tradeoffs in ${item.topic.toLowerCase()} with a structured design discussion.`:item.intro;
  const link=`<a class="practice-link" href="#${type}" data-route="${type}">Open ${type==='systems'?'system design':type==='coding'?'coding workspace':'trend briefing'} <span>→</span></a>`;
  let detail='';
  if(type==='coding')detail=`<div class="tag-row"><span>${escapeHtml(item.topic)}</span><span>${escapeHtml(item.tag)}</span><span class="level">${escapeHtml(item.level).toUpperCase()}</span></div><div class="question-box"><div class="box-label">THE PROMPT</div><p>${escapeHtml(item.prompt)}</p><button class="reveal-button" data-reveal="hint1">Show a hint <span>＋</span></button><p class="hint hidden" id="hint1">${escapeHtml(item.hint)}</p></div>`;
  if(type==='systems')detail=`<div class="tag-row"><span>${escapeHtml(item.topic)}</span><span>${escapeHtml(item.tag)}</span></div><div class="question-box"><div class="box-label">THE SCENARIO</div><p>${escapeHtml(item.scenario)}</p><button class="reveal-button" data-reveal="hint2">Show a discussion guide <span>＋</span></button><p class="hint hidden" id="hint2">${escapeHtml(item.guide[0])}</p></div>`;
  if(type==='trends')detail=`<div class="trend-points">${item.points.map(point=>`<div><span class="point-icon">◎</span><p><strong>${escapeHtml(point.title)}</strong><br />${escapeHtml(point.text)}</p></div>`).join('')}</div><a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Read ${escapeHtml(item.sourceTitle)} ↗</a>`;
  return `<article class="plan-card ${type==='systems'?'system-card':type==='coding'?'coding-card':'trend-card'}"><div class="card-top"><span class="category-icon ${colors[type]}">${icons[type]}</span><span class="duration">${durations[type]}</span></div><div class="card-kicker">${kickers[type]}${type==='trends'?'<span class="fresh">UPDATED</span>':''}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${detail}${link}<button class="complete-button ${taskDone?'completed':''}" data-task="${type}"><span class="check-circle">✓</span><span>${taskDone?'Completed':'Mark as complete'}</span><span class="button-arrow">→</span></button></article>`;
}
function renderToday(){
  const daily=dailyContent();
  document.querySelector('#todayCards').innerHTML=renderCard('coding',daily.coding)+renderCard('systems',daily.system)+renderCard('trends',daily.trend);
  const radar=document.querySelector('#radarCard');radar.innerHTML=`<div class="reading-head"><div><div class="eyebrow muted">ON YOUR RADAR · ${escapeHtml(daily.trend.updated||'')}</div><h3>${escapeHtml(daily.trend.readingTitle)}</h3></div><span class="reading-icon">↗</span></div><p>${escapeHtml(daily.trend.readingSummary)}</p><a href="${escapeHtml(daily.trend.readingUrl)}" target="_blank" rel="noreferrer">Explore the report <span>↗</span></a><div class="source-meta">SOURCE LINKED IN LOCAL CONTENT</div>`;
  document.querySelectorAll('[data-reveal]').forEach(bindReveal);
}
function renderCoding(){
  const item=dailyContent().coding;
  setText('#codingTopic',item.topic.toUpperCase());setText('#codingTitle',item.title);setText('#codingPrompt',item.prompt);setText('#codingHint',item.hint);
  document.querySelector('#codingDetails').innerHTML=`<div class="challenge-meta"><span>${escapeHtml(item.tag)}</span><span class="level">${escapeHtml(item.level).toUpperCase()}</span></div><p>Implement <code>solve(input)</code> in JavaScript. Pass all the sample checks to complete the coding session.</p>`;
  document.querySelector('#sampleCases').innerHTML=item.cases.map((test,index)=>`<div class="sample-case"><span>CASE ${index+1}</span><code>solve(${escapeHtml(JSON.stringify(test.input))}) → ${escapeHtml(JSON.stringify(test.expected))}</code></div>`).join('');
  const editor=document.querySelector('#codeEditor'),saved=localStorage.getItem(`prepkit-code-${item.id}`);
  editor.value=saved??item.starter;
  document.querySelector('#runResults').innerHTML='';
  document.querySelector('#runCode').onclick=()=>runChecks(item,editor.value);
  editor.oninput=()=>{localStorage.setItem(`prepkit-code-${item.id}`,editor.value);document.querySelector('#runResults').innerHTML='';if(completedTypes().includes('coding'))unmarkTask('coding');};
  document.querySelectorAll('[data-task="coding"]').forEach(button=>setTaskButton(button,completedTypes().includes('coding')));
  const concept=item.concept;
  document.querySelector('#conceptTitle').textContent=concept.title;document.querySelector('#conceptSummary').textContent=concept.summary;
  let step=0;
  const drawStep=()=>{const data=concept.steps[step];setText('#conceptStepLabel',`STEP ${step+1} OF ${concept.steps.length}`);setText('#conceptStepTitle',data.label);setText('#conceptStepDetail',data.detail);document.querySelector('#conceptVisual').innerHTML=data.visual.map(bit=>`<div class="visual-token"><span>${escapeHtml(bit.label)}</span><strong>${escapeHtml(bit.value)}</strong></div>`).join('');document.querySelector('#conceptPrevious').disabled=step===0;document.querySelector('#conceptNext').disabled=step===concept.steps.length-1;document.querySelector('#conceptProgress').style.width=`${(step+1)/concept.steps.length*100}%`;};
  document.querySelector('#conceptPrevious').onclick=()=>{step=Math.max(0,step-1);drawStep();};document.querySelector('#conceptNext').onclick=()=>{step=Math.min(concept.steps.length-1,step+1);drawStep();};drawStep();
  document.querySelectorAll('[data-reveal="codingHint"]').forEach(bindReveal);
}
function normalize(value,mode){
  if(mode==='groups')return JSON.stringify(value.map(group=>group.map(String).sort()).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
  if(mode==='unordered')return JSON.stringify([...value].sort((a,b)=>String(a).localeCompare(String(b))));
  return JSON.stringify(value);
}
function runChecks(item,source){
  const output=document.querySelector('#runResults'),button=document.querySelector('#runCode');output.innerHTML='<div class="run-status">Running sample checks…</div>';button.disabled=true;
  const tests=JSON.stringify(item.cases);
  const workerSource=`const cases=${tests};\ntry {\n${source}\nconst passed=[];for(const test of cases){try{const actual=solve(JSON.parse(JSON.stringify(test.input)));const mode=test.compare||'deep';const norm=(value,kind)=>kind==='groups'?JSON.stringify(value.map(group=>group.map(String).sort()).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))):kind==='unordered'?JSON.stringify([...value].sort((a,b)=>String(a).localeCompare(String(b)))):JSON.stringify(value);passed.push({ok:norm(actual,mode)===norm(test.expected,mode),expected:test.expected,actual});}catch(error){passed.push({ok:false,error:error?.message||String(error)});}}self.postMessage({passed});\n} catch(error) { self.postMessage({fatal:error?.message||String(error)}); }`;
  const blob=new Blob([workerSource],{type:'text/javascript'}),url=URL.createObjectURL(blob),worker=new Worker(url);let finished=false;
  const timer=setTimeout(()=>{if(finished)return;finished=true;worker.terminate();URL.revokeObjectURL(url);button.disabled=false;output.innerHTML='<div class="run-status fail">Stopped: the solution exceeded the 2 second time limit.</div>';},2000);
  worker.onmessage=({data})=>{if(finished)return;finished=true;clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);button.disabled=false;if(data.fatal){output.innerHTML=`<div class="run-status fail">Syntax error: ${escapeHtml(data.fatal)}</div>`;return;}const passed=data.passed.filter(test=>test.ok).length,total=data.passed.length,rows=data.passed.map((test,index)=>`<div class="case-result ${test.ok?'pass':'fail'}"><span>${test.ok?'✓':'×'} Case ${index+1}</span>${test.ok?'Passed':`Expected ${escapeHtml(JSON.stringify(test.expected))}; received ${escapeHtml(JSON.stringify(test.actual??test.error))}`}</div>`).join('');output.innerHTML=`<div class="run-status ${passed===total?'pass':'fail'}">${passed===total?'All checks passed':`${passed} of ${total} checks passed`}</div>${rows}`;if(passed===total)markTask('coding',item.title);};
  worker.onerror=(event)=>{if(finished)return;finished=true;clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);button.disabled=false;output.innerHTML=`<div class="run-status fail">Could not run this solution: ${escapeHtml(event.message||'worker error')}</div>`;};
}
function renderSystems(){
  const item=dailyContent().system;setText('#systemTopic',item.topic.toUpperCase());setText('#systemTitle',item.title);setText('#systemScenario',item.scenario);
  document.querySelector('#systemGuide').innerHTML=item.guide.map(point=>`<li>${escapeHtml(point)}</li>`).join('');
  const key=`${notesKey}-${item.id}`,notes=document.querySelector('#designNotes');notes.value=localStorage.getItem(key)||'';notes.oninput=()=>localStorage.setItem(key,notes.value);
  document.querySelectorAll('[data-task="systems"]').forEach(button=>setTaskButton(button,completedTypes().includes('systems')));document.querySelectorAll('[data-reveal="systemGuide"]').forEach(bindReveal);
}
function renderTrends(){
  const item=dailyContent().trend;setText('#trendTitle',item.title);setText('#trendIntro',item.intro);setText('#trendUpdated',item.updated?new Date(`${item.updated}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'');
  document.querySelector('#trendPoints').innerHTML=item.points.map((point,index)=>`<article class="trend-detail-card"><span class="trend-step">0${index+1}</span><h2>${escapeHtml(point.title)}</h2><p>${escapeHtml(point.text)}</p></article>`).join('');
  document.querySelector('#trendReading').innerHTML=`<div class="reading-head"><div><div class="eyebrow muted">SOURCE BRIEFING</div><h3>${escapeHtml(item.readingTitle)}</h3></div><span class="reading-icon">↗</span></div><p>${escapeHtml(item.readingSummary)}</p><a href="${escapeHtml(item.readingUrl)}" target="_blank" rel="noreferrer">Read the source report <span>↗</span></a><div class="source-meta">CONTENT LAST UPDATED ${escapeHtml(item.updated||'')}</div>`;
  document.querySelectorAll('[data-task="trends"]').forEach(button=>setTaskButton(button,completedTypes().includes('trends')));
}
function renderHistory(){
  const entries=Object.entries(history).filter(([,value])=>value?.tasks?.length).sort(([a],[b])=>b.localeCompare(a));
  const target=document.querySelector('#historyList');
  if(!entries.length){target.innerHTML='<div class="empty-history"><span>◴</span><h2>Your completed sessions will show up here.</h2><p>Finish a practice section and it will be saved by date, with its title and category.</p><a href="#today" data-route="today">Go to today’s plan →</a></div>';return;}
  target.innerHTML=entries.map(([date,entry])=>`<article class="history-day"><div class="history-date"><span>${new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{weekday:'short'}).toUpperCase()}</span><strong>${new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</strong></div><div class="history-tasks">${entry.tasks.map(task=>`<div class="history-task"><span class="history-check">✓</span><div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.type==='systems'?'System design':task.type==='trends'?'Engineering trends':'Coding fundamentals')}</small></div></div>`).join('')}</div><span class="history-count">${entry.tasks.length} section${entry.tasks.length===1?'':'s'} completed</span></article>`).join('');
}
function setTaskButton(button,done){button.classList.toggle('completed',done);const label=button.querySelector('span:nth-child(2)');if(label)label.textContent=done?'Completed':button.dataset.task==='coding'?'Mark coding practice complete':button.dataset.task==='systems'?'Mark system design complete':button.dataset.task==='trends'?'Mark engineering trends complete':'Mark as complete';}
function markTask(type,title){
  const key=dateKey(today);history[key]??={tasks:[]};if(!history[key].tasks.some(task=>task.type===type))history[key].tasks.push({type,title});saveHistory();updateProgress();renderHistory();
}
function unmarkTask(type){const key=dateKey(today);if(!history[key])return;history[key].tasks=history[key].tasks.filter(task=>task.type!==type);if(!history[key].tasks.length)delete history[key];saveHistory();updateProgress();renderHistory();}
function updateProgress(){
  const done=completedTypes(),count=done.length;setText('#progressText',`${count} of 3 completed`);document.querySelector('#progressFill').style.width=`${count/3*100}%`;
  document.querySelectorAll('[data-task]').forEach(button=>setTaskButton(button,done.includes(button.dataset.task)));
  let streak=0;for(let offset=0;offset<370;offset++){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-offset),tasks=history[dateKey(d)]?.tasks||[];if(tasks.length>=3)streak++;else if(offset>0)break;}
  setText('#streakCount',`${streak} day${streak===1?'':'s'} completed`);
  const week=document.querySelector('#weekDots');week.innerHTML='';const monday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-((today.getDay()+6)%7));
  for(let index=0;index<7;index++){const date=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+index),dot=document.createElement('span');dot.className='week-dot';if((history[dateKey(date)]?.tasks||[]).length) {dot.classList.add('done');dot.textContent='✓';}if(dateKey(date)===dateKey(today))dot.classList.add('today');week.append(dot);}
}
function bindReveal(button){button.onclick=()=>{const hint=document.getElementById(button.dataset.reveal);if(!hint)return;const open=hint.classList.toggle('hidden')===false;const symbol=button.querySelector('span');if(symbol)symbol.textContent=open?'−':'＋';button.childNodes[0].textContent=open?'Hide':'Show '+(button.dataset.reveal==='hint1'||button.dataset.reveal==='codingHint'?'a hint':'a discussion guide')+' ';};}
function navigate(route){
  const names={today:'Today',coding:'Coding practice',systems:'System design',trends:'Engineering trends',history:'Past sessions'};
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('hidden',view.id!==`view-${route}`));
  document.querySelectorAll('[data-route]').forEach(link=>link.classList.toggle('active',link.dataset.route===route));
  setText('#breadcrumbCurrent',names[route]||'Today');window.history.replaceState(null,'',`#${route}`);
  if(route==='coding')renderCoding();if(route==='systems')renderSystems();if(route==='trends')renderTrends();if(route==='history')renderHistory();window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',event=>{const routeLink=event.target.closest('[data-route]');if(routeLink){event.preventDefault();navigate(routeLink.dataset.route);}const taskButton=event.target.closest('[data-task]');if(taskButton){event.preventDefault();const type=taskButton.dataset.task;if(type==='coding'){const output=document.querySelector('#runResults');if(output&&!output.textContent.includes('All checks passed')){navigate('coding');document.querySelector('#runResults').innerHTML='<div class="run-status fail">Run all sample checks before completing coding practice.</div>';return;}}markTask(type,dailyContent()[type]?.title||type);}});
document.querySelector('#resetDay').addEventListener('click',()=>{delete history[dateKey(today)];saveHistory();updateProgress();renderToday();});
setText('#todayDate',today.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}));setText('#shortDate',today.toLocaleDateString(undefined,{month:'short',day:'numeric'}).toUpperCase());

fetch('content.json').then(response=>{if(!response.ok)throw new Error('Could not load content.json');return response.json();}).then(data=>{content=data;renderToday();updateProgress();if(location.hash)navigate(location.hash.slice(1));}).catch(error=>{document.querySelector('#todayCards').innerHTML=`<div class="load-error">${escapeHtml(error.message)}. Serve this folder locally with <code>python3 -m http.server 4173</code>, then open <code>http://localhost:4173</code>.</div>`;});
