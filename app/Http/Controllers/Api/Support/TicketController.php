<?php

namespace App\Http\Controllers\Api\Support;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTicketRequest;
use App\Http\Requests\TicketMessageRequest;
use App\Http\Resources\TicketResource;
use App\Services\SupportService;
use App\DTOs\SupportTicketDTO;
use App\Models\Ticket;
use App\Repositories\TicketRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(
        private SupportService $supportService,
        private TicketRepository $ticketRepo,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = Ticket::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'data' => TicketResource::collection($paginator->items()),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function store(CreateTicketRequest $request): JsonResponse
    {
        $dto = SupportTicketDTO::fromRequest($request->validated(), $request->user()->id);
        $ticket = $this->supportService->createTicket($dto);

        return response()->json([
            'success' => true,
            'message' => 'Ticket created',
            'data' => new TicketResource($ticket->load('user')),
        ], 201);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketRepo->findById($id);
        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new TicketResource($ticket),
        ]);
    }

    public function addMessage(int $ticketId, TicketMessageRequest $request): JsonResponse
    {
        $ticket = $this->ticketRepo->findById($ticketId);
        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $message = $this->supportService->addMessage(
            $ticketId,
            $request->user()->id,
            $request->input('message')
        );

        \App\Services\AuditLogService::log(
            'ticket_message_added',
            $request->user()->id,
            null,
            Ticket::class,
            $ticketId,
            null,
            ['message_id' => $message->id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Message added',
            'data' => new \App\Http\Resources\TicketMessageResource($message->load('user')),
        ]);
    }

    public function close(int $id, Request $request): JsonResponse
    {
        $ticket = $this->ticketRepo->findById($id);
        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $this->supportService->closeTicket($id);

        \App\Services\AuditLogService::log(
            'ticket_closed',
            $request->user()->id,
            null,
            Ticket::class,
            $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Ticket closed',
        ]);
    }
}
