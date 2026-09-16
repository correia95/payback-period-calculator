export interface PaybackResult {
  cumulative: number[];
  paybackYears: number | null;
}

function paybackFromFlows(initialInvestment: number, flows: number[]): PaybackResult {
  let cumulative = 0;
  const cumulativeArr: number[] = [];
  let paybackYears: number | null = null;
  for (let i = 0; i < flows.length; i++) {
    const prevCumulative = cumulative;
    cumulative += flows[i];
    cumulativeArr.push(cumulative);
    if (paybackYears === null && cumulative >= initialInvestment) {
      const remaining = initialInvestment - prevCumulative;
      const fraction = flows[i] !== 0 ? remaining / flows[i] : 0;
      paybackYears = i + fraction;
    }
  }
  return { cumulative: cumulativeArr, paybackYears };
}

export function simplePayback(initialInvestment: number, cashFlows: number[]): PaybackResult {
  return paybackFromFlows(initialInvestment, cashFlows);
}

export function discountCashFlows(cashFlows: number[], discountRatePercent: number): number[] {
  const r = discountRatePercent / 100;
  return cashFlows.map((cf, i) => cf / Math.pow(1 + r, i + 1));
}

export function discountedPayback(initialInvestment: number, cashFlows: number[], discountRatePercent: number): PaybackResult {
  const discounted = discountCashFlows(cashFlows, discountRatePercent);
  return paybackFromFlows(initialInvestment, discounted);
}

export interface State {
  initialInvestment: number;
  cashFlows: number[];
  discountRatePercent: number;
  currency: string;
}

function toUint8Array(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function toBase64Url(text: string): string {
  const bytes = toUint8Array(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeState(state: State): URLSearchParams {
  const params = new URLSearchParams();
  params.set('d', toBase64Url(JSON.stringify(state)));
  return params;
}

export function decodeState(params: URLSearchParams, fallback: State): State {
  const raw = params.get('d');
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(fromBase64Url(raw));
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.initialInvestment !== 'number' || !Array.isArray(parsed.cashFlows)) {
      return fallback;
    }
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}
