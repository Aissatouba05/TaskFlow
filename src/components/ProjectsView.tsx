import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit,
  UserPlus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Project, SafeUser } from '../types';
import { api } from '../services/api';

interface ProjectsViewProps {
  currentUser: SafeUser | null;
  dataVersion?: number;
  onDataChange?: () => void;
  onNavigateToTasks: (projectId?: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentUser,
  dataVersion,
  onDataChange,
  onNavigateToTasks,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [allUsers, setAllUsers] = useState<SafeUser[]>([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // New project form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMembers, setNewMembers] = useState<string[]>([]);

  // Member adding in detailed view
  const [selectedNewMemberId, setSelectedNewMemberId] = useState('');
  const [selectedNewMemberRole, setSelectedNewMemberRole] = useState<'MEMBER' | 'LEAD'>('MEMBER');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<any>('ACTIVE');

  // Action status message
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.getProjects({ search, status: statusFilter });
      setProjects(res.projects);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers();
      setAllUsers(res.users);
    } catch (e) {
      console.warn('Could not fetch all users:', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [search, statusFilter, currentUser?.id, dataVersion]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.createProject({
        title: newTitle,
        description: newDesc,
        members: newMembers.map((uid) => ({ userId: uid, role: 'MEMBER' })),
      });
      setMessage({ text: res.message, type: 'success' });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewMembers([]);
      fetchProjects();
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    try {
      const res = await api.updateProject(selectedProject.id, {
        title: editTitle,
        description: editDesc,
        status: editStatus,
      });
      setMessage({ text: res.message, type: 'success' });
      setIsEditing(false);
      const detailed = await api.getProject(selectedProject.id);
      setSelectedProject(detailed.project);
      fetchProjects();
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce projet et ses tâches ?')) return;

    try {
      const res = await api.deleteProject(id);
      setMessage({ text: res.message, type: 'success' });
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      fetchProjects();
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleAddMember = async () => {
    if (!selectedProject || !selectedNewMemberId) return;

    try {
      const res = await api.addMember(selectedProject.id, selectedNewMemberId, selectedNewMemberRole);
      setMessage({ text: res.message, type: 'success' });
      setSelectedNewMemberId('');
      const detailed = await api.getProject(selectedProject.id);
      setSelectedProject(detailed.project);
      fetchProjects();
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedProject) return;

    try {
      const res = await api.removeMember(selectedProject.id, userId);
      setMessage({ text: res.message, type: 'success' });
      const detailed = await api.getProject(selectedProject.id);
      setSelectedProject(detailed.project);
      fetchProjects();
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const openProjectDetails = async (proj: Project) => {
    try {
      const res = await api.getProject(proj.id);
      setSelectedProject(res.project);
      setEditTitle(res.project.title);
      setEditDesc(res.project.description);
      setEditStatus(res.project.status);
      setIsEditing(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-black uppercase tracking-wider">
              Module B • Gestion des Projets
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Projets & Espaces d'Équipe
          </h1>
          <p className="text-xs text-neutral-400">
            {currentUser?.role === 'ADMIN'
              ? 'Mode Administrateur : accès à l’ensemble des projets de l’entreprise.'
              : 'Affichage des projets dont vous êtes le responsable ou membre d’équipe.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl text-xs shadow-lg shadow-yellow-400/20 transition hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre ou description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-yellow-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-yellow-400"
        >
          <option value="">Tous les statuts</option>
          <option value="PLANNING">En planification (PLANNING)</option>
          <option value="ACTIVE">Actif (ACTIVE)</option>
          <option value="COMPLETED">Terminé (COMPLETED)</option>
          <option value="ARCHIVED">Archivé (ARCHIVED)</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading && projects.length === 0 ? (
        <div className="py-12 text-center text-neutral-400 text-xs">Chargement des projets...</div>
      ) : projects.length === 0 ? (
        <div className="p-8 bg-neutral-950 border border-dashed border-neutral-800 rounded-2xl text-center space-y-2">
          <FolderGit2 className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Aucun projet trouvé</h3>
          <p className="text-xs text-neutral-500">
            Créez votre premier projet en cliquant sur le bouton « Nouveau Projet ».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isOwner = proj.ownerId === currentUser?.id;
            const canManage = isOwner || currentUser?.role === 'ADMIN';

            return (
              <div
                key={proj.id}
                className="bg-neutral-950 border border-neutral-800 hover:border-yellow-400/60 rounded-2xl p-5 flex flex-col justify-between shadow-md transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        proj.status === 'ACTIVE'
                          ? 'bg-yellow-400 text-black'
                          : proj.status === 'PLANNING'
                          ? 'bg-white text-black'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {proj.status}
                    </span>

                    {canManage && (
                      <span className="text-[10px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/30">
                        {isOwner ? 'Propriétaire' : 'ADMIN'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-white text-base mb-1.5 group-hover:text-yellow-400 transition">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                    {proj.description || 'Aucune description spécifiée.'}
                  </p>
                </div>

                <div>
                  {/* Task progress */}
                  <div className="mb-4 pt-3 border-t border-neutral-900">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-400 font-medium">Progression</span>
                      <span className="text-yellow-400 font-bold">
                        {proj.completedTaskCount || 0} / {proj.taskCount || 0} terminées
                      </span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{
                          width: `${
                            proj.taskCount && proj.taskCount > 0
                              ? Math.round(((proj.completedTaskCount || 0) / proj.taskCount) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {proj.members.slice(0, 4).map((m, idx) => (
                        <div
                          key={idx}
                          title={`Membre: ${m.userId}`}
                          className="w-7 h-7 rounded-full bg-neutral-800 ring-2 ring-black flex items-center justify-center text-[10px] font-black text-white"
                        >
                          {m.userId.slice(-2).toUpperCase()}
                        </div>
                      ))}
                      {proj.members.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-yellow-400 text-black font-black ring-2 ring-black flex items-center justify-center text-[10px]">
                          +{proj.members.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openProjectDetails(proj)}
                        className="px-3 py-1.5 text-xs font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-850 rounded-xl border border-neutral-800 transition"
                      >
                        Gérer
                      </button>
                      <button
                        onClick={() => onNavigateToTasks(proj.id)}
                        className="p-1.5 text-black hover:text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl transition font-bold"
                        title="Voir les tâches du projet"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <FolderGit2 className="w-5 h-5 text-black" />
                </div>
                <h3 className="font-black text-lg">Créer un nouveau projet</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Titre du projet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Système de facturation automatisé"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Description du projet
                </label>
                <textarea
                  rows={3}
                  placeholder="Objectifs et livrables attendus..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Ajouter des membres initiaux
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-black border border-neutral-800 rounded-xl">
                  {allUsers
                    .filter((u) => u.id !== currentUser?.id)
                    .map((u) => {
                      const isSelected = newMembers.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewMembers([...newMembers, u.id]);
                                } else {
                                  setNewMembers(newMembers.filter((id) => id !== u.id));
                                }
                              }}
                              className="rounded border-neutral-700 text-yellow-400 focus:ring-0"
                            />
                            <span className="font-bold text-white">{u.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400">{u.department}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black shadow-md transition"
                >
                  Créer le projet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <FolderGit2 className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">{selectedProject.title}</h3>
                  <p className="text-[11px] text-yellow-400 font-mono">ID: {selectedProject.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-neutral-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            {/* Edit / View Project Details */}
            {isEditing ? (
              <div className="space-y-3 mb-6 bg-black p-4 rounded-xl border border-neutral-800">
                <h4 className="text-xs font-black text-yellow-400 uppercase">Modifier le projet</h4>
                <div>
                  <label className="text-[11px] text-neutral-400 font-bold">Titre</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 font-bold">Description</label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 font-bold">Statut</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateProject}
                    className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg text-xs font-black"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 space-y-2 bg-black p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      selectedProject.status === 'ACTIVE'
                        ? 'bg-yellow-400 text-black'
                        : 'bg-white text-black'
                    }`}
                  >
                    {selectedProject.status}
                  </span>

                  {(selectedProject.ownerId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProject(selectedProject.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-rose-300 bg-rose-950 hover:bg-rose-900 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {selectedProject.description || 'Pas de description.'}
                </p>
                <div className="text-[11px] text-neutral-500">
                  Créé le {new Date(selectedProject.createdAt).toLocaleDateString('fr-FR')} • Responsable : {selectedProject.owner?.name || selectedProject.ownerId}
                </div>
              </div>
            )}

            {/* Team Members Section */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-yellow-400" />
                <span>Équipe du projet ({selectedProject.members.length} membres)</span>
              </h4>

              {/* Add member form */}
              {(selectedProject.ownerId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                <div className="flex gap-2 bg-black p-3 rounded-xl border border-neutral-800">
                  <select
                    value={selectedNewMemberId}
                    onChange={(e) => setSelectedNewMemberId(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="">Sélectionner un collaborateur...</option>
                    {allUsers
                      .filter((u) => !selectedProject.members.some((m) => m.userId === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>

                  <select
                    value={selectedNewMemberRole}
                    onChange={(e) => setSelectedNewMemberRole(e.target.value as any)}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="LEAD">LEAD</option>
                  </select>

                  <button
                    onClick={handleAddMember}
                    disabled={!selectedNewMemberId}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black rounded-lg text-xs font-black transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              )}

              {/* Members List */}
              <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden bg-black">
                {selectedProject.members.map((m) => {
                  const isProjectOwner = selectedProject.ownerId === m.userId;
                  return (
                    <div key={m.userId} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt={m.user?.name || m.userId}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-yellow-400"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {m.user?.name || m.userId}
                            {isProjectOwner && (
                              <span className="text-[9px] bg-yellow-400 text-black px-1.5 py-0.2 rounded font-black">
                                OWNER
                              </span>
                            )}
                            {m.role === 'LEAD' && (
                              <span className="text-[9px] bg-white text-black px-1.5 py-0.2 rounded font-black">
                                LEAD
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400">{m.user?.email}</div>
                        </div>
                      </div>

                      {!isProjectOwner && (selectedProject.ownerId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="text-rose-400 hover:text-rose-300 text-[11px] font-bold px-2 py-1 rounded hover:bg-rose-950/40 transition"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
              <span className="text-xs text-neutral-400">
                {selectedProject.taskCount || 0} tâche(s) enregistrée(s)
              </span>
              <button
                onClick={() => {
                  const pid = selectedProject.id;
                  setSelectedProject(null);
                  onNavigateToTasks(pid);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black shadow transition"
              >
                <span>Accéder au Kanban du projet</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
