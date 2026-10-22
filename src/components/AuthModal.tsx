import React, { useState } from 'react';
import { User, AlertCircle } from 'lucide-react';
import { SafeUser } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: SafeUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          name,
          email,
          password,
          role,
          department,
        });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-white">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
              <User className="w-5 h-5 text-black" />
            </div>
            <h3 className="font-black text-lg">
              {isRegister ? 'Inscription d’un utilisateur' : 'Connexion à TaskFlow'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white font-bold">
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo fast click buttons */}
        {!isRegister && (
          <div className="mb-4 p-3.5 bg-black rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-400 text-[11px] block mb-2 font-bold uppercase tracking-wider">
              Comptes démo préconfigurés (cliquez pour remplir) :
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@taskflow.dev', 'Admin123!')}
                className="flex-1 py-1.5 px-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg text-xs font-black transition"
              >
                ADMIN (Amadou)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('sarah.diallo@taskflow.dev', 'User123!')}
                className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition border border-neutral-700"
              >
                USER (Sarah)
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <div>
              <label className="block text-neutral-300 font-bold mb-1">Nom complet *</label>
              <input
                type="text"
                required
                placeholder="Ex: Fatou Ndiaye"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
              />
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-bold mb-1">Adresse email *</label>
            <input
              type="email"
              required
              placeholder="Ex: utilisateur@taskflow.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-bold mb-1">Mot de passe *</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-neutral-300 font-bold mb-1">Département / Équipe</label>
                <input
                  type="text"
                  placeholder="Ex: Ingénierie Produit"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">Rôle initial</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
                >
                  <option value="USER">Utilisateur Standard (USER)</option>
                  <option value="ADMIN">Administrateur (ADMIN)</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl transition shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'Chargement...' : isRegister ? 'Créer le compte (POST /register)' : 'Se connecter (POST /login)'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-neutral-800 text-center text-xs text-neutral-400">
          {isRegister ? (
            <span>
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-yellow-400 hover:underline font-bold"
              >
                Se connecter
              </button>
            </span>
          ) : (
            <span>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-yellow-400 hover:underline font-bold"
              >
                S’inscrire
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
