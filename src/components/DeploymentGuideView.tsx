import React, { useState } from 'react';
import {
  Cloud,
  Server,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const DeploymentGuideView: React.FC = () => {
  const [copiedRenderYaml, setCopiedRenderYaml] = useState(false);
  const [copiedVercelJson, setCopiedVercelJson] = useState(false);

  const renderYamlContent = `services:
  - type: web
    name: taskflow-backend
    env: node
    plan: free
    region: frankfurt
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: JWT_SECRET
        generateValue: true`;

  const vercelJsonContent = `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://taskflow-backend.onrender.com/api/$1"
    },
    {
      "source": "/api-docs",
      "destination": "https://taskflow-backend.onrender.com/api-docs"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  return (
    <div className="space-y-6 text-white">
      {/* Header bar */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-black uppercase tracking-wider">
            Consigne Déploiement : Render & Vercel
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Guide de Déploiement en Production (Render & Vercel)
        </h1>
        <p className="text-xs text-neutral-400">
          Instructions détaillées et fichiers de configuration pour héberger l’API REST sur Render et le Backoffice sur Vercel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Render Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
                  <Server className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">1. Déploiement Backend sur Render</h3>
                  <p className="text-[11px] text-neutral-400">Hébergement du service Web Node.js / Express & Swagger</p>
                </div>
              </div>
              <a
                href="https://dashboard.render.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1"
              >
                <span>Render.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-3 text-xs text-neutral-300 list-decimal pl-4 leading-relaxed">
              <li>
                Connectez-vous sur <strong className="text-white">Render.com</strong> et créez un <strong className="text-yellow-400">Web Service</strong>.
              </li>
              <li>
                Sélectionnez votre repository GitHub.
              </li>
              <li>
                Paramètres de build :
                <ul className="list-disc pl-4 mt-1 text-neutral-400 space-y-0.5">
                  <li><strong>Environment :</strong> Node</li>
                  <li><strong>Build Command :</strong> <code className="text-yellow-300">npm install && npm run build</code></li>
                  <li><strong>Start Command :</strong> <code className="text-yellow-300">npm start</code></li>
                  <li><strong>Plan Type :</strong> Free</li>
                </ul>
              </li>
              <li>
                Ajoutez les variables d'environnement sous <strong className="text-white">Environment Variables</strong> :
                <ul className="list-disc pl-4 mt-1 text-neutral-400 space-y-0.5">
                  <li><code>NODE_ENV=production</code></li>
                  <li><code>PORT=3000</code></li>
                  <li><code>JWT_SECRET=&lt;votre-cle-secrete-production&gt;</code></li>
                </ul>
              </li>
              <li>
                Cliquez sur <strong>Create Web Service</strong>. Swagger UI sera disponible sur <code>https://taskflow-backend.onrender.com/api-docs</code>.
              </li>
            </ol>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
                <span>Fichier d'infrastructure : render.yaml</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(renderYamlContent);
                    setCopiedRenderYaml(true);
                    setTimeout(() => setCopiedRenderYaml(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-yellow-400 hover:text-yellow-300 font-bold"
                >
                  {copiedRenderYaml ? <Check className="w-3 h-3 text-yellow-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRenderYaml ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black rounded-xl border border-neutral-800 text-[10px] font-mono text-yellow-300 overflow-x-auto">
                {renderYamlContent}
              </pre>
            </div>
          </div>
        </div>

        {/* Vercel Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">2. Déploiement Backoffice sur Vercel</h3>
                  <p className="text-[11px] text-neutral-400">Hébergement du frontend React / Vite</p>
                </div>
              </div>
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white hover:text-neutral-300 font-bold flex items-center gap-1"
              >
                <span>Vercel.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-3 text-xs text-neutral-300 list-decimal pl-4 leading-relaxed">
              <li>
                Rendez-vous sur <strong className="text-white">Vercel.com</strong> et cliquez sur <strong className="text-white">New Project</strong>.
              </li>
              <li>
                Importez le repository Git.
              </li>
              <li>
                Paramètres de build :
                <ul className="list-disc pl-4 mt-1 text-neutral-400 space-y-0.5">
                  <li><strong>Framework Preset :</strong> Vite</li>
                  <li><strong>Build Command :</strong> <code className="text-yellow-300">npm run build</code></li>
                  <li><strong>Output Directory :</strong> <code className="text-yellow-300">dist</code></li>
                </ul>
              </li>
              <li>
                Ajoutez la variable d'environnement :
                <ul className="list-disc pl-4 mt-1 text-neutral-400 space-y-0.5">
                  <li><code>VITE_API_URL=https://&lt;votre-app&gt;.onrender.com</code></li>
                </ul>
              </li>
              <li>
                Cliquez sur <strong>Deploy</strong>. Vercel gère le routage SPA grâce au fichier <code>vercel.json</code>.
              </li>
            </ol>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
                <span>Fichier de routage SPA : vercel.json</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(vercelJsonContent);
                    setCopiedVercelJson(true);
                    setTimeout(() => setCopiedVercelJson(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-yellow-400 hover:text-yellow-300 font-bold"
                >
                  {copiedVercelJson ? <Check className="w-3 h-3 text-yellow-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedVercelJson ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black rounded-xl border border-neutral-800 text-[10px] font-mono text-white overflow-x-auto">
                {vercelJsonContent}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Production Security & Verification Checklist */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-yellow-400" />
          <span>Grille de Contrôle Finale pour l'Évaluation</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
          <div className="flex items-start gap-2 p-3 bg-black rounded-xl border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">API REST & Express :</strong> Architecture modulaire par routes (/api/auth, /api/users, /api/projects, /api/tasks, /api/dashboard).
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-black rounded-xl border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Sécurité & JWT :</strong> Algorithme bcrypt avec salt, aucune exposition de hash, middleware Bearer JWT, permissions RBAC (ADMIN/USER).
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-black rounded-xl border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Swagger UI & OpenAPI :</strong> Spécification 3.0 complète sur /api-docs avec test direct des routes authentifiées après saisie du token.
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-black rounded-xl border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Backoffice Administrateur :</strong> Interface complète pour créer/modifier projets, membres, tâches, assignations, statuts, et suite de 14 tests automatisés.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
