import { periods, fourthPeriods, secondsAt, elapsedAt, handAngles, remainingText } from './time.js';
const $=s=>document.querySelector(s);
const icons={clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',play:'<path d="m8 4 12 8-12 8Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',reset:'<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.5"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6"/>',ruler:'<path d="m3 16 13-13 5 5L8 21Zm3-3 3 3m0-6 2 2m1-5 3 3"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',sliders:'<path d="M4 7h5m4 0h7M4 17h9m4 0h3"/><circle cx="11" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>'};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.clock}</svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const ns='http://www.w3.org/2000/svg';
function svgEl(type,attrs){const el=document.createElementNS(ns,type);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
for(let i=0;i<60;i++){$('#ticks').appendChild(svgEl('line',{x1:150,y1:i%5===0?13:15,x2:150,y2:i%5===0?28:21,stroke:'#111','stroke-width':i%5===0?2.4:1,transform:`rotate(${i*6} 150 150)`}));}
for(let i=1;i<=12;i++){const a=i*Math.PI/6;const t=svgEl('text',{x:150+Math.sin(a)*105,y:150-Math.cos(a)*105+11,'text-anchor':'middle','font-family':'Arial, sans-serif','font-size':30,'font-weight':500,fill:'#111'});t.textContent=i;$('#numbers').appendChild(t);}
let selected=0,fourth=0,running=false,saved=0,startedAt=null,finished=false,wakeLock=null;
let scale=100;let draftScale=100;
function readPrefs(){try{return JSON.parse(localStorage.getItem('suneung-prefs')||'{}');}catch{return {};}}
const prefs=readPrefs();scale=Math.min(200,Math.max(60,Number(prefs.scale)||100));
$('#seconds-toggle').checked=prefs.seconds!==false;$('#remaining-toggle').checked=prefs.remaining===true;$('#actual-size-toggle').checked=prefs.actualSize===true;
function savePrefs(){try{localStorage.setItem('suneung-prefs',JSON.stringify({scale,seconds:$('#seconds-toggle').checked,remaining:$('#remaining-toggle').checked,actualSize:$('#actual-size-toggle').checked}));}catch{}}
function applyScale(value){document.documentElement.style.setProperty('--scale',value/100);$('#scale-output').value=`${value}%`;$('#scale').setAttribute('aria-valuetext',`${value}%`);}
applyScale(scale);
function current(){return selected===3?{...periods[3],...fourthPeriods[fourth]}:periods[selected];}
function elapsed(){return elapsedAt(saved,startedAt,Date.now(),current().minutes*60);}
$('#periods').innerHTML=periods.map((p,i)=>`<button class="period-button ${i===0?'active':''}" data-period="${i}" aria-pressed="${i===0}"><span class="period-top">${p.label}<span class="period-check" aria-hidden="true">${i===0?'✓':''}</span></span><span class="period-name">${p.name}</span><span class="period-time">${p.start} — ${p.end}</span></button>`).join('');
$('#periods').addEventListener('click',e=>{const button=e.target.closest('[data-period]');if(!button)return;selected=Number(button.dataset.period);fourth=0;reset();document.querySelectorAll('.period-button').forEach((b,i)=>{b.classList.toggle('active',i===selected);b.setAttribute('aria-pressed',i===selected);b.querySelector('.period-check').textContent=i===selected?'✓':'';});updateSession();toggle();});
function updateSession(){const p=current();$('#selected-name').textContent=`${p.name} 영역`;$('#period-label').textContent=p.label;$('#subject-title').textContent=`${p.name} 영역`;$('#subject-description').textContent=p.description;$('#start-time').textContent=p.start;$('#end-time').textContent=p.end;$('#duration').innerHTML=`${p.minutes}<span>분</span>`;$('#focus-subject').textContent=`${p.label} · ${p.name} 영역`;$('.fourth-select')?.remove();if(selected===3){const select=document.createElement('select');select.className='fourth-select';select.setAttribute('aria-label','4교시 세부 영역');select.innerHTML=fourthPeriods.map((x,i)=>`<option value="${i}" ${i===fourth?'selected':''}>${x.name} · ${x.start}–${x.end}</option>`).join('');select.addEventListener('change',()=>{fourth=Number(select.value);reset();updateSession();toggle();});$('.subject-heading').appendChild(select);}render();}
async function requestWakeLock(){try{if('wakeLock' in navigator&&document.visibilityState==='visible')wakeLock=await navigator.wakeLock.request('screen');}catch{}}
function releaseWakeLock(){if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null;}}
function toggle(){if(running){saved=elapsed();startedAt=null;running=false;releaseWakeLock();}else{if(finished){saved=0;finished=false;}startedAt=Date.now();running=true;requestWakeLock();}render();}
function reset(){running=false;saved=0;startedAt=null;finished=false;releaseWakeLock();render();}
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
function render(){
  const p=current(),duration=p.minutes*60,e=elapsed();
  if(running&&e>=duration){saved=duration;startedAt=null;running=false;finished=true;releaseWakeLock();notify(`${p.name} 연습이 끝났습니다. 수고했어요!`);}
  const angles=handAngles(secondsAt(p.start)+e);
  for(const [name,value]of Object.entries(angles))$(`#${name}-hand`).setAttribute('transform',`rotate(${value} 150 150)`);
  const clockSeconds=secondsAt(p.start)+Math.floor(e);
  $('#dial').setAttribute('aria-label',`${p.name} 시계 ${String(Math.floor(clockSeconds/3600)).padStart(2,'0')}:${String(Math.floor(clockSeconds/60)%60).padStart(2,'0')}:${String(clockSeconds%60).padStart(2,'0')}`);
  $('#second-hand').style.display=$('#seconds-toggle').checked?'':'none';
  document.body.classList.toggle('actual-size',$('#actual-size-toggle').checked);
  $('#size-caption').textContent=$('#actual-size-toggle').checked?'실제 크기 · 시계판 지름 30mm (보정값 적용)':'크게 보기';
  $('#remaining').hidden=!$('#remaining-toggle').checked;
  $('#remaining').textContent=`남은 시간 ${remainingText(duration-e)}`;
  $('#progress-bar').max=duration;
  $('#progress-bar').value=Math.floor(e);
  $('#progress-bar').setAttribute('aria-valuetext',`${Math.floor(e/60)}분 / ${p.minutes}분`);
  $('#elapsed-label').textContent=`${Math.floor(e/60)} / ${p.minutes}분`;
  $('#progress-label').textContent=finished?'오늘의 연습을 마쳤어요':running?'나의 페이스로 집중하는 중':e>0?'잠시 쉬어가도 괜찮아요':'준비가 되면 시작해 보세요';
  $('#start-label').textContent=finished?'다시 연습하기':running?'잠시 멈추기':e>0?'이어서 연습하기':'연습 시작하기';
  $('#start [data-icon]').innerHTML=icon(running?'pause':'play');
  $('#status').classList.toggle('running',running);
  const status=finished?'연습 완료':running?'연습 중':e>0?'일시정지':'시작 전';
  // Only announce a status change, not every clock tick.
  if($('#status').textContent.trim()!==status)$('#status').innerHTML=`<i aria-hidden="true"></i> ${status}`;
  $('#focus-start').innerHTML=`${running?'일시정지':'연습 시작'} <kbd>Space</kbd>`;
}
$('#start').addEventListener('click',toggle);$('#focus-start').addEventListener('click',toggle);$('#reset').addEventListener('click',()=>{reset();notify('시계를 시작 시각으로 되돌렸어요.');});
for(const id of ['seconds-toggle','remaining-toggle','actual-size-toggle'])$(`#${id}`).addEventListener('change',()=>{savePrefs();render();});
function enterFocus(){document.body.classList.add('focus-mode');$('#exit-focus').innerHTML='집중 모드 나가기 <kbd>Esc</kbd>';$('#exit-focus').focus();}
async function exitFocus(){
  if(document.fullscreenElement){
    try{await document.exitFullscreen();}catch{notify('전체화면을 종료하지 못했어요. Esc 키로 나가 주세요.');return;}
  }
  document.body.classList.remove('focus-mode');
  $('#focus').focus();
}
$('#focus').addEventListener('click',enterFocus);
$('#exit-focus').addEventListener('click',exitFocus);
$('#fullscreen').addEventListener('click',async()=>{
  enterFocus();
  if(!document.fullscreenEnabled||!document.documentElement.requestFullscreen){notify('이 브라우저는 전체화면을 지원하지 않아 시계 집중 모드로 전환했어요.');return;}
  try{await document.documentElement.requestFullscreen();}catch{notify('전체화면을 열지 못해 시계 집중 모드로 전환했어요.');}
});
document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement)$('#exit-focus').innerHTML='전체화면 나가기 <kbd>Esc</kbd>';
  else if(document.body.classList.contains('focus-mode'))exitFocus();
});
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&document.body.classList.contains('focus-mode'))exitFocus();if(e.code==='Space'&&!e.repeat&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','TEXTAREA','BUTTON','A','SUMMARY'].includes(document.activeElement.tagName)){e.preventDefault();toggle();}});
$('#guide').addEventListener('click',()=>$('#guide-dialog').showModal());$('#close-guide').addEventListener('click',()=>$('#guide-dialog').close());
$('#size-button').addEventListener('click',()=>{draftScale=scale;$('#scale').value=scale;applyScale(scale);$('#calibration-dialog').showModal();});$('#scale').addEventListener('input',e=>{draftScale=Number(e.target.value);applyScale(draftScale);});$('#save-size').addEventListener('click',()=>{scale=draftScale;savePrefs();$('#calibration-dialog').close();notify('이 화면의 시계 크기를 저장했어요.');});$('#calibration-dialog').addEventListener('close',()=>applyScale(scale));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();if(running)requestWakeLock();}});
updateSession();setInterval(render,200);
