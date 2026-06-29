import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginApi(form);
      if (data.success) {
        navigate('/dashboard');
      } else {
        setError(data.message || 'Erreur de connexion.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#0F2942] flex-col justify-center px-16 relative">
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-lg bg-blue-700/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white font-medium tracking-wide">Assurance Group</span>
          </div>
          <h1 className="text-3xl font-semibold text-white mb-4">Espace administration</h1>
          <p className="text-blue-200/70 text-sm leading-relaxed max-w-sm">
            Gérez les adhérents, les bulletins de soin et les bordereaux d'envoi de votre société d'assurance.
          </p>
        </div>
        <div className="space-y-4">
          {['Gestion des adhérents et sous-adhérents', 'Bulletins de soin centralisés', 'Statistiques en temps réel'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-blue-200/60 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-2xl font-semibold text-gray-900">Assurance Group</h1>
            <p className="text-sm text-gray-500 mt-1">Espace administration</p>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-1">Connexion</h2>
          <p className="text-sm text-gray-500 mb-8">Connectez-vous avec votre identifiant.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@stipe.tn"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={form.mot_de_passe}
                onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0F2942] text-white rounded-lg text-sm font-medium hover:bg-[#1A3A5C] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Accès réservé aux agents Assurance Group
          </p>
        </div>
      </div>
    </div>
  );
}
