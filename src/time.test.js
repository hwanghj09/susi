import {test} from 'node:test';
import assert from 'node:assert/strict';
import {periods,fourthPeriods,secondsAt,elapsedAt,handAngles,remainingText} from './time.js';
test('exam durations match starts and ends, including fourth-period sections',()=>{for(const p of [...periods.filter((_,i)=>i!==3),...fourthPeriods])assert.equal(secondsAt(p.end)-secondsAt(p.start),p.minutes*60);});
test('math clock starts at 10:30 and finishes at 12:10',()=>{assert.deepEqual(handAngles(secondsAt(periods[1].start)),{hour:315,minute:180,second:0});assert.deepEqual(handAngles(secondsAt(periods[1].start)+6000),{hour:5,minute:60,second:0});});
test('elapsed time accounts for suspended tabs, pause and end boundary',()=>{assert.equal(elapsedAt(30,1000,61000,6000),90);assert.equal(elapsedAt(90,null,999999,6000),90);assert.equal(elapsedAt(0,0,9000000,6000),6000);});
test('remaining time rounds up and never becomes negative',()=>{assert.equal(remainingText(5999.2),'100:00');assert.equal(remainingText(.2),'00:01');assert.equal(remainingText(-1),'00:00');});
