export const periods = [
  { id: 'korean', label: '1교시', name: '국어', start: '08:40', end: '10:00', minutes: 80, description: '첫 시작을 차분하게, 나의 리듬으로.' },
  { id: 'math', label: '2교시', name: '수학', start: '10:30', end: '12:10', minutes: 100, description: '한 문제씩 단단하게, 흔들림 없는 페이스.' },
  { id: 'english', label: '3교시', name: '영어', start: '13:10', end: '14:20', minutes: 70, description: '듣기부터 독해까지, 끝까지 차분하게.' },
  { id: 'history', label: '4교시', name: '한국사·탐구', start: '14:50', end: '16:37', minutes: 30, description: '마지막까지 집중하는, 나만의 시간.' },
  { id: 'language', label: '5교시', name: '제2외국어·한문', start: '17:05', end: '17:45', minutes: 40, description: '마지막 한 순간까지, 쌓아온 실력대로.' },
];
export const fourthPeriods = [
  { name: '한국사', start: '14:50', end: '15:20', minutes: 30 },
  { name: '탐구 1', start: '15:35', end: '16:05', minutes: 30 },
  { name: '탐구 2', start: '16:07', end: '16:37', minutes: 30 },
];
export function secondsAt(time) { const [h,m] = time.split(':').map(Number); return h*3600+m*60; }
export function customPeriod(start, end) {
  const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!validTime(start) || !validTime(end) || start === end) return null;
  const minutes = ((secondsAt(end) - secondsAt(start)) / 60 + 1440) % 1440;
  return { id: 'custom', label: '직접 설정', name: '커스텀 연습', start, end, minutes };
}
export function elapsedAt(saved, startedAt, now, duration) { return Math.min(duration, Math.max(0,saved+(startedAt === null ? 0 : (now-startedAt)/1000))); }
export function handAngles(seconds, smooth=false) { return { hour: seconds / 120 % 360, minute: seconds / 10 % 360, second: (smooth?seconds:Math.floor(seconds)) % 60 * 6 }; }
export function examHighlightPaths(start, minutes) {
  const angle = handAngles(secondsAt(start)).minute;
  const point = degrees => {
    const radians = degrees * Math.PI / 180;
    return `${150 + Math.sin(radians) * 144} ${150 - Math.cos(radians) * 144}`;
  };
  const paths = [];
  for (let left = minutes; left > 0; left -= 60) {
    const sweep = Math.min(left, 60) * 6;
    paths.push(sweep === 360
      ? 'M150 6 A144 144 0 1 1 150 294 A144 144 0 1 1 150 6 Z'
      : `M150 150 L${point(angle)} A144 144 0 ${sweep > 180 ? 1 : 0} 1 ${point(angle + sweep)} Z`);
  }
  return paths;
}
export function remainingText(seconds) { const s=Math.ceil(Math.max(0,seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

export function writtenExam(start, minutes) {
  if (typeof start !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !Number.isInteger(minutes) || minutes < 1 || minutes > 240) return null;
  const endMinutes = (secondsAt(start) / 60 + minutes) % 1440;
  const end = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  return { id: 'written', label: '지필고사', name: '지필고사', start, end, minutes };
}
