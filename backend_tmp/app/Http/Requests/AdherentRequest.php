<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdherentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'matricule' => [$required, 'integer'],
            'nom' => [$required, 'string', 'max:100'],
            'prenom' => [$required, 'string', 'max:100'],
            'etat_civil' => ['nullable', 'string', 'max:50'],
            'sexe' => ['nullable', 'string', 'max:20'],
            'date_naissance' => ['nullable', 'date'],
            'date_adhesion' => ['nullable', 'date'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'cin' => ['nullable', 'integer'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'identifiant' => ['nullable', 'string', 'max:100'],
            'statut' => ['nullable', 'string', 'max:100'],
        ];
    }
}
