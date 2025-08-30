import React from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, authInitialized } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute - User:', user ? 'موجود' : 'غير موجود');
    console.log('ProtectedRoute - Loading:', isLoading);
  }, [user, isLoading]);
  
  // إضافة timeout للتحميل
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !authInitialized) {
        console.log('انتهت مهلة التحميل، إعادة توجيه لتسجيل الدخول');
        setTimeoutReached(true);
      }
    }, 5000); // 5 ثواني

    return () => clearTimeout(timer);
  }, [isLoading, authInitialized]);

  // إذا انتهت المهلة أو لا يوجد مستخدم
  if (timeoutReached || (authInitialized && !user)) {
    console.log('ProtectedRoute - توجيه إلى صفحة تسجيل الدخول');
    return <Navigate to="/login" replace />;
  }
  
  if (isLoading || !authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-light/30 via-accent-light/20 to-accent-dark/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-light border-t-accent-dark mx-auto mb-4" />
          <p className="text-accent-dark font-medium">جاري التحميل...</p>
          <p className="text-accent-dark/70 text-sm mt-2">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute - عرض المحتوى المحمي');
  return <>{children}</>;
};