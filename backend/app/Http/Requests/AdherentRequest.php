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
        $id = $this->route('id');

        return [
            'matricule' => 'required|numeric|unique:adherent,matricule,' . $id . ',id_adherent',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'etat_civil' => 'required|string|max:50',
            'sexe' => 'required|string|max:20',
            'date_naissance' => 'required|date',
            'date_adhesion' => 'required|date',
            'adresse' => 'required|string|max:500',
            'cin' => 'nullable|numeric',
            'telephone' => 'required|string|max:30',
            'statut' => 'required|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'matricule.required' => 'Le matricule est obligatoire.',
            'matricule.unique' => 'Ce matricule existe déjà.',
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'etat_civil.required' => 'L\'état civil est obligatoire.',
            'sexe.required' => 'Le sexe est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_adhesion.required' => 'La date d\'adhésion est obligatoire.',
            'adresse.required' => 'L\'adresse est obligatoire.',
            'cin.required' => 'Le CIN est obligatoire.',
            'cin.numeric' => 'Le CIN doit être une valeur numérique valide.',
            'telephone.required' => 'Le téléphone est obligatoire.',
            'statut.required' => 'Le statut est obligatoire.',
        ];
    }
}
