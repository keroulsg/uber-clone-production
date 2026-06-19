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
        $paginator = Payment::whereHas('ride', fn($q) => $q->where('rider_id', $request->user()->id))
            ->orWhereHas('ride', fn($q) => $q->whereHas('driver', fn($dq) => $dq->where('user_id', $request->user()->id)))
            ->latest()
            ->paginate(20);

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
        $request->validate(['amount' => 'required|numeric|min:1']);

        $wallet = $this->walletRepo->findByUser($request->user()->id);
        if (!$wallet) {
            return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);
        }

        $balanceBefore = (float) $wallet->balance;
        $this->walletRepo->addBalance($request->user()->id, $request->input('amount'));
        $wallet->refresh();
        $balanceAfter = (float) $wallet->balance;

        LedgerEntry::create([
            'user_id' => $request->user()->id,
            'type' => 'credit',
            'amount' => (float) $request->input('amount'),
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'description' => 'Wallet top-up',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Funds added',
            'data' => new WalletResource($wallet),
        ]);
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
