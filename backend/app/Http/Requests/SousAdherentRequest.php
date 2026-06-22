<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SousAdherentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'id_adherent' => [$required, 'integer', 'exists:adherent,id_adherent'],
            'nom' => [$required, 'string', 'max:100'],
            'prenom' => [$required, 'string', 'max:100'],
            'date_naissance' => ['nullable', 'date'],
            'sexe' => ['nullable', 'string', 'max:20'],
            'lien_parente' => ['nullable', 'string', 'max:100'],
        ];
    }
}
