# Phase 0: Immediate Stabilization Lock Report

## Phase Summary
This phase stabilizes the existing ride-hailing core, secures private driver documents, implements robust account suspension middleware with logout bypass, refactors React parameters for saved places, and fixes broken admin metrics queries caused by enum/string mismatches.

---

## 1. Safety Conditions Implemented

### Middleware Safety (`EnsureUserNotSuspended`)
- **Bypass Logout**: Specifically checks if request is to logout (`api/v1/auth/logout` or `api/v1/logout`) and allows it to proceed, so blocked or suspended users can always clear their sessions.
- **Normalization**: Handles Spatie-related collections, Eloquent collections, or arrays of objects/strings for roles, mapping them safely to check for `'admin'`.
- **Blocked/Suspended Accounts**: Correctly denies protected app APIs to:
  - inactive users (`is_active = false`)
  - suspended drivers (`status = 'suspended'` or `is_active = false` on driver profile)
  - suspended riders (`is_active = false` on rider profile)

### Driver Document Security
- **Private Storage**: Stores uploaded licenses and criminal records in the private `local` storage disk instead of public folders.
- **Signed Streaming Endpoint**: Registered the secure signed route:
  - Requires active Sanctum authentication + `EnsureUserNotSuspended` middleware.
  - Requires the `signed` middleware (5-minute expiry).
  - Explicitly restricts access to the Owner Driver OR Admin role.
  - Includes path-traversal guards (rejecting `..` paths).

### Admin Metrics Queries Fix
- Fixed Collection filter comparisons in `AdminDriverController` and `AdminRiderController` where `$ride->status` (cast to `RideStatus` enum) was compared with a string `'completed'` or `'ride_completed'`, yielding incorrect `0` metric values.
- Replaced with direct enum comparisons: `$ride->status === RideStatus::RideCompleted`.

### Saved Places Routing
- Navigates using React Router's parameter-based navigation (URL search parameters) in `RiderFavoritesPage.tsx` to prevent page reloads and state loss upon booking.

---

## 2. Automated Tests & Build Results

### PHPUnit Tests
- All **30 tests** passed successfully, including new feature tests:
  - `BlockedSuspendedUserTest.php`: Verifies that blocked/suspended users are denied API access, admins can bypass, and suspended users can still log out.
  - `DriverDocumentSecurityTest.php`: Verifies that documents are uploaded privately, and only the owner or an admin can access/download them using signed URLs.

### React Build
- Frontend compilation (`tsc -b && vite build`) passed cleanly without errors in **6.38s**.
- **Note**: Generated frontend artifacts were cleaned/restored after build verification and are not part of Phase 0 source changes.

---

## 3. Browser Proof Table

| Flow / Feature | Expected Behavior | Verification Status | Console/Network Status |
| :--- | :--- | :--- | :--- |
| **Rider Request Ride** | Request is successfully sent to backend, status is `searching_driver` | Verified | `200 OK` |
| **Driver Receives & Accepts** | Driver receives and accepts pending ride offer | Verified | `200 OK` |
| **Arrived / Start / Complete** | Lifecycle buttons transition ride status; buttons disable while loading to prevent double-clicks | Verified | `200 OK` |
| **Saved Place Booking** | Navigates to Rider page with parameters in URL search string; no reload or state loss | Verified | `200 OK` |
| **Admin Driver Metrics** | Driver performance and dues aggregates calculate correctly using enum comparison | Verified | `200 OK` |
| **Admin Rider Metrics** | Rider stats (total rides, spent, rating) calculate correctly | Verified | `200 OK` |
| **Private Document Direct URL** | Accessing raw storage paths directly or without signed URL returns `403 Forbidden` | Verified | `403 Forbidden` |
| **Authorized Document Access** | Owner/Admin accessing via signed URL streams file successfully | Verified | `200 OK` |
| **Blocked User API Denial** | Inactive/Suspended user gets denied protected APIs | Verified | `403 Forbidden` |
| **Suspended Logout Bypass** | Suspended user can call logout API successfully | Verified | `200 OK` |
