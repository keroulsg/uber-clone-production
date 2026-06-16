<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VehicleRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'make' => 'required|string',
            'model' => 'required|string',
            'year' => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'color' => 'required|string',
            'license_plate' => 'required|string',
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'vehicle_class' => 'nullable|string',
            'features' => 'nullable|array',
        ];
    }
}
