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
        $id = $this->route('bulletin');
        $adherentId = $this->input('id_adherent');

        $rules = [
            'id_adherent' => 'required|integer|exists:adherent,id_adherent',
            'id_sous_adherent' => 'nullable|integer|exists:sous_adherent,id_sous_adherent',
            'numero_bulletin' => 'required|integer',
            'date_soin' => 'nullable|date',
            'montant_depense' => 'nullable|numeric|min:0',
            'type_soin' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'etat' => 'nullable|string|max:50|in:En attente,Validé,Rejeté',
            'details' => 'nullable|array',
            'details.*.date' => 'nullable|date',
            'details.*.montant' => 'nullable|numeric|min:0',
            'details.*.ordonnance' => 'nullable|boolean',
            'details.*.type_soin' => 'nullable|string|max:100',
            'pdf' => 'nullable|file|mimes:pdf|max:10240',
        ];

        // Unicité : un adhérent ne peut avoir qu'un seul bulletin
        if ($adherentId && $this->isMethod('post')) {
            $rules['id_adherent'] = 'required|integer|exists:adherent,id_adherent|unique:bulletin_soin,id_adherent';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'id_adherent.required' => "L'adhérent est obligatoire.",
            'id_adherent.unique' => 'Cet adhérent possède déjà un bulletin de soin.',
            'numero_bulletin.required' => 'Le numéro de bulletin est obligatoire.',
            'etat.in' => "L'état doit être : En attente, Validé ou Rejeté.",
        ];
    }
}
