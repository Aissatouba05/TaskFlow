import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Project,
  Task,
  SafeUser,
  TaskStatus,
  TaskPriority,
  DashboardStats,
} from './types.js';

interface DatabaseSchema {
  users: User[];
  projects: Project[];
  tasks: Task[];
}

const DB_FILE = path.resolve(process.cwd(), 'taskflow_data.json');

// Default initial seed
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Admin123!', 10);
const USER_PASSWORD_HASH = bcrypt.hashSync('User123!', 10);

function getInitialData(): DatabaseSchema {
  const adminId = 'usr-admin-001';
  const user1Id = 'usr-sarah-002';
  const user2Id = 'usr-mamadou-003';
  const user3Id = 'usr-aissatou-004';

  const users: User[] = [
    {
      id: adminId,
      name: 'Amadou Sow (Admin)',
      email: 'admin@taskflow.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department: 'Direction Technique & Sécurité',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: user1Id,
      name: 'Sarah Diallo',
      email: 'sarah.diallo@taskflow.dev',
      passwordHash: USER_PASSWORD_HASH,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      department: 'Gestion de Projet',
      createdAt: '2026-10-02T09:30:00.000Z',
      updatedAt: '2026-10-02T09:30:00.000Z',
    },
    {
      id: user2Id,
      name: 'Mamadou Fall',
      email: 'mamadou.fall@taskflow.dev',
      passwordHash: USER_PASSWORD_HASH,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      department: 'Ingénierie Backend',
      createdAt: '2026-10-03T11:00:00.000Z',
      updatedAt: '2026-10-03T11:00:00.000Z',
    },
    {
      id: user3Id,
      name: 'Aissatou Ba',
      email: 'aissatou.ba@taskflow.dev',
      passwordHash: USER_PASSWORD_HASH,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      department: 'Développement Full-Stack',
      createdAt: '2026-10-04T14:15:00.000Z',
      updatedAt: '2026-10-04T14:15:00.000Z',
    },
  ];

  const proj1Id = 'prj-taskflow-api';
  const proj2Id = 'prj-mobile-redesign';
  const proj3Id = 'prj-cloud-migration';

  const projects: Project[] = [
    {
      id: proj1Id,
      title: 'TaskFlow REST API & Swagger Core',
      description: 'Conception et déploiement de l’architecture API Node.js/Express avec Swagger, gestion des rôles et sécurisation JWT.',
      ownerId: adminId,
      status: 'ACTIVE',
      members: [
        { userId: adminId, role: 'OWNER', joinedAt: '2026-10-01T08:00:00.000Z' },
        { userId: user1Id, role: 'LEAD', joinedAt: '2026-10-02T10:00:00.000Z' },
        { userId: user2Id, role: 'MEMBER', joinedAt: '2026-10-03T11:30:00.000Z' },
        { userId: user3Id, role: 'MEMBER', joinedAt: '2026-10-04T15:00:00.000Z' },
      ],
      createdAt: '2026-10-05T08:00:00.000Z',
      updatedAt: '2026-10-18T16:00:00.000Z',
    },
    {
      id: proj2Id,
      title: 'TaskFlow Mobile Application (Flutter/React Native)',
      description: 'Refonte de l’expérience utilisateur mobile pour la gestion nomade des tâches et notifications push en temps réel.',
      ownerId: user1Id,
      status: 'PLANNING',
      members: [
        { userId: user1Id, role: 'OWNER', joinedAt: '2026-10-06T09:00:00.000Z' },
        { userId: user3Id, role: 'MEMBER', joinedAt: '2026-10-07T14:00:00.000Z' },
      ],
      createdAt: '2026-10-06T09:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
    {
      id: proj3Id,
      title: 'Migration Cloud & Pipeline CI/CD (Render + Vercel)',
      description: 'Automatisation des tests, conteneurisation Docker et déploiement haute disponibilité de la plateforme.',
      ownerId: user2Id,
      status: 'ACTIVE',
      members: [
        { userId: user2Id, role: 'OWNER', joinedAt: '2026-10-10T10:00:00.000Z' },
        { userId: adminId, role: 'LEAD', joinedAt: '2026-10-10T10:00:00.000Z' },
      ],
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-20T17:45:00.000Z',
    },
  ];

  const tasks: Task[] = [
    {
      id: 'tsk-001',
      projectId: proj1Id,
      title: 'Implémenter le middleware d’authentification JWT',
      description: 'Vérifier la validité des tokens Bearer JWT et injecter req.user avec le payload décodé.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: '2026-10-12T18:00:00.000Z',
      assignedTo: user2Id,
      createdById: adminId,
      createdAt: '2026-10-06T08:30:00.000Z',
      updatedAt: '2026-10-11T16:20:00.000Z',
    },
    {
      id: 'tsk-002',
      projectId: proj1Id,
      title: 'Rédiger la spécification Swagger OpenAPI 3.0',
      description: 'Documenter tous les endpoints, paramètres, schémas User/Project/Task et codes HTTP 200 à 500.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-10-25T18:00:00.000Z',
      assignedTo: user3Id,
      createdById: user1Id,
      createdAt: '2026-10-07T09:00:00.000Z',
      updatedAt: '2026-10-21T10:15:00.000Z',
    },
    {
      id: 'tsk-003',
      projectId: proj1Id,
      title: 'Module de statistiques et calcul des retards',
      description: 'Calculer en temps réel le total des projets, tâches achevées, tâches en cours et tâches en retard.',
      status: 'DONE',
      priority: 'MEDIUM',
      dueDate: '2026-10-15T18:00:00.000Z',
      assignedTo: user2Id,
      createdById: adminId,
      createdAt: '2026-10-08T11:00:00.000Z',
      updatedAt: '2026-10-14T17:00:00.000Z',
    },
    {
      id: 'tsk-004',
      projectId: proj1Id,
      title: 'Audit de sécurité & hachage des mots de passe',
      description: 'Vérifier l’absence d’exposition de hash dans les retours API et valider les entrées utilisateur.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: '2026-10-14T12:00:00.000Z',
      assignedTo: adminId,
      createdById: adminId,
      createdAt: '2026-10-08T14:00:00.000Z',
      updatedAt: '2026-10-13T15:30:00.000Z',
    },
    {
      id: 'tsk-005',
      projectId: proj1Id,
      title: 'Validation des données avec schéma strict (titre, statut, priorités)',
      description: 'Rejeter les requêtes malformées avec HTTP 400 et un message d’erreur explicite.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: '2026-10-26T18:00:00.000Z',
      assignedTo: user3Id,
      createdById: user1Id,
      createdAt: '2026-10-09T10:00:00.000Z',
      updatedAt: '2026-10-20T11:00:00.000Z',
    },
    {
      id: 'tsk-006',
      projectId: proj2Id,
      title: 'Maquettes Figma de la vue Kanban mobile',
      description: 'Concevoir l’interface tactile de déplacement des cartes et des filtres de priorité.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '2026-10-20T18:00:00.000Z', // Overdue!
      assignedTo: user1Id,
      createdById: user1Id,
      createdAt: '2026-10-11T13:00:00.000Z',
      updatedAt: '2026-10-11T13:00:00.000Z',
    },
    {
      id: 'tsk-007',
      projectId: proj2Id,
      title: 'Synchronisation hors-ligne des tâches avec WatermelonDB',
      description: 'Permettre aux équipes terrain de consulter et modifier leurs tâches sans connexion active.',
      status: 'TODO',
      priority: 'LOW',
      dueDate: '2026-11-05T18:00:00.000Z',
      assignedTo: user3Id,
      createdById: user1Id,
      createdAt: '2026-10-12T15:30:00.000Z',
      updatedAt: '2026-10-12T15:30:00.000Z',
    },
    {
      id: 'tsk-008',
      projectId: proj3Id,
      title: 'Configuration du fichier render.yaml pour le backend',
      description: 'Créer le service Web Node.js sur Render avec les variables d’environnement PORT, JWT_SECRET.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-10-23T18:00:00.000Z',
      assignedTo: user2Id,
      createdById: adminId,
      createdAt: '2026-10-15T09:00:00.000Z',
      updatedAt: '2026-10-21T18:00:00.000Z',
    },
    {
      id: 'tsk-009',
      projectId: proj3Id,
      title: 'Déploiement du backoffice React sur Vercel',
      description: 'Connecter le repository Git à Vercel et configurer la redirection API de test vers Render.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: '2026-10-19T18:00:00.000Z', // Overdue!
      assignedTo: adminId,
      createdById: adminId,
      createdAt: '2026-10-16T14:00:00.000Z',
      updatedAt: '2026-10-16T14:00:00.000Z',
    },
  ];

  return { users, projects, tasks };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing database file, falling back to initial seed:', e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  public reset(): DatabaseSchema {
    this.data = getInitialData();
    this.persist();
    return this.data;
  }

  // --- Users Operations ---
  public toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public listUsers(): SafeUser[] {
    return this.data.users.map((u) => this.toSafeUser(u));
  }

  public createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'USER';
    department?: string;
  }): SafeUser {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(userData.password, salt);
    const now = new Date().toISOString();

    const newUser: User = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      passwordHash,
      role: userData.role || 'USER',
      department: userData.department || 'Équipe Produit',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.data.users.push(newUser);
    this.persist();
    return this.toSafeUser(newUser);
  }

  public updateUser(
    id: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'role' | 'department' | 'avatar'>>
  ): SafeUser | null {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.email !== undefined) user.email = updates.email.toLowerCase().trim();
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.department !== undefined) user.department = updates.department;
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    user.updatedAt = new Date().toISOString();

    this.persist();
    return this.toSafeUser(user);
  }

  public updateUserPassword(id: string, newPassword: string): boolean {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return false;
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    if (this.data.users.length === initialLen) return false;

    // Remove user from project memberships
    this.data.projects.forEach((proj) => {
      proj.members = proj.members.filter((m) => m.userId !== id);
    });

    // Unassign tasks
    this.data.tasks.forEach((tsk) => {
      if (tsk.assignedTo === id) {
        tsk.assignedTo = null;
      }
    });

    this.persist();
    return true;
  }

  // --- Projects Operations ---
  public findProjectById(id: string): Project | undefined {
    return this.data.projects.find((p) => p.id === id);
  }

  public listProjectsForUser(user: SafeUser): Project[] {
    if (user.role === 'ADMIN') {
      return [...this.data.projects];
    }
    return this.data.projects.filter(
      (p) => p.ownerId === user.id || p.members.some((m) => m.userId === user.id)
    );
  }

  public createProject(projectData: {
    title: string;
    description: string;
    ownerId: string;
    members?: { userId: string; role?: 'MEMBER' | 'LEAD' }[];
  }): Project {
    const now = new Date().toISOString();
    const newMembers = [
      { userId: projectData.ownerId, role: 'OWNER' as const, joinedAt: now },
      ...(projectData.members || []).map((m) => ({
        userId: m.userId,
        role: m.role || ('MEMBER' as const),
        joinedAt: now,
      })),
    ];

    // De-duplicate members by userId
    const uniqueMembers = Array.from(
      new Map(newMembers.map((m) => [m.userId, m])).values()
    );

    const newProject: Project = {
      id: `prj-${crypto.randomUUID().slice(0, 8)}`,
      title: projectData.title.trim(),
      description: projectData.description.trim(),
      ownerId: projectData.ownerId,
      status: 'ACTIVE',
      members: uniqueMembers,
      createdAt: now,
      updatedAt: now,
    };

    this.data.projects.unshift(newProject);
    this.persist();
    return newProject;
  }

  public updateProject(
    id: string,
    updates: Partial<Pick<Project, 'title' | 'description' | 'status'>>
  ): Project | null {
    const project = this.data.projects.find((p) => p.id === id);
    if (!project) return null;

    if (updates.title !== undefined) project.title = updates.title.trim();
    if (updates.description !== undefined) project.description = updates.description.trim();
    if (updates.status !== undefined) project.status = updates.status;
    project.updatedAt = new Date().toISOString();

    this.persist();
    return project;
  }

  public deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    if (this.data.projects.length === initialLen) return false;

    // Delete associated tasks
    this.data.tasks = this.data.tasks.filter((t) => t.projectId !== id);
    this.persist();
    return true;
  }

  public addProjectMember(
    projectId: string,
    userId: string,
    role: 'MEMBER' | 'LEAD' = 'MEMBER'
  ): Project | null {
    const project = this.data.projects.find((p) => p.id === projectId);
    if (!project) return null;

    const existingIndex = project.members.findIndex((m) => m.userId === userId);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      project.members[existingIndex].role = role;
    } else {
      project.members.push({ userId, role, joinedAt: now });
    }

    project.updatedAt = now;
    this.persist();
    return project;
  }

  public removeProjectMember(projectId: string, userId: string): Project | null {
    const project = this.data.projects.find((p) => p.id === projectId);
    if (!project) return null;

    if (project.ownerId === userId) {
      throw new Error('Le propriétaire du projet ne peut pas être retiré de l’équipe.');
    }

    project.members = project.members.filter((m) => m.userId !== userId);
    // Unassign tasks assigned to this user in this project
    this.data.tasks.forEach((t) => {
      if (t.projectId === projectId && t.assignedTo === userId) {
        t.assignedTo = null;
      }
    });

    project.updatedAt = new Date().toISOString();
    this.persist();
    return project;
  }

  // --- Tasks Operations ---
  public findTaskById(id: string): Task | undefined {
    return this.data.tasks.find((t) => t.id === id);
  }

  public listTasks(filters: {
    projectId?: string;
    allowedProjectIds?: string[];
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    search?: string;
    sortBy?: 'createdAt' | 'dueDate';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): { tasks: Task[]; total: number; page: number; totalPages: number } {
    let result = [...this.data.tasks];

    // Access control: if allowedProjectIds specified, restrict to those
    if (filters.allowedProjectIds) {
      result = result.filter((t) => filters.allowedProjectIds!.includes(t.projectId));
    }

    if (filters.projectId) {
      result = result.filter((t) => t.projectId === filters.projectId);
    }

    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }

    if (filters.assignedTo) {
      result = result.filter((t) => t.assignedTo === filters.assignedTo);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'createdAt';
    const order = filters.order || 'desc';

    result.sort((a, b) => {
      const valA = a[sortBy] ? new Date(a[sortBy]!).getTime() : 0;
      const valB = b[sortBy] ? new Date(b[sortBy]!).getTime() : 0;
      return order === 'asc' ? valA - valB : valB - valA;
    });

    const total = result.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 20);
    const totalPages = Math.ceil(total / limit) || 1;

    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      tasks: paginated,
      total,
      page,
      totalPages,
    };
  }

  public createTask(taskData: {
    projectId: string;
    title: string;
    description: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    assignedTo?: string | null;
    createdById: string;
  }): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `tsk-${crypto.randomUUID().slice(0, 8)}`,
      projectId: taskData.projectId,
      title: taskData.title.trim(),
      description: taskData.description.trim(),
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate || null,
      assignedTo: taskData.assignedTo || null,
      createdById: taskData.createdById,
      createdAt: now,
      updatedAt: now,
    };

    this.data.tasks.unshift(newTask);
    this.persist();
    return newTask;
  }

  public updateTask(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignedTo'>>
  ): Task | null {
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return null;

    if (updates.title !== undefined) task.title = updates.title.trim();
    if (updates.description !== undefined) task.description = updates.description.trim();
    if (updates.status !== undefined) task.status = updates.status;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
    if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo;

    task.updatedAt = new Date().toISOString();
    this.persist();
    return task;
  }

  public deleteTask(id: string): boolean {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    if (this.data.tasks.length === initialLen) return false;
    this.persist();
    return true;
  }

  // --- Statistics ---
  public getStatsForUser(user: SafeUser): DashboardStats {
    const accessibleProjects = this.listProjectsForUser(user);
    const accessibleProjectIds = new Set(accessibleProjects.map((p) => p.id));

    const tasks = user.role === 'ADMIN'
      ? this.data.tasks
      : this.data.tasks.filter((t) => accessibleProjectIds.has(t.projectId));

    const now = new Date();

    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    let overdueTasks = 0;

    const statusBreakdown: Record<TaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    const priorityBreakdown: Record<TaskPriority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    tasks.forEach((t) => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
      priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;

      if (t.status === 'DONE') {
        completedTasks++;
      } else if (t.status === 'IN_PROGRESS') {
        inProgressTasks++;
      } else if (t.status === 'TODO') {
        todoTasks++;
      }

      if (t.dueDate && t.status !== 'DONE') {
        const due = new Date(t.dueDate);
        if (due < now) {
          overdueTasks++;
        }
      }
    });

    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const projectMap = new Map(this.data.projects.map((p) => [p.id, p.title]));
    const userMap = new Map(this.data.users.map((u) => [u.id, u.name]));

    const recentTasks = [...tasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((t) => ({
        ...t,
        projectTitle: projectMap.get(t.projectId) || 'Projet inconnu',
        assigneeName: t.assignedTo ? userMap.get(t.assignedTo) || 'Inconnu' : 'Non assigné',
      }));

    return {
      totalProjects: accessibleProjects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      completionRate,
      statusBreakdown,
      priorityBreakdown,
      recentTasks,
    };
  }
}

export const db = new Database();
