import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { AuthContextType, User } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // تحميل المستخدم الحالي
  useEffect(() => {
    if (authInitialized) return; // منع إعادة التهيئة

    let isMounted = true;
    const initializeAuth = async () => {
      try {
        console.log('بدء تهيئة المصادقة...');
        // التحقق من الجلسة الحالية
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        if (session?.user && isMounted) {
          console.log('جلسة موجودة، تحميل الملف الشخصي...');
          await loadUserProfile(session.user.id);
        } else if (isMounted) {
          console.log('لا توجد جلسة نشطة');
          setUser(null);
          setIsLoading(false);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [authInitialized]);

  // تحميل ملف المستخدم الشخصي
  const loadUserProfile = async (userId: string) => {
    console.log('تحميل الملف الشخصي للمستخدم:', userId);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('نتيجة تحميل الملف الشخصي:', { profile: profile?.email, error: error?.message });

      if (error) {
        console.error('Error loading profile:', error);
        
        // إذا لم يوجد ملف شخصي، أنشئ واحد
        if (error.code === 'PGRST116') {
          console.log('لم يوجد ملف شخصي، جاري إنشاء واحد...');
          const { data: authUser } = await supabase.auth.getUser();
          
          if (authUser.user) {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.user.id,
                email: authUser.user.email || '',
                name: authUser.user.email?.split('@')[0] || 'مستخدم',
                role: 'member', // الدور الافتراضي
                company_id: null
              })
              .select()
              .single();
            
            if (!insertError && newProfile) {
              console.log('تم إنشاء الملف الشخصي بنجاح');
              // استخدام الملف الشخصي الجديد مباشرة
              const userData: User = {
                id: newProfile.id,
                email: newProfile.email,
                name: newProfile.name,
                role: newProfile.role as 'admin' | 'manager' | 'member',
                username: newProfile.username || undefined,
                teamId: newProfile.team_id || undefined,
              };
              setUser(userData);
              setIsLoading(false);
              setAuthInitialized(true);
              return;
            } else {
              console.error('فشل في إنشاء الملف الشخصي:', insertError);
            }
          }
        }
        
        console.error('فشل في تحميل الملف الشخصي');
        setIsLoading(false);
        setAuthInitialized(true);
        return;
      }

      if (profile) {
        console.log('تم تحميل الملف الشخصي:', profile.name);
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as 'admin' | 'manager' | 'member',
          username: profile.username || undefined,
          teamId: profile.team_id || undefined,
        };
        setUser(userData);
      } else {
        console.error('لم يتم العثور على ملف شخصي');
        setUser(null);
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      setAuthInitialized(true);
      console.log('تم إنهاء تحميل الملف الشخصي');
    }
  };

  // تحميل جميع المستخدمين (للمديرين)
  const loadUsers = async () => {
    try {
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      const usersData: User[] = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as 'admin' | 'manager' | 'member',
        username: profile.username || undefined,
        teamId: profile.team_id || undefined,
      }));

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // تسجيل الدخول
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('بدء عملية تسجيل الدخول:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('استجابة Supabase:', { data: data?.user?.id, error: error?.message });

      if (error) {
        console.error('خطأ في المصادقة:', error);
        toast.error(handleSupabaseError(error));
        return false;
      }

      if (data.user) {
        console.log('تم العثور على المستخدم، سيتم تحميل الملف الشخصي تلقائياً...');
        // لا نحتاج لاستدعاء loadUserProfile هنا لأن onAuthStateChange سيتولى الأمر
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
      return false;
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(handleSupabaseError(error));
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  // إضافة مستخدم جديد
  const addUser = async (newUser: Omit<User, 'id'> & { password?: string; generatedPassword?: string }) => {
    try {
      const password = newUser.password || newUser.generatedPassword || 'defaultPassword123';
      // إنشاء حساب المصادقة
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: password,
      });

      if (authError) {
        toast.error(handleSupabaseError(authError));
        return;
      }

      if (authData.user) {
        // إنشاء الملف الشخصي
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            username: newUser.username,
            team_id: newUser.teamId,
          });

        if (profileError) {
          toast.error(handleSupabaseError(profileError));
          return;
        }

        toast.success('تم إنشاء المستخدم بنجاح');
        await loadUsers(); // إعادة تحميل قائمة المستخدمين
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('حدث خطأ أثناء إنشاء المستخدم');
    }
  };

  // تحميل المستخدمين عند تسجيل الدخول كمدير
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      loadUsers();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      addUser, 
      users 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};