<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'category' => 'nullable|string|max:50',
            'ride_id' => 'nullable|integer|exists:rides,id',
        ];
    }
}
