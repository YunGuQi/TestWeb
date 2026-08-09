import { generateSignature, verifySignature } from './lib/security';

async function test() {
  const ts = Date.now();
  const payload = "GET_QUESTIONS";
  
  const sign = await generateSignature(payload, ts);
  console.log("Generated Sign:", sign);
  
  const isValid = await verifySignature(ts.toString(), sign, payload, 120);
  console.log("Is Valid:", isValid);
}

test().catch(console.error);
