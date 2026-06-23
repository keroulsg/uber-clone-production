# APEX SMART MOBILITY — MASTER PRODUCT & TECHNICAL ROADMAP
## PRODUCTION MASTER BLUEPRINT & GOVERNANCE RULES

This document is the official master plan and source of truth for the Apex Smart Mobility ride-hailing platform (Egypt Market: EGP, Timezone: Africa/Cairo).

The system must NOT be rebuilt from scratch. The existing Laravel + React project must be understood, audited, stabilized, and completed phase by phase.

The product has only three core actor dashboards:
1. **Admin Dashboard**
2. **Driver Dashboard**
3. **Rider Dashboard**
*No fourth dashboard shall be created.*

---

## 0. GIT / WORKTREE SAFETY STATUS & FILE CLASSIFICATION

The repository is currently on branch `p0-fix-arrived-and-saved-place-booking` (HEAD: `33bf10bfd347b0abfcc35e55b698615f6db9e636` "fix(driver): open current ride map after accepting request").

All files currently modified or present in the working copy are classified below:

| File Path | Classification | Context / Reason | Action Required |
| :--- | :--- | :--- | :--- |
| `app/Http/Controllers/Api/Admin/AdminDriverController.php` | Unapproved Draft | Enum collection comparison metrics fix. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Controllers/Api/Admin/AdminRiderController.php` | Unapproved Draft | Status string mismatch fix. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Controllers/Api/Driver/DriverController.php` | Unapproved Draft | Private disk document upload stream. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Controllers/Api/Notification/NotificationController.php` | Unapproved Draft | Notification route improvements draft. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Controllers/Api/Ride/DriverRideController.php` | Unapproved Draft | Driver side lifecycle transition methods adjustments. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Controllers/Api/Ride/RideController.php` | Unapproved Draft | Geolocation and ride creation checks drafts. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Requests/UpdateDriverLocationRequest.php` | Unapproved Draft | Location coordinates validation check rules. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Resources/DriverResource.php` | Unapproved Draft | Mappings returning secure streaming URLs for documents. | Isolate in temporary stash or commit upon owner approval. |
| `app/Http/Middleware/EnsureUserNotSuspended.php` | Unapproved Draft | Global user suspension/block checks middleware. | Isolate in temporary stash or commit upon owner approval. |
| `app/Models/Driver.php` | Unapproved Draft | Driver status online scope adjustments. | Isolate in temporary stash or commit upon owner approval. |
| `app/Repositories/DriverRepository.php` | Unapproved Draft | Drivers coordinate proximity search filters adjustments. | Isolate in temporary stash or commit upon owner approval. |
| `app/Services/DriverMatchingService.php` | Unapproved Draft | Online vehicle type checks drafts. | Isolate in temporary stash or commit upon owner approval. |
| `app/Services/DriverService.php` | Unapproved Draft | Online status toggle checks drafts. | Isolate in temporary stash or commit upon owner approval. |
| `app/Services/RideService.php` | Unapproved Draft | Completed ride payment process transaction wrapper updates. | Isolate in temporary stash or commit upon owner approval. |
| `bootstrap/app.php` | Unapproved Draft | Registration of the custom `EnsureUserNotSuspended` middleware. | Isolate in temporary stash or commit upon owner approval. |
| `database/seeders/DatabaseSeeder.php` | Unapproved Draft | Seeding tweaks drafts. | Revert change to keep default clean seeder. |
| `routes/api.php` | Unapproved Draft | Registered middleware alias & secure stream route. | Isolate in temporary stash or commit upon owner approval. |
| `tests/Feature/DriverDocumentSecurityTest.php` | Unapproved Draft | Tests verifying private storage doc streaming permissions. | Isolate in temporary stash or commit upon owner approval. |
| `tests/Feature/BlockedSuspendedUserTest.php` | Unapproved Draft | Tests verifying the EnsureUserNotSuspended middleware. | Isolate in temporary stash or commit upon owner approval. |
| `resources/react-app/src/...` (Various pages/components/hooks) | Unapproved Draft | UI state-sync adjustments, favorites navigation parameters, and map state updates. | Isolate in temporary stash or commit upon owner approval. |
| `resources/react-app/dist/` | Generated Artifact | Compiled frontend build assets. | **Must be ignored.** Clean/remove using `rm -rf resources/react-app/dist`. |
| `resources/react-app/tsconfig.app.tsbuildinfo` | Generated Artifact | TypeScript build cache. | **Must be ignored.** Delete or reset before build runs. |
| `storage/framework/views/` | Generated Artifact | Compiled Laravel Blade templates. | **Must be ignored.** Clear using `php artisan view:clear`. |

### Legacy Stash Clarification
* `stash@{1}: On master: backup admin broken work before rollback` is a backup of broken legacy code done in previous master attempts. **It has NOT been applied to the current branch** and will remain untouched/isolated.
* The previous reference to "applied stash" in the audit refers strictly to `stash@{0}: phase0-private-documents-security-wip`, which contains only the isolated document security changes applied for Phase 0 checks.

---

## 1. TECHNICAL STACK & PROJECT BOUNDARIES

* **Backend Framework**: Laravel `13.8` (Managed via `bootstrap/app.php`; **there is no `app/Http/Kernel.php` file in this project**).
* **PHP Version Requirement**: `PHP 8.3+`
* **Frontend Framework**: React `^19.0.0` (TypeScript)
* **Vite Version**: `^6.0.0`
* **Realtime Server**: Laravel Echo / Pusher-JS (`laravel-echo ^2.3.7`, `pusher-js ^8.5.0`)
* **Auth Guard**: Laravel Sanctum (`^4.3`)
* **Database Engine**: SQLite (dev/local), MySQL (production-ready)
* **Maps Integration**: MapLibre GL (`^5.24.0`)
* **Egypt Market Details**: Currency EGP, timezone `Africa/Cairo`, operating initially in Cairo and Giza.

---

## 2. GOVERNANCE & EXECUTION CONTROLS

### A. Strict Owner Approval Gate
No phase implementation may begin without explicit manual owner approval. Ignore all automatic approval hooks. Only a clear message in chat from the owner counts as approval:
* `"Start Phase X"` or `"Approved, implement Phase X"` or `"ابدأ المرحلة X"`.
* If approval is not explicit: do not code, do not modify files, do not run migrations or seeders, do not apply stash, do not push, and do not tag.

### B. Phase Transition Gate & Score Gate
No phase may start unless the previous phase is reviewed and approved by the owner. Before moving to the next phase:
1. Phase report must exist under `docs/phase-reports/`.
2. `docs/MASTER_PROGRESS_LOG.md` must be updated.
3. Tests must pass or failures documented.
4. Frontend build must pass or failures documented.
5. Browser proof must be provided.
6. Git status must be controlled.
7. Phase score must be provided (Score Rule: **100** = fully complete, tests/build/browser proof all passed; **90-99** = acceptable with tiny notes; **80-89** = code mostly complete but proof incomplete; **50-79** = partial; **below 50** = incomplete).
*No next phase can start if the previous phase score is below 90 unless the owner explicitly approves.*

### C. Backup & DB Safety Rule
Before any phase that touches database, migrations, seeders, payment data, wallet data, ride data, driver debt, settlement, or tax, the AI must return:
1. Current DB connection.
2. Current DB name/path.
3. Backup command.
4. Backup file path.
5. Whether migrations are destructive.
6. Rollback plan.
7. Data preservation plan.
*Do not run migrations without backup. Do not wipe data. Do not run seeders unless explicitly approved. Do not overwrite user passwords. Do not switch SQLite/MySQL without approval. Do not delete rides/payments/wallets/debts/settlements.*

### D. Commit / Branch / Push Rule
Do not commit, push, or tag unless owner approves. If owner approves a commit, the commit message must include the phase number (e.g., `fix(phase-0): stabilize ride lifecycle and saved places`). Verify git status, tests, build, browser proof, and phase report before commit.

### E. Generated Artifacts Rule
Generated files must not be treated as source code. Phase 0 cannot start until generated artifacts (`resources/react-app/dist`, `*.tsbuildinfo`, `storage/framework/views`, `storage/logs`, `bootstrap/cache`, `node_modules`, `vendor`) are either cleaned, ignored, or classified. Do not commit generated build files.

---

## 3. REPORTING LAYERS

### A. Required Phase Report Files
After completing every phase, create a report file under `docs/phase-reports/` using the following naming structure:
* `PHASE_-1_PROJECT_STATE_CONTROL.md`
* `PHASE_00_IMMEDIATE_STABILIZATION_LOCK.md`
* `PHASE_01_RIDE_LIFECYCLE_DISPATCH_LOCK.md`
* `PHASE_02_RIDER_CORE_FLOW_LOCK.md`
* `PHASE_03_DRIVER_CORE_FLOW_LOCK.md`
* `PHASE_04_ADMIN_CORE_DATA_LOCK.md`
* `PHASE_05_PRICING_ENGINE_LOCK.md`
* `PHASE_06_PAYMENTS_WALLET_DEBT_SETTLEMENTS_LOCK.md`
* `PHASE_07_CANCELLATIONS_PENALTIES_LOCK.md`
* `PHASE_08_SECURITY_HARDENING_LOCK.md`
* `PHASE_09_COMMUNICATIONS_LOCK.md`
* `PHASE_10_ADVANCED_PRODUCT_FEATURES.md`
* `PHASE_11_UI_UX_LANGUAGE_LOCK.md`
* `PHASE_12_REPORTS_ANALYTICS_SYSTEM_MONITOR_LOCK.md`
* `PHASE_13_MOBILE_API_READINESS.md`
* `PHASE_14_FINANCE_HR_TAX_ETA.md`
* `PHASE_15_PRODUCTION_DEPLOYMENT_LOCK.md`

Every phase report file must contain:
1. **Phase Title**
2. **Phase Objective**: Purpose of the phase.
3. **Starting State**: Branch, HEAD, git status, DB, env, dirty files, accepted previous work, unapproved work.
4. **Scope Approved by Owner**: What was approved.
5. **Out of Scope**: Untouched systems.
6. **Files Changed**: Table `File | Type of Change | Why Changed | Risk Level`.
7. **Existing Work Preserved**: List of controllers, services, models, migrations, React pages, hooks, and logic preserved.
8. **Implementation Summary**: Explanation of changes/fixes.
9. **Business Rules Verified**: Protected business rules.
10. **Security Impact**: Security changes.
11. **Database Impact**: Migrations, schema changes, data changes.
12. **API Impact**: Affected endpoints.
13. **Frontend Impact**: Affected pages, components, hooks.
14. **Tests Run**: PHPUnit commands, npm run build.
15. **Test Results**: Pass/Fail confirmation.
16. **Browser Proof**: Table `Action | Expected | Actual | Result`.
17. **Console/Network Proof**: Confirm no repeated 400, 401, 403, 422, 500, or console spam.
18. **Acceptance Criteria Result**: Table `Acceptance Criteria | Passed? | Evidence`.
19. **Remaining Issues**: Open items.
20. **Phase Completion Score**: Score from 0 to 100.
21. **Risk Rating After Phase**: Low / Medium / High.
22. **Rollback Notes**: How to revert safely.
23. **Final Verdict**: `PHASE COMPLETE`, `PHASE COMPLETE WITH NOTES`, `PHASE INCOMPLETE`, or `PHASE BLOCKED`.
24. **Next Recommended Phase**: Next phase (do not start it).
25. **Owner Approval Needed**: "Waiting for owner approval before starting the next phase."

### B. Master Progress Log
Maintain a progress tracking log at `docs/MASTER_PROGRESS_LOG.md`. Update this file after each completed phase with:
1. Current branch.
2. Current HEAD.
3. Completed phases.
4. Incomplete phases.
5. Blocked phases.
6. Current production readiness percentage.
7. Last test result.
8. Last build result.
9. Last browser proof result.
10. Next recommended phase.
11. Owner approvals history.
12. Important risks.
13. Files modified across phases.
14. Rollback references.
15. Last known clean commit.
16. Active DB connection.
17. Active environment.
18. Open production blockers.

---

## 4. WORKING ON EXISTING BUILD — STRICT RULES
This project must continue from the existing completed foundation. Before creating anything new, check the existing project first.

Rules:
* Before creating a new controller, check existing controllers (e.g. check if `TicketController` can be extended instead of creating a new `ChatController`).
* Before creating a new service, check existing services.
* Before creating a new page, check existing React pages.
* Before creating new tables, check existing tables.
* Before creating new middleware, check existing middleware (e.g. check `EnsureUserNotSuspended.php`, `RoleOrProfile.php`, or `AdminMiddleware.php`).
* Before creating chat logic, check existing support/ticket logic.
* Before creating pricing logic, check `FareCalculationService`.
* Before creating wallet logic, check `WalletRepository` and `PaymentService` (or `Wallet` model).
* Before creating admin pages, check existing Admin pages.
* Before creating translations, check existing i18n/language structure (do not assume missing, classify first).

If existing code exists:
* **extend it**
* **patch it**
* **preserve naming**
* **preserve working logic**
* **avoid duplication**

Never rebuild a completed module.

---

## 5. PROJECT ROADMAP (PHASES -1 TO 15)

---

### PHASE -1 — PROJECT STATE CONTROL
* **Purpose**: Make repo state safe and classify all existing work.
* **Tasks**:
  1. Confirm Git active branch, current commit hash, and unapproved modified files.
  2. Classify all dirty files in the working directory (working tree).
  3. Ensure legacy backup stashes (`stash@{1}`) remain unapplied.
  4. Perform view caching cleanup (`php artisan view:clear`) and ignore compiled frontend files (`resources/react-app/dist`).
  5. Verify framework dependencies inside `composer.json` and `package.json`.
  6. Create `docs/phase-reports/PHASE_-1_PROJECT_STATE_CONTROL.md`.
  7. Update `docs/MASTER_PROGRESS_LOG.md`.
* **Output**:
  - Safe / Not safe to implement
  - Files needing isolation
  - Files needing cleanup
  - Do-not-touch list
* *No product code changes.*

---

### PHASE 0 — IMMEDIATE STABILIZATION LOCK
* **Purpose**: Fix immediate blockers preventing basic lifecycle transitions and dashboard metrics.
* **Tasks**:
  1. **Driver ride lifecycle 400**: Fix step transition buttons to disable during pending requests, display backend validation error messages via toast notification alerts, and sync page state immediately using react-query refetches.
  2. **Saved Places booking refresh**: Select favorite coordinates without reloading page; replace native replaceState redirects with React Router parameter navigation to preserve map and coordinates state.
  3. **Admin Driver metrics**: Fix Enum collection comparisons inside `AdminDriverController@show` to show real completed/cancelled rides, earnings, debt, and rating.
  4. **Admin Rider metrics**: Resolve string matching typos in `AdminRiderController@show` metrics aggregates.
  5. **Private driver documents**: Change storage disk to local private storage disk. Implement a secure signed route `api/v1/driver/{id}/documents/{type}` verifying admin role or owner driver ID. Legacy public uploads support fallback.
  6. **Global blocked/suspended middleware**: Create `EnsureUserNotSuspended` middleware. Register in `bootstrap/app.php` and apply globally to the authenticated Sanctum group in `routes/api.php` to block blocked riders and suspended drivers. Admins bypass the middleware.
  7. **Console clean**: Clean up hook polling timers and add status validation before executing state queries.
  8. **Dev-only location**: Allow local/dev Cairo test coords via explicit dev-only flag; production never fakes coordinates. Geolocation allowed only where appropriate.
* **Acceptance**:
  - Full browser ride: request $\to$ accept $\to$ arrived $\to$ start $\to$ complete.
  - Saved Place ride booking works without page refresh.
  - Admin metrics correct.
  - Private docs protected.
  - Blocked/suspended users blocked.
  - PHP tests pass.
  - Frontend build passes.
  - Report file created.
  - Master progress log updated.

---

### PHASE 1 — RIDE LIFECYCLE & DISPATCH LOCK
* **Purpose**: Make ride lifecycle and dispatch safe.
* **Tasks**:
  1. **Sequential nearest-first dispatch**: Only nearest driver receives offer first. Next driver receives it only after rejection or 60s timeout. No broad broadcasts.
  2. **Driver eligibility**: Ensure matching checks for online, approved, active, not blocked, not suspended, not busy, inside Cairo/Giza, and matching vehicle type.
  3. **Vehicle type strict matching**: Economy matches Economy, Comfort matches Comfort, etc. No silent fallback unless explicitly configured.
  4. **Status transitions constraint**: Prevent arriving before accept, starting before arrived, completing before start, and cancelling after start.
  5. **Duplicate prevention**: Multi-click disable guards and database transactions with `lockForUpdate` on all status transitions to block concurrent accepts/completes.
* **Acceptance**:
  - Only one offer row created for nearest driver first.
  - Next offer after 60s timeout or rejection.
  - No duplicate completes, payments, or debts.
  - All 4 vehicle types pass browser test.

---

### PHASE 2 — RIDER CORE FLOW LOCK
* **Purpose**: Complete rider experience.
* **Tasks**:
  1. Build profile page updates, profile image upload, registration, login, logout, and password change.
  2. Implement OTP verification provider plan.
  3. Integrate Egypt map Default center and geolocation.
  4. Complete saved places CRUD and checkout booking selectors.
  5. Establish payment breakdown frontend UI cards showing DomPDF invoice link logs.
* **Acceptance**:
  - Rider can complete full ride.
  - Rider saved place booking works without refresh.
  - Rider wallet/cash flows work.
  - Rider profile updates persist.
  - Rider rating appears.

---

### PHASE 3 — DRIVER CORE FLOW LOCK
* **Purpose**: Complete driver experience.
* **Tasks**:
  1. Add sound notification loops during pending offers; stop sound on accept/reject.
  2. Complete driver performance view, earnings logs, and charts.
  3. Implement driver vehicle setup registration views.
* **Acceptance**:
  - Driver can go online.
  - Driver receives request sounds.
  - Driver can complete full ride.
  - Driver earnings/debt update correctly.
  - Driver with debt > 500 EGP cannot go online.

---

### PHASE 4 — ADMIN CORE DATA LOCK
* **Purpose**: Complete admin operational dashboard.
* **Tasks**:
  1. Implement pagination on Rides, Drivers, and Riders indexes.
  2. Add search parameters (name, email, phone) and filter options on list indexes.
  3. Enable approve/reject buttons for vehicles and documents.
* **Acceptance**:
  - Admin pages show real database metrics (not zero unless truly zero).
  - Search, filters, pagination work.
  - Actions work.

---

### PHASE 5 — PRICING ENGINE LOCK
* **Purpose**: Backend-driven pricing calculations.
* **Tasks**:
  1. Configure timezone calculations to `Africa/Cairo` to apply night and peak surcharges automatically.
  2. Write active boundary checks for OSRM routes to trigger SurgeZone multipliers.
  3. Set 5 minutes free waiting limit; charge waiting fees thereafter.
  4. Ensure pickup compensation is visible in estimates and invoice breakdowns.
* **Acceptance**:
  - Estimate equals backend rules (frontend cannot be the source of pricing truth).
  - Final fare equals actual ride.
  - Invoice breakdown clear.
  - Admin can edit rules.

---

### PHASE 6 — PAYMENTS / WALLET / DEBT / SETTLEMENTS LOCK
* **Goal**: Finance-safe ride payments.
* **Tasks**:
  1. Prevent driver going online if outstanding debt exceeds 500 EGP.
  2. Build payment adapter interfaces mapping checkout verification webhooks for:
     * **Paymob**
     * **Fawry**
     * **Vodafone Cash**
     * **Instapay** (must not be omitted)
     For each gateway, implementation must specify, implement, and document:
     - Sandbox status check
     - Live key status check
     - Webhook route setup
     - Webhook signature verification logic (validate incoming request hashes/headers)
     - Success callback handler (wallet crediting, debt settling)
     - Failed callback handler (safe rejection, status tracking)
     - Refund callback (if supported by gateway)
     - Production go-live checklist
  3. Inject locks to block duplicate admin settlement approval triggers.
* **Acceptance**:
  - Cash ride creates correct debt.
  - Wallet ride updates balances.
  - Settlement clears debts once.
  - Double clicks do not duplicate money.
  - Webhooks for all 4 gateways (Paymob, Fawry, Vodafone Cash, Instapay) pass test coverage.

---

### PHASE 7 — CANCELLATIONS / PENALTIES LOCK
* **Purpose**: Business cancellation rules.
* **Tasks**:
  1. Enforce 3 cancellations/day limits per user.
  2. Apply 10 EGP penalty fee for cancellations made more than 5 minutes after driver accepts.
  3. Calculate ratings decrease and log penalty payer details.
* **Acceptance**:
  - Cancellation rules are configurable.
  - Penalty applies correctly.
  - No broken 400 cancel errors.

---

### PHASE 8 — SECURITY HARDENING LOCK
* **Purpose**: Close security gaps before production.
* **Tasks**:
  1. Throttle estimations (10/min) and booking requests (3/min).
  2. Implement IDOR checks on rides, payments, and wallet entries.
  3. Enforce private uploads checking file MIME extensions and size constraints.
  4. Inject security headers (HSTS, CSP) in Laravel's bootstrap/app.php middlewares pipeline.
* **Acceptance**:
  - Security tests pass.
  - Unauthorized access returns 401/403.
  - No private docs public.

---

### PHASE 9 — COMMUNICATIONS LOCK
* **Purpose**: Notifications and chat websockets.
* **Tasks**:
  1. Integrate active ride chat database tables, mapping Echo events.
  2. Set up support ticket threads and notifications center badges.
  3. Integrate Firebase FCM tokens register API endpoint.
* **Acceptance**:
  - Messages persist.
  - Correct users can view.
  - Realtime or polling works.

---

### PHASE 10 — ADVANCED PRODUCT FEATURES
* **Purpose**: Advanced business modules.
* **Tasks**:
  1. Enforce strict gender check matching inside `DriverMatchingService` with no male fallback.
  2. Map multi-stop stops table waypoints inside OSRM route calculators.
  3. Add driver Destination Mode coordinates filter (max 2 times daily).
  4. Enable promo codes campaign budgets, expiry, and user limits validation.
* **Acceptance**:
  - Each advanced feature has admin controls.
  - Each feature has tests.
  - Each feature has browser proof.

---

### PHASE 11 — UI/UX + LANGUAGE LOCK
* **Purpose**: Production UX layout alignments.
* **Tasks**:
  1. Map Arabic and English JSON files.
  2. Implement CSS RTL shifting.
  3. Disable buttons during loading states.
* **Acceptance**:
  - Arabic pages correct.
  - RTL correct.
  - No broken layout.

---

### PHASE 12 — REPORTS / ANALYTICS / SYSTEM MONITOR LOCK
* **Purpose**: Admin intelligence reports.
* **Tasks**:
  1. Compile accurate admin reports widgets tracking conversion and cancellation metrics.
  2. Connect Horizon queue and scheduler status monitoring metrics.
* **Acceptance**:
  - Reports accurate.
  - PDF readable.
  - Monitor not fake.

---

### PHASE 13 — MOBILE API READINESS
* **Purpose**: Prepare Flutter Rider/Driver apps APIs.
* **Tasks**:
  1. Generate Postman schemas for Auth, Rider, and Driver endpoints.
  2. Standardize JSON response error codes envelopes.
* **Acceptance**:
  - Postman collection complete.
  - Mobile endpoints tested.
  - No web-only assumptions in API.

---

### PHASE 14 — FINANCE / HR / TAX / ETA
* **Purpose**: Company operations, HR, and accounting.
* **Tasks**:
  1. Implement configurable VAT settings (do NOT hardcode 14%).
  2. Support both commission-based and gross-fare-based tax bases (no hardcoding).
  3. Add ETA e-invoice and e-receipt placeholder events (no forced integration).
  4. Configure dedicated accountant dashboard role.
* **Acceptance**:
  - Finance data does not corrupt records.
  - Tax settings configurable.
  - Accountant role separated.

---

### PHASE 15 — PRODUCTION DEPLOYMENT LOCK
* **Purpose**: Secure production release via Staging/UAT validation and direct deployment pipelines.
* **Tasks**:
  1. **Staging / UAT Environment Setup & Validation**: Create a staging server step to test everything before final production go-live. Verify the following staging requirements:
     - Staging URL configuration
     - Staging `.env` setup
     - Separate staging database
     - Staging queue worker running
     - Staging scheduler configured and running
     - Staging Reverb/Pusher configuration active
     - Staging SSL certificate configured
     - Staging smoke tests checklist execution
     - Owner UAT approval session
     *Production deployment cannot begin until the staging environment passes verification.*
  2. Set production environment properties, disable debug mode (`APP_DEBUG=false`).
  3. Verify server backups automated scripts, queue supervisors, and route config caches.
* **Acceptance**:
  - Staging smoke tests pass fully.
  - Owner review and explicit UAT approval is obtained.
  - Production deployment begins only after staging UAT approval.
  - Production smoke test passes.
  - Core ride flow works on production.
  - Backup exists and is validated.

---

## 6. PRODUCTION LOCK CRITERIA

The system is **LOCK READY** only when all of the following criteria are met:

1. **Git Status**: Git status is clean (working directory empty) or dirty files are fully classified.
2. **Stash Safety**: No unapproved legacy stashes (such as `stash@{1}`) are applied.
3. **Phase Reports**: All phase reports exist up to current phase in `docs/phase-reports/`.
4. **Progress Log**: `docs/MASTER_PROGRESS_LOG.md` is updated.
5. **Automated Tests**: Backend PHPUnit test suite passes without any warnings or failures (`php artisan test`).
6. **Frontend Compilation**: Frontend React build passes cleanly (`npm run build`) with zero TypeScript errors.
7. **Browser Proof**: E2E manual flow passes: Rider requests $\to$ nearest Driver accepts $\to$ Arrived $\to$ Started $\to$ Completed.
8. **Cash/Wallet Payments**: Both Cash and Wallet ride payments process correctly, updating ledger database tables.
9. **Saved Place Ride**: Booking rides from Saved Places works directly on the map dashboard without page reload.
10. **All Vehicle Classes**: All 4 vehicle categories (Economy, Comfort, Premium, Motorcycle) match corresponding drivers.
11. **Admin Metrics**: Dashboard metrics (rides, earnings, riders/drivers counts) are accurate and pull directly from real DB records.
12. **Driver/Rider Metrics**: Account metrics inside user profile views are not zero.
13. **Console Cleanliness**: Zero repeated 400, 422, 401, or socket connection errors in the developer console.
14. **Sensitive Document Privacy**: Driver documents return 404/403 on direct URL paths, streaming only via verified signed routes.
15. **Suspended & Blocked Users Middleware**: Middleware successfully blocks inactive, blocked, or suspended profiles from APIs.
16. **Duplicate Payout Protection**: Double click guards prevent duplicate settlement approvals.
17. **Duplicate Payment Protection**: Unique database transactions locks (`lockForUpdate`) prevent duplicate billing.
18. **Rate Limits**: Route rate limiters throttle bookings and estimation APIs.
19. **Production Configuration**: Environment is configured with `APP_DEBUG=false`, backups scheduled, and SSL enabled.
20. **Owner Approval**: Explicit manual approval received from the owner.

### **Until all of these criteria are met, the system is NOT LOCK READY.**

---

## 7. PRODUCTION HANDOVER PACKAGE

This section defines the mandatory final handover deliverables and acceptance criteria for Apex Smart Mobility.

### A. PRODUCTION DELIVERY DEFINITION
The project is considered delivered for production only when the owner receives:
1. **Working backend**: Fully functional Laravel 13 APIs, databases, routes, and queue system.
2. **Working frontend**: React 19 web application built with TypeScript, fully styled, and responsive.
3. **Working Admin dashboard**: Dashboard for managing drivers, riders, rides, payments, documents, and system configurations.
4. **Working Driver dashboard**: Interface for drivers to go online/offline, view offers, accept/reject rides, process rides, view earnings, and manage debt.
5. **Working Rider dashboard**: Interface for riders to search locations, view vehicle estimates, request rides, view active rides, and manage saved places/wallets.
6. **Working core ride flow**: Sequential matching dispatch, offer acceptance, driver arrival, trip start, and trip completion.
7. **Working cash ride**: Ride payment flow using cash mode, correctly calculating fare, recording driver debt, and reflecting ledger entries.
8. **Working wallet ride**: Ride payment flow using rider's wallet, checking balances, charging fare, and paying the driver.
9. **Working driver debt/settlement flow**: Debt accumulation from cash rides, payment of debt via admin-approved settlements.
10. **Working all 4 vehicle types**:
    * Economy
    * Comfort
    * Premium
    * Motorcycle
11. **Working saved places booking**: Booking flows using pre-saved address coordinates without full page reloads.
12. **Working admin metrics**: Real-time aggregated database query metrics on the admin dashboard (e.g. active riders, online drivers, earnings, cancel rates).
13. **Working security protections**: IDOR validation, upload restrictions, rate limiters, secure HTTP headers, and private file streaming.
14. **Working private driver documents**: Non-public upload disk storing license/national ID, served only via secure signed routes after permission checks.
15. **Working production deployment checklist**: A step-by-step setup guide for staging and production environments.
16. **Clear documentation**: Technical files describing the codebase, database schemas, and operational instructions.
17. **Clear rollback plan**: Standard operating procedures to revert deployments safely in the event of production issues.
18. **Clear handover report**: Full project delivery scorecard, open items list, and final production readiness status.

### B. FINAL PRODUCTION HANDOVER FILES
At the end of Phase 15, the following files must be created under the `docs/production-handover/` directory:
1. [PRODUCTION_HANDOVER_REPORT.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/PRODUCTION_HANDOVER_REPORT.md)
2. [PRODUCTION_DEPLOYMENT_GUIDE.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/PRODUCTION_DEPLOYMENT_GUIDE.md)
3. [PRODUCTION_ENVIRONMENT_CHECKLIST.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/PRODUCTION_ENVIRONMENT_CHECKLIST.md)
4. [PRODUCTION_SMOKE_TESTS.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/PRODUCTION_SMOKE_TESTS.md)
5. [PRODUCTION_ROLLBACK_PLAN.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/PRODUCTION_ROLLBACK_PLAN.md)
6. [SECURITY_AUDIT_REPORT.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/SECURITY_AUDIT_REPORT.md)
7. [API_ENDPOINTS_SUMMARY.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/API_ENDPOINTS_SUMMARY.md)
8. [ADMIN_OPERATIONS_MANUAL.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/ADMIN_OPERATIONS_MANUAL.md)
9. [KNOWN_LIMITATIONS.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/KNOWN_LIMITATIONS.md)
10. [PERFORMANCE_BENCHMARK_REPORT.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/PERFORMANCE_BENCHMARK_REPORT.md)
11. [MONITORING_AND_ALERTS.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/MONITORING_AND_ALERTS.md)
12. [BACKUP_RESTORE_TEST.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/BACKUP_RESTORE_TEST.md)
13. [GO_LIVE_CHECKLIST.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/GO_LIVE_CHECKLIST.md)
14. [LEGAL_AND_PRIVACY_NOTES.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/LEGAL_AND_PRIVACY_NOTES.md)
15. [SECRETS_HANDOVER_AND_ROTATION.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/SECRETS_HANDOVER_AND_ROTATION.md)
16. [INCIDENT_RESPONSE_RUNBOOK.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/INCIDENT_RESPONSE_RUNBOOK.md)
17. [DEVELOPER_ONBOARDING.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/production-handover/DEVELOPER_ONBOARDING.md)

Also update:
* [MASTER_PROGRESS_LOG.md](file:///Users/tammer/Desktop/myprojects/uper-clone-backend-rebuild/docs/MASTER_PROGRESS_LOG.md)

### C. DETAILED CONTENT OF HANDOVER FILES

#### 1. PRODUCTION_HANDOVER_REPORT.md
This report provides a formal evaluation of the project's state at handover. It must include:
1. **Project name**: Apex Smart Mobility.
2. **Version / branch / commit hash**: Current production deployment reference.
3. **Deployment date**: Handover execution timestamp.
4. **Environment specs**:
   * PHP version
   * Laravel version
   * Node version
   * React version
   * DB engine
   * Queue driver
   * Cache driver
   * Broadcasting driver
5. **Current production readiness score**: Out of 100.
6. **Completed phases**: Summary of finished project phases.
7. **Incomplete phases**: Any deferred phases.
8. **Blocked phases**: Any items blocked by external factors.
9. **Open issues**: Bug tracker reference list.
10. **Known limitations**: High-level platform boundaries.
11. **Owner-approved scope**: Explicit scope agreements.
12. **Features delivered**: Detail of implemented functionality.
13. **Features not delivered yet but planned in roadmap**: Backlog details.
14. **Risk rating**: Low / Medium / High assessment.
15. **Final verdict**: Must explicitly state one of:
    * `PRODUCTION READY`
    * `NOT PRODUCTION READY`
    * `PRODUCTION READY WITH NOTES`

#### 2. PRODUCTION_DEPLOYMENT_GUIDE.md
This guide details the steps to set up the application from scratch in production. It must include:
1. **Server requirements**: OS, memory, processor guidance.
2. **PHP extensions**: List of mandatory PHP extensions.
3. **MySQL requirements**: Versions and configurations.
4. **Node/npm requirements**: Version configurations for React compilation.
5. **Clone/deploy instructions**: SSH commands, repository setup.
6. **.env setup**: Complete list of environment keys (placeholders only).
7. **APP_DEBUG=false**: Configuration check description.
8. **Key generation**: `php artisan key:generate`.
9. **Migrations**: `php artisan migrate --force`.
10. **Storage setup**: `php artisan storage:link` and private disk config.
11. **Queue worker setup**: Supervisor configuration for `php artisan queue:work`.
12. **Scheduler setup**: Cron configuration `* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1`.
13. **Reverb/Pusher setup**: Realtime server parameters.
14. **SSL setup**: Let's Encrypt / Certbot commands.
15. **Domain setup**: Nginx config templates.
16. **Build frontend**:
    * `cd resources/react-app`
    * `npm install`
    * `npm run build`
17. **Laravel cache commands**:
    * `php artisan config:cache`
    * `php artisan route:cache`
    * `php artisan view:cache`
18. **Backup command**: Command or script to dump databases and assets.
19. **Restore command**: Command to recover database state from SQL file.
20. **Rollback command**: Reversion workflow steps.
*CRITICAL: Do not expose actual secrets in this guide.*

#### 3. PRODUCTION_ENVIRONMENT_CHECKLIST.md
A post-deployment validation checklist. It must include:
1. **APP_ENV=production**: Confirmed.
2. **APP_DEBUG=false**: Confirmed.
3. **Correct APP_URL**: Matches SSL-enabled domain.
4. **Correct database credentials**: Using separate production DB.
5. **Queue worker running**: Horizon or systemd service online.
6. **Scheduler running**: System cron working.
7. **Broadcasting configured**: WebSockets connecting on client.
8. **Storage private/public configured**: Secure disks isolated.
9. **SSL enabled**: HTTPS active on all requests.
10. **Logs writable**: `storage/logs/` permissions verified.
11. **Cache writable**: `bootstrap/cache/` and `storage/framework/` verified.
12. **Backup path writable**: Backup target storage verified.
13. **No .env committed**: Git repository checked.
14. **No API keys committed**: Scan of credentials done.
15. **No local SQLite committed**: Check that sqlite db files are not in Git.
16. **No generated artifacts committed**: Verification of no compiled dist in git.
17. **No public driver documents**: Storage config isolation validation.
18. **Admin account created securely**: Initial credentials generated and forced to change.
19. **Test/demo accounts removed**: All dummy accounts purged or deactivated.
20. **Rate limits enabled**: API throttling verified active.

#### 4. PRODUCTION_SMOKE_TESTS.md
The exact steps to manually verify the platform in a production staging environment:
* **A. Auth**:
  1. Admin login.
  2. Driver login.
  3. Rider login.
  4. Logout invalidates token.
  5. Suspended user gets 403.
* **B. Rider**:
  1. Open Rider dashboard.
  2. Select pickup.
  3. Select destination.
  4. Select vehicle type.
  5. Estimate fare.
  6. Request ride.
  7. Saved place booking.
  8. Wallet balance.
  9. Ride history.
  10. Rating after completion.
* **C. Driver**:
  1. Driver goes online.
  2. Location updates.
  3. Receives offer.
  4. Sound alert plays.
  5. Accepts ride.
  6. Arrived.
  7. Start.
  8. Complete.
  9. Earnings update.
  10. Debt update for cash ride.
* **D. Admin**:
  1. Dashboard loads.
  2. Driver metrics correct.
  3. Rider metrics correct.
  4. Rides list loads.
  5. Payments list loads.
  6. Settlements approve/reject works.
  7. Reports load.
  8. System monitor loads.
* **E. Payments**:
  1. Complete cash ride.
  2. Complete wallet ride.
  3. Wallet insufficient handled.
  4. No duplicate payment on double click.
  5. No duplicate settlement approval.
* **F. Security**:
  1. Rider cannot open admin API.
  2. Driver cannot open admin API.
  3. Rider cannot access driver API.
  4. Driver cannot access rider wallet.
  5. Other user cannot view private driver document.
  6. Invalid file upload rejected.
  7. Rate limits work.
* **G. Maps**:
  1. Cairo/Giza map loads.
  2. Route appears.
  3. Driver route to pickup appears.
  4. Driver route to destination appears.
  5. Out-of-Egypt production coordinates are rejected.
* **H. Console**:
  1. No repeated 400.
  2. No repeated 401.
  3. No repeated 403.
  4. No repeated 422.
  5. No 500.
  6. No console spam.

#### 5. PRODUCTION_ROLLBACK_PLAN.md
A step-by-step procedure to execute in case of critical production failures:
1. **Last stable commit**: The git commit hash of the previous known stable version.
2. **Current production commit**: The hash of the deployed version.
3. **DB backup path**: Storage path where DB dumps are maintained.
4. **Restore DB command**: Command to restore database from backup.
5. **Rollback code command**: Git command to revert repository to stable commit.
6. **Rollback frontend build command**: Build or recovery command for web static assets.
7. **Queue restart command**: `php artisan queue:restart` to reload workers.
8. **Cache clear command**: `php artisan cache:clear` and config clear commands.
9. **How to disable problematic feature flags**: Toggle commands or env settings.
10. **Emergency contact/owner approval note**: Operational protocols before reverting.

#### 6. SECURITY_AUDIT_REPORT.md
A detailed summary of security validations implemented. It must include:
1. **Auth security**: Sanctum configuration, tokens lifetime.
2. **Role security**: RBAC validation checks for Admin/Driver/Rider.
3. **Route protection**: Middleware configuration validation.
4. **IDOR protection**: Policy-based checks on models.
5. **Wallet/payment security**: Transaction safety and signature check audits.
6. **Driver document privacy**: Storage disk and signed URLs validation.
7. **File upload validation**: Extension checks (PDF, PNG, JPG) and size caps.
8. **Rate limits**: Endpoint-level rate limiting settings.
9. **Security headers**: CSP, HSTS, X-Frame-Options configurations.
10. **Safe production errors**: Handlers mapping standard production logs with no stack traces shown to users.
11. **Audit logs**: Log channels configuration.
12. **GitHub safety**: Scan results showing no credentials in repo.
13. **Secrets check**: Validation of `.env.example` vs `.env` values.
14. **Remaining security risks**: Listing residual low-priority threats.
15. **Final security verdict**: Assessment of system safety.

#### 7. API_ENDPOINTS_SUMMARY.md
A developer guide for mobile integration:
1. **Auth endpoints**: Login, Register, OTP, Logout.
2. **Rider endpoints**: Profile, Wallet, Saved Places.
3. **Driver endpoints**: Online toggle, Location, Earnings, Debt.
4. **Admin endpoints**: Dashboards, Metrics, Verification, Settings.
5. **Ride endpoints**: Estimations, Requests, Lifecycle status transitions.
6. **Wallet/payment endpoints**: Top-ups, Charges, Ledgers.
7. **Settlement endpoints**: Cash payments settlement.
8. **Notification endpoints**: Channels and settings.
9. **Support/chat endpoints**: Room setup, sending, and viewing.
10. **Mobile-ready endpoints**: Checklist of Flutter compatibility.
11. **Required auth role per endpoint**: Table outlining route permissions.
12. **Example response shape**: Standard success JSON structure.
13. **Error response shape**: Standard error JSON envelopes.

#### 8. ADMIN_OPERATIONS_MANUAL.md
A guide for administrators managing the platform:
1. **Manage drivers**: Creating, listing, searching.
2. **Approve driver documents**: Verification panel workflow.
3. **Approve vehicles**: Matching drivers to vehicle class.
4. **Block/suspend/reactivate users**: User status controls.
5. **View rides**: Detailed list of current and historical rides.
6. **View payments**: Ledger transaction viewer.
7. **Approve settlements**: Settling driver debt balances.
8. **Manage cancellation reasons**: System setup for rider/driver cancellation reasons.
9. **Manage pricing/settings**: Surcharge, night rates, boundary zones configuration.
10. **View reports**: Exporting dashboards.
11. **View system monitor**: WebSockets, queues, logs monitoring.
12. **Handle support tickets**: Customer ticketing chat interface.
13. **Handle emergencies**: Driver/Rider SOS action items.
14. **Handle failed payments**: Resolving system errors.
15. **Handle driver debt**: Monitoring debt caps.

#### 9. KNOWN_LIMITATIONS.md
A clear listing of system limits. It must include:
1. **What is fully production-ready**: Completed robust features.
2. **What is partially ready**: Features awaiting additional testing.
3. **What is intentionally disabled**: Flags turned off for launch.
4. **What requires external services**: SMS gateway APIs, Firebase keys, etc.
5. **What requires legal/accountant confirmation**: Surcharges, VAT parameters.
6. **What requires mobile app work**: App store setup, device capabilities.
7. **What requires payment gateway production keys**: Paymob/Fawry keys.
8. **What should not be used in production yet**: Experimental or draft logic.

#### 10. PERFORMANCE_BENCHMARK_REPORT.md
This report tracks performance metrics. It must include:
1. **Average API response time**: (Production acceptance target: normal API responses under 300ms where possible).
2. **Ride request latency**: (Target: must feel instant in browser).
3. **Driver matching latency**: (Target: must feel instant in browser).
4. **Driver location update latency**.
5. **Admin dashboard load time**: (Target: must not hang or freeze).
6. **Rider dashboard load time**.
7. **Driver dashboard load time**.
8. **Map load time**.
9. **Database slow queries**.
10. **Queue processing time**.
11. **Failed jobs count**.
12. **Memory usage**.
13. **CPU usage**.
14. **Bottlenecks**.
15. **Recommendations**.
*Performance goals checklist must verify no unbounded polling loops and no excessive notification requests.*

#### 11. MONITORING_AND_ALERTS.md
This guide details production monitoring setup. It must include verification of:
1. Laravel logs writable and monitored.
2. Failed jobs monitored.
3. Queue worker status monitored.
4. Scheduler status monitored.
5. Reverb/Pusher status monitored.
6. Database status monitored.
7. Backup status monitored.
8. Server disk usage monitored.
9. Error tracking configured or documented.
10. Critical alerts documented.
*Operational explanations required:*
- Where logs are stored.
- How to check failed jobs.
- How to restart queue workers.
- How to check scheduler.
- How to check websocket/realtime status.
- How to identify payment/webhook failures.
- Who should be alerted for critical failures.

#### 12. BACKUP_RESTORE_TEST.md
This file verifies system recoverability. It must include:
1. Backup command used.
2. Backup file path.
3. Backup timestamp.
4. Restore command.
5. Restore target.
6. Restore result.
7. Data verification after restore.
8. Rollback risk.
9. Final verdict.
*Production cannot be accepted until backup restore is tested or explicitly waived by owner.*

#### 13. GO_LIVE_CHECKLIST.md
A final verification list before launching:
1. Staging approved.
2. Production `.env` verified.
3. APP_DEBUG=false.
4. SSL active.
5. Domain active.
6. Database connected.
7. Migrations complete.
8. Storage configured.
9. Private docs protected.
10. Queue running.
11. Scheduler running.
12. Realtime running.
13. Cache/config/routes optimized.
14. Payment gateways verified.
15. Webhook routes verified.
16. Admin login verified.
17. Rider login verified.
18. Driver login verified.
19. Full ride test verified.
20. Cash payment verified.
21. Wallet payment verified.
22. Settlement test verified.
23. Backup created.
24. Restore tested.
25. Rollback plan confirmed.
26. Monitoring active.
27. Known limitations reviewed.
28. Owner final approval received.

#### 14. LEGAL_AND_PRIVACY_NOTES.md
This file contains legal compliance checks and privacy policies. It must include:
1. Privacy policy requirements.
2. Terms of service requirements.
3. Rider personal data handling workflows.
4. Driver personal data handling workflows.
5. Driver documents privacy and security rules.
6. Driver license / ID / criminal record storage and encryption policies.
7. Rider location data tracking and storage limits.
8. Driver location data tracking and storage limits.
9. Payment data processing compliance (PCI-DSS considerations).
10. Wallet data logging ledger boundaries.
11. Data retention policies.
12. Data deletion policies (right to be forgotten flow).
13. Access matrices specifying who can view sensitive documents.
14. Admin workspace access rules.
15. Security responsibility notes.
16. Legal/accountant confirmation requirements (flagging whether confirmations are complete or missing) for:
    * VAT configurations
    * Commission/gross tax basis
    * ETA e-invoice setups
    * ETA e-receipt integrations
17. Final legal readiness verdict (must state: `READY`, `READY WITH NOTES`, or `NOT READY`).
*CRITICAL: Do not invent legal approvals; mark missing validations clearly.*

#### 15. SECRETS_HANDOVER_AND_ROTATION.md
This guide secures the transition of keys to the owner. It must include:
1. List of secret categories to transition:
   * `APP_KEY`
   * Database passwords
   * Mail service keys
   * Payment gateway credentials (Paymob, Fawry, Vodafone Cash, Instapay keys)
   * SMS gateway provider keys
   * Firebase/FCM credentials
   * Pusher/Reverb security keys
   * Backup storage API credentials
2. Secure storage locations description.
3. Safe handover methods (e.g. encrypted managers, offline transfer).
4. Step-by-step rotation guide for each secret.
5. Access list mapping roles with rights.
6. Explicit security warnings detailing what must never be committed.
7. Rules ensuring `.env.example` contains placeholders only.
8. Check to verify that the production `.env` is never committed.
9. Revocation and emergency replacement procedures for compromised keys.
10. Final secrets safety verdict.
*CRITICAL: Do not print actual secrets, passwords, or active keys in this file.*

#### 16. INCIDENT_RESPONSE_RUNBOOK.md
This manual details instructions for operations when production failure occurs. It must include response guidelines for:
1. API down (Nginx, FPM failures).
2. Database connection failure.
3. Queue worker stopped.
4. Scheduler stopped.
5. Realtime/Pusher/Reverb stopped.
6. Driver matching failure.
7. Rider cannot request ride.
8. Driver cannot accept ride.
9. Payment gateway failure.
10. Wallet balance discrepancy.
11. Suspected duplicate payments.
12. Settlement clearance errors.
13. Private document access issues.
14. Security incidents and unauthorized access.
15. Server disk space exhaustion.
16. Backup creation failure.
17. Database restoration execution steps.
18. Version rollback execution steps.
19. Emergency owner approval protocol.
20. Notification directories (who to contact).
21. Priority levels definition: `Critical` / `High` / `Medium` / `Low`.
22. Expected target response time per priority level.
23. Final incident readiness verdict.

#### 17. DEVELOPER_ONBOARDING.md
This document provides instructions for developers maintaining the codebase. It must include:
1. Project overview.
2. Tech stack specifications.
3. Code folder structure.
4. Backend local environment setup.
5. Frontend local environment setup.
6. Commands to run Laravel locally.
7. Commands to run React locally.
8. Commands to run tests.
9. Commands to run frontend compilation builds.
10. Commands to clear and rebuild Laravel cache.
11. Procedures to inspect system logs.
12. Debugging protocols for the ride lifecycle.
13. Debugging protocols for the dispatch matching engine.
14. Debugging protocols for wallet/payment ledger processes.
15. Debugging protocols for driver location telemetry.
16. Debugging protocols for push notifications.
17. Debugging protocols for MapLibre/OSM maps.
18. Explanations of core classes:
    * `RideService`
    * `DriverMatchingService`
    * `FareCalculationService`
    * `PaymentService`
    * `WalletRepository`
19. Explanations of core frontend pages:
    * `RiderDashboardPage`
    * `DriverDashboardPage`
    * `DriverCurrentRidePage`
    * `AdminDashboardPage`
20. "Do-Not-Touch" system warnings.
21. Step-by-step instructions on writing new phase reports.
22. Step-by-step instructions on maintaining the `MASTER_PROGRESS_LOG.md` file.
23. Final developer onboarding handover verdict.

---

### D. FINAL PRODUCTION ACCEPTANCE CRITERIA
The owner can accept the project as PRODUCTION READY only when all the following conditions are met:
1. **All phase reports exist**: Complete set of documents from `PHASE_-1` to `PHASE_15` under `docs/phase-reports/`.
2. **Master progress log is updated**: `docs/MASTER_PROGRESS_LOG.md` matches the code state exactly.
3. **Production handover files exist**: All 17 files listed in Section 7-B are complete and located under `docs/production-handover/`.
4. **Git status is clean**: Clean working directory or fully explained/stashed pending changes.
5. **Backend tests pass**: All PHPUnit tests pass cleanly (`php artisan test`).
6. **Frontend build passes**: React build finishes successfully with zero TypeScript compilation warnings.
7. **Browser smoke tests pass**: Complete manual E2E ride validation passes.
8. **Staging smoke tests pass**: Verification of the staging environment checklist.
9. **Owner UAT approval exists**: Sign-off on staging validation.
10. **Production smoke tests pass**: Verification of the production environment checklist.
11. **Performance benchmark completed**: Verification metrics documented in `PERFORMANCE_BENCHMARK_REPORT.md`.
12. **Monitoring/alerts documented**: Monitors and alert protocols explained in `MONITORING_AND_ALERTS.md`.
13. **Backup restore tested**: Complete backup & restore proof in `BACKUP_RESTORE_TEST.md` (or explicitly waived by owner).
14. **Payment gateways go-live checklist completed**: Verification of Paymob, Fawry, Vodafone Cash, and Instapay production settings.
15. **Security audit completed**: Documented in `SECURITY_AUDIT_REPORT.md`.
16. **Legal/privacy notes completed**: Documented in `LEGAL_AND_PRIVACY_NOTES.md`.
17. **Secrets handover/rotation documented**: Documented in `SECRETS_HANDOVER_AND_ROTATION.md`.
18. **Incident response runbook completed**: Documented in `INCIDENT_RESPONSE_RUNBOOK.md`.
19. **Developer onboarding completed**: Documented in `DEVELOPER_ONBOARDING.md`.
20. **Rollback plan exists**: Rollback document `PRODUCTION_ROLLBACK_PLAN.md` is complete and tested.
21. **Admin dashboard works**: Verifiable operations on riders, drivers, and settings.
22. **Driver dashboard works**: Telemetry updates and status toggles functioning.
23. **Rider dashboard works**: Location lookup and vehicle matching dashboard functioning.
24. **Core ride flow works**: Rider requests $\to$ Sequential dispatch $\to$ Driver accepts $\to$ Arrived $\to$ Started $\to$ Completed.
25. **Cash ride works**: Ledgers update and driver debt increments correctly.
26. **Wallet ride works**: Ledger balances charge and pay out correctly.
27. **Driver debt/settlement works**: Verification of settling driver cash debts in the admin panel.
28. **Saved Places booking works**: Map targets refresh correctly without reloads.
29. **All 4 vehicle types work**: Economy, Comfort, Premium, and Motorcycle match corresponding classes.
30. **Private driver documents protected**: Direct storage paths blocked; streaming via secure signed routes works.
31. **Blocked/suspended users blocked**: Ensure middleware rejects suspended drivers and blocked riders.
32. **No critical console/network errors**: Console is free of repeating warnings or exceptions.
33. **Production env safe**: Verified `.env` file security, disabled debugging, rate limiting active.
34. **Owner gives final production approval**: Manual explicit approval in the conversation thread.
35. **Roadmap Feature Status Clarity**: Every roadmap feature (including VIP, Female Safety, Multi-stop, Destination Mode, Campaigns/Referrals, Chat, Mobile API, Finance/HR/Tax/ETA, and all advanced modules) must have a verified final status before production handover, explicitly mapping to one of the following:
    - Delivered and tested
    - Disabled by feature flag
    - Documented in `KNOWN_LIMITATIONS.md`
    - Pending owner-approved later phase
    *No feature may remain ambiguous or undocumented at production handover.*

#### **Until all of these 35 criteria are met, the status remains: SYSTEM NOT PRODUCTION READY.**

---

### E. FINAL GOVERNANCE RULE
The owner does not want a prototype; the owner wants a production-ready delivered project. Every phase must move the existing project closer to production delivery.
* **Do NOT start from scratch.**
* **Do NOT rebuild.**
* **Do NOT skip reports.**
* **Do NOT skip browser proof.**
* **Do NOT skip security.**
* **Do NOT skip rollback planning.**
* **Do NOT skip owner approval.**
