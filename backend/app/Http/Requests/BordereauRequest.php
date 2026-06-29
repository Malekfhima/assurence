<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BordereauRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'id_bulletin' => 'required|integer|exists:bulletin_soin,id_bulletin',
            'numero_bordereau' => 'required|integer',
            'date_envoi' => 'nullable|date',
            'statut' => 'nullable|string|max:50',
            'commentaire' => 'nullable|string|max:255',
        ];

        if ($this->isMethod('post')) {
            $rules['id_bulletin'] = 'required|integer|exists:bulletin_soin,id_bulletin|unique:bordereau,id_bulletin';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'id_bulletin.required' => 'Le bulletin est obligatoire.',
            'id_bulletin.unique' => 'Ce bulletin est déjà associé à un bordereau.',
            'numero_bordereau.required' => 'Le numéro de bordereau est obligatoire.',
        ];
    }
}
