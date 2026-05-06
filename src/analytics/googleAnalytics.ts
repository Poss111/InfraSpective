const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const ANALYTICS_DEBUG = import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initAnalytics(): void {
  if (!GA_MEASUREMENT_ID || initialized || typeof window === 'undefined') {
    if (!GA_MEASUREMENT_ID) {
      debugAnalytics('disabled_missing_measurement_id');
    }
    return;
  }

  initialized = true;
  debugAnalytics('initializing');
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.onload = () => debugAnalytics('script_loaded');
  script.onerror = () => debugAnalytics('script_failed_to_load');
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

export function trackPageView(path: string, title = document.title): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    debugAnalytics('page_view_skipped', { reason: 'missing_measurement_id', path });
    return;
  }

  initAnalytics();
  debugAnalytics('page_view_sent', { path });
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
}

export function trackEvent(name: string, parameters: Record<string, string | number | boolean | undefined> = {}): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    debugAnalytics('event_skipped', { reason: 'missing_measurement_id', event: name });
    return;
  }

  initAnalytics();
  const cleaned = cleanParameters(parameters);
  debugAnalytics('event_sent', { event: name, ...cleaned });
  window.gtag?.('event', name, cleaned);
}

export function trackButtonClick(
  buttonId: string,
  parameters: Record<string, string | number | boolean | undefined> = {},
): void {
  trackEvent('button_click', {
    button_id: buttonId,
    ...parameters,
  });
}

function cleanParameters(parameters: Record<string, string | number | boolean | undefined>): Record<string, string | number | boolean> {
  return Object.fromEntries(Object.entries(parameters).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined));
}

function debugAnalytics(message: string, parameters: Record<string, string | number | boolean | undefined> = {}): void {
  if (!ANALYTICS_DEBUG || typeof window === 'undefined') {
    return;
  }

  const measurementId = GA_MEASUREMENT_ID ? `${GA_MEASUREMENT_ID.slice(0, 4)}...${GA_MEASUREMENT_ID.slice(-4)}` : 'missing';
  console.info('[InfraSpective analytics]', message, {
    measurementId,
    ...cleanParameters(parameters),
  });
}
