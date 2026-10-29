import {test} from 'node:test';
import assert from 'node:assert/strict';
import {periods,fourthPeriods,secondsAt,elapsedAt,handAngles,remainingText} from './time.js';
test('exam durations match starts and ends, including fourth-period sections',()=>{for(const p of [...periods.filter((_,i)=>i!==3),...fourthPeriods])assert.equal(secondsAt(p.end)-secondsAt(p.start),p.minutes*60);});
test('math clock starts at 10:30 and finishes at 12:10',()=>{assert.deepEqual(handAngles(secondsAt(periods[1].start)),{hour:315,minute:180,second:0});assert.deepEqual(handAngles(secondsAt(periods[1].start)+6000),{hour:5,minute:60,second:0});});
test('second hand supports stepped and smooth motion across the minute boundary',()=>{assert.equal(handAngles(30.5).second,180);assert.equal(handAngles(30.5,true).second,183);assert.equal(handAngles(59.5,true).second,357);assert.equal(handAngles(60,true).second,0);assert.equal(handAngles(60.5,true).second,3);});
test('elapsed time accounts for suspended tabs, pause and end boundary',()=>{assert.equal(elapsedAt(30,1000,61000,6000),90);assert.equal(elapsedAt(90,null,999999,6000),90);assert.equal(elapsedAt(0,0,9000000,6000),6000);});
test('remaining time rounds up and never becomes negative',()=>{assert.equal(remainingText(5999.2),'100:00');assert.equal(remainingText(.2),'00:01');assert.equal(remainingText(-1),'00:00');});
test('written exams validate times and durations and wrap at midnight',async()=>{
  const {writtenExam}=await import('./time.js');
  assert.deepEqual(writtenExam('09:00',50),{id:'written',label:'지필고사',name:'지필고사',start:'09:00',end:'09:50',minutes:50});
  assert.equal(writtenExam('23:30',60).end,'00:30');
  assert.equal(writtenExam('08:00',1).end,'08:01');
  assert.equal(writtenExam('08:00',240).end,'12:00');
  for(const [start,minutes] of [['24:00',50],['09:60',50],['9:00',50],[null,50],['09:00',0],['09:00',241],['09:00',1.5],['09:00',NaN],['09:00','50']])assert.equal(writtenExam(start,minutes),null);
});
