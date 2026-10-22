export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TaskFlow REST API — Documentation Interactive',
    version: '1.0.0',
    description: `
**TaskFlow API** est une API REST d’entreprise conçue avec **Node.js** et **Express** pour la gestion de projets collaboratifs, d’équipes et de tâches.

### 🛡️ Authentification & Sécurité
- Authentification par **JSON Web Token (JWT)**.
- Algorithme de hachage de mot de passe : **bcrypt** (10 rounds).
- Rôles : **ADMIN** et **USER**.
- Pour tester les endpoints protégés :
  1. Utilisez \`POST /api/auth/login\` (ex: \`admin@taskflow.dev\` / \`Admin123!\` ou \`sarah.diallo@taskflow.dev\` / \`User123!\`).
  2. Copiez le champ \`token\`.
  3. Cliquez sur le bouton vert **Authorize** en haut à droite et collez votre token (le préfixe \`Bearer\` est géré automatiquement).

### 📦 Modules Implémentés
- **Module A** : Authentification, profil et gestion des rôles (JWT, bcrypt).
- **Module B** : Gestion des projets et équipes (RBAC, assignation de membres).
- **Module C** : Gestion des tâches (Kanban, filtres multiples, recherche textuelle, pagination, tri).
- **Module D** : Tableau de bord & Métriques temps réel (calculs dynamiques des retards et avancements).
    `,
    contact: {
      name: 'TaskFlow Backend Engineering Team',
      email: 'aissatou.ba34@unchk.edu.sn',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Serveur REST TaskFlow (relatif au domaine actuel)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Saisissez votre token JWT pour accéder aux endpoints protégés.',
      },
    },
    schemas: {
      UserRole: {
        type: 'string',
        enum: ['ADMIN', 'USER'],
        example: 'USER',
      },
      SafeUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-sarah-002' },
          name: { type: 'string', example: 'Sarah Diallo' },
          email: { type: 'string', format: 'email', example: 'sarah.diallo@taskflow.dev' },
          role: { $ref: '#/components/schemas/UserRole' },
          avatar: { type: 'string', example: 'https://images.unsplash.com/...' },
          department: { type: 'string', example: 'Gestion de Projet' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterDto: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Fatou Ndiaye' },
          email: { type: 'string', format: 'email', example: 'fatou.ndiaye@taskflow.dev' },
          password: { type: 'string', minLength: 6, example: 'Secret2026!' },
          role: { $ref: '#/components/schemas/UserRole' },
          department: { type: 'string', example: 'Design & UX' },
        },
      },
      LoginDto: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@taskflow.dev' },
          password: { type: 'string', example: 'Admin123!' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Authentification réussie.' },
          user: { $ref: '#/components/schemas/SafeUser' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      ProjectMember: {
        type: 'object',
        properties: {
          userId: { type: 'string', example: 'usr-sarah-002' },
          role: { type: 'string', enum: ['OWNER', 'LEAD', 'MEMBER'], example: 'MEMBER' },
          joinedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/SafeUser' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'prj-taskflow-api' },
          title: { type: 'string', example: 'TaskFlow REST API & Swagger Core' },
          description: { type: 'string', example: 'Conception et déploiement...' },
          ownerId: { type: 'string', example: 'usr-admin-001' },
          status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'], example: 'ACTIVE' },
          members: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProjectMember' },
          },
          taskCount: { type: 'integer', example: 5 },
          completedTaskCount: { type: 'integer', example: 3 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProjectDto: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 3, example: 'Plateforme E-commerce B2B' },
          description: { type: 'string', example: 'Développement de la nouvelle boutique en ligne.' },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: { type: 'string', example: 'usr-mamadou-003' },
                role: { type: 'string', enum: ['MEMBER', 'LEAD'], example: 'MEMBER' },
              },
            },
          },
        },
      },
      TaskStatus: {
        type: 'string',
        enum: ['TODO', 'IN_PROGRESS', 'DONE'],
        example: 'IN_PROGRESS',
      },
      TaskPriority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        example: 'HIGH',
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'tsk-001' },
          projectId: { type: 'string', example: 'prj-taskflow-api' },
          projectTitle: { type: 'string', example: 'TaskFlow REST API' },
          title: { type: 'string', example: 'Implémenter le middleware d’authentification JWT' },
          description: { type: 'string', example: 'Vérifier la validité des tokens Bearer...' },
          status: { $ref: '#/components/schemas/TaskStatus' },
          priority: { $ref: '#/components/schemas/TaskPriority' },
          dueDate: { type: 'string', format: 'date-time', nullable: true, example: '2026-10-25T18:00:00.000Z' },
          assignedTo: { type: 'string', nullable: true, example: 'usr-mamadou-003' },
          assignee: { $ref: '#/components/schemas/SafeUser' },
          createdById: { type: 'string', example: 'usr-admin-001' },
          creator: { $ref: '#/components/schemas/SafeUser' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTaskDto: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 2, example: 'Tester les codes HTTP avec Jest et Supertest' },
          description: { type: 'string', example: 'Vérifier les codes 200, 201, 400, 401, 403, 404, 409' },
          status: { $ref: '#/components/schemas/TaskStatus' },
          priority: { $ref: '#/components/schemas/TaskPriority' },
          dueDate: { type: 'string', format: 'date-time', example: '2026-10-31T20:00:00.000Z' },
          assignedTo: { type: 'string', example: 'usr-aissatou-004' },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalProjects: { type: 'integer', example: 3 },
          totalTasks: { type: 'integer', example: 9 },
          completedTasks: { type: 'integer', example: 3 },
          inProgressTasks: { type: 'integer', example: 3 },
          todoTasks: { type: 'integer', example: 3 },
          overdueTasks: { type: 'integer', example: 2 },
          completionRate: { type: 'integer', example: 33 },
          statusBreakdown: {
            type: 'object',
            properties: {
              TODO: { type: 'integer', example: 3 },
              IN_PROGRESS: { type: 'integer', example: 3 },
              DONE: { type: 'integer', example: 3 },
            },
          },
          priorityBreakdown: {
            type: 'object',
            properties: {
              LOW: { type: 'integer', example: 1 },
              MEDIUM: { type: 'integer', example: 4 },
              HIGH: { type: 'integer', example: 4 },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Bad Request' },
          message: { type: 'string', example: 'Erreurs de validation des données fournies.' },
          details: { type: 'object' },
          code: { type: 'string', example: 'VALIDATION_FAILED' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Module A — Authentification & Utilisateurs'],
        summary: 'Inscrire un nouvel utilisateur',
        description: 'Crée un nouvel utilisateur avec mot de passe haché par bcrypt. Retourne l’utilisateur sécurisé (sans mot de passe) et un token JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterDto' },
            },
          },
        },
        responses: {
          201: {
            description: 'Utilisateur créé avec succès.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: {
            description: 'Données invalides (nom trop court, email invalide, mot de passe < 6 caractères).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          409: {
            description: 'Conflit: l’adresse email existe déjà.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Module A — Authentification & Utilisateurs'],
        summary: 'Authentifier un utilisateur',
        description: 'Vérifie les identifiants email + mot de passe (comparaison bcrypt) et délivre un token Bearer JWT valable 24h.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginDto' },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion réussie avec token JWT.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: {
            description: 'Champs manquants ou format invalide.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          401: {
            description: 'Identifiants incorrects.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Module A — Authentification & Utilisateurs'],
        summary: 'Consulter son profil',
        security: [{ bearerAuth: [] }],
        description: 'Retourne les informations du profil de l’utilisateur actuellement connecté via son token JWT.',
        responses: {
          200: {
            description: 'Profil récupéré.',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/SafeUser' } } } } },
          },
          401: { description: 'Non authentifié (token manquant ou invalide).' },
        },
      },
      patch: {
        tags: ['Module A — Authentification & Utilisateurs'],
        summary: 'Modifier son profil',
        security: [{ bearerAuth: [] }],
        description: 'Permet à l’utilisateur de mettre à jour son nom, son département, son avatar ou son mot de passe.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Aissatou Ba (Lead Full-Stack)' },
                  department: { type: 'string', example: 'Architecture & Cloud' },
                  password: { type: 'string', minLength: 6, example: 'NouveauPass2026!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profil mis à jour avec succès.' },
          400: { description: 'Données fournies invalides.' },
          401: { description: 'Non authentifié.' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Module A — Authentification & Utilisateurs'],
        summary: 'Lister les collaborateurs du système',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Recherche textuelle par nom ou email' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'USER'] }, description: 'Filtrer par rôle' },
        ],
        responses: {
          200: { description: 'Liste des utilisateurs (sans hash de mot de passe).' },
          401: { description: 'Non authentifié.' },
        },
      },
    },
    '/users/{id}/role': {
      patch: {
        tags: ['Module A — Authentification & Utilisateurs'],
        summary: 'Modifier le rôle d’un utilisateur (ADMIN uniquement)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { $ref: '#/components/schemas/UserRole' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rôle modifié avec succès.' },
          403: { description: 'Accès refusé. Privilèges ADMIN requis.' },
          404: { description: 'Utilisateur introuvable.' },
        },
      },
    },
    '/users/{id}': {
      delete: {
        tags: ['Module A — Authentification & Utilisateurs'],
        summary: 'Supprimer un utilisateur (ADMIN uniquement)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Utilisateur supprimé.' },
          400: { description: 'Impossible de supprimer son propre compte.' },
          403: { description: 'Privilèges ADMIN requis.' },
          404: { description: 'Utilisateur introuvable.' },
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Lister les projets accessibles',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Recherche par titre ou description' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] }, description: 'Filtrer par statut' },
        ],
        responses: {
          200: {
            description: 'Liste des projets accessibles.',
            content: { 'application/json': { schema: { type: 'object', properties: { projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } } },
          },
          401: { description: 'Non authentifié.' },
        },
      },
      post: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Créer un projet',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectDto' },
            },
          },
        },
        responses: {
          201: { description: 'Projet créé avec succès.' },
          400: { description: 'Validation échouée.' },
          401: { description: 'Non authentifié.' },
        },
      },
    },
    '/projects/{id}': {
      get: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Consulter les détails d’un projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Détails du projet avec membres et statistiques.' },
          403: { description: 'Accès refusé: vous ne faites pas partie de l’équipe.' },
          404: { description: 'Projet introuvable.' },
        },
      },
      patch: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Modifier un projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Projet mis à jour avec succès.' },
          403: { description: 'Seul le propriétaire ou un ADMIN peut modifier ce projet.' },
          404: { description: 'Projet introuvable.' },
        },
      },
      delete: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Supprimer un projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Projet et ses tâches supprimés avec succès.' },
          403: { description: 'Seul le propriétaire ou un ADMIN peut supprimer ce projet.' },
          404: { description: 'Projet introuvable.' },
        },
      },
    },
    '/projects/{id}/members': {
      get: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Lister les membres d’un projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Liste des membres avec rôles et profils.' },
          403: { description: 'Accès refusé.' },
          404: { description: 'Projet introuvable.' },
        },
      },
      post: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Ajouter un membre à un projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', example: 'usr-mamadou-003' },
                  role: { type: 'string', enum: ['MEMBER', 'LEAD'], default: 'MEMBER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Membre ajouté avec succès.' },
          403: { description: 'Seul le propriétaire ou un ADMIN peut ajouter des membres.' },
          404: { description: 'Projet ou utilisateur introuvable.' },
        },
      },
    },
    '/projects/{id}/members/{userId}': {
      delete: {
        tags: ['Module B — Gestion des projets'],
        summary: 'Retirer un membre d’un projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Membre retiré avec succès.' },
          400: { description: 'Le propriétaire du projet ne peut pas être retiré.' },
          403: { description: 'Permission insuffisante.' },
          404: { description: 'Projet introuvable.' },
        },
      },
    },
    '/projects/{id}/tasks': {
      post: {
        tags: ['Module C — Gestion des tâches'],
        summary: 'Créer une tâche dans le projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskDto' },
            },
          },
        },
        responses: {
          201: { description: 'Tâche créée avec succès.' },
          400: { description: 'Validation échouée ou assigné invalide.' },
          403: { description: 'Vous ne faites pas partie de l’équipe de ce projet.' },
          404: { description: 'Projet introuvable.' },
        },
      },
      get: {
        tags: ['Module C — Gestion des tâches'],
        summary: 'Lister les tâches d’un projet',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/TaskStatus' } },
          { name: 'priority', in: 'query', schema: { $ref: '#/components/schemas/TaskPriority' } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'dueDate'], default: 'createdAt' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Tâches filtrées et paginées du projet.' },
          403: { description: 'Accès refusé au projet.' },
          404: { description: 'Projet introuvable.' },
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Module C — Gestion des tâches'],
        summary: 'Lister toutes les tâches accessibles',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'query', schema: { type: 'string' }, description: 'Filtrer par projet' },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/TaskStatus' } },
          { name: 'priority', in: 'query', schema: { $ref: '#/components/schemas/TaskPriority' } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'dueDate'], default: 'createdAt' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Tâches récupérées avec pagination et métadonnées.' },
          401: { description: 'Non authentifié.' },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['Module C — Gestion des tâches'],
        summary: 'Consulter une tâche',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Détails de la tâche.' },
          403: { description: 'Accès refusé.' },
          404: { description: 'Tâche introuvable.' },
        },
      },
      patch: {
        tags: ['Module C — Gestion des tâches'],
        summary: 'Modifier une tâche',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { $ref: '#/components/schemas/TaskStatus' },
                  priority: { $ref: '#/components/schemas/TaskPriority' },
                  dueDate: { type: 'string', format: 'date-time' },
                  assignedTo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tâche mise à jour avec succès.' },
          400: { description: 'Données invalides.' },
          403: { description: 'Accès refusé.' },
          404: { description: 'Tâche introuvable.' },
        },
      },
      delete: {
        tags: ['Module C — Gestion des tâches'],
        summary: 'Supprimer une tâche',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Tâche supprimée avec succès.' },
          403: { description: 'Accès refusé.' },
          404: { description: 'Tâche introuvable.' },
        },
      },
    },
    '/dashboard/stats': {
      get: {
        tags: ['Module D — Tableau de bord & Statistiques'],
        summary: 'Consulter les statistiques utilisateur',
        security: [{ bearerAuth: [] }],
        description: 'Calcule dynamiquement à partir de la base de données : total des projets accessibles, total des tâches, tâches terminées, tâches en cours, tâches en retard (dueDate dépassée) et ventilation par statut/priorité.',
        responses: {
          200: {
            description: 'Statistiques calculées avec succès.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStats' } } },
          },
          401: { description: 'Non authentifié.' },
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Module D — Tableau de bord & Statistiques'],
        summary: 'Consulter les statistiques globales d’administration (ADMIN uniquement)',
        security: [{ bearerAuth: [] }],
        description: 'Vue d’ensemble consolidée de tous les utilisateurs, projets, tâches et métriques du serveur Node.js.',
        responses: {
          200: { description: 'Statistiques globales d’administration.' },
          403: { description: 'Accès refusé. Privilèges ADMIN requis.' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Système & Monitoring'],
        summary: 'Vérification de la santé de l’API',
        responses: {
          200: { description: 'API fonctionnelle.' },
        },
      },
    },
    '/reset-demo': {
      post: {
        tags: ['Système & Monitoring'],
        summary: 'Réinitialiser le jeu de données de référence',
        description: 'Permet aux évaluateurs de remettre instantanément la base de données dans son état initial.',
        responses: {
          200: { description: 'Base réinitialisée.' },
        },
      },
    },
  },
};
