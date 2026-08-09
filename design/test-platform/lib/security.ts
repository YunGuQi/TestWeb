export async function generateSignature(payload: string, timestamp: number): Promise<string> {
  const secret = process.env.NEXT_PUBLIC_API_SALT || 'destiny-lover-default-salt-12345';
  const data = timestamp.toString() + payload + secret;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser environment
    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export async function verifySignature(
  timestamp: string | null,
  signature: string | null,
  payload: string,
  maxAgeSeconds: number = 120 // Default 2 minutes
): Promise<boolean> {
  if (!timestamp || !signature) return false;
  
  const time = parseInt(timestamp, 10);
  if (isNaN(time)) return false;
  
  const now = Date.now();
  // Check if timestamp is within maxAgeSeconds (both past and future allowed slightly for clock drift)
  if (Math.abs(now - time) > maxAgeSeconds * 1000) {
    return false;
  }
  
  const expectedSignature = await generateSignature(payload, time);
  return signature === expectedSignature;
}
