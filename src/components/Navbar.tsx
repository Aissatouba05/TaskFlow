import React, { useState } from 'react';
import {
  Shield,
  User,
  Key,
  BookOpen,
  RefreshCw,
  LogOut,
  ChevronDown,
  Copy,
  Check,
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Users,
  Terminal,
  Cloud,
} from 'lucide-react';
import { SafeUser } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  currentUser: SafeUser | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onUserChange: (user: SafeUser | null) => void;
  onResetData: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onUserChange,
  onResetData,
  onOpenAuthModal,
}) => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [switchingUser, setSwitchingUser] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const demoAccounts = [
    { name: 'Amadou Sow', email: 'admin@taskflow.dev', role: 'ADMIN', pass: 'Admin123!', dept: 'Direction Technique' },
    { name: 'Sarah Diallo', email: 'sarah.diallo@taskflow.dev', role: 'USER', pass: 'User123!', dept: 'Gestion de Projet' },
    { name: 'Mamadou Fall', email: 'mamadou.fall@taskflow.dev', role: 'USER', pass: 'User123!', dept: 'Ingénierie Backend' },
    { name: 'Aissatou Ba', email: 'aissatou.ba@taskflow.dev', role: 'USER', pass: 'User123!', dept: 'Full-Stack Lead' },
  ];

  const handleQuickSwitch = async (account: typeof demoAccounts[0]) => {
    try {
      setSwitchingUser(true);
      setShowUserDropdown(false);
      const res = await api.login(account.email, account.pass);
      onUserChange(res.user);
    } catch (err: any) {
      alert(`Erreur de connexion : ${err.message}`);
    } finally {
      setSwitchingUser(false);
    }
  };

  const handleCopyToken = () => {
    const token = api.getToken();
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    onUserChange(null);
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projects', label: 'Projets', icon: FolderGit2 },
    { id: 'tasks', label: 'Tâches & Kanban', icon: CheckSquare },
    { id: 'users', label: 'Utilisateurs & Rôles', icon: Users },
    { id: 'api-tester', label: 'Testeur API & Suite', icon: Terminal },
    { id: 'deployment', label: 'Déploiement Render/Vercel', icon: Cloud },
  ];

  return (
    <>
      <header className="bg-black border-b border-neutral-900 sticky top-0 z-40 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20 text-black font-black text-xl tracking-tighter">
                TF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg tracking-tight text-white">
                    TaskFlow
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-white text-black">
                    API REST
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                    2026
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 hidden sm:block font-medium">
                  Node.js • Express • Swagger • Backoffice Admin
                </p>
              </div>
            </div>

            {/* Quick Actions & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Reset Data Button */}
              <button
                onClick={onResetData}
                title="Réinitialiser la base de données avec les données initiales"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 rounded-xl border border-neutral-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
                <span>Reset Démo</span>
              </button>

              {/* Swagger Direct Link */}
              <a
                href="/api-docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-md transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-black" />
                <span>Swagger /api-docs</span>
              </a>

              {/* JWT Token Button */}
              {currentUser && (
                <button
                  onClick={() => setShowTokenModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 rounded-xl border border-neutral-800 transition"
                  title="Voir et copier le Bearer JWT actuel"
                >
                  <Key className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="hidden sm:inline">Token JWT</span>
                </button>
              )}

              {/* User Switcher / Profile */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition"
                  >
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-yellow-400"
                    />
                    <div className="hidden sm:block text-xs">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {currentUser.name}
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-black rounded-full ${
                            currentUser.role === 'ADMIN'
                              ? 'bg-yellow-400 text-black'
                              : 'bg-white text-black'
                          }`}
                        >
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[120px]">{currentUser.email}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 text-neutral-200">
                      <div className="px-3 py-2 border-b border-neutral-800">
                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-wider">
                          Changement Rapide de Compte Démo
                        </p>
                      </div>
                      <div className="py-1">
                        {demoAccounts.map((acc) => (
                          <button
                            key={acc.email}
                            onClick={() => handleQuickSwitch(acc)}
                            disabled={switchingUser}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-900 flex items-center justify-between transition ${
                              currentUser.email === acc.email ? 'bg-neutral-800 text-yellow-400 font-bold' : ''
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>{acc.name}</span>
                                {acc.role === 'ADMIN' && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-yellow-400 text-black rounded font-black">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-400">{acc.email}</div>
                            </div>
                            {currentUser.email === acc.email && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-neutral-800 pt-1 mt-1">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenAuthModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-900 flex items-center gap-2"
                        >
                          <User className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Connexion / Inscription personnalisée...</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 text-xs font-black text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-md transition"
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Noir, Blanc, Jaune) */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-neutral-900 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 font-black'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'users' && currentUser?.role === 'ADMIN' && (
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black text-yellow-400' : 'bg-yellow-400 text-black'}`}>
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* JWT Inspector Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <Key className="w-4 h-4 text-black" />
                </div>
                <h3 className="font-black text-base">Token JWT Actif (Bearer Token)</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-neutral-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-3">
              Ce token est injecté dans l’en-tête <code className="text-yellow-400">Authorization: Bearer &lt;token&gt;</code> pour chaque appel d’API.
            </p>

            <div className="bg-black p-3 rounded-xl border border-neutral-800 font-mono text-[11px] text-yellow-300 break-all select-all mb-4 max-h-32 overflow-y-auto">
              {api.getToken() || 'Aucun token actif'}
            </div>

            <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 text-xs mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Utilisateur connecté :</span>
                <span className="font-bold text-white">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Email :</span>
                <span className="font-mono text-neutral-300">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Rôle :</span>
                <span className="font-black text-yellow-400">{currentUser?.role}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black transition"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Copié dans le presse-papier !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-black" />
                    <span>Copier le token JWT</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
