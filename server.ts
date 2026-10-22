import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './server/swagger.js';

import authRouter from './server/routes/auth.js';
import usersRouter from './server/routes/users.js';
import projectsRouter from './server/routes/projects.js';
import tasksRouter from './server/routes/tasks.js';
import dashboardRouter from './server/routes/dashboard.js';
import systemRouter from './server/routes/system.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent browser/proxy caching on dynamic API routes
app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Swagger OpenAPI 3.0 Documentation UI & JSON spec
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { background-color: #000000; border-bottom: 2px solid #facc15; }
      .swagger-ui .topbar .topbar-wrapper a { content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='30' viewBox='0 0 120 30'%3E%3Ctext x='0' y='22' font-family='sans-serif' font-weight='900' font-size='20' fill='%23facc15'%3ETask%3C/text%3E%3Ctext x='48' y='22' font-family='sans-serif' font-weight='900' font-size='20' fill='%23ffffff'%3EFlow%3C/text%3E%3C/svg%3E"); }
      .swagger-ui .info { margin: 25px 0; }
      .swagger-ui .btn.authorize { background-color: #facc15; color: #000000; border-color: #facc15; font-weight: bold; }
    `,
    customSiteTitle: 'TaskFlow API — Documentation Swagger OpenAPI',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  })
);

// REST API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api', dashboardRouter);
app.use('/api', systemRouter);

// Fallback for unmatched API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `L'endpoint API ${req.method} ${req.path} n'existe pas. Consultez la documentation Swagger sur /api-docs.`,
  });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.name || 'Error',
    message: err.message || 'Une erreur inattendue est survenue sur le serveur.',
    timestamp: new Date().toISOString(),
  });
});

// Full-stack Vite integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TaskFlow Backend & Backoffice démarré sur http://localhost:${PORT}`);
    console.log(`📖 Swagger OpenAPI Documentation disponible sur http://localhost:${PORT}/api-docs`);
    console.log(`⚡ Schéma OpenAPI JSON disponible sur http://localhost:${PORT}/api-docs.json`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
