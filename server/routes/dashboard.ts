import { Router, Response } from 'express';
import { db } from '../db.js';
import {
  authenticateJWT,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth.js';

const router = Router();

/**
 * Handler for user dashboard statistics
 */
const getDashboardStatsHandler = (req: AuthenticatedRequest, res: Response): void => {
  const stats = db.getStatsForUser(req.user!);

  res.status(200).json({
    message: 'Statistiques du tableau de bord récupérées avec succès.',
    stats,
    calculatedAt: new Date().toISOString(),
  });
};

/**
 * Handler for admin platform statistics
 */
const getAdminStatsHandler = (_req: AuthenticatedRequest, res: Response): void => {
  const users = db.listUsers();
  const allProjects = db.listProjectsForUser({ id: 'admin', role: 'ADMIN', name: 'Admin', email: 'admin@taskflow.dev', createdAt: '', updatedAt: '' });
  const allTasks = db.listTasks({ limit: 1000 }).tasks;

  const now = new Date();
  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && t.status !== 'DONE' && new Date(t.dueDate) < now
  ).length;

  const completedTasks = allTasks.filter((t) => t.status === 'DONE').length;

  res.status(200).json({
    users: {
      total: users.length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      regularUsers: users.filter((u) => u.role === 'USER').length,
    },
    projects: {
      total: allProjects.length,
      active: allProjects.filter((p) => p.status === 'ACTIVE').length,
      planning: allProjects.filter((p) => p.status === 'PLANNING').length,
      completed: allProjects.filter((p) => p.status === 'COMPLETED').length,
    },
    tasks: {
      total: allTasks.length,
      completed: completedTasks,
      inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      todo: allTasks.filter((t) => t.status === 'TODO').length,
      overdue: overdueTasks,
      completionRate: allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0,
    },
    system: {
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
};

// Explicit routes
router.get('/dashboard/stats', authenticateJWT, getDashboardStatsHandler);
router.get('/admin/stats', authenticateJWT, requireRole('ADMIN'), getAdminStatsHandler);
router.get('/stats', authenticateJWT, getDashboardStatsHandler);

export default router;
