import { SafeUser, Project, Task, DashboardStats, AdminStats, TaskStatus, TaskPriority } from '../types';

const TOKEN_KEY = 'taskflow_jwt_token';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const currentToken = this.getToken();
    if (currentToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    const response = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = (data && typeof data === 'object' && (data.message || data.error))
        ? (data.message || data.error)
        : `Erreur HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg) as any;
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  // --- Auth & Users ---
  public async login(email: string, password: string): Promise<{ user: SafeUser; token: string; message: string }> {
    const res = await this.request<{ user: SafeUser; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'USER';
    department?: string;
  }): Promise<{ user: SafeUser; token: string; message: string }> {
    const res = await this.request<{ user: SafeUser; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: SafeUser }> {
    return this.request<{ user: SafeUser }>('/api/users/me');
  }

  public async updateMe(payload: { name?: string; department?: string; password?: string; avatar?: string }): Promise<{ user: SafeUser; message: string }> {
    return this.request<{ user: SafeUser; message: string }>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async getUsers(query?: { search?: string; role?: string }): Promise<{ users: SafeUser[]; total: number }> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.role) params.append('role', query.role);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ users: SafeUser[]; total: number }>(`/api/users${qs}`);
  }

  public async updateUserRole(userId: string, role: 'ADMIN' | 'USER'): Promise<{ user: SafeUser; message: string }> {
    return this.request<{ user: SafeUser; message: string }>(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  public async deleteUser(userId: string): Promise<{ message: string; deletedUserId: string }> {
    return this.request<{ message: string; deletedUserId: string }>(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // --- Projects ---
  public async getProjects(query?: { search?: string; status?: string }): Promise<{ projects: Project[]; total: number }> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ projects: Project[]; total: number }>(`/api/projects${qs}`);
  }

  public async getProject(id: string): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/api/projects/${id}`);
  }

  public async createProject(payload: {
    title: string;
    description: string;
    members?: { userId: string; role?: 'MEMBER' | 'LEAD' }[];
  }): Promise<{ project: Project; message: string }> {
    return this.request<{ project: Project; message: string }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateProject(
    id: string,
    payload: { title?: string; description?: string; status?: string }
  ): Promise<{ project: Project; message: string }> {
    return this.request<{ project: Project; message: string }>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteProject(id: string): Promise<{ message: string; deletedProjectId: string }> {
    return this.request<{ message: string; deletedProjectId: string }>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  public async addMember(
    projectId: string,
    userId: string,
    role: 'MEMBER' | 'LEAD' = 'MEMBER'
  ): Promise<{ project: Project; message: string }> {
    return this.request<{ project: Project; message: string }>(`/api/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  public async removeMember(projectId: string, userId: string): Promise<{ project: Project; message: string }> {
    return this.request<{ project: Project; message: string }>(`/api/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // --- Tasks ---
  public async getTasks(query?: {
    projectId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedTo?: string;
    search?: string;
    sortBy?: 'createdAt' | 'dueDate';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (query?.projectId) params.append('projectId', query.projectId);
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);
    if (query?.assignedTo) params.append('assignedTo', query.assignedTo);
    if (query?.search) params.append('search', query.search);
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.order) params.append('order', query.order);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ tasks: Task[]; total: number; page: number; totalPages: number }>(`/api/tasks${qs}`);
  }

  public async getProjectTasks(
    projectId: string,
    query?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string;
      search?: string;
      sortBy?: 'createdAt' | 'dueDate';
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<{ tasks: Task[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);
    if (query?.assignedTo) params.append('assignedTo', query.assignedTo);
    if (query?.search) params.append('search', query.search);
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.order) params.append('order', query.order);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ tasks: Task[]; total: number; page: number; totalPages: number }>(`/api/projects/${projectId}/tasks${qs}`);
  }

  public async createTask(
    projectId: string,
    payload: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string | null;
      assignedTo?: string | null;
    }
  ): Promise<{ task: Task; message: string }> {
    return this.request<{ task: Task; message: string }>(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getTask(id: string): Promise<{ task: Task }> {
    return this.request<{ task: Task }>(`/api/tasks/${id}`);
  }

  public async updateTask(
    id: string,
    payload: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string | null;
      assignedTo?: string | null;
    }
  ): Promise<{ task: Task; message: string }> {
    return this.request<{ task: Task; message: string }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteTask(id: string): Promise<{ message: string; deletedTaskId: string }> {
    return this.request<{ message: string; deletedTaskId: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Stats ---
  public async getDashboardStats(): Promise<{ stats: DashboardStats; message: string; calculatedAt: string }> {
    return this.request<{ stats: DashboardStats; message: string; calculatedAt: string }>('/api/dashboard/stats');
  }

  public async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/api/admin/stats');
  }

  // --- System ---
  public async getHealth(): Promise<{ status: string; version: string; serverTime: string }> {
    return this.request<{ status: string; version: string; serverTime: string }>('/api/health');
  }

  public async resetDemo(): Promise<{ message: string; usersCount: number; projectsCount: number; tasksCount: number }> {
    return this.request<{ message: string; usersCount: number; projectsCount: number; tasksCount: number }>('/api/reset-demo', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
