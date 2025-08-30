import React from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute - User:', user ? 'موجود' : 'غير موجود');
    console.log('ProtectedRoute - Loading:', isLoading);
  }, [user, isLoading]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - توجيه إلى صفحة تسجيل الدخول');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - عرض المحتوى المحمي');
  return <>{children}</>;
};