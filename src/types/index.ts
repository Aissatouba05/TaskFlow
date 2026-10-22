export type UserRole = 'ADMIN' | 'USER';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  projectId: string;
  projectTitle?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
  assignee?: SafeUser | null;
  createdById: string;
  creator?: SafeUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: string;
  role: 'OWNER' | 'LEAD' | 'MEMBER';
  joinedAt: string;
  user?: SafeUser | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  owner?: SafeUser | null;
  members: ProjectMember[];
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  taskCount?: number;
  completedTaskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  completionRate: number;
  statusBreakdown: Record<TaskStatus, number>;
  priorityBreakdown: Record<TaskPriority, number>;
  recentTasks: (Task & { projectTitle?: string; assigneeName?: string })[];
}

export interface AdminStats {
  users: { total: number; admins: number; regularUsers: number };
  projects: { total: number; active: number; planning: number; completed: number };
  tasks: { total: number; completed: number; inProgress: number; todo: number; overdue: number; completionRate: number };
  system: { nodeVersion: string; uptimeSeconds: number; memoryUsageMB: number };
  timestamp: string;
}
