import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Edit,
  Kanban,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowRight,
  RefreshCw,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import { Task, Project, SafeUser, TaskStatus, TaskPriority } from '../types';
import { api } from '../services/api';

interface TasksViewProps {
  currentUser: SafeUser | null;
  dataVersion?: number;
  onDataChange?: () => void;
  initialProjectId?: string;
}

export const TasksView: React.FC<TasksViewProps> = ({
  currentUser,
  dataVersion,
  onDataChange,
  initialProjectId,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('TODO');
  const [formPriority, setFormPriority] = useState<TaskPriority>('MEDIUM');
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formAssignedTo, setFormAssignedTo] = useState<string>('');

  // Toast
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({
        projectId: selectedProjectId || undefined,
        status: (statusFilter as TaskStatus) || undefined,
        priority: (priorityFilter as TaskPriority) || undefined,
        assignedTo: assignedFilter || undefined,
        search: search || undefined,
        sortBy,
        order,
        page,
        limit: viewMode === 'kanban' ? 50 : 10,
      });
      setTasks(res.tasks);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrerequisites = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([api.getProjects(), api.getUsers()]);
      setProjects(projRes.projects);
      setAllUsers(usersRes.users);
      if (!formProjectId && projRes.projects.length > 0) {
        setFormProjectId(projRes.projects[0].id);
      }
    } catch (e) {
      console.warn('Prerequisites fetch failed:', e);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, [currentUser?.id, dataVersion]);

  useEffect(() => {
    fetchTasks();
  }, [
    selectedProjectId,
    statusFilter,
    priorityFilter,
    assignedFilter,
    search,
    sortBy,
    order,
    page,
    viewMode,
    currentUser?.id,
    dataVersion,
  ]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormProjectId(selectedProjectId || (projects[0]?.id || ''));
    setFormTitle('');
    setFormDesc('');
    setFormStatus('TODO');
    setFormPriority('MEDIUM');
    setFormDueDate('');
    setFormAssignedTo('');
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setFormProjectId(task.projectId);
    setFormTitle(task.title);
    setFormDesc(task.description);
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setFormAssignedTo(task.assignedTo || '');
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (editingTask) {
        const res = await api.updateTask(editingTask.id, {
          title: formTitle,
          description: formDesc,
          status: formStatus,
          priority: formPriority,
          dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
          assignedTo: formAssignedTo || null,
        });
        setMessage({ text: res.message, type: 'success' });
      } else {
        if (!formProjectId) {
          setMessage({ text: 'Veuillez sélectionner un projet pour cette tâche.', type: 'error' });
          return;
        }
        const res = await api.createTask(formProjectId, {
          title: formTitle,
          description: formDesc,
          status: formStatus,
          priority: formPriority,
          dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
          assignedTo: formAssignedTo || null,
        });
        setMessage({ text: res.message, type: 'success' });
      }

      setShowTaskModal(false);
      await fetchTasks();
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Êtes-vous certain de vouloir supprimer cette tâche ?')) return;

    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await api.deleteTask(id);
      setMessage({ text: res.message, type: 'success' });
      fetchTasks();
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
      fetchTasks();
    }
  };

  // Immediate status change with Optimistic UI
  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;

    // 1. Instant optimistic update in UI!
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );

    try {
      await api.updateTask(task.id, { status: newStatus });
      onDataChange?.();
    } catch (err: any) {
      setMessage({ text: `Erreur : ${err.message}`, type: 'error' });
      fetchTasks(); // rollback
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      handleQuickStatusChange(task, targetStatus);
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-6 text-white">
      {/* Toast Feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold transition ${
            message.type === 'success'
              ? 'bg-yellow-400 text-black border border-yellow-300 font-bold shadow-lg shadow-yellow-500/10'
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
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-black tracking-wide uppercase">
              Module C • Gestion des Tâches
            </span>
            <span className="text-xs text-neutral-400">
              {totalCount} tâche(s) au total
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Tableau Kanban & Tâches
          </h1>
          <p className="text-xs text-neutral-400">
            Glissez-déposez ou cliquez sur les boutons de statut pour déplacer instantanément vos tâches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={() => {
              fetchTasks();
              fetchPrerequisites();
            }}
            title="Rafraîchir les tâches"
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-yellow-400' : ''}`} />
          </button>

          {/* View mode toggle */}
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-xl text-xs shadow-lg shadow-yellow-400/20 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Nouvelle Tâche</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setPage(1);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-200 focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Tous les projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-200 focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Tous statuts</option>
              <option value="TODO">À faire (TODO)</option>
              <option value="IN_PROGRESS">En cours (IN_PROGRESS)</option>
              <option value="DONE">Terminé (DONE)</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-200 focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Toutes priorités</option>
              <option value="HIGH">Haute (HIGH)</option>
              <option value="MEDIUM">Moyenne (MEDIUM)</option>
              <option value="LOW">Basse (LOW)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split('-');
                setSortBy(sb as any);
                setOrder(ord as any);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-200 focus:outline-hidden focus:border-blue-500"
            >
              <option value="createdAt-desc">Plus récentes d'abord</option>
              <option value="createdAt-asc">Plus anciennes d'abord</option>
              <option value="dueDate-asc">Échéance la plus proche</option>
              <option value="dueDate-desc">Échéance la plus lointaine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {viewMode === 'kanban' ? (
        /* --- KANBAN VIEW with DRAG & DROP & DIRECT STATUS SWITCH --- */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: TODO */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'TODO')}
            className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4 flex flex-col transition hover:border-neutral-700"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">
                  À faire (TODO)
                </h3>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[72vh] pr-1">
              {todoTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  isOverdue={isOverdue(task)}
                  onEdit={() => handleOpenEditModal(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onStatusChange={(s) => handleQuickStatusChange(task, s)}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                />
              ))}
              {todoTasks.length === 0 && (
                <div className="py-12 text-center text-neutral-600 text-xs italic border border-dashed border-neutral-900 rounded-xl">
                  Déposez une tâche ici (À faire)
                </div>
              )}
            </div>
          </div>

          {/* Column 2: IN_PROGRESS */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
            className="bg-neutral-950/80 border border-blue-900/50 rounded-2xl p-4 flex flex-col transition hover:border-blue-700/60"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-900/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-blue-300">
                  En cours (IN_PROGRESS)
                </h3>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-700/50 text-blue-300">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[72vh] pr-1">
              {inProgressTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  isOverdue={isOverdue(task)}
                  onEdit={() => handleOpenEditModal(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onStatusChange={(s) => handleQuickStatusChange(task, s)}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="py-12 text-center text-neutral-600 text-xs italic border border-dashed border-neutral-900 rounded-xl">
                  Déposez une tâche ici (En cours)
                </div>
              )}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'DONE')}
            className="bg-neutral-950/80 border border-yellow-900/40 rounded-2xl p-4 flex flex-col transition hover:border-yellow-600/50"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-yellow-900/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-yellow-300">
                  Terminé (DONE)
                </h3>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-600/40 text-yellow-300">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[72vh] pr-1">
              {doneTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  isOverdue={false}
                  onEdit={() => handleOpenEditModal(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onStatusChange={(s) => handleQuickStatusChange(task, s)}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                />
              ))}
              {doneTasks.length === 0 && (
                <div className="py-12 text-center text-neutral-600 text-xs italic border border-dashed border-neutral-900 rounded-xl">
                  Déposez une tâche ici (Terminé)
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* --- TABLE VIEW --- */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Titre & Description</th>
                  <th className="py-3 px-4">Projet</th>
                  <th className="py-3 px-4">Changer Statut</th>
                  <th className="py-3 px-4">Priorité</th>
                  <th className="py-3 px-4">Assigné à</th>
                  <th className="py-3 px-4">Échéance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {tasks.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task.id} className="hover:bg-neutral-800/40 transition">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-white text-sm">{task.title}</div>
                        <div className="text-[11px] text-neutral-400 truncate">{task.description}</div>
                      </td>
                      <td className="py-3 px-4 text-blue-400 font-semibold">
                        {task.projectTitle || task.projectId}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value as any)}
                          className={`text-xs font-black px-2.5 py-1 rounded-lg bg-black border ${
                            task.status === 'DONE'
                              ? 'text-yellow-400 border-yellow-500/50'
                              : task.status === 'IN_PROGRESS'
                              ? 'text-blue-400 border-blue-500/50'
                              : 'text-neutral-300 border-neutral-700'
                          }`}
                        >
                          <option value="TODO">À FAIRE</option>
                          <option value="IN_PROGRESS">EN COURS</option>
                          <option value="DONE">TERMINÉ</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : task.priority === 'MEDIUM'
                              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-200">
                        {task.assignee ? task.assignee.name : 'Non assigné'}
                      </td>
                      <td className="py-3 px-4">
                        {task.dueDate ? (
                          <span className={overdue ? 'text-yellow-400 font-black' : 'text-neutral-400'}>
                            {overdue && '⚠️ '}
                            {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                            title="Modifier la tâche"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40"
                            title="Supprimer la tâche"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 bg-black border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Page {page} sur {totalPages} ({totalCount} tâches au total)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-white rounded-lg border border-neutral-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-white rounded-lg border border-neutral-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal (Create / Edit) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <CheckSquare className="w-5 h-5 text-black" />
                </div>
                <h3 className="font-black text-lg">
                  {editingTask ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
                </h3>
              </div>
              <button onClick={() => setShowTaskModal(false)} className="text-neutral-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Projet associé *
                </label>
                <select
                  disabled={!!editingTask}
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-yellow-400 disabled:opacity-50"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rédiger la documentation Swagger OpenAPI"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Description détaillée
                </label>
                <textarea
                  rows={3}
                  placeholder="Détails techniques, consignes et critères de validation..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                  >
                    <option value="TODO">À faire (TODO)</option>
                    <option value="IN_PROGRESS">En cours (IN_PROGRESS)</option>
                    <option value="DONE">Terminé (DONE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Priorité
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                  >
                    <option value="LOW">Basse (LOW)</option>
                    <option value="MEDIUM">Moyenne (MEDIUM)</option>
                    <option value="HIGH">Haute (HIGH)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Date limite (dueDate)
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Assigner à un membre
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-yellow-400"
                  >
                    <option value="">Non assigné</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-xl text-xs transition"
                >
                  {editingTask ? 'Enregistrer les modifications' : 'Créer la tâche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual Kanban Card with 1-click status pills & drag support
interface KanbanCardProps {
  task: Task;
  isOverdue: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  isOverdue,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`p-4 bg-black border rounded-2xl shadow-sm transition hover:border-blue-500 cursor-grab active:cursor-grabbing group ${
        isOverdue ? 'border-yellow-400/80 ring-1 ring-yellow-400/40' : 'border-neutral-800'
      }`}
    >
      {/* Top Bar: Drag handle, Priority & Overdue */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400" />
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
              task.priority === 'HIGH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : task.priority === 'MEDIUM'
                ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}
          >
            {task.priority}
          </span>
        </div>

        {isOverdue && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-yellow-400 text-black flex items-center gap-1 shadow-xs">
            <AlertTriangle className="w-2.5 h-2.5 text-black" />
            <span>EN RETARD</span>
          </span>
        )}
      </div>

      {/* Title */}
      <h4
        onClick={onEdit}
        className="text-sm font-bold text-white hover:text-yellow-400 cursor-pointer line-clamp-2 mb-1.5 transition"
      >
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-[11px] text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Due Date & Project */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-3 pt-2 border-t border-neutral-900">
        <span className="truncate max-w-[130px] text-blue-400 font-bold">
          {task.projectTitle}
        </span>
        {task.dueDate && (
          <span className={isOverdue ? 'text-yellow-400 font-black' : 'text-neutral-400'}>
            📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {/* DIRECT 1-CLICK STATUS SELECTOR (Addresses "Les données ne changent pas") */}
      <div className="mb-3 p-1.5 bg-neutral-900 rounded-xl flex items-center gap-1 border border-neutral-800">
        <button
          onClick={() => onStatusChange('TODO')}
          className={`flex-1 py-1 text-[9px] font-black rounded-lg transition ${
            task.status === 'TODO'
              ? 'bg-white text-black shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          À FAIRE
        </button>
        <button
          onClick={() => onStatusChange('IN_PROGRESS')}
          className={`flex-1 py-1 text-[9px] font-black rounded-lg transition ${
            task.status === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          EN COURS
        </button>
        <button
          onClick={() => onStatusChange('DONE')}
          className={`flex-1 py-1 text-[9px] font-black rounded-lg transition ${
            task.status === 'DONE'
              ? 'bg-yellow-400 text-black shadow-xs font-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          TERMINÉ
        </button>
      </div>

      {/* Card Footer: Assignee & Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <div className="flex items-center gap-1.5 text-xs text-neutral-200">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center text-white ring-1 ring-neutral-700">
                {task.assignee.name.slice(0, 1)}
              </div>
              <span className="truncate max-w-[90px] font-medium">{task.assignee.name.split(' ')[0]}</span>
            </div>
          ) : (
            <span className="text-[10px] text-neutral-600 italic">Non assigné</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Modifier"
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Supprimer"
            className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-rose-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
