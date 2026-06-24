<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\RideResource;
use App\Http\Resources\DriverResource;
use App\Models\User;
use App\Models\Ride;
use App\Models\Payment;
use App\Models\DriverDebt;
use App\Models\LedgerEntry;
use App\Models\Setting;
use App\Models\Driver;
use App\Enums\RideStatus;
use App\Enums\PaymentStatus;
use App\Services\AdminService;
use App\Repositories\RideRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(
        private AdminService $adminService,
        private RideRepository $rideRepo,
    ) {}

    public function dashboard(): JsonResponse
    {
        $stats = $this->adminService->dashboard();

        return response()->json([
            'success' => true,
            'data' => new \App\Http\Resources\DashboardStatsResource((object) $stats),
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new \App\Http\Resources\DashboardStatsResource((object) $this->adminService->dashboard()),
        ]);
    }

    public function charts(Request $request): JsonResponse
    {
        $period = $request->input('period', 'weekly');
        $from = $request->input('from');
        $to = $request->input('to');

        if ($from && $to) {
            $start = \Carbon\Carbon::parse($from)->startOfDay();
            $end = \Carbon\Carbon::parse($to)->endOfDay();
        } else {
            $now = now();
            switch ($period) {
                case 'daily':
                    $start = $now->copy()->startOfDay();
                    $end = $now->copy()->endOfDay();
                    break;
                case 'weekly':
                    $start = $now->copy()->startOfWeek();
                    $end = $now->copy()->endOfWeek();
                    break;
                case 'monthly':
                default:
                    $start = $now->copy()->startOfMonth();
                    $end = $now->copy()->endOfMonth();
                    break;
            }
        }

        $fromDate = $start->toDateTimeString();
        $toDate = $end->toDateTimeString();

        $labels = [];
        $revenue = [];
        $rides = [];
        $users = [];
        $drivers = [];

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dateStr = $date->toDateString();
            $labels[] = $date->format('M d');
            $revenue[] = (float) Payment::whereDate('paid_at', $dateStr)
                ->where('status', PaymentStatus::Completed)
                ->sum('amount');
            $rides[] = Ride::whereDate('completed_at', $dateStr)
                ->where('status', RideStatus::RideCompleted)
                ->count();
            $users[] = User::whereDate('created_at', $dateStr)->count();
            $drivers[] = Driver::whereDate('created_at', $dateStr)->count();
        }

        $completedRides = Ride::where('status', RideStatus::RideCompleted)
            ->whereBetween('completed_at', [$fromDate, $toDate]);
        $completedPaymentIds = (clone $completedRides)->pluck('id');
        $completedPayments = Payment::whereIn('ride_id', $completedPaymentIds)
            ->where('status', PaymentStatus::Completed);

        return response()->json([
            'success' => true,
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    ['label' => 'Revenue', 'data' => $revenue],
                    ['label' => 'Rides', 'data' => $rides],
                    ['label' => 'Users', 'data' => $users],
                    ['label' => 'Drivers', 'data' => $drivers],
                ],
                'summary' => [
                    'totalRevenue' => round((float) (clone $completedPayments)->sum('amount'), 2),
                    'cashRevenue' => round((float) (clone $completedPayments)->where('payment_method', 'cash')->sum('amount'), 2),
                    'walletRevenue' => round((float) (clone $completedPayments)->where('payment_method', 'wallet')->sum('amount'), 2),
                    'completedRevenue' => round((float) (clone $completedPayments)->sum('amount'), 2),
                    'totalRides' => Ride::whereBetween('created_at', [$fromDate, $toDate])->count(),
                    'completedRides' => (clone $completedRides)->count(),
                    'cancelledRides' => Ride::whereIn('status', [RideStatus::Cancelled->value, RideStatus::CancelledByRider->value, RideStatus::CancelledByDriver->value])->whereBetween('created_at', [$fromDate, $toDate])->count(),
                    'totalUsers' => User::where('created_at', '<=', $toDate)->count(),
                    'totalRiders' => \App\Models\Rider::where('created_at', '<=', $toDate)->count(),
                    'totalDrivers' => Driver::where('created_at', '<=', $toDate)->count(),
                    'activeDrivers' => Driver::where('is_online', true)->count(),
                    'outstandingDebt' => round((float) \App\Models\DriverDebt::whereNull('paid_at')->sum('amount'), 2),
                    'from' => \Carbon\Carbon::parse($fromDate)->toDateString(),
                    'to' => \Carbon\Carbon::parse($toDate)->toDateString(),
                ],
            ],
        ]);
    }

    public function recentActivities(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [],
        ]);
    }

    public function settings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminService->getSettings(),
        ]);
    }

    public function updateSetting(Request $request): JsonResponse
    {
        $request->validate([
            'key' => 'required|string',
            'value' => 'required|string',
        ]);

        $this->adminService->updateSetting($request->input('key'), $request->input('value'));

        return response()->json([
            'success' => true,
            'message' => 'Setting updated',
        ]);
    }

    public function auditLogs(): JsonResponse
    {
        $paginator = \App\Models\AuditLog::with('actor')->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $paginator->items(),
                'meta' => [
                    'currentPage' => $paginator->currentPage(),
                    'lastPage' => $paginator->lastPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem() ?? 0,
                    'to' => $paginator->lastItem() ?? 0,
                ],
            ],
        ]);
    }

    public function users(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => UserResource::collection(User::with('rider', 'driver', 'latestBan')->latest()->paginate(20)),
        ]);
    }

    public function rides(): JsonResponse
    {
        $paginator = Ride::with('rider', 'driver.user', 'vehicle', 'vehicleType', 'payment')->latest()->paginate(20);
        return response()->json([
            'success' => true,
            'data' => [
                'data' => RideResource::collection($paginator->items()),
                'meta' => [
                    'currentPage' => $paginator->currentPage(),
                    'lastPage' => $paginator->lastPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem() ?? 0,
                    'to' => $paginator->lastItem() ?? 0,
                ],
            ],
        ]);
    }

    public function rideDetail(int $id): JsonResponse
    {
        $ride = Ride::with('rider', 'driver.user', 'vehicle', 'vehicleType', 'payment', 'statusHistories', 'offers')
            ->with('driver.debts')
            ->find($id);
        if (!$ride) {
            return response()->json(['success' => false, 'message' => 'Ride not found'], 404);
        }

        $payment = $ride->payment;

        return response()->json([
            'success' => true,
            'data' => [
                'ride' => new RideResource($ride),
                'status_history' => $ride->statusHistories->map(fn($h) => [
                    'id' => $h->id,
                    'status' => $h->status->value,
                    'created_at' => $h->created_at?->toISOString(),
                ]),
                'ledger_entries' => [],
                'debts' => $ride->driver?->debts?->where('ride_id', $ride->id)->values()->map(fn($d) => [
                    'id' => $d->id,
                    'ride_id' => (string) $d->ride_id,
                    'type' => $d->type,
                    'amount' => (float) $d->amount,
                    'status' => $d->paid_at ? 'paid' : 'unpaid',
                    'created_at' => $d->created_at?->toISOString(),
                ]) ?? [],
                'payment' => $payment ? [
                    'id' => (string) $payment->id,
                    'amount' => (float) $payment->amount,
                    'platform_fee' => (float) $payment->platform_fee,
                    'driver_amount' => (float) $payment->driver_amount,
                    'company_commission' => (float) $payment->company_commission,
                    'currency' => $payment->currency,
                    'method' => $payment->payment_method ?? $payment->method,
                    'status' => $payment->status->value,
                    'paid_at' => $payment->paid_at?->toISOString(),
                ] : null,
            ],
        ]);
    }

    public function payments(): JsonResponse
    {
        $paginator = \App\Models\Payment::with('ride.rider', 'ride.driver.user')->latest()->paginate(20);
        return response()->json([
            'success' => true,
            'data' => [
                'data' => \App\Http\Resources\PaymentResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function paymentDetail(int $id): JsonResponse
    {
        $payment = \App\Models\Payment::with('ride.rider', 'ride.driver.user')->find($id);
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        $debts = \App\Models\DriverDebt::where('ride_id', $payment->ride_id)->get();
        $ledgerEntries = \App\Models\LedgerEntry::where(function($q) use ($payment) {
            $q->where(function($q2) use ($payment) {
                $q2->where('reference_type', \App\Models\Ride::class)
                   ->where('reference_id', $payment->ride_id);
            })->orWhere(function($q2) use ($payment) {
                $q2->where('reference_type', \App\Models\Payment::class)
                   ->where('reference_id', $payment->id);
            });
        })->get();

        return response()->json([
            'success' => true,
            'data' => [
                'payment' => new \App\Http\Resources\PaymentResource($payment),
                'driver_debts' => $debts->map(fn($d) => [
                    'id' => $d->id,
                    'type' => $d->type,
                    'amount' => (float) $d->amount,
                    'status' => $d->paid_at ? 'paid' : 'unpaid',
                    'created_at' => $d->created_at?->toISOString(),
                ]),
                'ledger_entries' => $ledgerEntries->map(fn($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'amount' => (float) $e->amount,
                    'description' => $e->description,
                    'balance_before' => (float) $e->balance_before,
                    'balance_after' => (float) $e->balance_after,
                    'created_at' => $e->created_at?->toISOString(),
                ]),
            ],
        ]);
    }

    public function supportTickets(): JsonResponse
    {
        $paginator = \App\Models\Ticket::with('user', 'messages.user')->latest()->paginate(20);
        return response()->json([
            'success' => true,
            'data' => [
                'data' => \App\Http\Resources\TicketResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function banHistory(int $userId): JsonResponse
    {
        $history = \App\Models\BanHistory::where('user_id', $userId)
            ->with('actedBy')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history->map(fn($h) => [
                'id' => $h->id,
                'user_id' => $h->user_id,
                'action' => $h->action,
                'reason' => $h->reason,
                'acted_by' => $h->actedBy ? ['id' => $h->actedBy->id, 'name' => $h->actedBy->name] : null,
                'auto_blocked' => $h->auto_blocked,
                'created_at' => $h->created_at?->toISOString(),
            ]),
        ]);
    }

    public function liveDrivers(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => DriverResource::collection(
                Driver::with('user', 'vehicles.vehicleType')
                    ->online()
                    ->whereNotNull('latitude')
                    ->whereNotNull('longitude')
                    ->get()
            ),
        ]);
    }

    public function reportsExportCsv(Request $request): \Illuminate\Http\Response
    {
        $period = $request->input('period', 'weekly');
        $from = $request->input('from');
        $to = $request->input('to');
        $now = now();

        if ($from && $to) {
            $fromDate = \Carbon\Carbon::parse($from)->startOfDay()->toDateTimeString();
            $toDate = \Carbon\Carbon::parse($to)->endOfDay()->toDateTimeString();
        } else {
            switch ($period) {
                case 'daily':
                    $fromDate = $now->copy()->startOfDay()->toDateTimeString();
                    $toDate = $now->copy()->endOfDay()->toDateTimeString();
                    break;
                case 'weekly':
                    $fromDate = $now->copy()->startOfWeek()->toDateTimeString();
                    $toDate = $now->copy()->endOfWeek()->toDateTimeString();
                    break;
                default:
                    $fromDate = $now->copy()->startOfMonth()->toDateTimeString();
                    $toDate = $now->copy()->endOfMonth()->toDateTimeString();
                    break;
            }
        }

        $fromDisplay = \Carbon\Carbon::parse($fromDate)->toDateString();
        $toDisplay = \Carbon\Carbon::parse($toDate)->toDateString();
        $safeFrom = str_replace('-', '', $fromDisplay);
        $safeTo = str_replace('-', '', $toDisplay);

        $completedPayments = Payment::where('status', PaymentStatus::Completed)
            ->whereBetween('paid_at', [$fromDate, $toDate])->with('ride.rider', 'ride.driver.user')->get();
        $completedRides = Ride::where('status', RideStatus::RideCompleted)
            ->whereBetween('completed_at', [$fromDate, $toDate])->with('rider', 'driver.user')->get();
        $cancelledRides = Ride::whereIn('status', [RideStatus::Cancelled->value, RideStatus::CancelledByRider->value, RideStatus::CancelledByDriver->value])
            ->whereBetween('created_at', [$fromDate, $toDate])->count();
        $drivers = Driver::with('user')->get();
        $riders = \App\Models\Rider::with('user')->get();
        $settlements = \App\Models\DriverSettlement::whereBetween('created_at', [$fromDate, $toDate])->with('driver.user')->get();
        $debts = \App\Models\DriverDebt::whereNull('paid_at')->with('driver.user')->get();

        $rows = [];
        $rows[] = ["APEX Mobility Report"];
        $rows[] = ["Period", "{$fromDisplay} to {$toDisplay}"];
        $rows[] = ["Generated", $now->toISOString()];
        $rows[] = [""];
        $rows[] = ["=== SUMMARY ==="];
        $rows[] = ["Total Revenue", "EGP", round($completedPayments->sum('amount'), 2)];
        $rows[] = ["Cash Revenue", "EGP", round($completedPayments->where('payment_method', 'cash')->sum('amount'), 2)];
        $rows[] = ["Wallet Revenue", "EGP", round($completedPayments->where('payment_method', 'wallet')->sum('amount'), 2)];
        $rows[] = ["Completed Rides", "", $completedRides->count()];
        $rows[] = ["Cancelled Rides", "", $cancelledRides];
        $rows[] = ["Total Drivers", "", $drivers->count()];
        $rows[] = ["Total Riders", "", $riders->count()];
        $rows[] = ["Outstanding Debt", "EGP", round($debts->sum('amount'), 2)];
        $rows[] = [""];
        $rows[] = ["=== PAYMENTS ==="];
        $rows[] = ["ID", "Booking", "Rider", "Driver", "Amount", "Commission", "Payout", "Method", "Paid At"];
        foreach ($completedPayments as $p) {
            $rows[] = [$p->id, $p->ride?->booking_id ?? '', $p->ride?->rider?->name ?? '', $p->ride?->driver?->user?->name ?? '', $p->amount, $p->company_commission, $p->driver_amount, $p->payment_method, $p->paid_at];
        }
        $rows[] = [""];
        $rows[] = ["=== RIDES ==="];
        $rows[] = ["ID", "Booking", "Rider", "Driver", "Status", "Fare", "Created", "Completed"];
        foreach ($completedRides as $r) {
            $rows[] = [$r->id, $r->booking_id, $r->rider?->name ?? '', $r->driver?->user?->name ?? '', $r->status->value, $r->actual_fare, $r->created_at, $r->completed_at];
        }
        $rows[] = [""];
        $rows[] = ["=== DRIVERS ==="];
        $rows[] = ["ID", "Name", "Email", "Status", "Rides", "Earnings", "Created"];
        foreach ($drivers as $d) {
            $rows[] = [$d->id, $d->user?->name ?? '', $d->user?->email ?? '', $d->status, Ride::where('driver_id', $d->id)->count(), Payment::whereHas('ride', fn($q) => $q->where('driver_id', $d->id))->where('status', PaymentStatus::Completed)->sum('driver_amount'), $d->created_at];
        }
        $rows[] = [""];
        $rows[] = ["=== DEBTS ==="];
        $rows[] = ["ID", "Driver", "Type", "Amount", "Created"];
        foreach ($debts as $d) {
            $rows[] = [$d->id, $d->driver?->user?->name ?? '', $d->type, $d->amount, $d->created_at];
        }
        $rows[] = [""];
        $rows[] = ["=== SETTLEMENTS ==="];
        $rows[] = ["ID", "Driver", "Amount", "Method", "Status", "Created"];
        foreach ($settlements as $s) {
            $rows[] = [$s->id, $s->driver?->user?->name ?? '', $s->amount, $s->method, $s->status, $s->created_at];
        }

        $csv = "\u{FEFF}";
        foreach ($rows as $row) {
            $csv .= implode(',', array_map(fn($c) => '"' . str_replace('"', '""', (string) ($c ?? '')) . '"', $row)) . "\r\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"apex_report_{$safeFrom}_to_{$safeTo}.csv\"",
        ]);
    }

    public function reportsExportPdf(Request $request): \Illuminate\Http\Response
    {
        $period = $request->input('period', 'weekly');
        $from = $request->input('from');
        $to = $request->input('to');
        $now = now();

        if ($from && $to) {
            $start = \Carbon\Carbon::parse($from)->startOfDay();
            $end = \Carbon\Carbon::parse($to)->endOfDay();
            $periodLabel = "$from — $to";
        } else {
            switch ($period) {
                case 'daily':
                    $start = $now->copy()->startOfDay(); $end = $now->copy()->endOfDay(); $periodLabel = 'Daily'; break;
                case 'weekly':
                    $start = $now->copy()->startOfWeek(); $end = $now->copy()->endOfWeek(); $periodLabel = 'Weekly'; break;
                default:
                    $start = $now->copy()->startOfMonth(); $end = $now->copy()->endOfMonth(); $periodLabel = 'Monthly'; break;
            }
        }

        $fromDate = $start->toDateTimeString();
        $toDate = $end->toDateTimeString();
        $fromDisplay = $start->toDateString();
        $toDisplay = $end->toDateString();

        $completedPayments = Payment::where('status', PaymentStatus::Completed)
            ->whereBetween('paid_at', [$fromDate, $toDate])->with('ride.rider', 'ride.driver.user')->get();
        $completedRides = Ride::where('status', RideStatus::RideCompleted)
            ->whereBetween('completed_at', [$fromDate, $toDate])->with('rider', 'driver.user')->get();
        $cancelledRides = Ride::whereIn('status', [RideStatus::Cancelled->value, RideStatus::CancelledByRider->value, RideStatus::CancelledByDriver->value])
            ->whereBetween('created_at', [$fromDate, $toDate])->count();
        $allRidesInPeriod = Ride::whereBetween('created_at', [$fromDate, $toDate])->with('rider', 'driver.user', 'vehicleType')->get();
        $allUnpaidDebts = \App\Models\DriverDebt::whereNull('paid_at')->with('driver.user')->get();
        $periodDebts = \App\Models\DriverDebt::whereBetween('created_at', [$fromDate, $toDate])->with('driver.user')->get();
        $settlements = \App\Models\DriverSettlement::whereBetween('created_at', [$fromDate, $toDate])->with('driver.user')->get();

        $fmt = fn($v) => number_format((float)($v ?? 0), 2);

        $days = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $ds = $d->toDateString();
            $days[] = [
                'date' => $d->format('M d'),
                'revenue' => $completedPayments->filter(fn($p) => \Carbon\Carbon::parse($p->paid_at)->toDateString() === $ds)->sum('amount'),
                'cash' => $completedPayments->filter(fn($p) => \Carbon\Carbon::parse($p->paid_at)->toDateString() === $ds && $p->payment_method === 'cash')->sum('amount'),
                'wallet' => $completedPayments->filter(fn($p) => \Carbon\Carbon::parse($p->paid_at)->toDateString() === $ds && $p->payment_method === 'wallet')->sum('amount'),
                'rides' => $completedRides->filter(fn($r) => \Carbon\Carbon::parse($r->completed_at)->toDateString() === $ds)->count(),
                'cancelled' => Ride::whereIn('status', [RideStatus::Cancelled->value, RideStatus::CancelledByRider->value, RideStatus::CancelledByDriver->value])->whereDate('created_at', $ds)->count(),
                'total' => Ride::whereDate('created_at', $ds)->count(),
                'new_users' => User::whereDate('created_at', $ds)->count(),
                'new_drivers' => Driver::whereDate('created_at', $ds)->count(),
            ];
        }

        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>APEX Mobility Report</title>
<style>body{font-family:Arial,sans-serif;margin:30px;color:#222;font-size:12px}h1{font-size:20px;color:#1a1a2e;margin-bottom:2px}h2{font-size:15px;color:#333;margin:20px 0 8px;border-bottom:2px solid #1a1a2e;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin:6px 0;font-size:11px}th,td{border:1px solid #ccc;padding:5px 6px;text-align:left}th{background:#f0f0f0;font-weight:bold}.num{text-align:right}.total{font-weight:bold}.meta{color:#666;font-size:11px;margin:0}@media print{body{margin:15px}}</style></head><body>
<h1>APEX Mobility Report</h1><p class="meta"><strong>Period:</strong> ' . $periodLabel . ' (' . $fromDisplay . ' &mdash; ' . $toDisplay . ')</p><p class="meta"><strong>Generated:</strong> ' . $now->format('Y-m-d H:i') . '</p>';

        $html .= '<h2>1. Summary</h2><table>
<tr><th>Metric</th><th style="width:120px" class="num">Value</th></tr>
<tr><td>Total Revenue</td><td class="num total">' . $fmt($completedPayments->sum('amount')) . ' EGP</td></tr>
<tr><td>Cash Revenue</td><td class="num">' . $fmt($completedPayments->where('payment_method', 'cash')->sum('amount')) . ' EGP</td></tr>
<tr><td>Wallet Revenue</td><td class="num">' . $fmt($completedPayments->where('payment_method', 'wallet')->sum('amount')) . ' EGP</td></tr>
<tr><td>Completed Rides</td><td class="num">' . $completedRides->count() . '</td></tr>
<tr><td>Cancelled Rides</td><td class="num">' . $cancelledRides . '</td></tr>
<tr><td>Total Rides (created)</td><td class="num">' . $allRidesInPeriod->count() . '</td></tr>
<tr><td>Active Drivers</td><td class="num">' . Driver::where('is_online', true)->count() . '</td></tr>
<tr><td>Total Drivers (cumulative)</td><td class="num">' . Driver::where('created_at', '<=', $toDate)->count() . '</td></tr>
<tr><td>Total Users (cumulative)</td><td class="num">' . User::where('created_at', '<=', $toDate)->count() . '</td></tr>
<tr><td>Outstanding Driver Debt</td><td class="num">' . $fmt($allUnpaidDebts->sum('amount')) . ' EGP</td></tr>
</table>';

        $html .= '<h2>2. Daily Breakdown</h2><table>
<tr><th>Date</th><th class="num">Revenue</th><th class="num">Cash</th><th class="num">Wallet</th><th class="num">Completed</th><th class="num">Cancelled</th><th class="num">Total</th><th class="num">New Users</th><th class="num">New Drivers</th></tr>';
        foreach ($days as $day) {
            $html .= '<tr><td>' . $day['date'] . '</td><td class="num">' . $fmt($day['revenue']) . '</td><td class="num">' . $fmt($day['cash']) . '</td><td class="num">' . $fmt($day['wallet']) . '</td><td class="num">' . $day['rides'] . '</td><td class="num">' . $day['cancelled'] . '</td><td class="num">' . $day['total'] . '</td><td class="num">' . $day['new_users'] . '</td><td class="num">' . $day['new_drivers'] . '</td></tr>';
        }
        $html .= '</table>';

        $html .= '<h2>3. Payments (' . $completedPayments->count() . ')</h2><table>
<tr><th>ID</th><th>Booking</th><th>Rider</th><th>Driver</th><th>Method</th><th class="num">Amount</th><th class="num">Commission</th><th class="num">Payout</th><th>Paid At</th></tr>';
        foreach ($completedPayments as $p) {
            $html .= '<tr><td>' . $p->id . '</td><td>' . ($p->ride?->booking_id ?? '-') . '</td><td>' . ($p->ride?->rider?->name ?? '-') . '</td><td>' . ($p->ride?->driver?->user?->name ?? '-') . '</td><td>' . $p->payment_method . '</td><td class="num">' . $fmt($p->amount) . '</td><td class="num">' . $fmt($p->company_commission) . '</td><td class="num">' . $fmt($p->driver_amount) . '</td><td>' . substr($p->paid_at ?? '', 0, 16) . '</td></tr>';
        }
        $html .= '</table>';

        $html .= '<h2>4. Driver Debt (' . $periodDebts->count() . ' in period)</h2>';
        $html .= '<p class="meta">Outstanding debt summary is cumulative (' . $fmt($allUnpaidDebts->sum('amount')) . ' EGP). Debts shown below are those created during the selected period.</p>';
        $html .= '<table>
<tr><th>Driver</th><th>Type</th><th class="num">Amount</th><th>Status</th><th>Ride ID</th><th>Created</th></tr>';
        foreach ($periodDebts as $d) {
            $html .= '<tr><td>' . ($d->driver?->user?->name ?? '-') . '</td><td>' . str_replace('_', ' ', $d->type) . '</td><td class="num">' . $fmt($d->amount) . '</td><td>' . ($d->paid_at ? 'Paid' : 'Unpaid') . '</td><td>' . ($d->ride_id ?? '-') . '</td><td>' . substr($d->created_at ?? '', 0, 16) . '</td></tr>';
        }
        $html .= '</table>';

        $html .= '<h2>5. Settlements (' . $settlements->count() . ')</h2><table>
<tr><th>Driver</th><th class="num">Amount</th><th>Method</th><th>Status</th><th>Reference</th><th>Created</th></tr>';
        foreach ($settlements as $s) {
            $html .= '<tr><td>' . ($s->driver?->user?->name ?? '-') . '</td><td class="num">' . $fmt($s->amount) . '</td><td>' . $s->method . '</td><td>' . $s->status . '</td><td>' . ($s->reference ?? '-') . '</td><td>' . substr($s->created_at ?? '', 0, 16) . '</td></tr>';
        }
        $html .= '</table>';

        $html .= '<h2>6. Rides (' . $allRidesInPeriod->count() . ')</h2><table>
<tr><th>Booking ID</th><th>Rider</th><th>Driver</th><th>Status</th><th>Method</th><th class="num">Fare</th><th>Pickup</th><th>Created</th></tr>';
        foreach ($allRidesInPeriod as $r) {
            $html .= '<tr><td>' . $r->booking_id . '</td><td>' . ($r->rider?->name ?? '-') . '</td><td>' . ($r->driver?->user?->name ?? '-') . '</td><td>' . $r->status->value . '</td><td>' . ($r->payment_method ?? '-') . '</td><td class="num">' . $fmt($r->actual_fare ?? $r->estimated_fare ?? 0) . '</td><td>' . \Illuminate\Support\Str::limit($r->pickup_address ?? '', 30) . '</td><td>' . substr($r->created_at ?? '', 0, 16) . '</td></tr>';
        }
        $html .= '</table>';

        $html .= '<p class="meta" style="margin-top:20px">APEX Mobility &mdash; Report generated ' . $now->toISOString() . '</p></body></html>';

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    public function surgeData(): JsonResponse
    {
        $zones = \App\Models\SurgeZone::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $zones->map(fn($z) => [
                'id' => $z->id,
                'name' => $z->name,
                'bounds' => $z->bounds,
                'center_latitude' => (float) $z->center_latitude,
                'center_longitude' => (float) $z->center_longitude,
                'radius_km' => (float) $z->radius_km,
                'multiplier' => (float) $z->multiplier,
                'open_requests' => Ride::where('status', \App\Enums\RideStatus::SearchingDriver)->count(),
                'available_drivers' => Driver::where('is_online', true)->count(),
                'started_at' => $z->started_at?->toISOString(),
                'ended_at' => $z->ended_at?->toISOString(),
            ]),
        ]);
    }
}
