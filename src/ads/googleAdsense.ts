const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID;
const ADSENSE_DEBUG = import.meta.env.VITE_ADSENSE_DEBUG === 'true';

let initialized = false;

export function initAdsense(path: string): void {
  if (!shouldLoadAdsense(path)) {
    debugAdsense('skipped_for_route', { path });
    return;
  }

  if (!ADSENSE_CLIENT_ID || initialized || typeof window === 'undefined') {
    if (!ADSENSE_CLIENT_ID) {
      debugAdsense('disabled_missing_client_id');
    }
    return;
  }

  initialized = true;
  debugAdsense('initializing', { path });

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  script.onload = () => debugAdsense('script_loaded');
  script.onerror = () => debugAdsense('script_failed_to_load');
  document.head.appendChild(script);
}

function shouldLoadAdsense(path: string): boolean {
  return path !== '/app';
}

function debugAdsense(message: string, parameters: Record<string, string | undefined> = {}): void {
  if (!ADSENSE_DEBUG || typeof window === 'undefined') {
    return;
  }

  const clientId = ADSENSE_CLIENT_ID ? `${ADSENSE_CLIENT_ID.slice(0, 8)}...${ADSENSE_CLIENT_ID.slice(-4)}` : 'missing';
  console.info('[InfraSpective adsense]', message, {
    clientId,
    ...Object.fromEntries(Object.entries(parameters).filter(([, value]) => value !== undefined)),
  });
}
