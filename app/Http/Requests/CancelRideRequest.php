<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelRideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cancellation_reason' => 'required|string|max:500',
            'cancellation_reason_id' => 'nullable|integer|exists:cancellation_reasons,id',
            'cancellation_comment' => 'nullable|string|max:500',
        ];
    }
}
