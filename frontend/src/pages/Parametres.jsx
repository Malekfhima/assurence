import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Parametres() {
  const navigate = useNavigate();
  const getStoredEmail = () => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored).email : 'admin@stipe.tn';
    } catch {
      return 'admin@stipe.tn';
    }
  };
  const [email] = useState(getStoredEmail);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration du compte administrateur</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Compte administrateur</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Email connecté</label>
            <input type="email" value={email} disabled className="w-full max-w-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-500" />
          </div>
          <div className="pt-2">
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

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
