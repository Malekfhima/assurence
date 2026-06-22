<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulletinSoinRequest extends FormRequest
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
            'numero_bordereau' => [$required, 'integer'],
            'numero_bulletin' => [$required, 'integer'],
            'date_soin' => ['nullable', 'date'],
            'montant_depense' => ['nullable', 'numeric', 'min:0'],
            'type_soin' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'etat' => ['nullable', 'string', 'max:50'],
        ];
    }
}
