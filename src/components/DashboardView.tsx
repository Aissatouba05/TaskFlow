import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Flame,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { SafeUser, DashboardStats, AdminStats } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  currentUser: SafeUser | null;
  dataVersion?: number;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, dataVersion, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.getDashboardStats();
      setStats(res.stats);

      if (currentUser?.role === 'ADMIN') {
        try {
          const aRes = await api.getAdminStats();
          setAdminStats(aRes);
        } catch (adminErr) {
          console.warn('Admin stats warning:', adminErr);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser?.id, currentUser?.role, dataVersion]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-neutral-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-400" />
        <p className="text-sm font-semibold text-white">Calcul des métriques en temps réel...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl text-center my-6">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
        <h3 className="font-bold text-base text-white mb-1">Erreur de chargement des statistiques</h3>
        <p className="text-sm text-neutral-400 mb-4">{error || 'Données non disponibles'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-yellow-400 text-black font-extrabold rounded-xl text-xs hover:bg-yellow-300 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Welcome Banner */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-black uppercase tracking-wider">
              Module D • Tableau de Bord
            </span>
            <span className="text-xs text-neutral-400">
              Session : <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.role})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Vue d’ensemble des projets et des métriques
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Calcul dynamique en direct depuis l’API Express (tâches en cours, terminées et retards).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold border border-neutral-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => onNavigate('tasks')}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black shadow-lg shadow-yellow-400/20 transition hover:scale-105 active:scale-95"
          >
            <CheckSquare className="w-3.5 h-3.5 text-black" />
            <span>Gérer les tâches</span>
          </button>
        </div>
      </div>

      {/* Main KPI Grid (Noir, Blanc, Jaune) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Projets */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-neutral-950 border border-neutral-800 hover:border-yellow-400/60 rounded-2xl p-5 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Projets Accessibles</span>
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-1">
            {stats.totalProjects}
          </div>
          <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
            <span>Explorer les projets</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* KPI 2: Total Tâches & In Progress */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-neutral-950 border border-neutral-800 hover:border-yellow-400/60 rounded-2xl p-5 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Tâches en Cours</span>
            <div className="w-9 h-9 rounded-xl bg-neutral-800 text-white flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-1">
            {stats.inProgressTasks}{' '}
            <span className="text-sm font-normal text-neutral-500">/ {stats.totalTasks} tot.</span>
          </div>
          <div className="text-xs text-neutral-400">
            {stats.todoTasks} tâche(s) encore à faire
          </div>
        </div>

        {/* KPI 3: Tâches Terminées & Taux */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Tâches Terminées</span>
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-black" />
            </div>
          </div>
          <div className="text-3xl font-black text-yellow-400 tracking-tight mb-1">
            {stats.completedTasks}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className="flex-1 bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-yellow-400 h-full rounded-full transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <span className="font-black text-white">{stats.completionRate}%</span>
          </div>
        </div>

        {/* KPI 4: Tâches en retard (Overdue) */}
        <div
          onClick={() => onNavigate('tasks')}
          className={`rounded-2xl p-5 border transition shadow-md cursor-pointer group ${
            stats.overdueTasks > 0
              ? 'bg-black border-yellow-400 ring-1 ring-yellow-400/40 hover:scale-102'
              : 'bg-neutral-950 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Tâches en Retard</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                stats.overdueTasks > 0 ? 'bg-yellow-400 text-black font-black animate-bounce' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-3xl font-black tracking-tight mb-1 ${
              stats.overdueTasks > 0 ? 'text-yellow-400' : 'text-neutral-400'
            }`}
          >
            {stats.overdueTasks}
          </div>
          <div className="text-xs font-bold text-yellow-300">
            {stats.overdueTasks > 0 ? '⚠️ Date limite dépassée' : 'Aucun retard'}
          </div>
        </div>
      </div>

      {/* Breakdowns & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-yellow-400" />
            <span>Répartition par Statut</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-bold">À faire (TODO)</span>
                <span className="text-white font-black">
                  {stats.statusBreakdown.TODO} ({stats.totalTasks > 0 ? Math.round((stats.statusBreakdown.TODO / stats.totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-neutral-400 h-full rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.statusBreakdown.TODO / stats.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-bold">En cours (IN_PROGRESS)</span>
                <span className="text-white font-black">
                  {stats.statusBreakdown.IN_PROGRESS} ({stats.totalTasks > 0 ? Math.round((stats.statusBreakdown.IN_PROGRESS / stats.totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-neutral-200 h-full rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.statusBreakdown.IN_PROGRESS / stats.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-yellow-400 font-bold">Terminé (DONE)</span>
                <span className="text-yellow-400 font-black">
                  {stats.statusBreakdown.DONE} ({stats.totalTasks > 0 ? Math.round((stats.statusBreakdown.DONE / stats.totalTasks) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-yellow-400 h-full rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.statusBreakdown.DONE / stats.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-yellow-400" />
            <span>Répartition par Priorité</span>
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-bold">Haute (HIGH)</span>
                <span className="text-yellow-400 font-black">{stats.priorityBreakdown.HIGH}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-yellow-400 h-full rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.priorityBreakdown.HIGH / stats.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-bold">Moyenne (MEDIUM)</span>
                <span className="text-white font-black">{stats.priorityBreakdown.MEDIUM}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-neutral-300 h-full rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.priorityBreakdown.MEDIUM / stats.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400 font-bold">Basse (LOW)</span>
                <span className="text-neutral-300 font-black">{stats.priorityBreakdown.LOW}</span>
              </div>
              <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="bg-neutral-600 h-full rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.priorityBreakdown.LOW / stats.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Server Info */}
        {currentUser?.role === 'ADMIN' && adminStats ? (
          <div className="bg-neutral-950 border border-yellow-400/40 rounded-2xl p-5 shadow-md">
            <h3 className="text-sm font-black text-yellow-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span>Backoffice Admin Système</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-800">
                <span className="text-neutral-400">Utilisateurs enregistrés :</span>
                <span className="font-black text-white">
                  {adminStats.users.total} ({adminStats.users.admins} admin, {adminStats.users.regularUsers} user)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800">
                <span className="text-neutral-400">Uptime Serveur Express :</span>
                <span className="font-mono text-yellow-400 font-bold">{adminStats.system.uptimeSeconds}s</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800">
                <span className="text-neutral-400">Version Node.js :</span>
                <span className="font-mono text-white font-bold">{adminStats.system.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-400">Mémoire Heap utilisée :</span>
                <span className="font-mono text-yellow-400 font-bold">{adminStats.system.memoryUsageMB} Mo</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md">
            <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span>Accès Rapides</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Explorez et validez les fonctionnalités des modules du sujet d’examen :
            </p>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('tasks')}
                className="w-full text-left px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-xs rounded-xl text-white font-bold flex items-center justify-between transition"
              >
                <span>Tableau Kanban & Filtrage</span>
                <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />
              </button>
              <button
                onClick={() => onNavigate('projects')}
                className="w-full text-left px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-xs rounded-xl text-white font-bold flex items-center justify-between transition"
              >
                <span>Gestion des Projets & Membres</span>
                <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-white">Activité & Dernières Tâches</h3>
            <p className="text-xs text-neutral-400">Mises à jour récentes dans vos projets</p>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs text-yellow-400 hover:text-yellow-300 font-black flex items-center gap-1 transition"
          >
            <span>Voir toutes les tâches</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Tâche</th>
                <th className="pb-3">Projet</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3">Priorité</th>
                <th className="pb-3">Assigné à</th>
                <th className="pb-3 text-right">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {stats.recentTasks.map((t) => {
                const isOverdue = t.dueDate && t.status !== 'DONE' && new Date(t.dueDate) < new Date();
                return (
                  <tr key={t.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 font-bold text-white">{t.title}</td>
                    <td className="py-3 text-neutral-400 font-medium">{t.projectTitle}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          t.status === 'DONE'
                            ? 'bg-yellow-400 text-black'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-white text-black'
                            : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          t.priority === 'HIGH'
                            ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 text-neutral-300">{t.assigneeName}</td>
                    <td className="py-3 text-right">
                      {t.dueDate ? (
                        <span className={isOverdue ? 'text-yellow-400 font-black' : 'text-neutral-400'}>
                          {isOverdue && '⚠️ '}
                          {new Date(t.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
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
  );
};
