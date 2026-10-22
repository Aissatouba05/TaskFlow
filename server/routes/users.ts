import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/users/me
 * Consulter son profil utilisateur
 */
router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({
    user: req.user,
  });
});

/**
 * PATCH /api/users/me
 * Modifier son profil utilisateur
 */
router.patch('/me', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { name, department, avatar, password } = req.body;
  const currentUserId = req.user!.id;

  if (password) {
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Le nouveau mot de passe doit comporter au moins 6 caractères.',
      });
      return;
    }
    db.updateUserPassword(currentUserId, password);
  }

  const updatedUser = db.updateUser(currentUserId, {
    name,
    department,
    avatar,
  });

  if (!updatedUser) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Utilisateur introuvable.',
    });
    return;
  }

  res.status(200).json({
    message: 'Profil mis à jour avec succès.',
    user: updatedUser,
  });
});

/**
 * GET /api/users
 * Lister les utilisateurs (avec recherche optionnelle)
 */
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { search, role } = req.query;
  let users = db.listUsers();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
    );
  }

  if (role && (role === 'ADMIN' || role === 'USER')) {
    users = users.filter((u) => u.role === role);
  }

  res.status(200).json({
    users,
    total: users.length,
  });
});

/**
 * GET /api/users/:id
 * Consulter un utilisateur spécifique
 */
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Utilisateur introuvable.',
    });
    return;
  }

  res.status(200).json({
    user: db.toSafeUser(user),
  });
});

/**
 * PATCH /api/users/:id/role
 * Modifier le rôle d'un utilisateur (ADMIN uniquement)
 */
router.patch('/:id/role', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response): void => {
  const { role } = req.body;
  const targetId = req.params.id;

  if (!role || !['ADMIN', 'USER'].includes(role)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Le rôle doit être soit "ADMIN" soit "USER".',
    });
    return;
  }

  const user = db.findUserById(targetId);
  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Utilisateur introuvable.',
    });
    return;
  }

  const updated = db.updateUser(targetId, { role });

  res.status(200).json({
    message: `Rôle de l'utilisateur mis à jour vers ${role}.`,
    user: updated,
  });
});

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur (ADMIN uniquement)
 */
router.delete('/:id', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = req.params.id;

  if (targetId === req.user!.id) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Un administrateur ne peut pas supprimer son propre compte.',
    });
    return;
  }

  const success = db.deleteUser(targetId);
  if (!success) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Utilisateur introuvable.',
    });
    return;
  }

  res.status(200).json({
    message: 'Utilisateur supprimé avec succès.',
    deletedUserId: targetId,
  });
});

export default router;
