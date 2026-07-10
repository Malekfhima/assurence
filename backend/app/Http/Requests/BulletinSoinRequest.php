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
        $id = $this->route('id');

        $rules = [
            'id_adherent' => 'required|integer|exists:adherent,id_adherent',
            'id_sous_adherent' => 'nullable|integer|exists:sous_adherent,id_sous_adherent',
            'numero_bulletin' => 'required|string|max:50|unique:bulletin_soin,numero_bulletin' . ($id ? ',' . $id . ',id_bulletin' : ''),
            'date_soin' => 'nullable|date',
            'montant_depense' => 'nullable|numeric|min:0',
            'type_soin' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'etat' => 'nullable|string|max:50|in:En attente,Validé,Rejeté,Sous contrôle',
            'details' => 'required|array|min:1',
            'details.*.date' => 'nullable|date',
            'details.*.montant' => 'required|numeric|min:0.01',
            'details.*.type_soin' => 'required|string|max:100',
            'pdf' => 'nullable|file|mimes:pdf|max:10240',
        ];

        return $rules;
    }

    public function messages(): array
    {
        return [
            'id_adherent.required' => "L'adhérent est obligatoire.",
            'numero_bulletin.required' => 'Le numéro de bulletin est obligatoire.',
            'numero_bulletin.unique' => 'Ce numéro de bulletin est déjà utilisé par un autre bulletin.',
            'details.required' => 'Au moins un détail de soin est requis.',
            'details.min' => 'Ajoutez au moins un détail de soin.',
            'details.*.montant.required' => 'Le montant est obligatoire pour chaque ligne de soin.',
            'details.*.montant.min' => 'Le montant doit être supérieur à 0.',
            'details.*.type_soin.required' => 'Le type de soin est obligatoire pour chaque ligne.',
            'etat.in' => "L'état doit être : En attente, Validé, Rejeté ou Sous contrôle.",
        ];
    }
}
