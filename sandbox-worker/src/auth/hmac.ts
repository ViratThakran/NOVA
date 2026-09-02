import crypto from "crypto";

export const TIMESTAMP_HEADER = "x-nova-timestamp";
export const SIGNATURE_HEADER = "x-nova-signature";
export const DEFAULT_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Creates an HMAC-SHA256 signature for a request payload
 * Format: sha256={hex_digest}
 */
export function createWorkerSignature(
  timestamp: string,
  rawBody: string,
  secret: string
): string {
  if (!secret) {
    throw new Error("Worker secret must not be empty");
  }
  const payload = `${timestamp}.${rawBody}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${hmac}`;
}

/**
 * Validates incoming request HMAC-SHA256 signature and timestamp window
 */
export function verifyWorkerSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string,
  secret: string,
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS
): { valid: boolean; error?: string } {
  if (!secret) {
    return { valid: false, error: "Server misconfiguration: worker secret is missing" };
  }

  // Normalize header keys to lowercase
  const normalizedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (typeof v === "string") {
      normalizedHeaders[k.toLowerCase()] = v;
    } else if (Array.isArray(v) && v.length > 0) {
      normalizedHeaders[k.toLowerCase()] = v[0];
    }
  }

  const timestampStr = normalizedHeaders[TIMESTAMP_HEADER];
  const signatureStr = normalizedHeaders[SIGNATURE_HEADER];

  if (!timestampStr) {
    return { valid: false, error: `Missing required header '${TIMESTAMP_HEADER}'` };
  }

  if (!signatureStr) {
    return { valid: false, error: `Missing required header '${SIGNATURE_HEADER}'` };
  }

  // Verify timestamp freshness (Replay attack protection)
  const reqTime = Date.parse(timestampStr);
  if (isNaN(reqTime)) {
    return { valid: false, error: "Invalid timestamp format in header" };
  }

  const now = Date.now();
  const diffSeconds = Math.abs(now - reqTime) / 1000;
  if (diffSeconds > toleranceSeconds) {
    return {
      valid: false,
      error: `Request timestamp expired or outside tolerance window (${diffSeconds.toFixed(1)}s > ${toleranceSeconds}s)`,
    };
  }

  // Compute expected signature
  const expectedSig = createWorkerSignature(timestampStr, rawBody, secret);

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signatureStr);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: "Invalid signature" };
  }

  const isMatch = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  if (!isMatch) {
    return { valid: false, error: "Signature verification failed" };
  }

  return { valid: true };
}
