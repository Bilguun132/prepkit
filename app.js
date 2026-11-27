const storageKey='prepkit-progress-v2';
const notesKey='prepkit-system-notes-v1';
const today=new Date();
const dateKey=(date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dayNumber=Math.floor(new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime()/86400000);
const setText=(selector,value)=>{const element=document.querySelector(selector);if(element)element.textContent=value??''};
const escapeHtml=(value)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let content,topicData,history={},activeItems=[],activeFrames=[],activeFrame=0,playbackTimer=null,selectedTopicId=null,selectedSystemId=null;

try{history=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{history={}}
if(!Object.keys(history).length){try{const old=JSON.parse(localStorage.getItem('prepkit-progress-v1')||'{}');history=Object.fromEntries(Object.entries(old).map(([date,tasks])=>[date,{tasks:(tasks||[]).map(type=>({type,title:type==='systems'?'System design practice':type==='coding'?'Coding practice':'Engineering trends'}))}]));}catch{}}
function saveHistory(){localStorage.setItem(storageKey,JSON.stringify(history));}
function completedTypes(){return (history[dateKey(today)]?.tasks||[]).map(item=>item.type);}
function dailyTopic(){
  return topicData.topics.find(topic=>topic.id===topicData.featuredTopicId)||topicData.topics.at(-1);
}
function activeTopic(){return topicData.topics.find(topic=>topic.id===selectedTopicId)||dailyTopic();}
function dailyContent(){
  const system=content.systems.find(item=>item.id===content.featuredSystemId)||content.systems.at(-1);
  return {coding:dailyTopic(),system,trend:content.trend};
}
function renderUpdatedAt(value){if(!value)return;const date=new Date(value);if(Number.isNaN(date.getTime()))return;setText('#siteUpdated',date.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}));}

function renderCard(type,item){
  const colors={coding:'mint',systems:'blue',trends:'violet'},icons={coding:'⌘',systems:'▤',trends:'↗'},durations={coding:'20 MIN',systems:'20 MIN',trends:'10 MIN'},kickers={coding:'ALGORITHM TOPIC',systems:'SYSTEM DESIGN',trends:'ENGINEERING TRENDS'};
  const description=type==='coding'?item.summary:type==='systems'?`Reason through tradeoffs in ${item.topic.toLowerCase()} with a structured design discussion.`:item.intro;
  const title=item.title;
  let detail='';
  if(type==='coding')detail=`<div class="topic-preview"><strong>${item.questions.length} linked practice questions</strong><span>${item.questions.map(question=>escapeHtml(question.title)).join(' · ')}</span></div>`;
  if(type==='systems')detail=`<div class="tag-row"><span>${escapeHtml(item.topic)}</span><span>${escapeHtml(item.tag)}</span></div><div class="question-box"><div class="box-label">THE SCENARIO</div><p>${escapeHtml(item.scenario)}</p><button class="reveal-button" data-reveal="hint2">Show a discussion guide <span>＋</span></button><p class="hint hidden" id="hint2">${escapeHtml(item.guide[0])}</p></div>`;
  if(type==='trends')detail=`<div class="trend-points">${item.points.map(point=>`<div><span class="point-icon">◎</span><p><strong>${escapeHtml(point.title)}</strong><br />${escapeHtml(point.text)}</p></div>`).join('')}</div><a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">Read ${escapeHtml(item.sourceTitle)} ↗</a>`;
  const label=type==='coding'?'Open today’s lesson':type==='systems'?'Open system design':'Open trend briefing';
  const link=`<a class="practice-link" href="#${type}" data-route="${type}" data-today-link>${label} <span>→</span></a>`;
  const done=completedTypes().includes(type);
  return `<article class="plan-card ${type==='systems'?'system-card':type==='coding'?'coding-card':'trend-card'}"><div class="card-top"><span class="category-icon ${colors[type]}">${icons[type]}</span><span class="duration">${durations[type]}</span></div><div class="card-kicker">${kickers[type]}${type==='trends'&&item.reviewed?`<span class="fresh">REVIEWED ${escapeHtml(shortContentDate(item.reviewed))}</span>`:''}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(type==='coding'?item.subtitle:description)}</p>${detail}${link}<button class="complete-button ${done?'completed':''}" data-task="${type}"><span class="check-circle">✓</span><span>${done?'Completed':'Mark as complete'}</span><span class="button-arrow">→</span></button></article>`;
}
function renderToday(){
  const daily=dailyContent();
  document.querySelector('#todayCards').innerHTML=renderCard('coding',daily.coding)+renderCard('systems',daily.system)+renderCard('trends',daily.trend);
  const radar=document.querySelector('#radarCard');radar.innerHTML=`<div class="reading-head"><div><div class="eyebrow muted">ON YOUR RADAR · ${escapeHtml(daily.trend.updated||'')}</div><h3>${escapeHtml(daily.trend.readingTitle)}</h3></div><span class="reading-icon">↗</span></div><p>${escapeHtml(daily.trend.readingSummary)}</p><a href="${escapeHtml(daily.trend.readingUrl)}" target="_blank" rel="noreferrer">Read the source <span>↗</span></a>`;
  document.querySelectorAll('[data-reveal]').forEach(bindReveal);
}
function setVisualizer(title,concept,visual,label='CORE CONCEPT'){
  stopPlayback();activeItems=visual.items;activeFrames=visual.frames;activeFrame=0;
  setText('#visualLabel',label);setText('#visualTitle',title);setText('#visualConcept',concept);drawFrame();
}
function drawFrame(){
  const frame=activeFrames[activeFrame];if(!frame)return;
  setText('#visualStepCount',`STEP ${activeFrame+1} OF ${activeFrames.length}`);setText('#visualState',frame.state||'');setText('#visualCaption',frame.caption||'');
  document.querySelector('#visualProgress').style.width=`${((activeFrame+1)/activeFrames.length)*100}%`;
  const active=new Set(frame.active||[]),markers={};
  [['L',frame.left],['R',frame.right],['P',frame.pivot]].forEach(([label,index])=>{if(Number.isInteger(index)){markers[index]??=[];markers[index].push(label);}});
  document.querySelector('#visualArray').innerHTML=activeItems.map((item,index)=>`<div class="viz-cell ${active.has(index)?'active':''} ${markers[index]?.includes('L')?'marker-left':''} ${markers[index]?.includes('R')?'marker-right':''} ${markers[index]?.includes('P')?'marker-pivot':''}"><div class="viz-markers">${(markers[index]||[]).map(marker=>`<span>${marker}</span>`).join('')}</div><div class="viz-value">${escapeHtml(item)}</div><div class="viz-index">${index}</div></div>`).join('');
  document.querySelector('#visualPrevious').disabled=activeFrame===0;document.querySelector('#visualNext').disabled=activeFrame===activeFrames.length-1;document.querySelector('#visualPlay').textContent=playbackTimer?'Ⅱ Pause':'▶ Play';
}
function stopPlayback(){if(playbackTimer){clearInterval(playbackTimer);playbackTimer=null;}const button=document.querySelector('#visualPlay');if(button)button.textContent='▶ Play';}
function renderTopicLesson(lesson){
  const panel=document.querySelector('#topicLesson');
  const check=document.querySelector('#topicCheck');
  panel.hidden=check.hidden=!lesson;
  document.querySelector('#topicSummary').hidden=Boolean(lesson);
  if(!lesson){
    panel.innerHTML=check.innerHTML='';
    return;
  }
  const terms=lesson.terms.map(({term,definition})=>`
    <div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd></div>`).join('');
  panel.innerHTML=`
    <h2>Start here</h2>
    <p>${escapeHtml(lesson.intuition)}</p>
    <dl class="lesson-terms">${terms}</dl>
    <h3>How to solve it</h3>
    <ol>${lesson.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol>`;
  check.innerHTML=`
    <h2>Try it</h2>
    <p> ${escapeHtml(lesson.check.question)}</p>
    <details><summary>Check your answer</summary><p>${escapeHtml(lesson.check.answer)}</p></details>`;
}

function renderQuestion(question,index){
  const work=question.walkthrough;
  const details=work?`
    <details class="question-explanation">
      <summary>Read the worked example</summary>
      <dl><dt>Input</dt><dd>${escapeHtml(work.input)}</dd><dt>Expected result</dt><dd>${escapeHtml(work.output)}</dd></dl>
      <ol>${work.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol>
      <p><strong>Why it works</strong> ${escapeHtml(work.whyItWorks)}</p>
      <p><strong>Time and space</strong> ${escapeHtml(work.cost)}</p>
      <p><strong>Common mistake</strong> ${escapeHtml(work.pitfall)}</p>
    </details>`:'';
  return `<article class="question-card">
    <div class="question-card-top"><span class="question-number">${String(question.number).padStart(3,'0')}</span><span class="level">${escapeHtml(question.difficulty).toUpperCase()}</span></div>
    <h3>${escapeHtml(question.title)}</h3><p>${escapeHtml(question.prompt)}</p>
    ${details}
    <div class="question-actions">
      <button class="secondary-button" data-explain-question="${index}">Walk through visually</button>
      <a class="primary-button" href="${escapeHtml(question.url)}" target="_blank" rel="noreferrer">Open in LeetCode ↗</a>
    </div>
  </article>`;
}

function renderTopic(){
  const topic=activeTopic();setText('#topicTitle',topic.title);setText('#topicSubtitle',topic.subtitle);setText('#topicSummary',topic.summary);setText('#questionCount',`${topic.questions.length} QUESTIONS`);
  document.querySelector('#topicPrinciples').innerHTML=topic.principles.map(principle=>`<li>${escapeHtml(principle)}</li>`).join('');
  renderTopicLesson(topic.lesson);
  document.querySelector('#topicQuestions').innerHTML=topic.questions.map(renderQuestion).join('');
  setVisualizer(topic.title,topic.summary,topic.conceptFrames,'CORE CONCEPT');
  document.querySelectorAll('[data-task="coding"]').forEach(button=>setTaskButton(button,completedTypes().includes('coding')));
}
function renderSystemLibrary(){const items=content.systems;document.querySelector('#systemLibrary').innerHTML=items.map(item=>`<button class="system-library-item ${item.id===(selectedSystemId||dailyContent().system.id)?'selected':''}" data-system-id="${escapeHtml(item.id)}"><span>${escapeHtml(item.topic)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.tag||'System design')}</small></button>`).join('');}
function renderTechnologyStack(stack){
  if(!stack.length)return '';
  return `<section class="technology-stack" aria-labelledby="technology-stack-title">
    <h3 id="technology-stack-title">Example technology stack</h3>
    <table>
      <thead><tr><th scope="col">Technology</th><th scope="col">Role and reason</th><th scope="col">Tradeoff</th></tr></thead>
      <tbody>${stack.map(technology=>`<tr>
        <th scope="row">${escapeHtml(technology.name)}</th>
        <td><strong>${escapeHtml(technology.role)}</strong> ${escapeHtml(technology.reason)}</td>
        <td>${escapeHtml(technology.tradeoff)}</td>
      </tr>`).join('')}</tbody>
    </table>
  </section>`;
}

function renderArchitectureBoard(flows,stack=[]){
  if(!flows?.length)return '';
  const technologyNames=new Map(stack.map(technology=>[technology.id,technology.name]));
  return `<section class="architecture-board" aria-label="Architecture board">
    <h3>Architecture board</h3>
    ${flows.map(flow=>`
      <section class="board-flow">
        <h4>${escapeHtml(flow.title)}</h4>
        <ol>${flow.steps.map(step=>{
          const names=(step.stackIds||[]).map(id=>technologyNames.get(id)).filter(Boolean);
          const technologies=names.length?`<span class="board-technology">${escapeHtml(names.join(' · '))}</span>`:'';
          return `<li><strong>${escapeHtml(step.name)}</strong>${technologies}<span>${escapeHtml(step.detail)}</span></li>`;
        }).join('')}</ol>
      </section>
    `).join('')}
  </section>`;
}

function renderSystems(){
  const item=content.systems.find(system=>system.id===selectedSystemId)||dailyContent().system;setText('#systemTopic',item.topic.toUpperCase());setText('#systemTitle',item.title);setText('#systemScenario',item.scenario);
  document.querySelector('#systemGuide').innerHTML=item.guide.map(point=>`<li>${escapeHtml(point)}</li>`).join('');
  const solution=content.systemSolutions[item.id];
  const stack=solution.stack||[];
  document.querySelector('#systemSolution').innerHTML=`
    <p class="solution-intro">${escapeHtml(solution.intro)}</p>
    ${renderArchitectureBoard(solution.board,stack)}
    ${renderTechnologyStack(stack)}
    ${solution.sections.map((section,index)=>`<section class="solution-section"><span>0${index+1}</span><div><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.body)}</p></div></section>`).join('')}`;
  const solutionButton=document.querySelector('#toggleSystemSolution');
  const solutionPanel=document.querySelector('#systemSolution');
  solutionButton.textContent='Show a strong example design';
  solutionButton.setAttribute('aria-expanded','false');
  solutionPanel.classList.add('hidden');
  solutionButton.onclick=()=>{
    const open=!solutionPanel.classList.toggle('hidden');
    solutionButton.textContent=open?'Hide example design':'Show a strong example design';
    solutionButton.setAttribute('aria-expanded',String(open));
  };
  const key=`${notesKey}-${item.id}`,notes=document.querySelector('#designNotes');notes.value=localStorage.getItem(key)||'';notes.oninput=()=>localStorage.setItem(key,notes.value);
  document.querySelectorAll('[data-task="systems"]').forEach(button=>setTaskButton(button,completedTypes().includes('systems')));document.querySelectorAll('[data-reveal="systemGuide"]').forEach(bindReveal);
}
function shortContentDate(value){
  if(!value)return '';
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'});
}

function renderTrends(){
  const item=dailyContent().trend;
  setText('#trendTitle',item.title);
  setText('#trendIntro',item.intro);
  const dates=[item.updated&&`Briefing updated ${shortContentDate(item.updated)}`,item.reviewed&&`Sources checked ${shortContentDate(item.reviewed)}`];
  setText('#trendStatus',dates.filter(Boolean).join(' · '));
  document.querySelector('#trendPoints').innerHTML=item.points.map(point=>`
    <article class="trend-detail-card"><h2>${escapeHtml(point.title)}</h2><p>${escapeHtml(point.text)}</p></article>`).join('');
  const sources=item.sources||[{title:item.readingTitle,url:item.readingUrl,note:item.readingSummary}];
  document.querySelector('#trendReading').innerHTML=`
    <h2>Sources and review notes</h2>
    ${item.reviewSummary?`<p>${escapeHtml(item.reviewSummary)}</p>`:''}
    <ul class="trend-sources">${sources.map(source=>`<li>
      <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} ↗</a>
      <p>${escapeHtml(source.note)}</p>
    </li>`).join('')}</ul>`;
  document.querySelector('#trendHistory').innerHTML=(content.trendHistory||[]).length?`
    <h2>Past briefings</h2>
    ${content.trendHistory.map(briefing=>`
      <details>
        <summary>${escapeHtml(briefing.title)} · ${escapeHtml(shortContentDate(briefing.updated))}</summary>
        <p>${escapeHtml(briefing.intro)}</p>
        <ul>${briefing.points.map(point=>`<li><strong>${escapeHtml(point.title)}</strong> ${escapeHtml(point.text)}</li>`).join('')}</ul>
        <a href="${escapeHtml(briefing.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(briefing.sourceTitle)} ↗</a>
      </details>`).join('')}`:'';
  document.querySelectorAll('[data-task="trends"]').forEach(button=>setTaskButton(button,completedTypes().includes('trends')));
}
function renderTopicLibrary(){const topics=topicData.topics;setText('#topicLibraryCount',`${topics.length} TOPICS`);document.querySelector('#topicLibraryGrid').innerHTML=topics.map((topic,index)=>`<article class="topic-library-card"><div class="library-card-top"><span class="question-number">${String(index+1).padStart(2,'0')}</span><span class="duration">${topic.questions.length} QUESTIONS</span></div><h2>${escapeHtml(topic.title)}</h2><p>${escapeHtml(topic.subtitle)}</p><small>${escapeHtml(topic.summary)}</small><div class="library-question-list">${topic.questions.map(question=>`<span>${escapeHtml(question.title)}</span>`).join('')}</div><button class="primary-button" data-topic-id="${escapeHtml(topic.id)}">Study this topic →</button></article>`).join('');}
function renderHistory(){
  const entries=Object.entries(history).filter(([,value])=>value?.tasks?.length).sort(([a],[b])=>b.localeCompare(a));const target=document.querySelector('#historyList');
  if(!entries.length){target.innerHTML='<div class="empty-history"><span>◴</span><h2>Your completed sessions will show up here.</h2><p>Finish a practice section and it will be saved by date, with its title and category.</p><a href="#today" data-route="today">Go to today’s plan →</a></div>';return;}
  target.innerHTML=entries.map(([date,entry])=>`<article class="history-day"><div class="history-date"><span>${new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{weekday:'short'}).toUpperCase()}</span><strong>${new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</strong></div><div class="history-tasks">${entry.tasks.map(task=>`<div class="history-task"><span class="history-check">✓</span><div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.type==='systems'?'System design':task.type==='trends'?'Engineering trends':'Algorithm topic')}</small></div></div>`).join('')}</div><span class="history-count">${entry.tasks.length} section${entry.tasks.length===1?'':'s'} completed</span></article>`).join('');
}
function setTaskButton(button,done){button.classList.toggle('completed',done);const label=button.querySelector('span:nth-child(2)');if(label)label.textContent=done?'Completed':button.dataset.task==='coding'?'Mark today’s topic complete':button.dataset.task==='systems'?'Mark system design complete':'Mark engineering trends complete';}
function markTask(type,title){const key=dateKey(today);history[key]??={tasks:[]};if(!history[key].tasks.some(task=>task.type===type))history[key].tasks.push({type,title});saveHistory();updateProgress();renderHistory();}
function updateProgress(){
  const done=completedTypes(),count=done.length;setText('#progressText',`${count} of 3 completed`);document.querySelector('#progressFill').style.width=`${count/3*100}%`;document.querySelectorAll('[data-task]').forEach(button=>setTaskButton(button,done.includes(button.dataset.task)));
  let streak=0;for(let offset=0;offset<370;offset++){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-offset);if((history[dateKey(d)]?.tasks||[]).length>=3)streak++;else if(offset>0)break;}setText('#streakCount',`${streak} day${streak===1?'':'s'} completed`);
  const week=document.querySelector('#weekDots');week.innerHTML='';const monday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-((today.getDay()+6)%7));for(let index=0;index<7;index++){const date=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+index),dot=document.createElement('span');dot.className='week-dot';if((history[dateKey(date)]?.tasks||[]).length){dot.classList.add('done');dot.textContent='✓';}if(dateKey(date)===dateKey(today))dot.classList.add('today');week.append(dot);}
}
function bindReveal(button){button.onclick=()=>{const hint=document.getElementById(button.dataset.reveal);if(!hint)return;const open=hint.classList.toggle('hidden')===false,symbol=button.querySelector('span');if(symbol)symbol.textContent=open?'−':'＋';button.childNodes[0].textContent=open?'Hide':'Show a discussion guide ';};}
function navigate(route){const names={today:'Today',coding:selectedTopicId?activeTopic().title:'Today’s topic',topics:'Topic library',systems:'System design',trends:'Engineering trends',history:'Past sessions'};if(!document.querySelector(`#view-${route}`))route='today';document.querySelectorAll('.view').forEach(view=>view.classList.toggle('hidden',view.id!==`view-${route}`));document.querySelectorAll('.nav-item').forEach(link=>link.classList.toggle('active',link.dataset.route===route));setText('#breadcrumbCurrent',names[route]);window.history.replaceState(null,'',`#${route}`);if(route==='coding')renderTopic();if(route==='topics')renderTopicLibrary();if(route==='systems'){renderSystemLibrary();renderSystems();}if(route==='trends')renderTrends();if(route==='history')renderHistory();window.scrollTo({top:0,behavior:'smooth'});}
document.querySelector('#visualPrevious').addEventListener('click',()=>{stopPlayback();activeFrame=Math.max(0,activeFrame-1);drawFrame();});
document.querySelector('#visualNext').addEventListener('click',()=>{stopPlayback();activeFrame=Math.min(activeFrames.length-1,activeFrame+1);drawFrame();});
document.querySelector('#visualPlay').addEventListener('click',()=>{if(playbackTimer){stopPlayback();return;}if(activeFrame===activeFrames.length-1)activeFrame=0;drawFrame();playbackTimer=setInterval(()=>{if(activeFrame>=activeFrames.length-1){stopPlayback();return;}activeFrame++;drawFrame();},1300);document.querySelector('#visualPlay').textContent='Ⅱ Pause';});
document.querySelector('#playCoreConcept').addEventListener('click',()=>{const topic=activeTopic();setVisualizer(topic.title,topic.summary,topic.conceptFrames,'CORE CONCEPT');});
document.addEventListener('click',event=>{const topicButton=event.target.closest('[data-topic-id]');if(topicButton){selectedTopicId=topicButton.dataset.topicId;navigate('coding');}const systemButton=event.target.closest('[data-system-id]');if(systemButton){selectedSystemId=systemButton.dataset.systemId;renderSystems();renderSystemLibrary();}const routeLink=event.target.closest('[data-route]');if(routeLink){event.preventDefault();if(routeLink.hasAttribute('data-today-link')){if(routeLink.dataset.route==='coding')selectedTopicId=null;if(routeLink.dataset.route==='systems')selectedSystemId=null;}navigate(routeLink.dataset.route);}const questionButton=event.target.closest('[data-explain-question]');if(questionButton){const question=activeTopic().questions[Number(questionButton.dataset.explainQuestion)];setVisualizer(question.title,question.why,question.visual,'QUESTION WALKTHROUGH');document.querySelector('.visualizer-card').scrollIntoView({behavior:'smooth',block:'center'});}const taskButton=event.target.closest('[data-task]');if(taskButton){event.preventDefault();const type=taskButton.dataset.task;markTask(type,type==='coding'?activeTopic().title:type==='systems'?(content.systems.find(system=>system.id===selectedSystemId)||dailyContent().system).title:dailyContent()[type]?.title||type);}});
document.querySelector('#resetDay').addEventListener('click',()=>{delete history[dateKey(today)];saveHistory();updateProgress();renderToday();});
setText('#todayDate',today.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}));setText('#shortDate',today.toLocaleDateString(undefined,{month:'short',day:'numeric'}).toUpperCase());
Promise.all([fetch('content.json').then(response=>{if(!response.ok)throw new Error('Could not load content.json');return response.json();}),fetch('topics.json').then(response=>{if(!response.ok)throw new Error('Could not load topics.json');return response.json();}),fetch(`build-info.json?ts=${Date.now()}`).then(response=>response.ok?response.json():null).catch(()=>null)]).then(([appContent,topics,buildInfo])=>{content=appContent;topicData=topics;renderUpdatedAt(buildInfo?.lastUpdated||content.lastUpdated);renderToday();updateProgress();renderHistory();if(location.hash)navigate(location.hash.slice(1));}).catch(error=>{document.querySelector('#todayCards').innerHTML=`<div class="load-error">${escapeHtml(error.message)}. Serve this folder locally with <code>python3 -m http.server 4173</code>, then open <code>http://localhost:4173</code>.</div>`;});
