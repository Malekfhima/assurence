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
        $id = $this->route('adherent');

        return [
            'matricule' => 'required|integer|unique:adherent,matricule,' . $id . ',id_adherent',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'etat_civil' => 'nullable|string|max:50',
            'sexe' => 'nullable|string|max:20',
            'date_naissance' => 'nullable|date',
            'date_adhesion' => 'nullable|date',
            'adresse' => 'nullable|string|max:255',
            'cin' => 'nullable|integer',
            'telephone' => 'nullable|string|max:20',
            'statut' => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'matricule.required' => 'Le matricule est obligatoire.',
            'matricule.unique' => 'Ce matricule existe déjà.',
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
        ];
    }
}
