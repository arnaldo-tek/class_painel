export type UserRole = 'admin' | 'professor' | 'colaborador' | 'aluno'
export type ApprovalStatus = 'em_analise' | 'aprovado' | 'reprovado'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'

export const ADMIN_PERMISSIONS = [
  'manage_categories',
  'manage_packages',
  'manage_courses',
  'manage_news',
  'manage_editais',
  'manage_professor_support',
  'manage_student_support',
  'view_sales',
  'manage_colaboradores',
  'manage_students',
  'manage_professors',
  'manage_tutorials',
  'manage_documents',
  'manage_advertising',
  'manage_audiocourses',
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]
