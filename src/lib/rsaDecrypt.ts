// RSA decryption helper for Digikala OAuth verification code.
// Tries RSA-OAEP (SHA-256, SHA-1) first, then falls back to RSA PKCS#1 v1.5
// via a minimal BigInt-based modPow implementation (Web Crypto does not
// expose raw PKCS1-v1_5 decryption).

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemToDer(pem: string): { der: Uint8Array; label: string } {
  const m = pem.match(/-----BEGIN ([A-Z0-9 ]+)-----([\s\S]+?)-----END \1-----/);
  if (!m) throw new Error("کلید خصوصی PEM نامعتبر است");
  return { label: m[1].trim(), der: b64ToBytes(m[2]) };
}

// Minimal ASN.1 DER walker — extracts (n, d) from a PKCS#1 RSAPrivateKey, or
// unwraps a PKCS#8 PrivateKeyInfo to its inner PKCS#1 key.
function parseAsnInteger(buf: Uint8Array, offset: number): { value: Uint8Array; next: number } {
  if (buf[offset] !== 0x02) throw new Error("ASN.1: expected INTEGER");
  const { length, headerLen } = readLen(buf, offset + 1);
  let start = offset + 1 + headerLen;
  let end = start + length;
  // strip leading zero
  while (start < end && buf[start] === 0x00) start++;
  return { value: buf.slice(start, end), next: end };
}
function readLen(buf: Uint8Array, off: number): { length: number; headerLen: number } {
  const first = buf[off];
  if (first < 0x80) return { length: first, headerLen: 1 };
  const n = first & 0x7f;
  let len = 0;
  for (let i = 0; i < n; i++) len = (len << 8) | buf[off + 1 + i];
  return { length: len, headerLen: 1 + n };
}
function readSeqHeader(buf: Uint8Array, off: number): { contentStart: number; contentEnd: number } {
  if (buf[off] !== 0x30) throw new Error("ASN.1: expected SEQUENCE");
  const { length, headerLen } = readLen(buf, off + 1);
  return { contentStart: off + 1 + headerLen, contentEnd: off + 1 + headerLen + length };
}

function extractRsaPrivate(der: Uint8Array, label: string): { n: bigint; d: bigint } {
  let body = der;
  if (label.includes("PRIVATE KEY") && !label.includes("RSA")) {
    // PKCS#8: SEQUENCE { version, algId, OCTET STRING { RSAPrivateKey } }
    const outer = readSeqHeader(body, 0);
    // skip version INTEGER
    const v = parseAsnInteger(body, outer.contentStart);
    // skip algorithm identifier SEQUENCE
    const alg = readSeqHeader(body, v.next);
    // OCTET STRING
    let p = alg.contentEnd;
    if (body[p] !== 0x04) throw new Error("ASN.1: expected OCTET STRING in PKCS#8");
    const { length, headerLen } = readLen(body, p + 1);
    const start = p + 1 + headerLen;
    body = body.slice(start, start + length);
  }
  const seq = readSeqHeader(body, 0);
  // RSAPrivateKey ::= SEQUENCE { version, n, e, d, ... }
  const ver = parseAsnInteger(body, seq.contentStart);
  const n = parseAsnInteger(body, ver.next);
  const e = parseAsnInteger(body, n.next);
  const d = parseAsnInteger(body, e.next);
  return { n: bytesToBigInt(n.value), d: bytesToBigInt(d.value) };
}

function bytesToBigInt(b: Uint8Array): bigint {
  let r = 0n;
  for (const x of b) r = (r << 8n) | BigInt(x);
  return r;
}
function bigIntToBytes(n: bigint, len: number): Uint8Array {
  const out = new Uint8Array(len);
  let v = n;
  for (let i = len - 1; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

function pkcs1v15Unpad(em: Uint8Array): Uint8Array {
  // EM = 0x00 || 0x02 || PS || 0x00 || M
  if (em[0] !== 0x00 || em[1] !== 0x02) throw new Error("PKCS#1 v1.5 padding نامعتبر");
  let i = 2;
  while (i < em.length && em[i] !== 0x00) i++;
  if (i === em.length) throw new Error("PKCS#1 v1.5 separator یافت نشد");
  return em.slice(i + 1);
}

async function tryWebCryptoOaep(privatePemBytes: Uint8Array, cipher: Uint8Array, hash: "SHA-256" | "SHA-1"): Promise<string | null> {
  try {
    const keyBuf = privatePemBytes.slice().buffer;
    const cipherBuf = cipher.slice().buffer;
    const key = await crypto.subtle.importKey(
      "pkcs8",
      keyBuf,
      { name: "RSA-OAEP", hash },
      false,
      ["decrypt"],
    );
    const plain = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, key, cipherBuf);
    return new TextDecoder().decode(plain).trim();
  } catch {
    return null;
  }
}

export async function decryptDigikalaToken(opts: {
  privateKeyPem: string;
  encryptedBase64: string;
}): Promise<string> {
  const cipher = b64ToBytes(opts.encryptedBase64);
  const { der, label } = pemToDer(opts.privateKeyPem);

  // 1) RSA-OAEP via Web Crypto (only works on PKCS#8 keys)
  if (label.includes("PRIVATE KEY") && !label.includes("RSA")) {
    const a = await tryWebCryptoOaep(der, cipher, "SHA-256");
    if (a) return a;
    const b = await tryWebCryptoOaep(der, cipher, "SHA-1");
    if (b) return b;
  }

  // 2) Fallback: raw RSA + PKCS#1 v1.5 unpad (manual)
  const { n, d } = extractRsaPrivate(der, label);
  const k = Math.ceil(n.toString(2).length / 8);
  if (cipher.length !== k) throw new Error(`اندازه رمز (${cipher.length}) با اندازه کلید (${k}) همخوانی ندارد`);
  const c = bytesToBigInt(cipher);
  const m = modPow(c, d, n);
  const em = bigIntToBytes(m, k);
  const msg = pkcs1v15Unpad(em);
  return new TextDecoder().decode(msg).trim();
}
