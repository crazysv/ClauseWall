# ClauseWall Hardening Checklist

## Phase 0 — Baseline
- [x] hardening branch created
- [x] baseline tag created
- [x] routes inventory captured
- [x] api routes inventory captured
- [x] env usage inventory captured
- [x] critical flows documented

## Phase 1 — Secrets and Security Containment
- [ ] .gitignore verified
- [ ] secret scan completed
- [ ] exposed keys rotated
- [ ] Vercel env vars updated
- [ ] Supabase keys rotated
- [ ] Telegram token rotated
- [ ] Resend/HuggingFace/Groq/Gemini keys rotated
- [ ] storage buckets reviewed

## Phase 2 — Auth and Authorization
- [ ] middleware strategy finalized
- [ ] public/private routes classified
- [ ] ownership model validated
- [ ] RLS audited

## Phase 3 — API Protection
- [ ] request validation added
- [ ] sanitization added
- [ ] rate limiting added
- [ ] CSRF/origin checks added
- [ ] upload validation hardened

## Phase 4 — Stability
- [ ] malformed routes fixed
- [ ] error boundaries added
- [ ] structured logging added
- [ ] health endpoints added
- [ ] known bug files patched

## Phase 5 — Performance
- [ ] baseline timings recorded
- [ ] rule caching added
- [ ] bounded concurrency added
- [ ] progress streaming added
- [ ] model optimization reviewed

## Phase 6 — Testing
- [ ] unit tests added
- [ ] integration tests added
- [ ] e2e tests added

## Phase 7 — Observability
- [ ] monitoring added
- [ ] analytics added
- [ ] cron observability added

## Phase 8 — Production Maturity
- [ ] queue architecture reviewed
- [ ] database indexing reviewed
- [ ] storage hardening complete
- [ ] final security audit completed
- [ ] final performance audit completed
