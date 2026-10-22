import { Router, Response } from 'express';
import { db } from '../db.js';
import {
  authenticateJWT,
  AuthenticatedRequest,
  canAccessProject,
} from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/tasks
 * Lister toutes les tâches accessibles à l'utilisateur (à travers ses projets)
 * Supporte : filtres par projectId, status, priority, assignedTo, recherche, tri, pagination
 */
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const accessibleProjects = db.listProjectsForUser(req.user!);
  const allowedProjectIds = req.user!.role === 'ADMIN'
    ? undefined
    : accessibleProjects.map((p) => p.id);

  const {
    projectId,
    status,
    priority,
    assignedTo,
    search,
    sortBy,
    order,
    page,
    limit,
  } = req.query;

  // If specific projectId is requested, verify access
  if (projectId && typeof projectId === 'string') {
    const project = db.findProjectById(projectId);
    if (!project || !canAccessProject(project, req.user!)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Accès refusé au projet spécifié.',
      });
      return;
    }
  }

  const result = db.listTasks({
    projectId: projectId as string,
    allowedProjectIds,
    status: status as any,
    priority: priority as any,
    assignedTo: assignedTo as string,
    search: search as string,
    sortBy: sortBy as any,
    order: order as any,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  const projectMap = new Map(accessibleProjects.map((p) => [p.id, p]));

  const enrichedTasks = result.tasks.map((t) => {
    const assignee = t.assignedTo ? db.findUserById(t.assignedTo) : null;
    const creator = db.findUserById(t.createdById);
    const project = projectMap.get(t.projectId) || db.findProjectById(t.projectId);
    return {
      ...t,
      projectTitle: project?.title || 'Projet',
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

/**
 * GET /api/tasks/:id
 * Consulter une tâche spécifique
 */
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const task = db.findTaskById(req.params.id);

  if (!task) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Tâche introuvable.',
    });
    return;
  }

  const project = db.findProjectById(task.projectId);
  if (!project || !canAccessProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Accès refusé. Vous ne faites pas partie du projet lié à cette tâche.',
    });
    return;
  }

  const assignee = task.assignedTo ? db.findUserById(task.assignedTo) : null;
  const creator = db.findUserById(task.createdById);

  res.status(200).json({
    task: {
      ...task,
      project,
      assignee: assignee ? db.toSafeUser(assignee) : null,
      creator: creator ? db.toSafeUser(creator) : null,
    },
  });
});

/**
 * PATCH /api/tasks/:id
 * Modifier une tâche (titre, description, statut, priorité, date limite, assignation)
 */
router.patch('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const task = db.findTaskById(req.params.id);

  if (!task) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Tâche introuvable.',
    });
    return;
  }

  const project = db.findProjectById(task.projectId);
  if (!project || !canAccessProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Accès refusé. Vous ne pouvez modifier que les tâches de vos projets.',
    });
    return;
  }

  const { title, description, status, priority, dueDate, assignedTo } = req.body;

  // Validation
  if (status && !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Le statut doit être TODO, IN_PROGRESS ou DONE.',
    });
    return;
  }

  if (priority && !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'La priorité doit être LOW, MEDIUM ou HIGH.',
    });
    return;
  }

  if (assignedTo) {
    const user = db.findUserById(assignedTo);
    if (!user) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'L’utilisateur assigné est introuvable.',
      });
      return;
    }
  }

  const updated = db.updateTask(task.id, {
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo,
  });

  res.status(200).json({
    message: 'Tâche mise à jour avec succès.',
    task: updated,
  });
});

/**
 * DELETE /api/tasks/:id
 * Supprimer une tâche
 */
router.delete('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const task = db.findTaskById(req.params.id);

  if (!task) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Tâche introuvable.',
    });
    return;
  }

  const project = db.findProjectById(task.projectId);
  if (!project || !canAccessProject(project, req.user!)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Accès refusé. Vous ne pouvez supprimer que les tâches de vos projets.',
    });
    return;
  }

  db.deleteTask(task.id);

  res.status(200).json({
    message: 'Tâche supprimée avec succès.',
    deletedTaskId: task.id,
  });
});

export default router;
