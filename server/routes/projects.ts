import { Router, Response } from 'express';
import { db } from '../db.js';
import {
  authenticateJWT,
  AuthenticatedRequest,
  canAccessProject,
  canModifyProject,
} from '../middleware/auth.js';
import { validateProject, validateTask } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/projects
 * Créer un nouveau projet
 */
router.post('/', authenticateJWT, validateProject, (req: AuthenticatedRequest, res: Response): void => {
  const { title, description, members } = req.body;
  const ownerId = req.user!.id;

  const project = db.createProject({
    title,
    description: description || '',
    ownerId,
    members: Array.isArray(members) ? members : [],
  });

  res.status(201).json({
    message: 'Projet créé avec succès.',
    project,
  });
});

/**
 * GET /api/projects
 * Lister les projets accessibles à l'utilisateur connecté (ou tous pour l'ADMIN)
 */
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { search, status } = req.query;
  let projects = db.listProjectsForUser(req.user!);

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    projects = projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (status && typeof status === 'string') {
    projects = projects.filter((p) => p.status === status);
  }

  // Enrich with user information for owner
  const enriched = projects.map((p) => {
    const owner = db.findUserById(p.ownerId);
    const tasks = db.listTasks({ projectId: p.id }).tasks;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    return {
      ...p,
      owner: owner ? db.toSafeUser(owner) : null,
      taskCount: tasks.length,
      completedTaskCount: completedTasks,
    };
  });

  res.status(200).json({
    projects: enriched,
    total: enriched.length,
  });
});

/**
 * GET /api/projects/:id
 * Consulter un projet et ses détails
 */
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canAccessProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Accès refusé. Vous ne faites pas partie de l’équipe de ce projet.',
    });
    return;
  }

  const owner = db.findUserById(project.ownerId);
  const tasks = db.listTasks({ projectId: project.id }).tasks;
  const enrichedMembers = project.members.map((m) => {
    const u = db.findUserById(m.userId);
    return {
      ...m,
      user: u ? db.toSafeUser(u) : null,
    };
  });

  res.status(200).json({
    project: {
      ...project,
      owner: owner ? db.toSafeUser(owner) : null,
      members: enrichedMembers,
      taskCount: tasks.length,
      completedTaskCount: tasks.filter((t) => t.status === 'DONE').length,
    },
  });
});

/**
 * PATCH /api/projects/:id
 * Modifier un projet (réservé au propriétaire ou ADMIN)
 */
router.patch('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canModifyProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Seul le propriétaire du projet ou un administrateur peut modifier ce projet.',
    });
    return;
  }

  const { title, description, status } = req.body;
  const updated = db.updateProject(project.id, { title, description, status });

  res.status(200).json({
    message: 'Projet mis à jour avec succès.',
    project: updated,
  });
});

/**
 * DELETE /api/projects/:id
 * Supprimer un projet (réservé au propriétaire ou ADMIN)
 */
router.delete('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canModifyProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Seul le propriétaire du projet ou un administrateur peut supprimer ce projet.',
    });
    return;
  }

  db.deleteProject(project.id);

  res.status(200).json({
    message: 'Projet et tâches associées supprimés avec succès.',
    deletedProjectId: project.id,
  });
});

/**
 * GET /api/projects/:id/members
 * Lister les membres d'un projet
 */
router.get('/:id/members', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canAccessProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Accès refusé. Vous ne faites pas partie de l’équipe de ce projet.',
    });
    return;
  }

  const enrichedMembers = project.members.map((m) => {
    const user = db.findUserById(m.userId);
    return {
      ...m,
      user: user ? db.toSafeUser(user) : null,
    };
  });

  res.status(200).json({
    members: enrichedMembers,
    total: enrichedMembers.length,
  });
});

/**
 * POST /api/projects/:id/members
 * Ajouter un membre à un projet (propriétaire ou ADMIN)
 */
router.post('/:id/members', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canModifyProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Seul le propriétaire du projet ou un administrateur peut ajouter des membres.',
    });
    return;
  }

  const { userId, role } = req.body;

  if (!userId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'L’identifiant userId est obligatoire.',
    });
    return;
  }

  const targetUser = db.findUserById(userId);
  if (!targetUser) {
    res.status(404).json({
      error: 'Not Found',
      message: 'L’utilisateur à ajouter est introuvable.',
    });
    return;
  }

  const updatedProject = db.addProjectMember(
    project.id,
    userId,
    role === 'LEAD' ? 'LEAD' : 'MEMBER'
  );

  res.status(201).json({
    message: 'Membre ajouté avec succès au projet.',
    project: updatedProject,
  });
});

/**
 * DELETE /api/projects/:id/members/:userId
 * Retirer un membre d'un projet
 */
router.delete('/:id/members/:userId', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canModifyProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Seul le propriétaire du projet ou un administrateur peut retirer des membres.',
    });
    return;
  }

  const targetUserId = req.params.userId;

  try {
    const updated = db.removeProjectMember(project.id, targetUserId);
    res.status(200).json({
      message: 'Membre retiré du projet avec succès.',
      project: updated,
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Bad Request',
      message: err.message || 'Impossible de retirer le membre.',
    });
  }
});

/**
 * POST /api/projects/:id/tasks
 * Créer une tâche rattachée au projet
 */
router.post('/:id/tasks', authenticateJWT, validateTask, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canAccessProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Vous devez faire partie du projet pour y créer des tâches.',
    });
    return;
  }

  const { title, description, status, priority, dueDate, assignedTo } = req.body;

  // If assignedTo is provided, verify they are in the project team or valid user
  if (assignedTo) {
    const assignee = db.findUserById(assignedTo);
    if (!assignee) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'L’utilisateur assigné n’existe pas.',
      });
      return;
    }
  }

  const task = db.createTask({
    projectId: project.id,
    title,
    description: description || '',
    status,
    priority,
    dueDate,
    assignedTo,
    createdById: req.user!.id,
  });

  res.status(201).json({
    message: 'Tâche créée avec succès dans le projet.',
    task,
  });
});

/**
 * GET /api/projects/:id/tasks
 * Lister les tâches du projet avec filtres, recherche, pagination et tri
 */
router.get('/:id/tasks', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const project = db.findProjectById(req.params.id);

  if (!project) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Projet introuvable.',
    });
    return;
  }

  if (!canAccessProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Accès refusé aux tâches de ce projet.',
    });
    return;
  }

  const { status, priority, assignedTo, search, sortBy, order, page, limit } = req.query;

  const result = db.listTasks({
    projectId: project.id,
    status: status as any,
    priority: priority as any,
    assignedTo: assignedTo as string,
    search: search as string,
    sortBy: sortBy as any,
    order: order as any,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  // Enrich with user information
  const enrichedTasks = result.tasks.map((t) => {
    const assignee = t.assignedTo ? db.findUserById(t.assignedTo) : null;
    const creator = db.findUserById(t.createdById);
    return {
      ...t,
      assignee: assignee ? db.toSafeUser(assignee) : null,
      creator: creator ? db.toSafeUser(creator) : null,
    };
  });

  res.status(200).json({
    tasks: enrichedTasks,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
});

export default router;
