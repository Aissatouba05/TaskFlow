import React, { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  Trash2,
  Edit3,
  Search,
  Check,
  Building,
  Mail,
} from 'lucide-react';
import { SafeUser } from '../types';
import { api } from '../services/api';

interface UsersViewProps {
  currentUser: SafeUser | null;
  dataVersion?: number;
  onProfileUpdated: (user: SafeUser) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser, dataVersion, onProfileUpdated }) => {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Self-profile edit state
  const [name, setName] = useState(currentUser?.name || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Message toast
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers({ search, role: roleFilter });
      setUsers(res.users);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, currentUser?.id, dataVersion]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setDepartment(currentUser.department || '');
    }
  }, [currentUser]);

  const handleUpdateSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const res = await api.updateMe({
        name,
        department,
        password: newPassword || undefined,
      });
      setMessage({ text: res.message, type: 'success' });
      setNewPassword('');
      onProfileUpdated(res.user);
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggleRole = async (targetUser: SafeUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Confirmer le changement de rôle de ${targetUser.name} vers ${newRole} ?`)) return;

    try {
      const res = await api.updateUserRole(targetUser.id, newRole);
      setMessage({ text: res.message, type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (targetUser: SafeUser) => {
    if (!confirm(`Supprimer définitivement l’utilisateur ${targetUser.name} (${targetUser.email}) ?`)) return;

    try {
      const res = await api.deleteUser(targetUser.id);
      setMessage({ text: res.message, type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Toast Feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold ${
            message.type === 'success'
              ? 'bg-yellow-400 text-black border border-yellow-300'
              : 'bg-rose-950 border border-rose-500/60 text-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Header bar */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-black uppercase tracking-wider">
            Module A • Gestion des Utilisateurs & Rôles
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Annuaire des Équipes & Contrôle des Accès (RBAC)
        </h1>
        <p className="text-xs text-neutral-400">
          Les mots de passe sont hachés avec bcrypt. Les hashes ne sont jamais exposés dans les réponses API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Users Table & Role Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou département..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-yellow-400"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-yellow-400"
            >
              <option value="">Tous les rôles</option>
              <option value="ADMIN">Administrateurs (ADMIN)</option>
              <option value="USER">Utilisateurs standards (USER)</option>
            </select>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Département</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Inscrit le</th>
                    <th className="py-3 px-4 text-right">Actions Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isAdmin = currentUser?.role === 'ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-neutral-900/60 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-yellow-400"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[9px] bg-yellow-400 text-black px-1.5 py-0.2 rounded-full font-black">
                                    VOUS
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-300 font-medium">{u.department || '—'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              u.role === 'ADMIN'
                                ? 'bg-yellow-400 text-black'
                                : 'bg-white text-black'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Role */}
                              <button
                                onClick={() => handleToggleRole(u)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? 'Impossible de modifier son propre rôle'
                                    : `Changer vers ${u.role === 'ADMIN' ? 'USER' : 'ADMIN'}`
                                }
                                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition disabled:opacity-30 ${
                                  u.role === 'ADMIN'
                                    ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                                    : 'bg-yellow-400 text-black hover:bg-yellow-300'
                                }`}
                              >
                                {u.role === 'ADMIN' ? 'Passer USER' : 'Passer ADMIN'}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={isSelf}
                                title={isSelf ? 'Impossible de supprimer son propre compte' : 'Supprimer'}
                                className="p-1.5 text-neutral-400 hover:text-rose-400 disabled:opacity-20 rounded-lg hover:bg-rose-950/40 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-600 italic">Protégé</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Edit My Profile */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Mon Profil Connecté</h3>
              <p className="text-[10px] text-neutral-400">Endpoint : PATCH /api/users/me</p>
            </div>
          </div>

          <form onSubmit={handleUpdateSelfProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-neutral-400 font-bold mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-neutral-400 font-bold mb-1">Adresse email (lecture seule)</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full bg-black/60 border border-neutral-900 rounded-xl px-3 py-2 text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-neutral-400 font-bold mb-1">Département / Équipe</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Direction Technique"
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-neutral-400 font-bold mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                placeholder="Laisser vide pour conserver l'actuel"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-yellow-400"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl transition shadow-md disabled:opacity-50"
            >
              {profileSaving ? 'Enregistrement...' : 'Mettre à jour mon profil'}
            </button>
          </form>

          {/* Security details box */}
          <div className="p-3.5 bg-black rounded-xl border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <div className="font-bold text-yellow-400">Contraintes de sécurité Module A :</div>
            <p>✅ Rôles vérifiés via middleware Bearer JWT.</p>
            <p>✅ Hash bcrypt avec sel de 10 tours.</p>
            <p>✅ Champ <code className="text-white">passwordHash</code> exclu de tous les retours.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
