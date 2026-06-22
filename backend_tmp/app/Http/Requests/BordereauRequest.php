<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BordereauRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('bordereau')?->id_bordereau;

        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'id_bulletin' => [
                $required,
                'integer',
                'exists:bulletin_soin,id_bulletin',
                Rule::unique('bordereau', 'id_bulletin')->ignore($id, 'id_bordereau'),
            ],
            'numero_bordereau' => [$required, 'integer'],
            'date_envoi' => ['nullable', 'date'],
            'statut' => ['nullable', 'string', 'max:50'],
            'commentaire' => ['nullable', 'string', 'max:255'],
        ];
    }
}
