# APEX SMART MOBILITY — REALITY-BASED ROADMAP v2
## المعدلة على أساس الواقع الفعلي للمشروع — مش rebuilding من الصفر

**تاريخ التعديل:** 2026-06-23  
**الفرع الحالي:** `p0-fix-arrived-and-saved-place-booking`  
**الـ HEAD:** `33bf10bfd347b0abfcc35e55b698615f6db9e636`

---

## 0. STATUS CLASSIFICATION SYSTEM

كل feature في المشروع ليها واحد من 4 حالات:

| الحالة | المعنى | اللون |
|--------|--------|-------|
| **✅ SOLID** | موجود، شغال، مختبر — يحتاج stabilization بسيط أو مفيش | أخضر |
| **🟡 STUB** | موجود هيكل (endpoint/UI/model) بس مش شغال كامل | أصفر |
| **🔴 MISSING** | مش موجود خالص | أحمر |
| **⬜ SCOPE** | خارج نطاق الـ MVP أو مقرر يتأجل | رمادي |

---

## 1. ما هو موجود فعلاً (Existing Work Inventory)

### ✅ SOLID — موجود وشغال ومختبر

**Backend:**
| Feature | Tests | Notes |
|---------|-------|-------|
| Auth (register, login, logout, change password, profile, avatar, settings) | ✅ | Full Sanctum integration |
| Rider ride request + lifecycle (create → searching → assigned → arrived → started → completed) | ✅ DispatchReliabilityTest (40 tests) | Full state machine |
| Driver ride lifecycle (accept, reject, arrived, start, complete, summary) | ✅ RideLifecycleE2ETest | With DB locking |
| All 4 vehicle types (Economy, Comfort, Premium, Motorcycle) | ✅ | Matching + pricing |
| Fare calculation (base, distance, time, surge, peak, night, waiting, class multiplier, female surcharge) | ✅ | FareCalculationService |
| Wallet payment (debit/credit, balance check, ledger) | ✅ | WalletRepository + PaymentService |
| Cash payment (cash collection, change credit, commission debt) | ✅ | DriverDebtService |
| Driver online/offline toggle | ✅ | With suspension checks |
| Driver location update | ✅ | Egypt bounds validation |
| Saved places CRUD | ✅ | RiderFavoritesPage |
| Cancellation with reasons + penalties | ✅ | Full flow with wallet deduction |
| Support tickets (CRUD + messages) | ✅ | Ticket + TicketMessage models |
| Admin panel (16+ pages: dashboard, riders, drivers, vehicles, payments, reports, settings, features, support, analytics, settlements, surge, live map) | ✅ | Full CRUD + actions |
| Reports + analytics (daily/weekly/monthly/custom, revenue, charts, CSV/PDF export) | ✅ | ReportService + dompdf |
| Feature flags (40+ flags, middleware, admin UI) | ✅ | FeatureFlagService |
| Rate limiting (register, login, forgot-password, global API) | ✅ | Named throttles |
| Driver documents (upload + secure signed route streaming) | ✅ | Private disk + verification |
| EnsureUserNotSuspended middleware | ✅ | Blocks suspended/blocked users |
| Notification system (DB-based, Reverb/Pusher real-time) | ✅ | In-app + WebSocket |
| Driver performance + earnings + debt views | ✅ | |
| Rider history + wallet + payments + ratings pages | ✅ | |
| Horizon + Telescope configured | ✅ | No custom jobs yet |
| Activity Log (Spatie) + Permissions (Spatie) | ✅ | |
| E2E tests (RideLifecycleE2ETest, DispatchReliabilityTest, AuthTest, etc.) | ✅ | 7 test files |

**Frontend:**
| Page/Component | Status |
|----------------|--------|
| Rider Dashboard (map, fare est, vehicle select, payment method, female toggle, save place) | ✅ |
| Rider Current Ride (tracking, cancel, fallback dialog, rating) | ✅ |
| Rider Favorites (saved places CRUD) | ✅ |
| Rider Profile, Wallet, Payments, History, Ratings, Settings, Support, Notifications | ✅ |
| Driver Dashboard (online toggle, pending offers, accept/reject, active ride card, stats) | ✅ |
| Driver Current Ride (full lifecycle: arrived → start → preview → complete, cash handling, rating) | ✅ |
| Driver Profile, Vehicle, Documents, Earnings, Wallet, History, Ratings, Settings, Support, Notifications, Settlements | ✅ |
| Admin Dashboard, Rides, Drivers, Riders, Vehicles, Payments, Reports, Settings, Features, Support, Notifications, Pricing Calculator, Surge, Live Map, Settlements | ✅ |

### 🟡 STUB — هيكل موجود بس مش مكتمل

| Feature | الموجود | الناقص |
|---------|---------|--------|
| OTP Verification | `POST /send-otp` + `POST /verify-otp` endpoints | No actual SMS dispatch (stub returns success) |
| Forgot/Reset Password | `POST /forgot-password` + `POST /reset-password` | No email sending, no real reset flow |
| Female Driver Matching | Rider toggle UI, driver `female_only` field, fare calculation | `DriverMatchingService@findAndNotifyDrivers` doesn't filter by female preference |
| Promo Codes | `PromoCode` model, `PromoCodeRepository`, migration | No API endpoints, no integration into ride flow, no admin CRUD |
| SOS/Emergency Button | `window.alert()` in RiderCurrentRidePage | No backend endpoint, no trusted contacts, no SMS/notification dispatch |
| Surge/Dynamic Pricing | `surgeMultiplier`, `isPeak`, `isNight` params in FareCalculationService | Never set from real conditions (no SurgeZone logic, no peak hour detection) |

### 🔴 MISSING — مش موجود خالص

| Feature | Priority | Why Important |
|---------|----------|---------------|
| Payment gateways (Paymob, Fawry, Vodafone Cash, Instapay) | 🔥 HIGH | MVP can launch with wallet+cash only. Gateways = Phase 2 |
| Push notifications (Firebase FCM) | 🔥 HIGH | Needed for mobile apps, not for web MVP |
| i18n/Arabic (translations + RTL) | MEDIUM | Egypt market needs Arabic. Can launch English-first |
| Multi-stop rides | LOW | Post-MVP feature |
| Driver destination mode | LOW | Post-MVP feature |
| Scheduled rides | LOW | Post-MVP feature |
| Referral / Loyalty / Cashback | LOW | Post-MVP feature |
| VIP system | LOW | Post-MVP feature |
| Corporate accounts | LOW | Post-MVP feature |
| Queueable jobs (`ShouldQueue`) | MEDIUM | Notifications are synchronous — fine for MVP scale |
| Real-time chat (WebSocket) | LOW | Support tickets work, real-time chat is nice-to-have |
| Social login (Laravel Socialite) | LOW | Installed but not used |

---

## 2. REALITY-BASED PHASES (مش rebuilding — ده stabilization + completion)

### Phase R0 — IMMEDIATE STABILIZATION 🔥
**الوضع:** معظم الحاجات موجودة وشغالة. الـ Phase دي عبارة عن تثبيت الـ bugs اللي ظهرت في الـ production testing.

**المدة المقدرة:** 2-3 أيام

| المهمة | الحالة الحالية | الهدف |
|--------|---------------|-------|
| Fix Arrived 400 error after accept | قيد التحقيق | Toast + error handling + backend diagnostics |
| Fix Saved Place booking refresh | قيد الإصلاح | React Router state بدل query params |
| Fix Admin Driver metrics (enum comparison) | 🟡 موجود | تصحيح الـ Enum comparisons |
| Fix Admin Rider metrics (string typos) | 🟡 موجود | تصحيح string matching |
| Fix female driver matching logic | 🟡 Stub | إضافة filter في DriverMatchingService |
| Dev-only location env var | 🟡 موجود | VITE_ENABLE_EGYPT_TEST_LOCATION |
| Console clean (polling timers) | 🟡 موجود | Cleanup intervals + status validation |
| All tests pass + frontend build | ✅ | تأكيد الاستقرار |

**الإنجاز:** Full browser ride lifecycle بدون errors + Admin metrics صحيحة + Saved places booking شغال

---

### Phase R1 — RIDE LIFECYCLE & DISPATCH LOCK 🔒
**الوضع:** الـ lifecycle موجود وشغال. محتاجين نحميه من race conditions ونظبط الـ dispatch strategy.

**المدة المقدرة:** 3-4 أيام

| المهمة | الحالة | الملاحظات |
|--------|--------|-----------|
| Unify dispatch strategy | ✅ موجود (nearest) لكن في broadcast كمان | إما نشيل broadcast من `RideService@createRide` أو ننقل الكل لطريقة واحدة |
| Fix `processDriverOffers` race condition | 🟡 موجود بدون lock | نضيف `lockForUpdate` |
| Driver eligibility review | ✅ موجود | Online + approved + active + vehicle match + not busy |
| Vehicle type strict matching | ✅ موجود | No silent fallback |
| State transition guard review | ✅ موجود | لكل transitions guards |
| `useDriverCurrentRide` store flicker fix | 🟡 موجود | لو الـ API رجع null، نعمل clear للـ store — UI بيفضل يظهر "No Active Ride" |
| Dispatch diagnostics command | ✅ موجود | `RidesDiagnoseDispatch` |

**الإنجاز:** Dispatch آمن، transition آمنة، testing على كل الـ 4 types

---

### Phase R2 — RIDER & DRIVER CORE LOCK 🔒
**الوضع:** الـ rider و driver workflows كاملة. محتاجين نثبت الحاجات الصغيرة.

**المدة المقدرة:** 2-3 أيام

| المهمة | الحالة | الملاحظات |
|--------|--------|-----------|
| OTP verification (real SMS) | 🟡 Stub | Needs SMS gateway API key + provider |
| Forgot/Reset password (real flow) | 🟡 Stub | Needs email sending |
| Driver sound notification loop | ✅ موجود | `useNewRequestSound` |
| Driver vehicle setup views | ✅ موجود | `DriverVehiclePage` |
| Driver earnings + debt charts | ✅ موجود | `DriverEarningsPage` |
| Rider profile update persistence | ✅ موجود | `RiderProfilePage` |
| Admin pagination + search on indexes | ✅ موجود | Already paginated |
| Admin approve/reject vehicles + docs | ✅ موجود | Already working |
| Debt > 500 EGP prevent going online | 🟡 Stub feature | Not implemented |

**الإنجاز:** All user-facing flows complete + OTP شغال

---

### Phase R3 — ADMIN OPERATIONS LOCK 🔒
**الوضع:** Admin panel كامل. محتاجين تصحيح + testing.

**المدة المقدرة:** 1-2 أيام

| المهمة | الحالة |
|--------|--------|
| Verify admin metrics accuracy | ✅ موجود needs testing |
| Verify search + filters + pagination | ✅ موجود |
| Verify approve/reject actions | ✅ موجود |
| Verify reports accuracy | ✅ موجود |
| Verify feature flag management | ✅ موجود |
| Admin documents verification workflow | ✅ موجود |

**الإنجاز:** Admin pages == real DB data

---

### Phase R4 — PRICING ENGINE LOCK 🔒
**الوضع:** FareCalculationService كامل. محتاج automatic conditions للـ surge و peak و night.

**المدة المقدرة:** 2-3 أيام

| المهمة | الحالة | الملاحظات |
|--------|--------|-----------|
| Africa/Cairo timezone in calculations | 🟡 موجود | Need to verify timezone is applied |
| Automatic surge zone logic | 🟡 Stub | SurgeMultiplier موجود بس مش بيتحط من real conditions |
| Peak hour detection | 🟡 Stub | `isPeak` parameter موجود بس مش automatic |
| Night surcharge automatic | 🟡 Stub | `isNight` parameter موجود بس مش automatic |
| Waiting fee (5 min free) | ✅ موجود | `waitingFreeMinutes`, `waitingFeePerMinute` settings |
| Pickup compensation visibility | ✅ موجود | `pickup_distance` in fare calc |
| Admin pricing rules editor | ✅ موجود | `AdminPricingCalculatorPage` |
| OSRM route boundary checks | 🟡 ممكن | Need geographic boundary implementation |

**الإنجاز:** التسعير automatic ومظبوط مع القوانين المصرية

---

### Phase R5 — PAYMENTS / WALLET / DEBT / SETTLEMENTS LOCK 🔒
**الوضع:** Wallet + Cash شغالين. Gateways لسّه مش موجودة. الـ MVP ممكن يشتغل بـ wallet + cash بس.

**المدة المقدرة:** 5-7 أيام

| المهمة | الحالة | الملاحظات |
|--------|--------|-----------|
| Wallet payment (existing) | ✅ SOLID | شغال ومختبر |
| Cash payment (existing) | ✅ SOLID | شغال ومختبر |
| Driver debt prevention ( > 500 EGP) | 🟡 Stub | المشروع مش مطبق |
| Settlement approve/reject (existing) | ✅ SOLID | Admin settlements UI + API |
| Double-click payment protection | ✅ موجود | `lockForUpdate` في `completeRide` |
| Double-click settlement protection | 🟡 موجود | Need to verify locking exists |
| Paymob gateway | 🔴 MISSING | Not in MVP scope |
| Fawry gateway | 🔴 MISSING | Not in MVP scope |
| Vodafone Cash gateway | 🔴 MISSING | Not in MVP scope |
| Instapay gateway | 🔴 MISSING | Not in MVP scope |

**قرار:** الـ MVP ينطلق بـ wallet + cash بس. الـ gateways تتبني في Phase منفصلة بعد الإطلاق.

**الإنجاز:** Wallet + cash آمنين بدون duplicate payments

---

### Phase R6 — PAYMENT GATEWAYS INTEGRATION 💳
**الوضع:** مش موجود خالص. محتاج building من الصفر.

**المدة المقدرة:** 3-4 أسابيع

| المهمة | الأولوية |
|--------|----------|
| Paymob adapter (sandbox + webhook + signature + production) | 1st |
| Fawry adapter | 2nd |
| Vodafone Cash adapter | 3rd |
| Instapay adapter | 4th |
| All gateway feature flags | موجودة وجاهزة |

**قرار:** Phase مستقلة بعد الإطلاق. MVP مش محتاجها.

---

### Phase R7 — COMMUNICATIONS LOCK 📡
**الوضع:** In-app notifications شغالة. Real-time chat مش موجود.

**المدة المقدرة:** 3-4 أيام

| المهمة | الحالة |
|--------|--------|
| In-app notifications | ✅ SOLID |
| Support tickets (existing) | ✅ SOLID |
| Real-time chat (WebSocket messages) | 🔴 MISSING |
| Firebase FCM push notifications | 🔴 MISSING |
| FCM token registration endpoint | 🟡 موجود (endpoint) |

**الإنجاز:** Notifications + chat كاملة

---

### Phase R8 — SECURITY HARDENING LOCK 🔐
**الوضع:** أساسيات الأمان موجودة. محتاجين نضيف rate limits + IDOR checks + upload validation.

**المدة المقدرة:** 2-3 أيام

| المهمة | الحالة |
|--------|--------|
| Rate limiting (estimations 10/min, bookings 3/min) | 🟡 موجود basic needs extension |
| IDOR checks on rides, payments, wallets | 🟡 موجود rides check, need to verify others |
| File upload validation (MIME + size) | ✅ موجود in AvatarRequest + DocumentController |
| Security headers (HSTS, CSP) | 🔴 MISSING |
| Private storage config | ✅ موجود local private disk |
| Suspended/blocked middleware | ✅ موجود EnsureUserNotSuspended |

**الإنجاز:** Security audit pass

---

### Phase R9 — ADVANCED FEATURES 🚀
**الوضع:** في feature flags كتير. محتاجين نبني اللي تختاره.

**المدة المقدرة:** حسب الأولوية — كل feature 2-5 أيام

| المهمة | الأولوية | الحالة |
|--------|----------|--------|
| Complete female driver matching | 🔥 HIGH | 🟡 Data model done, just need matching logic |
| Promo codes (API + admin CRUD + ride flow) | MEDIUM | 🟡 Model exists |
| SOS / Emergency button | MEDIUM | 🟡 UI stub only |
| Surge zone + peak detection | MEDIUM | 🟡 Stub |
| Multi-stop rides | LOW | 🔴 MISSING |
| Driver destination mode | LOW | 🔴 MISSING |
| VIP system | LOW | 🔴 MISSING |
| Scheduled rides | LOW | 🔴 MISSING |
| Referral / Loyalty / Cashback | LOW | 🔴 MISSING |

---

### Phase R10 — UI/UX + ARABIC LOCK 🌐
**الوضع:** مش موجود خالص.

**المدة المقدرة:** 1-2 أسبوع

| المهمة | الحالة |
|--------|--------|
| Translation JSON files (ar/en) | 🔴 MISSING |
| RTL CSS support | 🔴 MISSING |
| i18n library integration | 🔴 MISSING |
| Loading state UI review | ✅ موجود mostly done |
| Buttons disabled during loading | ✅ موجود mostly done |

**الإنجاز:** Arabic UI + RTL

---

### Phase R11 — MOBILE API READINESS 📱
**الوضع:** APIs موجودة. محتاجين توثيق.

**المدة المقدرة:** 2-3 أيام

| المهمة | الحالة |
|--------|--------|
| Postman collection | 🔴 MISSING |
| Error code standardization | 🔴 MISSING |
| Mobile endpoint testing | 🟡 APIs موجودة مش مختبرة mobile |

---

### Phase R12 — FINANCE / HR / TAX / ETA 🏦
**الوضع:** أساسيات الحسابات موجودة. التكامل مع ETA مش موجود.

**المدة المقدرة:** 1 أسبوع

| المهمة | الحالة |
|--------|--------|
| VAT configuration (not hardcoded) | 🟡 موجود in settings |
| Commission-based tax base | ✅ موجود |
| ETA e-invoice placeholder | 🔴 MISSING |
| Accountant role | 🔴 MISSING |

---

### Phase R13 — PRODUCTION DEPLOYMENT LOCK 🚀
**الوضع:** المشروع محتاج staging + production setup.

**المدة المقدرة:** 1 أسبوع

| المهمة | الحالة |
|--------|--------|
| Staging environment | 🔴 MISSING |
| Production env config | 🟡 موجود .env | 
| SSL setup | 🔴 MISSING |
| Queue worker (supervisor) | 🟡 Horizon configured |
| Scheduler cron | 🟡 موجود schedule |
| Backup automation | 🔴 MISSING |
| Monitoring | 🟡 Telescope installed |
| Smoke tests | 🔴 MISSING |
| Production handover docs | 🔴 MISSING |

---

## 3. MVP SCOPE DEFINITION

المشروع ينقسم إلى:

### MVP (Phase R0-R5) — ممكن ينطلق
- ✅ Auth + registration + login
- ✅ Rider full workflow
- ✅ Driver full workflow
- ✅ Admin panel
- ✅ Wallet payments
- ✅ Cash payments
- ✅ All 4 vehicle types
- ✅ Ride lifecycle (request → complete)
- ✅ Dispatch (nearest-first)
- ✅ Fare estimation
- ✅ Saved places
- ✅ Cancellation + penalties
- ✅ Support tickets
- ✅ Admin reports
- ✅ Feature flags
- ✅ Driver documents
- ✅ Rate limiting
- ❌ **Needs:** OTP SMS (Phase R2), female matching fix (Phase R2), surge zone (Phase R4)

### Post-MVP (Phase R6+) — بعد الإطلاق
- Payment gateways (Paymob, Fawry, Vodafone Cash, Instapay)
- Push notifications (FCM)
- Arabic / RTL i18n
- Real-time chat
- Multi-stop rides
- Driver destination mode
- Promo codes
- VIP system
- Referral / Loyalty
- Scheduled rides
- SOS / Emergency
- Mobile API readiness
- Finance / HR / TAX / ETA
- Production deployment package

---

## 4. GOVERNANCE RULES (معدلة)

1. **Each phase starts with audit** — مش building من الجديد، تقييم الواقع أولاً
2. **Phase report = 2-3 pages** — مش 30. الـ details في الكود والتست مش في الماركداون
3. **"Browser proof" = Screen recording + console log** — محدد وواضح
4. **No "do not rebuild" warning needed** — لأن الخطة أصلاً مبنية على existing work
5. **Phase score = تقدم + fixing bugs + passes tests** — مش من الصفر
6. **Owner approval on phase START only** — مش على كل commit

---

## 5. EXISTING WORK PRESERVATION RULES

- أي Controller موجود — مدوش. أي Service موجود — مدوش. أي Model موجود — مدوش.
- أي React page موجودة — مدوش. أي React hook — مدوش.
- أي route موجودة — مدوش.
- أي migration موجودة — مدوش.
- أي test موجود — يتوسع مش يتكتب من أول وجديد.
- لو عاوز تضيف feature جديدة — دور على existing naming ونمط الكود الأول.
- ممنوع rename files عشان "نظافة" من غير سبب وظيفي.

---

## 6. EXCLUDED FROM MVP

الـ features دي **مش مطلوبة** عشان الـ MVP ينطلق:

| Feature | سبب التأجيل |
|---------|-------------|
| Paymob/Fawry/Instapay/Vodafone Cash | Wallet + Cash يكفي MVP |
| Firebase FCM push | Web notifications + WebSocket يكفي MVP |
| Arabic / RTL | MVP ينطلق English، Arabic Phase R10 |
| Real-time chat | Support tickets تكفي MVP |
| Multi-stop | Post-MVP feature |
| Destination mode | Post-MVP feature |
| VIP system | Product decision needed |
| Promo codes | Product decision needed |
| Referral / Loyalty | Product decision needed |
| Scheduled rides | Post-MVP feature |
| SOS / Emergency | Post-MVP feature |
| Social login | Installed but not needed for MVP |
| Mobile API readiness | Post-MVP (when mobile app starts) |
| Finance / HR / TAX / ETA | Product decision needed |

---

## 7. SUMMARY: PHASES vs REALITY

| Original Phase | Reality Status | Action |
|----------------|----------------|--------|
| Phase -1 (Project State Control) | ✅ Done — هذه الوثيقة هي البديل | N/A |
| Phase 0 (Immediate Stabilization) | 🟡 قيد التنفيذ | Complete |
| Phase 1 (Ride Lifecycle & Dispatch Lock) | ✅ 80% موجود | Stabilize only |
| Phase 2 (Rider Core Flow Lock) | ✅ 95% موجود | OTP + minor fixes |
| Phase 3 (Driver Core Flow Lock) | ✅ 95% موجود | Sound + debt prevention |
| Phase 4 (Admin Core Data Lock) | ✅ 95% موجود | Metrics accuracy |
| Phase 5 (Pricing Engine Lock) | ✅ 80% موجود | Auto surge/peak/night |
| Phase 6 (Payments/Wallet/Debt) | 🔴 50% موجود (wallet+cash) | Gateways = post-MVP |
| Phase 7 (Cancellations/Penalties) | ✅ 100% موجود | No work needed |
| Phase 8 (Security Hardening) | 🟡 70% موجود | Headers + verify IDOR |
| Phase 9 (Communications) | 🟡 60% موجود | Notif + tickets done, chat + FCM missing |
| Phase 10 (Advanced Features) | ⬜ Most missing | Choose what to build |
| Phase 11 (UI/UX + Language) | 🔴 0% موجود (no i18n) | Arabic = post-MVP |
| Phase 12 (Reports/Analytics) | ✅ 100% موجود | No work needed |
| Phase 13 (Mobile API) | 🔴 0% | Post-MVP |
| Phase 14 (Finance/HR/TAX) | 🔴 0% | Post-MVP |
| Phase 15 (Production Deployment) | 🟡 40% موجود | Staging + backup + monitoring |

**الخلاصة:** المشروع أقرب لـ **80% complete** من ناحية MVP. مش محتاج rebuilding. محتاج stabilization + testing + deploy.
