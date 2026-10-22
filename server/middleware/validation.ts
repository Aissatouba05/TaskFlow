import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { name, email, password, role } = req.body;
  const errors: Record<string, string> = {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Le nom complet est obligatoire et doit contenir au moins 2 caractères.';
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Une adresse email valide est obligatoire.';
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.password = 'Le mot de passe doit comporter au minimum 6 caractères.';
  }

  if (role && !['ADMIN', 'USER'].includes(role)) {
    errors.role = 'Le rôle doit être soit ADMIN soit USER.';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Erreurs de validation des données d’inscription.',
      details: errors,
    });
    return;
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  const errors: Record<string, string> = {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Veuillez renseigner une adresse email valide.';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Le mot de passe est requis.';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Identifiants de connexion invalides ou incomplets.',
      details: errors,
    });
    return;
  }

  next();
}

export function validateProject(req: Request, res: Response, next: NextFunction): void {
  const { title, description } = req.body;
  const errors: Record<string, string> = {};

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.title = 'Le titre du projet est obligatoire (minimum 3 caractères).';
  }

  if (description && typeof description !== 'string') {
    errors.description = 'La description doit être une chaîne de caractères.';
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Validation échouée pour la création du projet.',
      details: errors,
    });
    return;
  }

  next();
}

export function validateTask(req: Request, res: Response, next: NextFunction): void {
  const { title, description, status, priority, dueDate } = req.body;
  const errors: Record<string, string> = {};

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.title = 'Le titre de la tâche est obligatoire (minimum 2 caractères).';
  }

  if (description && typeof description !== 'string') {
    errors.description = 'La description doit être une chaîne de caractères.';
  }

  if (status && !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    errors.status = 'Le statut doit être TODO, IN_PROGRESS ou DONE.';
  }

  if (priority && !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
    errors.priority = 'La priorité doit être LOW, MEDIUM ou HIGH.';
  }

  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      errors.dueDate = 'La date limite (dueDate) doit être une date ISO valide (ex: 2026-10-30T18:00:00Z).';
    }
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Validation échouée pour la tâche.',
      details: errors,
    });
    return;
  }

  next();
}
