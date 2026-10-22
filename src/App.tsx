import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { TasksView } from './components/TasksView';
import { UsersView } from './components/UsersView';
import { ApiTesterView } from './components/ApiTesterView';
import { DeploymentGuideView } from './components/DeploymentGuideView';
import { AuthModal } from './components/AuthModal';
import { SafeUser } from './types';
import { api } from './services/api';
import { BookOpen, Terminal } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectIdForTasks, setSelectedProjectIdForTasks] = useState<string | undefined>(undefined);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(1);

  const triggerDataRefresh = () => {
    setDataVersion((v) => v + 1);
  };

  // Initialize authentication on load
  const initAuth = async () => {
    try {
      setInitializing(true);
      const token = api.getToken();

      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
          triggerDataRefresh();
          return;
        } catch {
          // Token expired or invalid
        }
      }

      // Auto login as default Admin for seamless evaluation
      const res = await api.login('admin@taskflow.dev', 'Admin123!');
      setCurrentUser(res.user);
      triggerDataRefresh();
    } catch (err: any) {
      console.warn('Initial auto-login fallback:', err);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleResetData = async () => {
    if (!confirm('Réinitialiser la base de données avec le jeu de données initial (utilisateurs, projets, tâches) ?')) {
      return;
    }

    try {
      const res = await api.resetDemo();
      setGlobalMessage(res.message);
      triggerDataRefresh();
      await initAuth();
      setTimeout(() => setGlobalMessage(null), 4000);
    } catch (err: any) {
      alert(`Erreur de réinitialisation: ${err.message}`);
    }
  };

  const handleUserChange = (user: SafeUser | null) => {
    setCurrentUser(user);
    triggerDataRefresh();
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-2xl shadow-yellow-400/30 text-black font-black text-2xl tracking-tighter animate-pulse">
          TF
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-white">TaskFlow Enterprise</h2>
          <p className="text-xs text-yellow-400 font-semibold mt-1">Initialisation de l’environnement Express...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-yellow-400 selection:text-black font-sans antialiased">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'tasks') {
            setSelectedProjectIdForTasks(undefined);
          }
          triggerDataRefresh();
        }}
        onUserChange={handleUserChange}
        onResetData={handleResetData}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Global Notification Banner */}
      {globalMessage && (
        <div className="bg-yellow-400 text-black py-2.5 px-4 text-center text-xs font-black tracking-wide border-b border-yellow-500 shadow-md">
          ⚡ {globalMessage}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            dataVersion={dataVersion}
            onNavigate={(tab) => {
              setActiveTab(tab);
              triggerDataRefresh();
            }}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            currentUser={currentUser}
            dataVersion={dataVersion}
            onDataChange={triggerDataRefresh}
            onNavigateToTasks={(projectId) => {
              setSelectedProjectIdForTasks(projectId);
              setActiveTab('tasks');
              triggerDataRefresh();
            }}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            currentUser={currentUser}
            dataVersion={dataVersion}
            onDataChange={triggerDataRefresh}
            initialProjectId={selectedProjectIdForTasks}
          />
        )}

        {activeTab === 'users' && (
          <UsersView
            currentUser={currentUser}
            dataVersion={dataVersion}
            onProfileUpdated={(user) => {
              setCurrentUser(user);
              triggerDataRefresh();
            }}
          />
        )}

        {activeTab === 'api-tester' && (
          <ApiTesterView
            currentUser={currentUser}
            onDataChange={triggerDataRefresh}
          />
        )}

        {activeTab === 'deployment' && (
          <DeploymentGuideView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-4 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">TaskFlow Enterprise</span>
            <span className="text-neutral-600">•</span>
            <span className="text-yellow-400 font-semibold">Examen Node.js & Express (Octobre 2026)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="/api-docs"
              target="_blank"
              rel="noreferrer"
              className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Swagger UI (/api-docs)</span>
            </a>
            <a
              href="/api-docs.json"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-300 hover:text-white font-mono"
            >
              OpenAPI JSON
            </a>
            <button
              onClick={() => {
                setActiveTab('api-tester');
                triggerDataRefresh();
              }}
              className="text-neutral-400 hover:text-yellow-400 flex items-center gap-1 transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Testeur API</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          triggerDataRefresh();
        }}
      />
    </div>
  );
}
