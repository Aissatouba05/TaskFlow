import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

/**
 * GET /api/health
 * Statut de santé de l'API
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'UP',
    name: 'TaskFlow REST API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

/**
 * POST /api/reset-demo
 * Réinitialiser la base de données avec les données initiales de démonstration
 */
router.post('/reset-demo', (_req: Request, res: Response): void => {
  const freshData = db.reset();
  res.status(200).json({
    message: 'Base de données réinitialisée aux valeurs de référence avec succès.',
    usersCount: freshData.users.length,
    projectsCount: freshData.projects.length,
    tasksCount: freshData.tasks.length,
  });
});

export default router;
