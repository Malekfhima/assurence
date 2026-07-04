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
        return [
            'id_adherent' => 'required|integer|exists:adherent,id_adherent',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'date_naissance' => 'required|date',
            'sexe' => 'required|string|max:20',
            'lien_parente' => 'required|string|in:Fils,Fille,Conjoint',
        ];
    }

    public function messages(): array
    {
        return [
            'id_adherent.required' => "L'adhérent est obligatoire.",
            'id_adherent.exists' => "L'adhérent spécifié n'existe pas.",
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'sexe.required' => 'Le sexe est obligatoire.',
            'lien_parente.required' => 'Le lien de parenté est obligatoire.',
            'lien_parente.in' => 'Le lien de parenté doit être Fils, Fille ou Conjoint.',
        ];
    }
}
