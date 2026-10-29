import { Capacitor } from '@capacitor/core';

export const measurementId = 'G-Q7DH6WXCC7';
const native = Capacitor.isNativePlatform();
let enabled = false;
let ready = Promise.resolve();
let firebase;

function gtag() { window.dataLayer.push(arguments); }

export function setAnalyticsEnabled(value) {
  enabled = value === true;
  window[`ga-disable-${measurementId}`] = !enabled;
  const consented = enabled;
  ready = ready.then(async () => {
    if (native) {
      firebase ??= (await import('@capacitor-firebase/analytics')).FirebaseAnalytics;
      for (const type of ['AD_STORAGE', 'AD_USER_DATA', 'AD_PERSONALIZATION']) {
        await firebase.setConsent({ type, status: 'DENIED' });
      }
      await firebase.setConsent({ type: 'ANALYTICS_STORAGE', status: consented ? 'GRANTED' : 'DENIED' });
      await firebase.setEnabled({ enabled: consented });
      if (!consented) await firebase.resetAnalyticsData();
    } else if (consented) {
      if (!window.dataLayer) {
        window.dataLayer = [];
        gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        gtag('js', new Date());
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
      }
      gtag('consent', 'update', { analytics_storage: 'granted' });
      gtag('config', measurementId, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: 'https://hwanghj09.github.io/susi/',
        page_referrer: '',
        page_title: '수능의 시간',
      });
    } else if (window.dataLayer) {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (name === '_ga' || name.startsWith('_ga_')) {
          document.cookie = `${name}=; Max-Age=0; path=/`;
          document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
        }
      }
    }
  }).catch(error => console.warn('사용 통계를 설정하지 못했습니다.', error));
  return ready;
}

export function trackEvent(name, params = {}) {
  if (!enabled) return Promise.resolve();
  return ready.then(() => {
    if (!enabled) return;
    if (native) return firebase.logEvent({ name, params });
    gtag('event', name, params);
  }).catch(error => console.warn('사용 통계를 전송하지 못했습니다.', error));
}
