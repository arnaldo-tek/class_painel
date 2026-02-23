import type { UserRole } from '@/types/enums'
import type { AdminPermission } from '@/types/enums'

export interface NavItem {
  label: string
  path: string
  icon: string
  /** Roles que podem ver este item. Se vazio, todos os roles autenticados veem */
  roles?: UserRole[]
  /** Permissão admin granular necessária (só se aplica a colaboradores) */
  permission?: AdminPermission
  children?: NavItem[]
  /** Marca o item como "em breve" — renderiza desabilitado */
  comingSoon?: boolean
}

export const navigation: NavItem[] = [
  // ─── Compartilhado ────────────────────────────────────────────────────────
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'professor', 'colaborador'],
  },

  // ─── Professor only ───────────────────────────────────────────────────────
  {
    label: 'Perfil',
    path: '/meu-perfil',
    icon: 'UserCircle',
    roles: ['professor'],
  },
  {
    label: 'Produtos',
    path: '/cursos',
    icon: 'ShoppingBag',
    roles: ['professor'],
    children: [
      {
        label: 'Cursos',
        path: '/cursos',
        icon: 'BookOpen',
      },
      {
        label: 'Flashcards',
        path: '/flashcards',
        icon: 'Layers',
        comingSoon: true,
      },
      {
        label: 'Mapas Mentais',
        path: '/mapas-mentais',
        icon: 'Network',
        comingSoon: true,
      },
    ],
  },
  {
    label: 'Oportunidades',
    path: '/oportunidades',
    icon: 'Briefcase',
    roles: ['professor'],
    comingSoon: true,
  },
  {
    label: 'Mentorias',
    path: '/mentorias',
    icon: 'Users',
    roles: ['professor'],
    comingSoon: true,
  },
  {
    label: 'Cards',
    path: '/cards',
    icon: 'Image',
    roles: ['professor'],
  },

  // ─── Admin / Colaborador ──────────────────────────────────────────────────
  {
    label: 'Conteudos',
    path: '/cursos',
    icon: 'BookOpen',
    roles: ['admin', 'colaborador'],
    children: [
      {
        label: 'Cursos',
        path: '/cursos',
        icon: 'BookOpen',
        permission: 'manage_courses',
      },
      {
        label: 'Pacotes',
        path: '/pacotes',
        icon: 'Package',
        permission: 'manage_packages',
      },
      {
        label: 'Editais',
        path: '/editais',
        icon: 'FileText',
        permission: 'manage_editais',
      },
      {
        label: 'Noticias',
        path: '/noticias',
        icon: 'Newspaper',
        permission: 'manage_news',
      },
      {
        label: 'Audio Cursos',
        path: '/audio-cursos',
        icon: 'Headphones',
        permission: 'manage_audiocourses',
      },
    ],
  },
  {
    label: 'Categorias',
    path: '/categorias',
    icon: 'Tags',
    roles: ['admin', 'colaborador'],
    children: [
      {
        label: 'Filtros',
        path: '/filtros',
        icon: 'SlidersHorizontal',
        permission: 'manage_categories',
      },
      {
        label: 'Categorias',
        path: '/categorias',
        icon: 'Tags',
        permission: 'manage_categories',
      },
    ],
  },
  {
    label: 'Professores',
    path: '/professores',
    icon: 'GraduationCap',
    roles: ['admin', 'colaborador'],
    permission: 'manage_professors',
  },
  {
    label: 'Alunos',
    path: '/alunos',
    icon: 'Users',
    roles: ['admin', 'colaborador'],
    permission: 'manage_students',
  },
  {
    label: 'Colaboradores',
    path: '/colaboradores',
    icon: 'UserCog',
    roles: ['admin'],
    permission: 'manage_colaboradores',
  },

  // ─── Vendas (compartilhado) ───────────────────────────────────────────────
  {
    label: 'Vendas',
    path: '/vendas',
    icon: 'DollarSign',
    roles: ['admin', 'professor', 'colaborador'],
    permission: 'view_sales',
  },
  {
    label: 'Cupons',
    path: '/cupons',
    icon: 'Ticket',
    roles: ['admin', 'colaborador'],
    permission: 'view_sales',
  },

  // ─── Admin only ───────────────────────────────────────────────────────────
  {
    label: 'Comunidades',
    path: '/comunidades',
    icon: 'Users',
    roles: ['admin', 'colaborador'],
  },
  {
    label: 'Documentos',
    path: '/documentos',
    icon: 'FolderOpen',
    roles: ['admin', 'colaborador'],
    permission: 'manage_documents',
  },
  {
    label: 'Publicidade',
    path: '/publicidade',
    icon: 'Megaphone',
    roles: ['admin', 'colaborador'],
    permission: 'manage_advertising',
  },
  {
    label: 'Tutoriais',
    path: '/tutoriais',
    icon: 'PlayCircle',
    roles: ['admin', 'colaborador'],
    permission: 'manage_tutorials',
  },
  {
    label: 'FAQ',
    path: '/faq',
    icon: 'HelpCircle',
    roles: ['admin', 'colaborador'],
    permission: 'manage_student_support',
  },

  // ─── Suporte ──────────────────────────────────────────────────────────────
  {
    label: 'Suporte',
    path: '/suporte',
    icon: 'LifeBuoy',
    roles: ['admin', 'professor', 'colaborador'],
    children: [
      {
        label: 'Chamados Alunos',
        path: '/suporte/alunos',
        icon: 'MessageSquare',
        permission: 'manage_student_support',
      },
      {
        label: 'Chamados Professores',
        path: '/suporte/professores',
        icon: 'MessageSquare',
        permission: 'manage_professor_support',
      },
    ],
  },
  {
    label: 'Chat',
    path: '/chat',
    icon: 'MessageCircle',
    roles: ['admin', 'professor'],
  },
]
