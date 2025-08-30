import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Project, Phase, Task, Team, ProjectAnalytics, TeamAnalytics, DashboardStats, Activity } from '../types';
import { addDays, subDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import toast from 'react-hot-toast';

interface DataContextType {
  projects: Project[];
  teams: Team[];
  tasks: Task[];
  phases: Phase[];
  activities: Activity[];
  
  // CRUD operations
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addPhase: (phase: Omit<Phase, 'id' | 'createdAt'>) => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  deletePhase: (id: string) => void;
  
  // Helper functions
  getAllTeams: () => Array<{ id: string; name: string; description: string; memberCount: number }>;
  getProjectAnalytics: (projectId: string) => ProjectAnalytics;
  getTeamAnalytics: (teamId: string) => TeamAnalytics;
  getDashboardStats: () => DashboardStats;
  getTasksByTeam: (teamId: string) => Task[];
  getOverdueTasks: () => Task[];
  getRecentActivities: (limit?: number) => Activity[];
  getPhasesByProject: (projectId: string) => Phase[];
  
  // Helper function to get all members from all teams
  getAllMembers: () => Array<{ id: string; name: string; email: string; teamName: string; teamId: string }>;
  
  // متتبع المهام المحسن
  logDailyAchievement: (taskId: string, achievement: any) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  calculateTaskProgress: (task: Task) => number;
  getTaskRiskLevel: (task: Task) => 'low' | 'medium' | 'high' | 'critical';
  updatePhaseProgress: (phaseId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data محسن
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'فريق التطوير',
    description: 'مطورو الواجهة الأمامية والخلفية',
    members: [
      { id: '1', userId: '1', name: 'أحمد المدير', email: 'admin@demo.com', role: 'lead', joinedAt: subDays(new Date(), 30) },
      { id: '2', userId: '3', name: 'محمد العضو', email: 'member@demo.com', role: 'member', joinedAt: subDays(new Date(), 15) },
      { id: '4', userId: '4', name: 'علياء المطورة', email: 'alice@demo.com', role: 'member', joinedAt: subDays(new Date(), 20) }
    ],
    createdAt: subDays(new Date(), 30)
  },
  {
    id: '2',
    name: 'فريق التصميم',
    description: 'مصممو واجهات المستخدم والفنانون البصريون',
    members: [
      { id: '3', userId: '2', name: 'سارة المديرة', email: 'manager@demo.com', role: 'lead', joinedAt: subDays(new Date(), 25) },
      { id: '5', userId: '5', name: 'بوب المصمم', email: 'bob@demo.com', role: 'member', joinedAt: subDays(new Date(), 12) }
    ],
    createdAt: subDays(new Date(), 25)
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'منصة التجارة الإلكترونية',
    description: 'بناء منصة تجارة إلكترونية حديثة باستخدام React و Node.js',
    startDate: subDays(new Date(), 20),
    endDate: addDays(new Date(), 40),
    status: 'in-progress',
    progress: 65,
    teamId: '1',
    phases: [],
    createdAt: subDays(new Date(), 20)
  },
  {
    id: '2',
    name: 'إعادة تصميم التطبيق المحمول',
    description: 'إعادة تصميم كاملة لتطبيق الهاتف المحمول',
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 30),
    status: 'in-progress',
    progress: 35,
    teamId: '2',
    phases: [],
    createdAt: subDays(new Date(), 10)
  }
];

const mockPhases: Phase[] = [
  {
    id: '1',
    name: 'التخطيط والتصميم',
    description: 'مرحلة التخطيط الأولي وتصميم واجهة المستخدم',
    totalTarget: 200,
    startDate: subDays(new Date(), 20),
    endDate: subDays(new Date(), 10),
    status: 'completed',
    progress: 100,
    projectId: '1',
    createdAt: subDays(new Date(), 20)
  },
  {
    id: '2',
    name: 'التطوير',
    description: 'مرحلة التطوير الأساسية',
    totalTarget: 500,
    startDate: subDays(new Date(), 10),
    endDate: addDays(new Date(), 20),
    status: 'in-progress',
    progress: 70,
    projectId: '1',
    createdAt: subDays(new Date(), 15)
  },
  {
    id: '3',
    name: 'الاختبار والنشر',
    description: 'مرحلة الاختبار والنشر',
    totalTarget: 150,
    startDate: addDays(new Date(), 20),
    endDate: addDays(new Date(), 40),
    status: 'not-started',
    progress: 0,
    projectId: '1',
    createdAt: subDays(new Date(), 10)
  },
  {
    id: '4',
    name: 'البحث',
    description: 'بحث المستخدمين وتحليل المنافسين',
    totalTarget: 100,
    startDate: subDays(new Date(), 10),
    endDate: new Date(),
    status: 'in-progress',
    progress: 80,
    projectId: '2',
    createdAt: subDays(new Date(), 10)
  },
  {
    id: '5',
    name: 'مرحلة التصميم',
    description: 'إنشاء تصاميم واجهة المستخدم الجديدة',
    totalTarget: 120,
    startDate: new Date(),
    endDate: addDays(new Date(), 15),
    status: 'not-started',
    progress: 0,
    projectId: '2',
    createdAt: subDays(new Date(), 5)
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'إنشاء نظام المصادقة',
    description: 'تنفيذ تسجيل الدخول والخروج وإدارة المستخدمين',
    status: 'completed',
    priority: 'high',
    assignedToTeamId: '1',
    assignedToTeamName: 'فريق التطوير',
    startDate: subDays(new Date(), 15),
    endDate: subDays(new Date(), 5),
    progress: 100,
    phaseId: '1',
    projectId: '1',
    createdAt: subDays(new Date(), 15),
    dailyAchievements: [
      {
        date: subDays(new Date(), 10).toISOString().split('T')[0],
        value: 25,
        checkIn: {
          timestamp: subDays(new Date(), 10).toISOString(),
          location: { latitude: 24.7136, longitude: 46.6753 }
        },
        checkOut: {
          timestamp: new Date(subDays(new Date(), 10).getTime() + 8 * 60 * 60 * 1000).toISOString(),
          location: { latitude: 24.7136, longitude: 46.6753 }
        },
        media: [],
        voiceNotes: [],
        workHours: 8
      }
    ],
    totalTarget: 100,
    actualStartDate: subDays(new Date(), 15),
    actualEndDate: subDays(new Date(), 5),
    plannedEffortHours: 40,
    actualEffortHours: 38,
    riskLevel: 'low',
    completionRate: 100,
    timeSpent: 2280,
    isOverdue: false,
    lastActivity: subDays(new Date(), 5)
  },
  {
    id: '2',
    title: 'تصميم كتالوج المنتجات',
    description: 'إنشاء صفحات قائمة المنتجات وتفاصيل المنتج المتجاوبة',
    status: 'in-progress',
    priority: 'high',
    assignedToTeamId: '1',
    assignedToTeamName: 'فريق التطوير',
    startDate: subDays(new Date(), 8),
    endDate: addDays(new Date(), 5),
    progress: 60,
    phaseId: '2',
    projectId: '1',
    createdAt: subDays(new Date(), 8),
    dailyAchievements: [
      {
        date: subDays(new Date(), 5).toISOString().split('T')[0],
        value: 30,
        checkIn: {
          timestamp: subDays(new Date(), 5).toISOString(),
          location: { latitude: 24.7136, longitude: 46.6753 }
        },
        media: [],
        voiceNotes: [],
        workHours: 6
      }
    ],
    totalTarget: 50,
    actualStartDate: subDays(new Date(), 8),
    plannedEffortHours: 32,
    actualEffortHours: 20,
    riskLevel: 'medium',
    completionRate: 60,
    timeSpent: 1200,
    isOverdue: false,
    lastActivity: subDays(new Date(), 1)
  },
  {
    id: '3',
    title: 'تنفيذ سلة التسوق',
    description: 'إضافة وظيفة إضافة إلى السلة وإدارة السلة',
    status: 'todo',
    priority: 'medium',
    assignedToTeamId: '2',
    assignedToTeamName: 'فريق التصميم',
    startDate: new Date(),
    endDate: addDays(new Date(), 10),
    progress: 0,
    phaseId: '2',
    projectId: '1',
    createdAt: subDays(new Date(), 3),
    dailyAchievements: [],
    totalTarget: 75,
    plannedEffortHours: 50,
    actualEffortHours: 0,
    riskLevel: 'low',
    completionRate: 0,
    timeSpent: 0,
    isOverdue: false,
    lastActivity: subDays(new Date(), 3)
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'task_completed',
    description: 'تم إكمال مهمة "إنشاء نظام المصادقة"',
    userId: '1',
    userName: 'أحمد المدير',
    entityId: '1',
    entityType: 'task',
    timestamp: subDays(new Date(), 5)
  },
  {
    id: '2',
    type: 'achievement_logged',
    description: 'تم تسجيل إنجاز يومي لمهمة "تصميم كتالوج المنتجات"',
    userId: '4',
    userName: 'علياء المطورة',
    entityId: '2',
    entityType: 'task',
    timestamp: subDays(new Date(), 1)
  }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [phases, setPhases] = useState<Phase[]>(mockPhases);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // تحميل البيانات من Supabase
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // تحميل جميع البيانات من قاعدة البيانات
  const loadAllData = async () => {
    try {
      setIsDataLoaded(false);
      
      // تحميل الشركات
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();

      // تحميل الفرق
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (
            id,
            role,
            joined_at,
            profiles (
              id,
              name,
              email
            )
          )
        `);

      if (teamsError) {
        console.error('Error loading teams:', teamsError);
        toast.error('فشل في تحميل الفرق');
      } else if (teamsData) {
        const formattedTeams: Team[] = teamsData.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description || '',
          members: team.team_members?.map((member: any) => ({
            id: member.id,
            userId: member.profiles?.id || '',
            name: member.profiles?.name || '',
            email: member.profiles?.email || '',
            role: member.role === 'lead' ? 'lead' : 'member',
            joinedAt: new Date(member.joined_at)
          })) || [],
          createdAt: new Date(team.created_at)
        }));
        setTeams(formattedTeams);
      }

      // تحميل المشاريع
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        toast.error('فشل في تحميل المشاريع');
      } else if (projectsData) {
        const formattedProjects: Project[] = projectsData.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          startDate: new Date(project.start_date),
          endDate: new Date(project.end_date),
          status: project.status as any,
          progress: project.progress || 0,
          teamId: project.team_id || '',
          phases: [],
          createdAt: new Date(project.created_at)
        }));
        setProjects(formattedProjects);
      }

      // تحميل المراحل
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*');

      if (phasesError) {
        console.error('Error loading phases:', phasesError);
        toast.error('فشل في تحميل المراحل');
      } else if (phasesData) {
        const formattedPhases: Phase[] = phasesData.map(phase => ({
          id: phase.id,
          name: phase.name,
          description: phase.description || '',
          totalTarget: phase.total_target || 100,
          startDate: new Date(phase.start_date),
          endDate: new Date(phase.end_date),
          status: phase.status as any,
          progress: phase.progress || 0,
          projectId: phase.project_id,
          createdAt: new Date(phase.created_at)
        }));
        setPhases(formattedPhases);
      }

      // تحميل المهام
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          teams (name),
          daily_achievements (*)
        `);

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        toast.error('فشل في تحميل المهام');
      } else if (tasksData) {
        const formattedTasks: Task[] = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as any,
          priority: task.priority as any,
          assignedToTeamId: task.assigned_to_team_id,
          assignedToTeamName: task.teams?.name,
          startDate: new Date(task.start_date),
          endDate: new Date(task.end_date),
          progress: task.progress || 0,
          phaseId: task.phase_id,
          projectId: task.project_id,
          createdAt: new Date(task.created_at),
          dailyAchievements: task.daily_achievements?.map((achievement: any) => ({
            date: achievement.date,
            value: achievement.value || 0,
            checkIn: achievement.check_in_time ? {
              timestamp: achievement.check_in_time,
              location: achievement.check_in_location || {}
            } : undefined,
            checkOut: achievement.check_out_time ? {
              timestamp: achievement.check_out_time,
              location: achievement.check_out_location || {}
            } : undefined,
            workHours: achievement.work_hours || 0,
            notes: achievement.notes,
            media: [],
            voiceNotes: []
          })) || [],
          totalTarget: task.total_target || 100,
          actualStartDate: task.actual_start_date ? new Date(task.actual_start_date) : undefined,
          actualEndDate: task.actual_end_date ? new Date(task.actual_end_date) : undefined,
          plannedEffortHours: task.planned_effort_hours || 40,
          actualEffortHours: task.actual_effort_hours || 0,
          riskLevel: task.risk_level as any || 'low',
          completionRate: task.completion_rate || 0,
          timeSpent: task.time_spent || 0,
          isOverdue: task.is_overdue || false,
          lastActivity: task.last_activity ? new Date(task.last_activity) : new Date()
        }));
        setTasks(formattedTasks);
      }

      setIsDataLoaded(true);
      toast.success('تم تحميل البيانات من قاعدة البيانات بنجاح');
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
      setIsDataLoaded(true);
    }
  };

  // Helper functions محسنة
  const getAllTeams = () => {
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.members.length
    }));
  };

  const calculateTaskProgress = (task: Task): number => {
    if (!task.dailyAchievements || task.dailyAchievements.length === 0) return 0;
    if (!task.totalTarget || task.totalTarget === 0) return task.status === 'completed' ? 100 : 0;
    
    const totalAchieved = task.dailyAchievements.reduce((sum, achievement) => sum + (achievement.value || 0), 0);
    return Math.min(100, Math.round((totalAchieved / task.totalTarget) * 100));
  };

  const getTaskRiskLevel = (task: Task): 'low' | 'medium' | 'high' | 'critical' => {
    const today = new Date();
    const endDate = new Date(task.endDate);
    const startDate = new Date(task.startDate);
    const progress = calculateTaskProgress(task);
    
    // إذا كانت المهمة متأخرة
    if (isAfter(today, endDate) && task.status !== 'completed') {
      return 'critical';
    }
    
    // إذا كانت المهمة قريبة من الانتهاء والتقدم منخفض
    const totalDays = differenceInDays(endDate, startDate);
    const remainingDays = differenceInDays(endDate, today);
    const expectedProgress = totalDays > 0 ? ((totalDays - remainingDays) / totalDays) * 100 : 0;
    
    if (progress < expectedProgress - 20) return 'high';
    if (progress < expectedProgress - 10) return 'medium';
    
    return 'low';
  };

  const getProjectAnalytics = (projectId: string): ProjectAnalytics => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const completedTasks = projectTasks.filter(t => t.status === 'completed');
    const inProgressTasks = projectTasks.filter(t => t.status === 'in-progress');
    const overdueTasks = projectTasks.filter(t => t.isOverdue);
    
    const averageCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => sum + (task.actualEffortHours || 0), 0) / completedTasks.length
      : 0;
    
    const teamProductivity = projectTasks.length > 0 
      ? (completedTasks.length / projectTasks.length) * 100
      : 0;
    
    const riskScore = projectTasks.reduce((score, task) => {
      const riskValues = { low: 1, medium: 2, high: 3, critical: 4 };
      return score + riskValues[getTaskRiskLevel(task)];
    }, 0) / projectTasks.length;

    return {
      projectId,
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      averageCompletionTime,
      teamProductivity,
      riskScore
    };
  };

  const getTeamAnalytics = (teamId: string): TeamAnalytics => {
    const team = teams.find(t => t.id === teamId);
    const teamProjects = projects.filter(p => p.teamId === teamId);
    const teamTasks = tasks.filter(t => teamProjects.some(p => p.id === t.projectId));
    
    const workloadDistribution = team?.members.map(member => ({
      memberId: member.userId,
      taskCount: teamTasks.filter(t => t.assignedToUserId === member.userId).length
    })) || [];

    return {
      teamId,
      memberCount: team?.members.length || 0,
      activeProjects: teamProjects.filter(p => p.status === 'in-progress').length,
      completedProjects: teamProjects.filter(p => p.status === 'completed').length,
      totalTasks: teamTasks.length,
      averageTaskCompletion: teamTasks.length > 0 
        ? teamTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0) / teamTasks.length
        : 0,
      workloadDistribution
    };
  };

  const getDashboardStats = (): DashboardStats => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const overdueTasks = tasks.filter(t => t.isOverdue);
    const activeTeams = getAllTeams().filter(team => 
      tasks.some(t => t.assignedToTeamId === team.id && t.status === 'in-progress')
    );

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in-progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      totalMembers: teams.reduce((acc, team) => acc + team.members.length, 0),
      activeMembers: activeTeams.length,
      recentActivities: activities.slice(0, 10)
    };
  };

  const getTasksByTeam = (teamId: string): Task[] => {
    return tasks.filter(t => t.assignedToTeamId === teamId);
  };

  const getOverdueTasks = (): Task[] => {
    return tasks.filter(t => t.isOverdue);
  };

  const getRecentActivities = (limit: number = 10): Activity[] => {
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  const getPhasesByProject = (projectId: string): Phase[] => {
    return phases.filter(phase => phase.projectId === projectId);
  };

  const getAllMembers = () => {
    const allMembers: Array<{ id: string; name: string; email: string; teamName: string; teamId: string }> = [];
    
    teams.forEach(team => {
      team.members.forEach(member => {
        allMembers.push({
          id: member.userId,
          name: member.name,
          email: member.email,
          teamName: team.name,
          teamId: team.id
        });
      });
    });
    
    return allMembers;
  };
  
  // متتبع المهام المحسن
  const logDailyAchievement = async (taskId: string, achievement: any) => {
    try {
      // حفظ الإنجاز في قاعدة البيانات
      const { error } = await supabase
        .from('daily_achievements')
        .upsert({
          task_id: taskId,
          user_id: user?.id,
          date: achievement.date,
          value: achievement.value || 0,
          check_in_time: achievement.checkIn?.timestamp || null,
          check_in_location: achievement.checkIn?.location || null,
          check_out_time: achievement.checkOut?.timestamp || null,
          check_out_location: achievement.checkOut?.location || null,
          work_hours: achievement.workHours || 0,
          notes: achievement.notes || null
        });

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      // إعادة تحميل البيانات
      await loadAllData();
      toast.success('تم حفظ الإنجاز اليومي');
      
    } catch (error) {
      console.error('Error logging achievement:', error);
      toast.error('فشل في حفظ الإنجاز');
    }
  };

  const startTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: 'task_created',
          description: `تم بدء مهمة "${task.title}"`,
          userId: task.assignedToUserId || '',
          userName: task.assignedToName || '',
          entityId: taskId,
          entityType: 'task',
          timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev]);
        
        const updatedTask = {
          ...task,
          status: 'in-progress' as const,
          actualStartDate: new Date(),
          lastActivity: new Date()
        };
        
        // تحديث تقدم المرحلة
        updatePhaseProgress(task.phaseId);
        
        return updatedTask;
      }
      return task;
    }));
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: 'task_completed',
          description: `تم إكمال مهمة "${task.title}"`,
          userId: task.assignedToUserId || '',
          userName: task.assignedToName || '',
          entityId: taskId,
          entityType: 'task',
          timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev]);
        
        const updatedTask = {
          ...task,
          status: 'completed' as const,
          actualEndDate: new Date(),
          progress: 100,
          completionRate: 100,
          lastActivity: new Date()
        };
        
        // تحديث تقدم المرحلة
        updatePhaseProgress(task.phaseId);
        
        return updatedTask;
      }
      return task;
    }));
  };

  // CRUD operations محسنة
  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          description: project.description,
          start_date: project.startDate.toISOString().split('T')[0],
          end_date: project.endDate.toISOString().split('T')[0],
          status: project.status,
          progress: project.progress,
          team_id: project.teamId || null,
          company_id: null,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      if (data) {
        const newProject: Project = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
          status: data.status,
          progress: data.progress || 0,
          teamId: data.team_id || '',
          phases: [],
          createdAt: new Date(data.created_at)
        };
        
        setProjects(prev => [...prev, newProject]);
        toast.success('تم إنشاء المشروع بنجاح');
      }
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('فشل في إنشاء المشروع');
    }
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const addTeam = async (team: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      // إنشاء الفريق
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          description: team.description,
          company_id: null
        })
        .select()
        .single();

      if (teamError) {
        toast.error(handleSupabaseError(teamError));
        return;
      }

      if (teamData && team.members.length > 0) {
        // إضافة أعضاء الفريق
        const teamMembersData = team.members.map(member => ({
          team_id: teamData.id,
          user_id: member.userId,
          role: member.role
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(teamMembersData);

        if (membersError) {
          console.error('Error adding team members:', membersError);
        }
      }

      // إعادة تحميل البيانات
      await loadAllData();
      toast.success('تم إنشاء الفريق بنجاح');
      
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('فشل في إنشاء الفريق');
    }
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    const projectsToDelete = projects.filter(p => p.teamId === id).map(p => p.id);
    setProjects(prev => prev.filter(p => p.teamId !== id));
    setTasks(prev => prev.filter(t => !projectsToDelete.includes(t.projectId)));
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to_team_id: task.assignedToTeamId,
          assigned_to_user_id: null,
          start_date: task.startDate.toISOString().split('T')[0],
          end_date: task.endDate.toISOString().split('T')[0],
          progress: task.progress,
          phase_id: task.phaseId,
          project_id: task.projectId,
          total_target: task.totalTarget || 100,
          planned_effort_hours: task.plannedEffortHours || 40,
          risk_level: 'low',
          completion_rate: 0,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      if (data) {
        // إعادة تحميل البيانات
        await loadAllData();
        toast.success('تم إنشاء المهمة بنجاح');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('فشل في إنشاء المهمة');
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updatedTask = { 
          ...t, 
          ...updates, 
          lastActivity: new Date(),
          // تحديث التقدم إذا تم تحديث الإنجازات اليومية
          progress: updates.dailyAchievements ? 
            calculateTaskProgress({ ...t, ...updates }) : 
            (updates.progress !== undefined ? updates.progress : t.progress)
        };
        
        // إعادة حساب مستوى المخاطر
        updatedTask.riskLevel = getTaskRiskLevel(updatedTask);
        updatedTask.isOverdue = isAfter(new Date(), new Date(updatedTask.endDate)) && updatedTask.status !== 'completed';
        
        // تحديث تقدم المرحلة المرتبطة
        updatePhaseProgress(updatedTask.phaseId);
        
        return updatedTask;
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addPhase = async (phase: Omit<Phase, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('phases')
        .insert({
          name: phase.name,
          description: phase.description,
          total_target: phase.totalTarget || 100,
          start_date: phase.startDate.toISOString().split('T')[0],
          end_date: phase.endDate.toISOString().split('T')[0],
          status: phase.status,
          progress: phase.progress,
          project_id: phase.projectId
        })
        .select()
        .single();

      if (error) {
        toast.error(handleSupabaseError(error));
        return;
      }

      if (data) {
        // إعادة تحميل البيانات
        await loadAllData();
        toast.success('تم إنشاء المرحلة بنجاح');
      }
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error('فشل في إنشاء المرحلة');
    }
  };

  const updatePhase = (id: string, updates: Partial<Phase>) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePhase = (id: string) => {
    setPhases(prev => prev.filter(p => p.id !== id));
  };

  // دالة لتحديث تقدم المرحلة بناءً على المهام المرتبطة بها
  const updatePhaseProgress = (phaseId: string) => {
    const phaseTasks = tasks.filter(t => t.phaseId === phaseId);
    if (phaseTasks.length === 0) return;
    
    const totalProgress = phaseTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0);
    const averageProgress = Math.round(totalProgress / phaseTasks.length);
    
    // تحديد حالة المرحلة بناءً على حالة المهام
    const completedTasks = phaseTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = phaseTasks.filter(t => t.status === 'in-progress').length;
    
    let phaseStatus: 'not-started' | 'in-progress' | 'completed' = 'not-started';
    
    if (completedTasks === phaseTasks.length) {
      phaseStatus = 'completed';
    } else if (inProgressTasks > 0 || completedTasks > 0) {
      phaseStatus = 'in-progress';
    }
    
    setPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          progress: averageProgress,
          status: phaseStatus
        };
      }
      return phase;
    }));
  };

  // حساب الإحصائيات المحسنة
  const enhancedProjects = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const projectPhases = phases.filter(p => p.projectId === project.id);
      const completedTasks = projectTasks.filter(t => t.status === 'completed');
      const overdueTasks = projectTasks.filter(t => t.isOverdue);
      
      return {
        ...project,
        phases: projectPhases,
        totalTasks: projectTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        progress: projectTasks.length > 0 
          ? Math.round(projectTasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0) / projectTasks.length)
          : 0
      };
    });
  }, [projects, tasks, phases]);

  const enhancedTasks = useMemo(() => {
    return tasks.map(task => {
      const totalAchieved = (task.dailyAchievements || []).reduce((sum, achievement) => sum + (achievement.value || 0), 0);
      
      return {
        ...task,
        progress: calculateTaskProgress(task),
        isOverdue: isAfter(new Date(), new Date(task.endDate)) && task.status !== 'completed',
        totalAchieved
      };
    });
  }, [tasks]);

  return (
    <DataContext.Provider value={{
      projects: enhancedProjects,
      teams,
      tasks: enhancedTasks,
      phases,
      activities,
      addProject,
      updateProject,
      deleteProject,
      addTeam,
      updateTeam,
      deleteTeam,
      addTask,
      updateTask,
      deleteTask,
      addPhase,
      updatePhase,
      deletePhase,
      getAllTeams,
      getProjectAnalytics,
      getTeamAnalytics,
      getDashboardStats,
      getTasksByTeam,
      getOverdueTasks,
      getRecentActivities,
      getPhasesByProject,
      getAllMembers,
      logDailyAchievement,
      startTask,
      completeTask,
      calculateTaskProgress,
      getTaskRiskLevel,
      updatePhaseProgress
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};