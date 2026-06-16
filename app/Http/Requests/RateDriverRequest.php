<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RateDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ride_id' => 'required|exists:rides,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ];
    }
}
