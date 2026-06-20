<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Ride\RideController;
use App\Http\Controllers\Api\Ride\DriverRideController;
use App\Http\Controllers\Api\Driver\DriverController;
use App\Http\Controllers\Api\Vehicle\VehicleController;
use App\Http\Controllers\Api\Payment\PaymentController;
use App\Http\Controllers\Api\Rating\RatingController;
use App\Http\Controllers\Api\Notification\NotificationController;
use App\Http\Controllers\Api\Support\TicketController;
use App\Http\Controllers\Api\Report\ReportController;
use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\AdminDriverController;
use App\Http\Controllers\Api\Admin\AdminRiderController;
use App\Http\Controllers\Api\Settlement\DriverSettlementController;
use App\Http\Controllers\Api\Settlement\AdminSettlementController;
use App\Http\Controllers\Api\Admin\AdminFeatureController;
use App\Http\Controllers\Api\CancellationReasonController;
use App\Http\Controllers\Api\SavedPlaceController;

Route::prefix('v1')->group(function () {

    // Public routes (rate-limited)
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1,register');
    Route::post('auth/login', [AuthController::class, 'login'])->name('login')->middleware('throttle:10,1,login');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,1,forgot-password');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1,reset-password');
    Route::post('auth/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('auth/verify-otp', [AuthController::class, 'verifyOtp']);

    // Vehicle types (public)
    Route::get('vehicle-types', [VehicleController::class, 'types']);

    // Public config
    Route::get('config', function () {
        $currency = \App\Models\Setting::where('key', 'default_currency')->first()?->value ?? 'USD';
        $locale = \App\Models\Setting::where('key', 'currency_locale')->first()?->value ?? 'en-US';
        return response()->json([
            'success' => true,
            'data' => [
                'default_currency' => $currency,
                'currency_locale' => $locale,
            ],
        ]);
    });

    // Cancellation reasons (public — needed for both rider and driver before cancel)
    Route::get('cancellation-reasons', [CancellationReasonController::class, 'index']);

    // Authenticated routes
    Route::middleware(['auth:sanctum', 'throttle:200,1,api'])->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('user', [AuthController::class, 'user']);
            Route::post('profile', [AuthController::class, 'updateProfile']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
            Route::get('settings', [AuthController::class, 'getSettings']);
            Route::post('settings', [AuthController::class, 'updateSettings']);
            Route::post('avatar', [AuthController::class, 'uploadAvatar']);
            Route::delete('avatar', [AuthController::class, 'deleteAvatar']);
        });

        // Fare estimate (available to all authenticated users)
        Route::post('rides/estimate-fare', [RideController::class, 'estimateFare']);

        // Recent completed ride pending rating (rider or driver)
        Route::get('rides/recent-completed-pending-rating', [RideController::class, 'recentCompletedPendingRating']);
        Route::post('rides/{ride}/dismiss-completed', [RideController::class, 'dismissCompleted']);

        // Rides (rider only via role or rider profile)
        Route::prefix('rides')->middleware('role_or_profile:rider,App\Models\Rider')->group(function () {
            Route::get('/', [RideController::class, 'index']);
            Route::post('/', [RideController::class, 'store']);
            Route::get('current', [RideController::class, 'current']);
            Route::get('track-driver/{driverId}', [RideController::class, 'trackDriver']);
            Route::get('{id}', [RideController::class, 'show']);
            Route::post('{id}/cancel', [RideController::class, 'cancel']);
            Route::post('{id}/accept-any-driver', [RideController::class, 'acceptAnyDriver']);
        });

        // Saved Places
        Route::prefix('saved-places')->group(function () {
            Route::get('/', [SavedPlaceController::class, 'index']);
            Route::post('/', [SavedPlaceController::class, 'store']);
            Route::get('{id}', [SavedPlaceController::class, 'show']);
            Route::put('{id}', [SavedPlaceController::class, 'update']);
            Route::delete('{id}', [SavedPlaceController::class, 'destroy']);
        });

        // Driver Rides
        Route::prefix('driver/rides')->middleware('role_or_profile:driver,App\Models\Driver')->group(function () {
            Route::get('pending', [DriverRideController::class, 'pending']);
            Route::post('{rideId}/accept', [DriverRideController::class, 'accept']);
            Route::post('{rideId}/reject', [DriverRideController::class, 'reject']);
            Route::post('{rideId}/start', [DriverRideController::class, 'start']);
            Route::post('{rideId}/arrived', [DriverRideController::class, 'arrived']);
            Route::get('{rideId}/summary', [DriverRideController::class, 'summary']);
            Route::post('{rideId}/complete', [DriverRideController::class, 'complete']);
            Route::get('current', [DriverRideController::class, 'current']);
            Route::get('history', [DriverRideController::class, 'history']);
        });

        // Driver
        Route::prefix('driver')->middleware('role_or_profile:driver,App\Models\Driver')->group(function () {
            Route::get('profile', [DriverController::class, 'show']);
            Route::post('profile', [DriverController::class, 'update']);
            Route::post('toggle-online', [DriverController::class, 'toggleOnlineStatus']);
            Route::post('location', [DriverController::class, 'updateLocation']);
            Route::get('earnings', [DriverController::class, 'earnings']);
            Route::get('performance', [DriverController::class, 'performance']);
            Route::get('ride-history', [DriverController::class, 'rideHistory']);
            Route::get('nearby', [DriverController::class, 'nearby']);
            Route::post('documents', [DriverController::class, 'uploadDocument']);
            Route::post('submit-verification', [DriverController::class, 'submitVerification']);
            Route::get('payout', [DriverController::class, 'payout']);
            Route::post('payout', [DriverController::class, 'updatePayout']);
            Route::get('wallet', [DriverController::class, 'wallet']);

            // Driver Settlements
            Route::get('settlements', [DriverSettlementController::class, 'index']);
            Route::post('settlements', [DriverSettlementController::class, 'store']);

            // Driver Vehicles
            Route::prefix('vehicles')->group(function () {
                Route::get('/', [VehicleController::class, 'index']);
                Route::post('/', [VehicleController::class, 'store']);
                Route::get('{id}', [VehicleController::class, 'show']);
                Route::put('{id}', [VehicleController::class, 'update']);
                Route::post('{id}/documents', [VehicleController::class, 'uploadDocument']);
            });
        });

        // Payments (authenticated, role-agnostic — scoped by user context)
        Route::prefix('payments')->group(function () {
            Route::get('/', [PaymentController::class, 'index']);
            Route::get('wallet', [PaymentController::class, 'wallet']);
            Route::post('wallet/fund', [PaymentController::class, 'addFunds']);
            Route::get('transactions', [PaymentController::class, 'transactions']);
            Route::get('{id}', [PaymentController::class, 'show']);
        });

        // Ratings
        Route::prefix('ratings')->group(function () {
            Route::post('driver', [RatingController::class, 'rateDriver']);
            Route::post('rider', [RatingController::class, 'rateRider']);
            Route::get('driver/me', [RatingController::class, 'myDriverRatings']);
            Route::get('rider/me', [RatingController::class, 'myRiderRatings']);
            Route::get('driver/{driverId}', [RatingController::class, 'driverRatings']);
            Route::get('rider/{riderId}', [RatingController::class, 'riderRatings']);
        });

        // Notifications
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::post('{id}/read', [NotificationController::class, 'markAsRead']);
            Route::post('read-all', [NotificationController::class, 'markAllAsRead']);
            Route::get('unread-count', [NotificationController::class, 'unreadCount']);
        });

        // Support Tickets
        Route::prefix('tickets')->group(function () {
            Route::get('/', [TicketController::class, 'index']);
            Route::post('/', [TicketController::class, 'store']);
            Route::get('{id}', [TicketController::class, 'show']);
            Route::post('{ticketId}/messages', [TicketController::class, 'addMessage']);
            Route::post('{id}/close', [TicketController::class, 'close']);
        });

        // Reports (admin only)
        Route::prefix('reports')->middleware('admin')->group(function () {
            Route::get('daily', [ReportController::class, 'daily']);
            Route::get('weekly', [ReportController::class, 'weekly']);
            Route::get('monthly', [ReportController::class, 'monthly']);
            Route::get('custom', [ReportController::class, 'custom']);
            Route::get('revenue', [ReportController::class, 'revenue']);
            Route::get('charts', [ReportController::class, 'charts']);
            Route::get('rides', [ReportController::class, 'rides']);
            Route::get('drivers', [ReportController::class, 'drivers']);
            Route::get('users', [ReportController::class, 'users']);
            Route::get('export', [ReportController::class, 'export']);
        });

        // Admin
        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('dashboard', [AdminController::class, 'dashboard']);
            Route::get('stats', [AdminController::class, 'stats']);
            Route::get('charts', [AdminController::class, 'charts']);
            Route::get('activities', [AdminController::class, 'recentActivities']);
            Route::get('settings', [AdminController::class, 'settings']);
            Route::post('settings', [AdminController::class, 'updateSetting']);
            Route::get('features', [AdminFeatureController::class, 'index']);
            Route::post('features/{code}', [AdminFeatureController::class, 'update']);
            Route::get('reports/export-csv', [AdminController::class, 'reportsExportCsv']);
            Route::get('reports/export-pdf', [AdminController::class, 'reportsExportPdf']);
            Route::get('audit-logs', [AdminController::class, 'auditLogs']);
            Route::get('users', [AdminController::class, 'users']);
            Route::get('rides', [AdminController::class, 'rides']);
            Route::get('rides/{id}', [AdminController::class, 'rideDetail']);
            Route::get('payments', [AdminController::class, 'payments']);
            Route::get('payments/{id}', [AdminController::class, 'paymentDetail']);
            Route::get('settlements', [AdminSettlementController::class, 'index']);
            Route::get('settlements/{id}', [AdminSettlementController::class, 'show']);
            Route::post('settlements/{id}/approve', [AdminSettlementController::class, 'approve']);
            Route::post('settlements/{id}/reject', [AdminSettlementController::class, 'reject']);
            Route::get('support-tickets', [AdminController::class, 'supportTickets']);
            Route::get('users/{id}/ban-history', [AdminController::class, 'banHistory']);

            // Live drivers
            Route::get('live-drivers', [AdminController::class, 'liveDrivers']);
            Route::get('surge-data', [AdminController::class, 'surgeData']);

            // Drivers
            Route::get('drivers', [AdminDriverController::class, 'index']);
            Route::post('drivers', [AdminDriverController::class, 'store']);
            Route::get('drivers/{id}', [AdminDriverController::class, 'show']);
            Route::put('drivers/{id}', [AdminDriverController::class, 'update']);
            Route::post('drivers/{id}/approve', [AdminDriverController::class, 'approve']);
            Route::post('drivers/{id}/reject', [AdminDriverController::class, 'reject']);
            Route::post('drivers/{id}/suspend', [AdminDriverController::class, 'suspend']);
            Route::post('drivers/{id}/reactivate', [AdminDriverController::class, 'reactivate']);
            Route::post('drivers/{id}/block', [AdminDriverController::class, 'block']);
            Route::post('drivers/{id}/unblock', [AdminDriverController::class, 'unblock']);
            Route::get('drivers/{id}/warnings', [AdminDriverController::class, 'warnings']);
            Route::post('drivers/{id}/warnings', [AdminDriverController::class, 'storeWarning']);
            Route::get('drivers/{id}/penalties', [AdminDriverController::class, 'penalties']);
            Route::post('drivers/{id}/penalties', [AdminDriverController::class, 'storePenalty']);
            Route::get('drivers/{id}/rides', [AdminDriverController::class, 'rides']);
            Route::get('drivers/{id}/payments', [AdminDriverController::class, 'payments']);
            Route::get('drivers/{id}/settlements', [AdminSettlementController::class, 'driverSettlements']);

            // Riders
            Route::get('riders', [AdminRiderController::class, 'index']);
            Route::get('riders/{id}', [AdminRiderController::class, 'show']);
            Route::post('riders/{id}/suspend', [AdminRiderController::class, 'suspend']);
            Route::post('riders/{id}/reactivate', [AdminRiderController::class, 'reactivate']);
            Route::post('riders/{id}/block', [AdminRiderController::class, 'block']);
            Route::post('riders/{id}/unblock', [AdminRiderController::class, 'unblock']);
            Route::get('riders/{id}/rides', [AdminRiderController::class, 'rides']);
            Route::get('riders/{id}/payments', [AdminRiderController::class, 'payments']);

            // Vehicles
            Route::get('vehicles', [\App\Http\Controllers\Api\Admin\AdminVehicleController::class, 'index']);
            Route::get('vehicles/{id}', [\App\Http\Controllers\Api\Admin\AdminVehicleController::class, 'show']);
            Route::post('vehicles/{id}/approve', [\App\Http\Controllers\Api\Admin\AdminVehicleController::class, 'approve']);
            Route::post('vehicles/{id}/reject', [\App\Http\Controllers\Api\Admin\AdminVehicleController::class, 'reject']);
            Route::post('vehicles/{id}/suspend', [\App\Http\Controllers\Api\Admin\AdminVehicleController::class, 'suspend']);
        });
    });
});
