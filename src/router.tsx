import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterProfessorPage } from '@/pages/RegisterProfessorPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CursosPage } from '@/features/cursos/CursosPage'
import { CursoFormPage } from '@/features/cursos/CursoFormPage'
import { CursoDetailPage } from '@/features/cursos/CursoDetailPage'
import { CategoriasPage } from '@/features/categorias/CategoriasPage'
import { FiltrosPage } from '@/features/filtros/FiltrosPage'
import { PacotesPage } from '@/features/pacotes/PacotesPage'
import { ProfessoresPage } from '@/features/professores/ProfessoresPage'
import { ProfessorDetailPage } from '@/features/professores/ProfessorDetailPage'
import { AlunosPage } from '@/features/alunos/AlunosPage'
import { ColaboradoresPage } from '@/features/colaboradores/ColaboradoresPage'
import { VendasPage } from '@/features/vendas/VendasPage'
import { CuponsPage } from '@/features/vendas/CuponsPage'
import { NoticiasPage } from '@/features/conteudo/NoticiasPage'
import { EditaisPage } from '@/features/conteudo/EditaisPage'
import { AudioCursosPage } from '@/features/conteudo/AudioCursosPage'
import { DocumentosPage } from '@/features/conteudo/DocumentosPage'
import { PublicidadePage } from '@/features/conteudo/PublicidadePage'
import { TutoriaisPage } from '@/features/conteudo/TutoriaisPage'
import { TutoriaisProfessorPage } from '@/features/conteudo/TutoriaisProfessorPage'
import { MeusChamadosPage } from '@/features/suporte/MeusChamadosPage'
import { ComunidadesPage } from '@/features/comunidades/ComunidadesPage'
import { SuporteAlunosPage, SuporteProfessoresPage } from '@/features/suporte/SuportePage'
import { useAuth } from '@/hooks/useAuth'
import { ChatPage } from '@/features/chat/ChatPage'
import { FaqPage } from '@/features/faq/FaqPage'
import { MeuPerfilPage } from '@/features/perfil/MeuPerfilPage'
import { CardsPage } from '@/features/cards/CardsPage'

// Root route
const rootRoute = createRootRoute({
  component: Outlet,
})

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const registerProfessorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cadastro-professor',
  component: RegisterProfessorPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
})

// Protected layout route
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: () => (
    <AuthGuard>
      <AppLayout />
    </AuthGuard>
  ),
})

// Dashboard
const dashboardRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/dashboard', component: DashboardPage })

// Cursos
const cursosRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/cursos', component: CursosPage })
const cursoNovoRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/cursos/novo', component: CursoFormPage })
const cursoDetailRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/cursos/$cursoId', component: CursoDetailPage })
const cursoEditarRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/cursos/$cursoId/editar', component: CursoFormPage })

// Gestão
const categoriasRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/categorias', component: CategoriasPage })
const filtrosRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/filtros', component: FiltrosPage })
const pacotesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/pacotes', component: PacotesPage })
const professoresRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/professores', component: ProfessoresPage })
const professorDetailRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/professores/$professorId', component: ProfessorDetailPage })
const alunosRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/alunos', component: AlunosPage })
const colaboradoresRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/colaboradores', component: ColaboradoresPage })

// Vendas
const vendasRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/vendas', component: VendasPage })
const cuponsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/cupons', component: CuponsPage })

// Conteúdo
const noticiasRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/noticias', component: NoticiasPage })
const editaisRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/editais', component: EditaisPage })
const audioCursosRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/audio-cursos', component: AudioCursosPage })
const documentosRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/documentos', component: DocumentosPage })
const publicidadeRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/publicidade', component: PublicidadePage })
function TutoriaisRouter() {
  const { isProfessor, isAdmin } = useAuth()
  if (isProfessor && !isAdmin) return <TutoriaisProfessorPage />
  return <TutoriaisPage />
}
const tutoriaisRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/tutoriais', component: TutoriaisRouter })

// FAQ
const faqRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/faq', component: FaqPage })

// Comunidades
const comunidadesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/comunidades', component: ComunidadesPage })

// Suporte e Chat
const meusChamadosRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/suporte/meus-chamados', component: MeusChamadosPage })
const suporteAlunosRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/suporte/alunos', component: SuporteAlunosPage })
const suporteProfessoresRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/suporte/professores', component: SuporteProfessoresPage })
const chatRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/chat', component: ChatPage })
const meuPerfilRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/meu-perfil', component: MeuPerfilPage })
const cardsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/cards', component: CardsPage })

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerProfessorRoute,
  forgotPasswordRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    cursosRoute, cursoNovoRoute, cursoDetailRoute, cursoEditarRoute,
    categoriasRoute, filtrosRoute, pacotesRoute, professoresRoute, professorDetailRoute, alunosRoute, colaboradoresRoute,
    vendasRoute, cuponsRoute,
    noticiasRoute, editaisRoute, audioCursosRoute, documentosRoute, publicidadeRoute, tutoriaisRoute,
    faqRoute,
    comunidadesRoute,
    meusChamadosRoute, suporteAlunosRoute, suporteProfessoresRoute, chatRoute, meuPerfilRoute, cardsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
