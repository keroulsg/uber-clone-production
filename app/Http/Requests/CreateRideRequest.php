<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pickup_latitude' => 'required|numeric',
            'pickup_longitude' => 'required|numeric',
            'pickup_address' => 'required|string|max:500',
            'destination_latitude' => 'required|numeric',
            'destination_longitude' => 'required|numeric',
            'destination_address' => 'required|string|max:500',
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'payment_method' => 'nullable|string|in:wallet,cash',
            'female_driver_preferred' => 'nullable|boolean',
        ];
    }
}
