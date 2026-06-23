<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\WalletResource;
use App\Http\Resources\TransactionResource;
use App\Models\LedgerEntry;
use App\Models\Payment;
use App\Repositories\PaymentRepository;
use App\Repositories\WalletRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentRepository $paymentRepo,
        private WalletRepository $walletRepo,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()
            ->with(['ride.driver.user', 'ride.rider'])
            ->where(function ($q) use ($request) {
                $q->whereHas('ride', fn($sub) => $sub->where('rider_id', $request->user()->id))
                  ->orWhereHas('ride', fn($sub) => $sub->whereHas('driver', fn($dq) => $dq->where('user_id', $request->user()->id)));
            });

        // Status filter
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Payment method filter
        if ($request->filled('method') && $request->input('method') !== 'all') {
            $query->where('payment_method', $request->input('method'));
        }

        // Date range filter
        if ($request->filled('from')) {
            $query->whereDate('paid_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('paid_at', '<=', $request->input('to'));
        }

        // Search by ride/booking ID
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhereHas('ride', fn($sq) => $sq->where('booking_id', 'like', "%{$search}%"));
            });
        }

        $perPage = min((int) $request->input('per_page', 20), 100);

        $paginator = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'payments' => PaymentResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $payment = $this->paymentRepo->findById($id);
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new PaymentResource($payment),
        ]);
    }

    public function wallet(Request $request): JsonResponse
    {
        $wallet = $this->walletRepo->findByUser($request->user()->id);

        if (!$wallet) {
            return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new WalletResource($wallet),
        ]);
    }

    public function addFunds(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|gt:0',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $wallet = $this->walletRepo->findByUser($request->user()->id, true);
            if (!$wallet) {
                return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);
            }

            $amount = (float) $request->input('amount');
            $balanceBefore = (float) $wallet->balance;
            
            $wallet->balance += $amount;
            $wallet->last_transaction_at = now();
            $wallet->save();

            $balanceAfter = (float) $wallet->balance;

            LedgerEntry::create([
                'user_id' => $request->user()->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'description' => 'Wallet top-up',
            ]);

            \App\Models\Notification::create([
                'type' => 'wallet_topup',
                'notifiable_type' => \App\Models\User::class,
                'notifiable_id' => $request->user()->id,
                'data' => ['amount' => $amount, 'message' => "Your wallet has been topped up with {$amount}."],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Funds added',
                'data' => new WalletResource($wallet),
            ]);
        });
    }

    public function transactions(Request $request): JsonResponse
    {
        $wallet = $this->walletRepo->findByUser($request->user()->id);
        if (!$wallet) {
            return response()->json(['success' => true, 'data' => ['data' => [], 'meta' => ['currentPage' => 1, 'lastPage' => 1, 'perPage' => 10, 'total' => 0, 'from' => 0, 'to' => 0]]]);
        }

        $paginator = $wallet->transactions()
            ->whereIn('type', ['credit', 'debit'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => [
                'data' => TransactionResource::collection($paginator->items()),
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
}
