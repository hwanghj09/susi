import {test} from 'node:test';
import assert from 'node:assert/strict';

test('clock settings persist and pause preserves elapsed time and completion',async t=>{
  const elements=new Map();
  let storedPrefs=null,frame;
  function element(selector){
    if(!elements.has(selector)){
      const attributes=new Map(),classes=new Set();
      elements.set(selector,{
        textContent:'',style:{setProperty(){}},dataset:{},checked:false,children:[],
        setAttribute:(name,value)=>attributes.set(name,value),getAttribute:name=>attributes.get(name),
        classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),toggle(){},contains:name=>classes.has(name)},
        appendChild(child){this.children.push(child);},replaceChildren(...children){this.children=children;},remove(){},addEventListener(name,handler){this[name]=handler;}
      });
    }
    return elements.get(selector);
  }
  const globals={
    window:{},localStorage:{getItem:()=>storedPrefs,setItem:(key,value)=>{storedPrefs=value;}},
    document:{querySelector:element,querySelectorAll:()=>[],createElementNS:(ns,tagName)=>Object.assign(element(Symbol()),{tagName}),
      documentElement:element('root'),body:element('body'),addEventListener(){}},
    setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:callback=>{frame=callback;return 0;}
  };
  for(const [name,value] of Object.entries(globals)){
    const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
    Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
    t.after(()=>descriptor?Object.defineProperty(globalThis,name,descriptor):delete globalThis[name]);
  }
  let now=1000;
  t.mock.method(Date,'now',()=>now);
  await import('./main.js');
  const start=element('#start'),toast=element('#toast');
  assert.equal(element('#second-motion').value,'stepped');
  assert.equal(element('#tick-style').value,'lines');
  assert.equal(element('#ticks').children.length,60);
  assert.equal(element('#ticks').children[0].tagName,'line');
  assert.equal(element('#highlight-toggle').checked,false);
  assert.equal(element('#exam-highlight').children.length,0);
  element('#highlight-toggle').checked=true;
  element('#highlight-toggle').change();
  assert.equal(element('#exam-highlight').children.length,1);
  const koreanHighlight=element('#exam-highlight').children[0].getAttribute('d');
  assert.match(element('#highlight-description').textContent,/08:40부터 10:00까지/);
  start.click();
  assert.equal(toast.textContent,'');
  now+=500;
  frame();
  assert.equal(element('#second-hand').getAttribute('transform'),'rotate(0 150 150)');
  element('#second-motion').value='smooth';
  element('#second-motion').change();
  assert.equal(element('#second-hand').getAttribute('transform'),'rotate(3 150 150)');
  now+=250;
  frame();
  assert.equal(element('#second-hand').getAttribute('transform'),'rotate(4.5 150 150)');
  now+=90000;
  start.click();
  assert.equal(toast.textContent,'남은 시간 78:30 · 소요 시간 01:30');
  assert.equal(toast.classList.contains('visible'),true);
  assert.equal(start.getAttribute('aria-label'),'이어서 재생');
  const pausedAngle=element('#second-hand').getAttribute('transform');
  now+=600000;
  frame();
  assert.equal(element('#second-hand').getAttribute('transform'),pausedAngle);
  start.click();
  now+=30250;
  start.click();
  assert.equal(toast.textContent,'남은 시간 77:59 · 소요 시간 02:01');
  start.click();
  now+=4800000;
  start.click();
  assert.equal(toast.textContent,'국어 연습 완료');
  assert.equal(start.getAttribute('aria-label'),'다시 재생');
  for(const style of ['dots','lines','dots']){
    element('#tick-style').value=style;
    element('#tick-style').change();
    const ticks=element('#ticks').children;
    assert.equal(ticks.length,60);
    assert.ok(ticks.every(tick=>tick.tagName===(style==='dots'?'circle':'line')));
    if(style==='dots'){
      assert.equal(ticks[0].getAttribute('r'),2.4);
      assert.equal(ticks[1].getAttribute('r'),1.2);
    }
  }
  assert.equal(JSON.parse(storedPrefs).secondMotion,'smooth');
  assert.equal(JSON.parse(storedPrefs).tickStyle,'dots');
  assert.equal(JSON.parse(storedPrefs).highlight,true);
  await import('./main.js?restored-settings');
  assert.equal(element('#second-motion').value,'smooth');
  assert.equal(element('#tick-style').value,'dots');
  assert.equal(element('#ticks').children[0].tagName,'circle');
  assert.equal(element('#highlight-toggle').checked,true);
  assert.equal(element('#exam-highlight').children[0].getAttribute('d'),koreanHighlight);
  element('#periods').click({target:{closest:()=>({dataset:{period:'1'}})}});
  assert.notEqual(element('#exam-highlight').children[0].getAttribute('d'),koreanHighlight);
  assert.match(element('#highlight-description').textContent,/수학 10:30부터 12:10까지/);
  element('#highlight-toggle').checked=false;
  element('#highlight-toggle').change();
  assert.equal(element('#exam-highlight').children.length,0);
  assert.equal(element('#highlight-description').textContent,'');
  assert.equal(JSON.parse(storedPrefs).highlight,false);
});
