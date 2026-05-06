const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initAnalytics(): void {
  if (!GA_MEASUREMENT_ID || initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
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
    return;
  }

  initAnalytics();
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
}

export function trackEvent(name: string, parameters: Record<string, string | number | boolean | undefined> = {}): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    return;
  }

  initAnalytics();
  window.gtag?.('event', name, cleanParameters(parameters));
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
