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
            'cancellation_reason_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) {
                    $reason = \App\Models\CancellationReason::find($value);
                    if (!$reason) {
                        $fail('The selected cancellation reason is invalid.');
                        return;
                    }
                    if (!$reason->is_active) {
                        $fail('The selected cancellation reason is inactive.');
                        return;
                    }
                    if ($reason->actor !== 'rider') {
                        $fail('The selected cancellation reason is not allowed for riders.');
                        return;
                    }
                },
            ],
            'cancellation_comment' => 'nullable|string|max:500',
        ];
    }
}
