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
        $tickets = $this->ticketRepo->findByUser($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => TicketResource::collection($tickets),
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

    public function show(int $id): JsonResponse
    {
        $ticket = $this->ticketRepo->findById($id);
        if (!$ticket) {
            return response()->json(['success' => false, 'message' => 'Ticket not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new TicketResource($ticket),
        ]);
    }

    public function addMessage(int $ticketId, TicketMessageRequest $request): JsonResponse
    {
        $message = $this->supportService->addMessage(
            $ticketId,
            $request->user()->id,
            $request->input('message')
        );

        return response()->json([
            'success' => true,
            'message' => 'Message added',
            'data' => new \App\Http\Resources\TicketMessageResource($message->load('user')),
        ]);
    }

    public function close(int $id, Request $request): JsonResponse
    {
        $this->supportService->closeTicket($id);

        return response()->json([
            'success' => true,
            'message' => 'Ticket closed',
        ]);
    }
}
