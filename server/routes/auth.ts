import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/auth/register
 * Inscrire un nouvel utilisateur
 */
router.post('/register', validateRegister, (req: Request, res: Response): void => {
  const { name, email, password, role, department } = req.body;

  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(409).json({
      error: 'Conflict',
      message: 'Un utilisateur avec cette adresse email existe déjà dans le système.',
      code: 'EMAIL_ALREADY_EXISTS',
    });
    return;
  }

  // Security: only allow setting ADMIN role if specified or default to USER
  const safeUser = db.createUser({
    name,
    email,
    password,
    role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    department,
  });

  const token = generateToken(safeUser);

  res.status(201).json({
    message: 'Compte utilisateur créé avec succès.',
    user: safeUser,
    token,
  });
});

/**
 * POST /api/auth/login
 * Authentifier un utilisateur et retourner un token JWT
 */
router.post('/login', validateLogin, (req: Request, res: Response): void => {
  const { email, password } = req.body;

  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Identifiants invalides (email ou mot de passe incorrect).',
      code: 'INVALID_CREDENTIALS',
    });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Identifiants invalides (email ou mot de passe incorrect).',
      code: 'INVALID_CREDENTIALS',
    });
    return;
  }

  const safeUser = db.toSafeUser(user);
  const token = generateToken(safeUser);

  res.status(200).json({
    message: 'Authentification réussie.',
    user: safeUser,
    token,
  });
});

/**
 * GET /api/auth/verify
 * Vérifie le token actuel et retourne l'utilisateur
 */
router.get('/verify', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({
    valid: true,
    user: req.user,
  });
});

export default router;
