<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BulletinSoin extends Model
{
    protected $table = 'bulletin_soin';
    protected $primaryKey = 'id_bulletin';
    public $timestamps = false;

    protected $fillable = [
        'id_adherent', 'id_sous_adherent', 'id_bordereau', 'numero_bulletin',
        'date_soin', 'montant_depense', 'montant_rembourse', 'type_soin', 'description', 'etat', 'pdf_path',
    ];

    /**
     * Accessor: retourne la valeur stockée en base (source de vérité).
     * La colonne montant_depense est définie explicitement lors de la
     * création du bulletin (via le formulaire) et lors de la vérification
     * PDF (mise à jour depuis le montant_rembourse du PDF STIP).
     * Ne pas recalculer depuis les détails car cela écraserait les
     * mises à jour explicites (ex: vérification PDF).
     */
    public function getMontantDepenseAttribute($value): float
    {
        return (float) ($value ?? 0);
    }

    public function adherent(): BelongsTo
    {
        return $this->belongsTo(Adherent::class, 'id_adherent', 'id_adherent');
    }

    public function sousAdherent(): BelongsTo
    {
        return $this->belongsTo(SousAdherent::class, 'id_sous_adherent', 'id_sous_adherent');
    }

    public function details(): HasMany
    {
        return $this->hasMany(BulletinSoinDetail::class, 'id_bulletin', 'id_bulletin');
    }

    public function bordereau(): BelongsTo
    {
        return $this->belongsTo(Bordereau::class, 'id_bordereau', 'id_bordereau');
    }
}
