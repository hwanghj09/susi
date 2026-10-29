import {test} from 'node:test';
import assert from 'node:assert/strict';
import {periods,fourthPeriods,secondsAt,customPeriod,elapsedAt,handAngles,remainingText} from './time.js';
test('exam durations match starts and ends, including fourth-period sections',()=>{for(const p of [...periods.filter((_,i)=>i!==3),...fourthPeriods])assert.equal(secondsAt(p.end)-secondsAt(p.start),p.minutes*60);});
test('math clock starts at 10:30 and finishes at 12:10',()=>{assert.deepEqual(handAngles(secondsAt(periods[1].start)),{hour:315,minute:180,second:0});assert.deepEqual(handAngles(secondsAt(periods[1].start)+6000),{hour:5,minute:60,second:0});});
test('second hand supports stepped and smooth motion across the minute boundary',()=>{assert.equal(handAngles(30.5).second,180);assert.equal(handAngles(30.5,true).second,183);assert.equal(handAngles(59.5,true).second,357);assert.equal(handAngles(60,true).second,0);assert.equal(handAngles(60.5,true).second,3);});
test('elapsed time accounts for suspended tabs, pause and end boundary',()=>{assert.equal(elapsedAt(30,1000,61000,6000),90);assert.equal(elapsedAt(90,null,999999,6000),90);assert.equal(elapsedAt(0,0,9000000,6000),6000);});
test('remaining time rounds up and never becomes negative',()=>{assert.equal(remainingText(5999.2),'100:00');assert.equal(remainingText(.2),'00:01');assert.equal(remainingText(-1),'00:00');});
test('custom periods calculate same-day and overnight durations',()=>{
  assert.equal(customPeriod('09:15','10:45').minutes,90);
  assert.equal(customPeriod('23:30','00:15').minutes,45);
  assert.equal(customPeriod('23:59','00:00').minutes,1);
  assert.equal(customPeriod('00:00','23:59').minutes,1439);
});
test('custom periods reject empty, malformed, out-of-range and equal times',()=>{
  for(const [start,end] of [['','10:00'],['09:00',''],['9:00','10:00'],['24:00','10:00'],['09:00','10:60'],['09:00','09:00'],[null,'10:00'],['09:00',undefined]])assert.equal(customPeriod(start,end),null);
});
