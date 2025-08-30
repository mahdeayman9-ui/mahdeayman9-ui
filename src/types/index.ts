export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  teamId?: string;
  username?: string;
  generatedPassword?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'lead' | 'member';
  joinedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  teamId: string;
  phases: Phase[];
  createdAt: Date;
  // إضافة حقول جديدة للربط
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  totalTarget?: number;
  startDate: Date;
  endDate: Date;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  projectId: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedToTeamId: string | null;
  assignedToTeamName?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  phaseId: string;
  projectId: string;
  createdAt: Date;
  
  // حقول متتبع المهام المحسنة
  dailyAchievements?: DailyAchievement[];
  totalTarget?: number;
  totalAchieved?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  plannedEffortHours?: number;
  actualEffortHours?: number;
  
  // حقول جديدة للربط والتحليل
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  completionRate?: number;
  timeSpent?: number; // بالدقائق
  isOverdue?: boolean;
  lastActivity?: Date;
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
}

export interface DailyAchievement {
  date: string;
  value: number;
  checkIn?: {
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  checkOut?: {
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  media?: MediaItem[];
  voiceNotes?: VoiceNote[];
  notes?: string;
  workHours?: number;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  timestamp: string;
  name?: string;
  size?: number;
}

export interface VoiceNote {
  audioUrl: string;
  timestamp: string;
  duration?: number;
  transcription?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  addUser?: (user: User) => void;
  users?: User[];
}

// إضافة واجهات جديدة للتحليلات
export interface ProjectAnalytics {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  teamProductivity: number;
  riskScore: number;
}

export interface TeamAnalytics {
  teamId: string;
  memberCount: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  averageTaskCompletion: number;
  workloadDistribution: { memberId: string; taskCount: number }[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMembers: number;
  activeMembers: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_completed' | 'project_started' | 'member_added' | 'achievement_logged';
  description: string;
  userId: string;
  userName: string;
  entityId: string;
  entityType: 'task' | 'project' | 'team';
  timestamp: Date;
}