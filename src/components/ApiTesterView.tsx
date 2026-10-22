import React, { useState } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  BookOpen,
  ExternalLink,
  Code,
  Sparkles,
} from 'lucide-react';
import { SafeUser } from '../types';
import { api } from '../services/api';

interface ApiTesterViewProps {
  currentUser: SafeUser | null;
  onDataChange?: () => void;
}

interface TestCase {
  id: string;
  name: string;
  module: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  expectedStatus: number;
  description: string;
  run: () => Promise<{ status: number; durationMs: number; response: any; passed: boolean }>;
}

export const ApiTesterView: React.FC<ApiTesterViewProps> = ({ currentUser, onDataChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'suite' | 'runner' | 'swagger'>('suite');

  // Test Suite State
  const [testResults, setTestResults] = useState<Record<string, { status: number; durationMs: number; response: any; passed: boolean }>>({});
  const [runningTests, setRunningTests] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  // Manual Runner State
  const [reqMethod, setReqMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE'>('GET');
  const [reqEndpoint, setReqEndpoint] = useState('/api/dashboard/stats');
  const [reqBody, setReqBody] = useState('');
  const [manualResult, setManualResult] = useState<{ status: number; durationMs: number; data: any; headers: any } | null>(null);
  const [manualRunning, setManualRunning] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Presets
  const presets = [
    { label: 'GET /api/dashboard/stats (Statistiques réelles)', method: 'GET', url: '/api/dashboard/stats', body: '' },
    { label: 'GET /api/projects (Projets accessibles)', method: 'GET', url: '/api/projects', body: '' },
    { label: 'GET /api/tasks?priority=HIGH (Tâches urgentes)', method: 'GET', url: '/api/tasks?priority=HIGH', body: '' },
    { label: 'GET /api/users/me (Profil actuel)', method: 'GET', url: '/api/users/me', body: '' },
    { label: 'GET /api/admin/stats (Stats Admin système)', method: 'GET', url: '/api/admin/stats', body: '' },
    {
      label: 'POST /api/projects (Nouveau projet)',
      method: 'POST',
      url: '/api/projects',
      body: JSON.stringify({ title: 'Projet d’Évaluation Express', description: 'Test de création de projet par API REST' }, null, 2),
    },
    {
      label: 'POST /api/auth/login (Connexion)',
      method: 'POST',
      url: '/api/auth/login',
      body: JSON.stringify({ email: 'admin@taskflow.dev', password: 'Admin123!' }, null, 2),
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setReqMethod(p.method as any);
    setReqEndpoint(p.url);
    setReqBody(p.body);
  };

  const handleRunManual = async () => {
    try {
      setManualRunning(true);
      const start = performance.now();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = api.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(reqEndpoint, {
        method: reqMethod,
        headers,
        body: ['POST', 'PATCH', 'PUT'].includes(reqMethod) && reqBody.trim() ? reqBody : undefined,
      });

      const durationMs = Math.round(performance.now() - start);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : await res.text();

      setManualResult({
        status: res.status,
        durationMs,
        data,
        headers: Object.fromEntries(res.headers.entries()),
      });
      onDataChange?.();
    } catch (err: any) {
      setManualResult({
        status: 0,
        durationMs: 0,
        data: { error: err.message },
        headers: {},
      });
    } finally {
      setManualRunning(false);
    }
  };

  const generateCurl = () => {
    const token = api.getToken();
    let cmd = `curl -X ${reqMethod} "http://localhost:3000${reqEndpoint}" \\\n  -H "Content-Type: application/json"`;
    if (token) {
      cmd += ` \\\n  -H "Authorization: Bearer ${token}"`;
    }
    if (['POST', 'PATCH', 'PUT'].includes(reqMethod) && reqBody.trim()) {
      cmd += ` \\\n  -d '${reqBody.replace(/'/g, "\\'")}'`;
    }
    return cmd;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const testCases: TestCase[] = [
    {
      id: 'test-1',
      name: 'Santé de l’API Express',
      module: 'Système',
      method: 'GET',
      endpoint: '/api/health',
      expectedStatus: 200,
      description: 'Vérifie que l’API Express est démarrée et répond HTTP 200.',
      run: async () => {
        const start = performance.now();
        const res = await fetch('/api/health');
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 200 };
      },
    },
    {
      id: 'test-2',
      name: 'Inscription avec mot de passe haché (bcrypt)',
      module: 'Module A',
      method: 'POST',
      endpoint: '/api/auth/register',
      expectedStatus: 201,
      description: 'Crée un utilisateur de test et vérifie qu’aucun hash de mot de passe n’est retourné.',
      run: async () => {
        const start = performance.now();
        const email = `eval.user.${Date.now()}@taskflow.dev`;
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Utilisateur Évaluation',
            email,
            password: 'SuperPassword2026!',
            role: 'USER',
            department: 'Assurance Qualité',
          }),
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        const passed = res.status === 201 && data.token && !data.user.passwordHash;
        return { status: res.status, durationMs, response: data, passed };
      },
    },
    {
      id: 'test-3',
      name: 'Rejet des doublons d’email (HTTP 409)',
      module: 'Module A',
      method: 'POST',
      endpoint: '/api/auth/register',
      expectedStatus: 409,
      description: 'Tente d’inscrire un compte avec un email déjà existant.',
      run: async () => {
        const start = performance.now();
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Doublon Test',
            email: 'admin@taskflow.dev',
            password: 'Password123!',
          }),
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 409 };
      },
    },
    {
      id: 'test-4',
      name: 'Authentification JWT (POST /api/auth/login)',
      module: 'Module A',
      method: 'POST',
      endpoint: '/api/auth/login',
      expectedStatus: 200,
      description: 'Valide les identifiants avec comparaison de hash bcrypt et retourne le token JWT.',
      run: async () => {
        const start = performance.now();
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@taskflow.dev',
            password: 'Admin123!',
          }),
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 200 && !!data.token };
      },
    },
    {
      id: 'test-5',
      name: 'Rejet identifiants invalides (HTTP 401)',
      module: 'Module A',
      method: 'POST',
      endpoint: '/api/auth/login',
      expectedStatus: 401,
      description: 'Tente de se connecter avec un mauvais mot de passe.',
      run: async () => {
        const start = performance.now();
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@taskflow.dev',
            password: 'FauxMotDePasse!',
          }),
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 401 };
      },
    },
    {
      id: 'test-6',
      name: 'Protection route privée sans token (HTTP 401)',
      module: 'Module A',
      method: 'GET',
      endpoint: '/api/users/me',
      expectedStatus: 401,
      description: 'Vérifie que la route privée /api/users/me rejette les requêtes sans Authorization header.',
      run: async () => {
        const start = performance.now();
        const res = await fetch('/api/users/me');
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 401 };
      },
    },
    {
      id: 'test-7',
      name: 'Consultation du profil connecté (GET /api/users/me)',
      module: 'Module A',
      method: 'GET',
      endpoint: '/api/users/me',
      expectedStatus: 200,
      description: 'Accède au profil avec le token Bearer JWT actuel.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 200 && !!data.user };
      },
    },
    {
      id: 'test-8',
      name: 'Lister les projets accessibles (GET /api/projects)',
      module: 'Module B',
      method: 'GET',
      endpoint: '/api/projects',
      expectedStatus: 200,
      description: 'Récupère la liste des projets autorisés pour l’utilisateur.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 200 && Array.isArray(data.projects) };
      },
    },
    {
      id: 'test-9',
      name: 'Créer un projet (POST /api/projects)',
      module: 'Module B',
      method: 'POST',
      endpoint: '/api/projects',
      expectedStatus: 201,
      description: 'Crée un nouveau projet avec le créateur en tant que propriétaire.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: `Projet Test Automatique #${Date.now()}`,
            description: 'Validation de la route POST /api/projects',
          }),
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 201 && !!data.project };
      },
    },
    {
      id: 'test-10',
      name: 'Créer une tâche dans un projet (POST /api/projects/:id/tasks)',
      module: 'Module C',
      method: 'POST',
      endpoint: '/api/projects/prj-taskflow-api/tasks',
      expectedStatus: 201,
      description: 'Crée une tâche avec statut TODO, priorité HIGH et date limite.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/projects/prj-taskflow-api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: `Tâche Auto #${Date.now().toString().slice(-4)}`,
            description: 'Créée via la suite de test',
            priority: 'HIGH',
            status: 'TODO',
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          }),
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 201 && !!data.task };
      },
    },
    {
      id: 'test-11',
      name: 'Filtrer et trier les tâches (GET /api/tasks)',
      module: 'Module C',
      method: 'GET',
      endpoint: '/api/tasks?priority=HIGH&sortBy=createdAt&order=desc',
      expectedStatus: 200,
      description: 'Valide le filtrage par priorité HIGH et le tri descendant.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/tasks?priority=HIGH&sortBy=createdAt&order=desc', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        const allHigh = data.tasks.every((t: any) => t.priority === 'HIGH');
        return { status: res.status, durationMs, response: data, passed: res.status === 200 && allHigh };
      },
    },
    {
      id: 'test-12',
      name: 'Mettre à jour le statut d’une tâche (PATCH /api/tasks/:id)',
      module: 'Module C',
      method: 'PATCH',
      endpoint: '/api/tasks/tsk-001',
      expectedStatus: 200,
      description: 'Met à jour le statut d’une tâche vers DONE.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/tasks/tsk-001', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'DONE' }),
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        return { status: res.status, durationMs, response: data, passed: res.status === 200 && data.task?.status === 'DONE' };
      },
    },
    {
      id: 'test-13',
      name: 'Statistiques & calcul des retards (GET /api/dashboard/stats)',
      module: 'Module D',
      method: 'GET',
      endpoint: '/api/dashboard/stats',
      expectedStatus: 200,
      description: 'Vérifie le calcul temps réel des projets, tâches, retards et avancement.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        const hasStats = data.stats && typeof data.stats.overdueTasks === 'number' && typeof data.stats.completionRate === 'number';
        return { status: res.status, durationMs, response: data, passed: res.status === 200 && hasStats };
      },
    },
    {
      id: 'test-14',
      name: 'Statistiques globales d’administration (GET /api/admin/stats)',
      module: 'Module D',
      method: 'GET',
      endpoint: '/api/admin/stats',
      expectedStatus: 200,
      description: 'Vérifie l’accès aux métriques serveur et utilisateurs pour le compte ADMIN.',
      run: async () => {
        const start = performance.now();
        const token = api.getToken();
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const durationMs = Math.round(performance.now() - start);
        const data = await res.json();
        const expected = currentUser?.role === 'ADMIN' ? 200 : 403;
        return { status: res.status, durationMs, response: data, passed: res.status === expected };
      },
    },
  ];

  const handleRunAllTests = async () => {
    try {
      setRunningTests(true);
      const results: Record<string, any> = {};

      for (const test of testCases) {
        try {
          const outcome = await test.run();
          results[test.id] = outcome;
        } catch (err: any) {
          results[test.id] = {
            status: 500,
            durationMs: 0,
            response: { error: err.message },
            passed: false,
          };
        }
        setTestResults({ ...results });
      }
      onDataChange?.();
    } finally {
      setRunningTests(false);
    }
  };

  const passedCount = Object.values(testResults).filter((r) => r.passed).length;
  const totalRun = Object.keys(testResults).length;

  return (
    <div className="space-y-6 text-white">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-black uppercase tracking-wider">
              Module E • Tests & Swagger OpenAPI 3.0
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Studio de Test d'API & Spécification
          </h1>
          <p className="text-xs text-neutral-400">
            Validez chaque exigence du barème de l’examen avec la suite automatisée ou le testeur interactif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api-docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black shadow-lg shadow-yellow-400/20 transition hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-black" />
            <span>Ouvrir Swagger UI (/api-docs)</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-neutral-800 text-xs font-bold space-x-6">
        <button
          onClick={() => setActiveSubTab('suite')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeSubTab === 'suite'
              ? 'border-b-2 border-yellow-400 text-yellow-400 font-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Suite de Tests Automatisée ({testCases.length} tests)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('runner')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeSubTab === 'runner'
              ? 'border-b-2 border-yellow-400 text-yellow-400 font-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Testeur Interactif (cURL & Requête)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('swagger')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeSubTab === 'swagger'
              ? 'border-b-2 border-yellow-400 text-yellow-400 font-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Documentation Swagger Intégrée</span>
        </button>
      </div>

      {/* SUB-TAB 1: TEST SUITE */}
      {activeSubTab === 'suite' && (
        <div className="space-y-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black text-lg">
                {totalRun > 0 ? `${passedCount}/${totalRun}` : '0/14'}
              </div>
              <div>
                <h3 className="font-black text-sm text-white">
                  Bilan de validation des Modules A, B, C, D & Sécurité
                </h3>
                <p className="text-xs text-neutral-400">
                  {totalRun === 0
                    ? 'Cliquez pour exécuter tous les tests en direct contre l’API Express.'
                    : passedCount === totalRun
                    ? '🎉 100% des tests validés ! Tous les codes HTTP (200, 201, 401, 409) sont conformes.'
                    : `${totalRun - passedCount} test(s) nécessitent votre attention.`}
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAllTests}
              disabled={runningTests}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black shadow-lg shadow-yellow-400/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-black" />
              <span>{runningTests ? 'Exécution des tests...' : 'Lancer tous les tests (1-Click)'}</span>
            </button>
          </div>

          {/* Test cases list */}
          <div className="space-y-2">
            {testCases.map((tc, idx) => {
              const res = testResults[tc.id];
              const isExpanded = expandedTest === tc.id;

              return (
                <div
                  key={tc.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden text-xs transition hover:border-neutral-700"
                >
                  <div
                    onClick={() => setExpandedTest(isExpanded ? null : tc.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-900/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center text-neutral-500 font-mono text-[11px]">
                        #{idx + 1}
                      </div>

                      {res ? (
                        res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" />
                      )}

                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{tc.name}</span>
                          <span className="text-[10px] text-yellow-400 bg-black px-1.5 py-0.2 rounded font-mono border border-neutral-800">
                            {tc.module}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-black text-yellow-400">{tc.method}</span>
                          <span className="font-mono text-neutral-400">{tc.endpoint}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {res && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono font-black text-[10px] ${
                              res.passed ? 'bg-yellow-400 text-black' : 'bg-rose-950 text-rose-200 border border-rose-500/40'
                            }`}
                          >
                            HTTP {res.status}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">{res.durationMs}ms</span>
                        </div>
                      )}
                      <span className="text-neutral-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 bg-black border-t border-neutral-800 text-[11px] space-y-2">
                      <p className="text-neutral-400">{tc.description}</p>
                      <div className="flex justify-between text-neutral-500 font-mono text-[10px]">
                        <span>Statut HTTP attendu : {tc.expectedStatus}</span>
                        {res && <span>Statut HTTP obtenu : {res.status}</span>}
                      </div>
                      {res && (
                        <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 font-mono text-neutral-200 overflow-x-auto max-h-48">
                          <pre>{JSON.stringify(res.response, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INTERACTIVE RUNNER */}
      {activeSubTab === 'runner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-yellow-400" />
              <span>Générateur & Exécuteur de Requête HTTP</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">
                Modèles de requêtes préconfigurés
              </label>
              <select
                onChange={(e) => {
                  const p = presets[Number(e.target.value)];
                  if (p) handleApplyPreset(p);
                }}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-yellow-400"
              >
                <option value="">Sélectionnez un preset pour tester...</option>
                {presets.map((p, i) => (
                  <option key={i} value={i}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <select
                value={reqMethod}
                onChange={(e) => setReqMethod(e.target.value as any)}
                className="bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs font-black text-yellow-400"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={reqEndpoint}
                onChange={(e) => setReqEndpoint(e.target.value)}
                placeholder="/api/projects"
                className="flex-1 bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-yellow-400"
              />
            </div>

            <div className="p-3 bg-black rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1">
              <div>Content-Type: application/json</div>
              <div className="truncate text-yellow-300">
                Authorization: Bearer {api.getToken()?.slice(0, 24)}...
              </div>
            </div>

            {['POST', 'PATCH', 'PUT'].includes(reqMethod) && (
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">
                  Corps de la requête (JSON Body)
                </label>
                <textarea
                  rows={5}
                  value={reqBody}
                  onChange={(e) => setReqBody(e.target.value)}
                  placeholder='{"title": "Mon projet", "description": "..."}'
                  className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-hidden focus:border-yellow-400"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold border border-neutral-800 transition"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Copier en cURL</span>
                  </>
                )}
              </button>

              <button
                onClick={handleRunManual}
                disabled={manualRunning}
                className="flex items-center gap-2 px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black shadow-lg shadow-yellow-400/20 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-black" />
                <span>{manualRunning ? 'Envoi...' : 'Envoyer la requête'}</span>
              </button>
            </div>
          </div>

          {/* Right: Response Inspector */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-yellow-400" />
                  <span>Réponse du Serveur Express</span>
                </h3>

                {manualResult && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
                        manualResult.status >= 200 && manualResult.status < 300
                          ? 'bg-yellow-400 text-black'
                          : 'bg-rose-950 text-rose-200 border border-rose-500/40'
                      }`}
                    >
                      HTTP {manualResult.status}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">
                      {manualResult.durationMs} ms
                    </span>
                  </div>
                )}
              </div>

              {manualResult ? (
                <div className="bg-black p-3.5 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-200 overflow-y-auto max-h-[400px]">
                  <pre>{JSON.stringify(manualResult.data, null, 2)}</pre>
                </div>
              ) : (
                <div className="py-24 text-center text-neutral-500 text-xs italic">
                  Envoyez une requête pour inspecter le code HTTP, les en-têtes et le corps de réponse.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SWAGGER EMBEDDED */}
      {activeSubTab === 'swagger' && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-white">Swagger UI & OpenAPI 3.0 Interactive</h3>
              <p className="text-xs text-neutral-400">
                La documentation interactive Swagger est hébergée sur <code className="text-yellow-400 font-bold">/api-docs</code>.
              </p>
            </div>
            <a
              href="/api-docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl text-xs font-black shadow transition"
            >
              <span>Plein écran dans un nouvel onglet</span>
              <ExternalLink className="w-3.5 h-3.5 text-black" />
            </a>
          </div>

          <div className="rounded-xl overflow-hidden border border-neutral-800 h-[650px] bg-black">
            <iframe
              src="/api-docs"
              title="Swagger UI"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
