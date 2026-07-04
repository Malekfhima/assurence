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
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        $rules = [
            'numero_bordereau' => 'required|string|max:50|unique:bordereau,numero_bordereau,' . ($this->route('id') ?? 'NULL') . ',id_bordereau',
            'date_envoi' => 'nullable|date',
            'statut' => 'nullable|string|max:50',
            'commentaire' => 'nullable|string|max:255',
        ];

        // En création, les bulletins sont obligatoires ; en modification ils sont optionnels
        if (!$isUpdate) {
            $rules['id_bulletins'] = 'required|array|min:1';
        } else {
            $rules['id_bulletins'] = 'nullable|array';
        }
        $rules['id_bulletins.*'] = 'integer|exists:bulletin_soin,id_bulletin';

        return $rules;
    }

    public function messages(): array
    {
        return [
            'id_bulletins.required' => 'Sélectionnez au moins un bulletin de soin.',
            'id_bulletins.min' => 'Sélectionnez au moins un bulletin de soin.',
            'id_bulletins.*.exists' => 'Un des bulletins sélectionnés n\'existe pas.',
            'numero_bordereau.required' => 'Le numéro de bordereau est obligatoire.',
            'numero_bordereau.max' => 'Le numéro de bordereau ne doit pas dépasser 50 caractères.',
        ];
    }
}
