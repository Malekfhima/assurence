import { useState } from 'react';
import api from '../services/api';

export default function Parametres() {
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : { email: '' };
    } catch {
      return { email: '' };
    }
  };

  const storedUser = getStoredUser();

  const [email, setEmail] = useState(storedUser.email || '');
  const [originalEmail] = useState(storedUser.email || '');
  const [motDePasseActuel, setMotDePasseActuel] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [nouveauMotDePasseConfirmation, setNouveauMotDePasseConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (email === originalEmail) return;
    setSaving(true);
    try {
      const res = await api.put('/profile', { email });
      if (res.data.success) {
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        showNotif('Email mis à jour avec succès.');
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Erreur lors de la mise à jour.';
      showNotif(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (!motDePasseActuel || !nouveauMotDePasse || !nouveauMotDePasseConfirmation) return;
    if (nouveauMotDePasse !== nouveauMotDePasseConfirmation) {
      showNotif('Les mots de passe ne correspondent pas.', 'error');
      return;
    }
    if (nouveauMotDePasse.length < 8) {
      showNotif('Le mot de passe doit contenir au moins 8 caractères.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/profile', {
        mot_de_passe_actuel: motDePasseActuel,
        nouveau_mot_de_passe: nouveauMotDePasse,
        nouveau_mot_de_passe_confirmation: nouveauMotDePasseConfirmation,
      });
      if (res.data.success) {
        showNotif('Mot de passe mis à jour avec succès.');
        setMotDePasseActuel('');
        setNouveauMotDePasse('');
        setNouveauMotDePasseConfirmation('');
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.mot_de_passe_actuel?.[0]
        || err.response?.data?.errors?.nouveau_mot_de_passe?.[0]
        || err.response?.data?.message
        || 'Erreur lors de la mise à jour.';
      showNotif(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration du compte administrateur</p>
      </div>

      {/* Email */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Adresse email</h2>
        </div>
        <form onSubmit={handleSubmitEmail} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={saving || email === originalEmail}
                className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Mot de passe</h2>
        </div>
        <form onSubmit={handleSubmitPassword} className="p-5 space-y-4">
          <div className="max-w-sm space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                value={motDePasseActuel}
                onChange={(e) => setMotDePasseActuel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Votre mot de passe actuel"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Minimum 8 caractères"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={nouveauMotDePasseConfirmation}
                onChange={(e) => setNouveauMotDePasseConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Confirmer le mot de passe"
              />
            </div>
          </div>
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving || !motDePasseActuel || !nouveauMotDePasse || !nouveauMotDePasseConfirmation}
              className="px-4 py-2 text-sm bg-[#0F2942] text-white rounded-lg hover:bg-[#1A3A5C] transition disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>
        </form>
      </div>

      {/* Informations */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Informations</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Application de gestion interne réservée aux agents de l'assurance.
          Version 1.0 — Assurance Group.
        </p>
      </div>
    </div>
  );
}
