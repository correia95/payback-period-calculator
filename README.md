# Payback Period Calculator

How long it takes for a capital investment's cash flows to recover
the initial cost — simple and discounted, for uneven annual cash
flows.

- Simple payback: cumulative cash flows vs. initial investment, with
  fractional-year interpolation
- Discounted payback: each year's cash flow discounted by
  (1 + rate)^year first
- "Not recovered" shown when the cash flows entered never reach the
  initial investment
- Add/remove years for uneven cash flow schedules
- Shareable link (base64url-encoded)

## Develop

```
npm install
npm run dev
npm run build      # tsc --noEmit && vite build
node --experimental-strip-types --test src/payback.test.mjs
```

The engine (`simplePayback`, `discountCashFlows`,
`discountedPayback`) is in `src/payback.ts`. 9 Node tests in
`src/payback.test.mjs`, including a classic capital-budgeting
textbook example ($1,000 investment, $400/year → 2.5-year payback).

## Deploy

Static assets on Cloudflare Workers (`wrangler.jsonc`). Live at
<https://payback-period-calculator.correia95.workers.dev/>.
