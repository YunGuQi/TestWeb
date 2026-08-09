import { generateSignature } from './security';

/**
 * Enhanced deviceId generator (Soft Fingerprint)
 * Appends a hash of user-agent, screen size, and language to a UUID to make it harder to spoof simply by clearing localStorage.
 */
export async function getEnhancedDeviceId(): Promise<string> {
  if (typeof window === 'undefined') return 'unknown';
  
  let did = localStorage.getItem('deviceId');
  if (did && did.includes('.')) {
    // Already enhanced
    return did;
  }

  // Generate fingerprint components
  const ua = navigator.userAgent || '';
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const lang = navigator.language || '';
  const fpString = `${ua}|${screen}|${lang}`;
  
  // Hash the fingerprint
  const encoder = new TextEncoder();
  let fpHash = 'fp';
  if (window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-1', encoder.encode(fpString));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      fpHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
    } catch (e) {
      // Fallback
    }
  }

  if (!did) {
    did = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  
  const enhancedDid = `${did}.${fpHash}`;
  localStorage.setItem('deviceId', enhancedDid);
  return enhancedDid;
}

/**
 * Wrapper for fetch that automatically injects x-timestamp and x-sign headers
 */
export async function fetchWithSignature(url: string, options: RequestInit = {}): Promise<Response> {
  const timestamp = Date.now();
  let payload = '';
  
  if (options.method && options.method.toUpperCase() !== 'GET' && options.body) {
    payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  } else {
    payload = "GET_QUESTIONS";
  }

  const sign = await generateSignature(payload, timestamp);
  
  const headers = new Headers(options.headers || {});
  headers.set('x-timestamp', timestamp.toString());
  headers.set('x-sign', sign);
  
  return fetch(url, {
    ...options,
    headers
  });
}
