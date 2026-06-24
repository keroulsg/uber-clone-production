# Phase 10A – Safe Additives Lock

**Status:** ✅ Complete (code + tests pass)  
**Date:** 2026-06-24  
**Base commit:** `fbc22386`  
**Owner approved:** Yes (Phase 10 split into 10A/10B/10C; 10A approved)

---

## Scope

Phase 10A introduces foundational database columns, resources, admin CRUD, and seeders that are **additive only** — no payment, fare, dispatch, or ride lifecycle logic changes.

### VehicleType
- **File:** `app/Models/VehicleType.php`
- **Changes:** Expanded `$fillable` and `$casts` to include `commission_rate`, `fuel_multiplier`, `vip_enabled`, `female_driver_enabled`, `seats`, `luggage_capacity`, `base_fare`, `per_km_rate`, `per_minute_rate`, `minimum_fare`, `waiting_charge_per_minute`, `cancellation_fee`
- **API:** Exposed via `VehicleTypeResource`
- **Data:** All new fields included in `GET /api/v1/vehicle-types`

### Driver Resource
- **File:** `app/Http/Resources/DriverResource.php`, `app/Http/Resources/DriverBriefResource.php`
- **Changes:** Added `gender` (string) and `femaleOnly` (boolean) fields to both resources

### PromoCode Admin CRUD
- **Files:**
  - `app/Http/Controllers/Api/Admin/AdminPromoCodeController.php`
  - `app/Http/Resources/PromoCodeResource.php`
  - `app/Models/PromoCode.php` (pre-existing model used)
  - `database/factories/PromoCodeFactory.php`
- **Routes:** `GET|POST /api/v1/admin/promo-codes`, `GET|PUT|DELETE /api/v1/admin/promo-codes/{id}`
- **Validation:** `code` required|unique, `type` in:fixed/percentage, `value` numeric, `min_ride_amount`/`max_discount`/`usage_limit` nullable|numeric, `is_active` boolean
- **Auth:** Admin middleware (`role:admin`) applied via route group
- **Note:** Discount application to rides is NOT implemented (deferred to Phase 10C)

### Service Area Foundation
- **Files:**
  - `database/migrations/2026_06_24_162300_create_service_areas_table.php`
  - `app/Models/ServiceArea.php`
  - `app/Http/Controllers/Api/Admin/AdminServiceAreaController.php`
  - `database/factories/ServiceAreaFactory.php`
  - `database/seeders/ServiceAreaSeeder.php`
- **Routes:** `GET|POST /api/v1/admin/service-areas`, `GET|PUT|DELETE /api/v1/admin/service-areas/{id}`
- **Table columns:** `name`, `slug`, `city`, `governorate`, `center_latitude`, `center_longitude`, `radius_km`, `cities` (JSON), `is_active`, timestamps
- **Seeder:** Cairo (radius 30km) + Giza (radius 25km)
- **Note:** Pickup/dropoff geo-enforcement is NOT implemented (deferred to Phase 10C)

### Settings
- **Seeder addition:** `waiting_free_minutes` key added to `CoreDataSeeder` (group: pricing, type: integer, value: 5)

---

## Files Changed

### Modified
| File | Change |
|------|--------|
| `app/Models/VehicleType.php` | Expanded `$fillable` + `$casts` |
| `app/Http/Resources/VehicleTypeResource.php` | Exposed 12 new fields |
| `app/Http/Resources/DriverResource.php` | Added `gender`, `femaleOnly` |
| `app/Http/Resources/DriverBriefResource.php` | Added `gender`, `femaleOnly` |
| `database/seeders/CoreDataSeeder.php` | Added `waiting_free_minutes` setting |
| `routes/api.php` | Added admin promo-codes and service-areas routes |

### New
| File | Purpose |
|------|---------|
| `app/Http/Controllers/Api/Admin/AdminPromoCodeController.php` | PromoCode admin CRUD |
| `app/Http/Resources/PromoCodeResource.php` | PromoCode API resource |
| `app/Models/ServiceArea.php` | ServiceArea model |
| `app/Http/Controllers/Api/Admin/AdminServiceAreaController.php` | ServiceArea admin CRUD |
| `database/migrations/2026_06_24_162300_create_service_areas_table.php` | Service areas migration |
| `database/factories/PromoCodeFactory.php` | PromoCode factory |
| `database/factories/ServiceAreaFactory.php` | ServiceArea factory |
| `database/seeders/ServiceAreaSeeder.php` | Cairo + Giza seed data |
| `tests/Feature/Phase10aSafeAdditivesTest.php` | 16 tests for Phase 10A |

---

## Broadcast Auth Fix (Pre-existing Phase 9 Issue)

During Phase 10A testing, 3 Phase 9 broadcast auth tests were discovered failing on the base commit `fbc22386`. Root cause: `phpunit.xml` set `BROADCAST_CONNECTION=null`, which used Laravel's `NullBroadcaster` — its `auth()` method is a no-op, always returning 200. The channel authorization callbacks from `routes/channels.php` were never invoked.

### Fix applied:

1. **`config/broadcasting.php`** (new) — explicit broadcast config with a `test` driver.
2. **`app/Broadcasting/TestBroadcaster.php`** (new) — custom broadcaster extending `Broadcaster` that:
   - Calls `verifyUserCanAccessChannel()` to properly invoke channel callbacks
   - Strips `private-`/`presence-` prefix via `normalizeChannelName()`
   - Returns empty array for auth responses (avoids Pusher/Ably dependency)
   - No-ops actual broadcasts
3. **`app/Providers/AppServiceProvider.php`** (modified) — registers the `test` driver via `Broadcast::extend()`.
4. **`phpunit.xml`** (modified) — changed `BROADCAST_CONNECTION` from `null` to `test`.

**Result:** All 40 Phase 9 communication tests pass, full suite 172/172.

## Test Results

- **Phase 10A:** 16 tests, 38 assertions ✅ all pass
- **Full suite:** 172 tests, 535 assertions ✅ all pass (172/172)
- **React build:** ✅ built in 6.40s (chunk size warnings only, pre-existing)

## Deferred to Phase 10B/10C
- PromoCode discount application to ride fares
- Female driver matching logic
- Service area pickup/dropoff geo-enforcement
- Vehicle type dynamic pricing integration
