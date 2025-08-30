import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('محاولة تسجيل الدخول:', { email, password: '***' });
      const success = await login(email, password);
      console.log('نتيجة تسجيل الدخول:', success);
      
      if (!success) {
        setError('بيانات الدخول غير صحيحة. تأكد من صحة البريد الإلكتروني وكلمة المرور');
        toast.error('فشل في تسجيل الدخول');
      } else {
        console.log('تم تسجيل الدخول بنجاح، سيتم التوجه للصفحة الرئيسية');
        toast.success('تم تسجيل الدخول بنجاح');
        // التوجه للصفحة الرئيسية سيحدث تلقائياً عبر ProtectedRoute
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setError('حدث خطأ أثناء تسجيل الدخول');
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-light/30 via-accent-light/20 to-accent-dark/20 flex items-center justify-center p-4">
      <div className="card-professional p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent-light to-accent-dark/20 rounded-full flex items-center justify-center mb-4 shadow-soft">
            <LogIn className="h-8 w-8 text-accent-dark" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">أهلاً بك مرة أخرى</h1>
          <p className="text-accent-dark/80 mt-2">سجل دخولك إلى حساب إدارة المشاريع</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-accent-dark mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-dark/60 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-professional pr-10 pl-4 py-3"
                placeholder="أدخل بريدك الإلكتروني"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-accent-dark mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-dark/60 h-5 w-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-professional pr-10 pl-4 py-3"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg shadow-soft">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-accent-light/20 rounded-lg border border-accent-light/30">
          <p className="text-xs text-accent-dark/80 mb-2">حسابات تجريبية:</p>
          <ul className="text-xs space-y-1">
            <li><strong>مدير:</strong> admin@demo.com / password</li>
            <li><strong>مدير فريق:</strong> manager@demo.com / password</li>
            <li><strong>عضو:</strong> member@demo.com / password</li>
            <li><strong>قائد فريق:</strong> استخدم اسم المستخدم وكلمة المرور المولدة</li>
          </ul>
        </div>
      </div>
    </div>
  );
};