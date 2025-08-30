/*
  # إنشاء الحسابات التجريبية

  1. الهدف
    - إنشاء حسابات تجريبية للاختبار
    - إضافة ملفات شخصية للمستخدمين التجريبيين
    - إنشاء شركة وفرق تجريبية

  2. الحسابات التجريبية
    - admin@demo.com (مدير)
    - manager@demo.com (مدير فريق)
    - member@demo.com (عضو)

  3. البيانات التجريبية
    - شركة تجريبية
    - فريقين تجريبيين
    - ربط المستخدمين بالفرق
*/

-- إنشاء شركة تجريبية
INSERT INTO companies (id, name, primary_color, secondary_color) 
VALUES (
  'demo-company-id',
  'شركة إدارة المشاريع التجريبية',
  '#5f979d',
  '#b4e1e6'
) ON CONFLICT (id) DO NOTHING;

-- إنشاء فرق تجريبية
INSERT INTO teams (id, name, description, company_id) VALUES
(
  'demo-team-dev',
  'فريق التطوير',
  'فريق مطوري الواجهة الأمامية والخلفية',
  'demo-company-id'
),
(
  'demo-team-design',
  'فريق التصميم',
  'فريق مصممي واجهات المستخدم',
  'demo-company-id'
) ON CONFLICT (id) DO NOTHING;

-- إنشاء الحسابات التجريبية في auth.users (يدوياً)
-- ملاحظة: هذا يتطلب استخدام service role key

-- إدراج الملفات الشخصية للمستخدمين التجريبيين
-- سنستخدم UUIDs ثابتة للمستخدمين التجريبيين
INSERT INTO profiles (id, email, name, role, company_id, team_id) VALUES
(
  'demo-admin-id',
  'admin@demo.com',
  'أحمد المدير',
  'admin',
  'demo-company-id',
  NULL
),
(
  'demo-manager-id',
  'manager@demo.com',
  'سارة المديرة',
  'manager',
  'demo-company-id',
  'demo-team-design'
),
(
  'demo-member-id',
  'member@demo.com',
  'محمد العضو',
  'member',
  'demo-company-id',
  'demo-team-dev'
) ON CONFLICT (id) DO NOTHING;

-- إضافة أعضاء الفرق
INSERT INTO team_members (team_id, user_id, role) VALUES
(
  'demo-team-design',
  'demo-manager-id',
  'lead'
),
(
  'demo-team-dev',
  'demo-member-id',
  'member'
) ON CONFLICT (team_id, user_id) DO NOTHING;

-- إنشاء مشروع تجريبي
INSERT INTO projects (id, name, description, start_date, end_date, status, progress, team_id, company_id, created_by) VALUES
(
  'demo-project-id',
  'مشروع التجارة الإلكترونية',
  'بناء منصة تجارة إلكترونية حديثة',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '30 days',
  'in-progress',
  45,
  'demo-team-dev',
  'demo-company-id',
  'demo-admin-id'
) ON CONFLICT (id) DO NOTHING;

-- إنشاء مرحلة تجريبية
INSERT INTO phases (id, name, description, total_target, start_date, end_date, status, progress, project_id) VALUES
(
  'demo-phase-id',
  'مرحلة التطوير',
  'تطوير الواجهة الأمامية والخلفية',
  200,
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '20 days',
  'in-progress',
  60,
  'demo-project-id'
) ON CONFLICT (id) DO NOTHING;

-- إنشاء مهمة تجريبية
INSERT INTO tasks (id, title, description, status, priority, assigned_to_team_id, start_date, end_date, progress, phase_id, project_id, total_target, created_by) VALUES
(
  'demo-task-id',
  'تطوير نظام المصادقة',
  'إنشاء نظام تسجيل الدخول والخروج',
  'in-progress',
  'high',
  'demo-team-dev',
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '7 days',
  70,
  'demo-phase-id',
  'demo-project-id',
  100,
  'demo-admin-id'
) ON CONFLICT (id) DO NOTHING;