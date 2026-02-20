export async function mixEntropy(...sources: Uint8Array[]): Promise<Uint8Array> {
  const result = new Uint8Array(32);
  for (const source of sources) {
    for (let i = 0; i < 32; i++) {
      result[i] ^= source[i % source.length];
    }
  }

  const systemEntropy = new Uint8Array(32);
  crypto.getRandomValues(systemEntropy);
  for (let i = 0; i < 32; i++) {
    result[i] ^= systemEntropy[i];
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', result);
  return new Uint8Array(hashBuffer);
}
