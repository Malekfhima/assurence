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
        return [
            'id_bulletins' => 'required|array|min:1',
            'id_bulletins.*' => 'integer|exists:bulletin_soin,id_bulletin',
            'numero_bordereau' => 'required|integer',
            'date_envoi' => 'nullable|date',
            'statut' => 'nullable|string|max:50',
            'commentaire' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'id_bulletins.required' => 'Sélectionnez au moins un bulletin de soin.',
            'id_bulletins.min' => 'Sélectionnez au moins un bulletin de soin.',
            'id_bulletins.array' => 'Les bulletins doivent être une liste.',
            'id_bulletins.*.exists' => 'Un des bulletins sélectionnés n\'existe pas.',
            'numero_bordereau.required' => 'Le numéro de bordereau est obligatoire.',
        ];
    }
}
