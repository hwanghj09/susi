import { periods, fourthPeriods, secondsAt, elapsedAt, handAngles, remainingText } from './time.js';
const $=s=>document.querySelector(s);
const icons={
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  play:'<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  pause:'<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  reset:'<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  collapse:'<path d="M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5"/>',
  ruler:'<path d="m3 16 13-13 5 5L8 21Zm3-3 3 3m0-6 2 2m1-5 3 3"/>',
  settings:'<path d="M10 2h4l1 3 2 1 3-.5L22 9l-2 2v2l2 2-2 3.5-3-.5-2 1-1 3h-4l-1-3-2-1-3 .5L2 15l2-2v-2L2 9l2-3.5 3 .5 2-1Z"/><circle cx="12" cy="12" r="3.5"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>'
};
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
$('#periods').addEventListener('click',e=>{const button=e.target.closest('[data-period]');if(!button||Number(button.dataset.period)===selected)return;selected=Number(button.dataset.period);fourth=0;reset();document.querySelectorAll('.period-button').forEach((b,i)=>{b.classList.toggle('active',i===selected);b.setAttribute('aria-pressed',i===selected);b.querySelector('.period-check').textContent=i===selected?'✓':'';});updateSession();});
function updateSession(){
  const p=current();
  $('#period-label').textContent=p.label;
  $('#subject-title').textContent=`${p.name} 영역`;
  $('#start-time').textContent=p.start;
  $('#end-time').textContent=p.end;
  $('#duration').innerHTML=`${p.minutes}<span>분</span>`;
  $('#focus-subject').textContent=`${p.label} · ${p.name} 영역`;
  let select=$('.fourth-select');
  if(selected===3){
    if(!select){
      select=document.createElement('select');
      select.className='fourth-select';
      select.setAttribute('aria-label','4교시 세부 영역');
      select.innerHTML=fourthPeriods.map((x,i)=>`<option value="${i}">${x.name} · ${x.start}–${x.end}</option>`).join('');
      select.addEventListener('change',()=>{fourth=Number(select.value);reset();updateSession();});
      $('.subject-heading').appendChild(select);
    }
    select.value=String(fourth);
  }else select?.remove();
  render();
}
async function requestWakeLock(){try{if('wakeLock' in navigator&&document.visibilityState==='visible')wakeLock=await navigator.wakeLock.request('screen');}catch{}}
function releaseWakeLock(){if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null;}}
function toggle(){if(running){saved=elapsed();startedAt=null;running=false;releaseWakeLock();}else{if(finished){saved=0;finished=false;}startedAt=Date.now();running=true;requestWakeLock();}render();}
function reset(){running=false;saved=0;startedAt=null;finished=false;releaseWakeLock();render();}
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
function render(){
  const p=current(),duration=p.minutes*60,e=elapsed();
  if(running&&e>=duration){saved=duration;startedAt=null;running=false;finished=true;releaseWakeLock();notify(`${p.name} 연습 완료`);}
  const angles=handAngles(secondsAt(p.start)+e);
  for(const [name,value]of Object.entries(angles))$(`#${name}-hand`).setAttribute('transform',`rotate(${value} 150 150)`);
  const clockSeconds=secondsAt(p.start)+Math.floor(e);
  $('#dial').setAttribute('aria-label',`${p.name} 시계 ${String(Math.floor(clockSeconds/3600)).padStart(2,'0')}:${String(Math.floor(clockSeconds/60)%60).padStart(2,'0')}:${String(clockSeconds%60).padStart(2,'0')}`);
  $('#second-hand').style.display=$('#seconds-toggle').checked?'':'none';
  document.body.classList.toggle('actual-size',$('#actual-size-toggle').checked);
  $('#remaining').hidden=!$('#remaining-toggle').checked;
  $('#remaining').textContent=`남은 시간 ${remainingText(duration-e)}`;
  $('#progress-bar').max=duration;
  $('#progress-bar').value=Math.floor(e);
  $('#progress-bar').setAttribute('aria-valuetext',`${Math.floor(e/60)}분 / ${p.minutes}분`);
  $('#elapsed-label').textContent=`${Math.floor(e/60)} / ${p.minutes}분`;
  const label=running?'일시정지':finished?'다시 재생':e>0?'이어서 재생':'재생';
  if($('#start').getAttribute('aria-label')!==label){
    $('#start').setAttribute('aria-label',label);
    $('#start').title=`${label} (Space)`;
    $('#start [data-icon]').innerHTML=icon(running?'pause':'play');
  }
  $('#reset').disabled=e===0&&!finished;
  $('#status').classList.toggle('running',running);
  const status=finished?'완료':running?'진행 중':e>0?'일시정지':'준비';
  // Only announce a status change, not every clock tick.
  if($('#status').textContent.trim()!==status)$('#status').innerHTML=`<i aria-hidden="true"></i> ${status}`;
}
$('#start').addEventListener('click',toggle);$('#reset').addEventListener('click',reset);
for(const id of ['seconds-toggle','remaining-toggle','actual-size-toggle'])$(`#${id}`).addEventListener('change',()=>{savePrefs();render();});
function enterFocus(){document.body.classList.add('focus-mode');$('#exit-focus').setAttribute('aria-label','집중 모드 나가기');$('#exit-focus').title='집중 모드 나가기 (Esc)';$('#start').focus({preventScroll:true});}
async function exitFocus(){
  if(document.fullscreenElement){
    try{await document.exitFullscreen();}catch{notify('전체화면을 종료하지 못했어요. Esc 키로 나가 주세요.');return;}
  }
  document.body.classList.remove('focus-mode');
  $('#fullscreen').focus();
}
$('#exit-focus').addEventListener('click',exitFocus);
$('#fullscreen').addEventListener('click',async()=>{
  enterFocus();
  if(!document.fullscreenEnabled||!document.documentElement.requestFullscreen){notify('이 브라우저는 전체화면을 지원하지 않아 시계 집중 모드로 전환했어요.');return;}
  try{await document.documentElement.requestFullscreen();$('#start').focus({preventScroll:true});}catch{notify('전체화면을 열지 못해 시계 집중 모드로 전환했어요.');}
});
document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement){$('#exit-focus').setAttribute('aria-label','전체화면 나가기');$('#exit-focus').title='전체화면 나가기 (Esc)';}
  else if(document.body.classList.contains('focus-mode'))exitFocus();
});
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&!document.querySelector('dialog[open]')&&document.body.classList.contains('focus-mode'))exitFocus();if(e.code==='Space'&&!e.repeat&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();toggle();}});
$('#settings-button').addEventListener('click',()=>$('#settings-dialog').showModal());
$('#guide').addEventListener('click',()=>$('#guide-dialog').showModal());$('#close-guide').addEventListener('click',()=>$('#guide-dialog').close());
$('#size-button').addEventListener('click',()=>{draftScale=scale;$('#scale').value=scale;applyScale(scale);$('#calibration-dialog').showModal();});$('#scale').addEventListener('input',e=>{draftScale=Number(e.target.value);applyScale(draftScale);});$('#save-size').addEventListener('click',()=>{scale=draftScale;savePrefs();$('#calibration-dialog').close();notify('이 화면의 시계 크기를 저장했어요.');});$('#calibration-dialog').addEventListener('close',()=>applyScale(scale));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();if(running)requestWakeLock();}});
updateSession();setInterval(render,200);
