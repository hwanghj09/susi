import test from 'node:test';
import assert from 'node:assert/strict';
import { measurementId, setAnalyticsEnabled, trackEvent } from './analytics.js';

test('동의 전에는 태그를 로드하지 않고, 동의 철회 후에는 이벤트를 보내지 않는다', async () => {
  const scripts = [];
  globalThis.window = {};
  globalThis.document = { createElement: () => ({}), head: { appendChild: script => scripts.push(script) }, cookie: '' };
  globalThis.location = { hostname: 'localhost' };
  try {
    await setAnalyticsEnabled(false);
    await trackEvent('practice_start');
    assert.equal(scripts.length, 0);
    assert.equal(window.dataLayer, undefined);
    await setAnalyticsEnabled(true);
    await trackEvent('practice_start', { subject: '국어' });
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    assert.deepEqual([...window.dataLayer.at(-1)], ['event', 'practice_start', { subject: '국어' }]);
    await setAnalyticsEnabled(false);
    const count = window.dataLayer.length;
    await trackEvent('practice_complete');
    assert.equal(window.dataLayer.length, count);
    assert.equal(window[`ga-disable-${measurementId}`], true);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.location;
  }
});
