import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Credenciais de teste — sobrescritas via variáveis de ambiente no CI
// ---------------------------------------------------------------------------
export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e@superclasse.com.br'
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'Superclasse@e2e!'
export const TEST_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@superclasse.com.br'
export const TEST_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Admin@superclasse!'

// ---------------------------------------------------------------------------
// Helper: login
// ---------------------------------------------------------------------------
/**
 * Realiza login na aplicacao class_painel.
 * Navega para /login, preenche o formulário e aguarda o redirect para
 * o dashboard (/dashboard ou /cursos, dependendo do role).
 */
export async function login(
  page: Page,
  email: string = TEST_EMAIL,
  password: string = TEST_PASSWORD,
): Promise<void> {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()

  await page.getByLabel(/e-?mail/i).fill(email)
  await page.getByLabel(/senha/i).fill(password)
  await page.getByRole('button', { name: /entrar/i }).click()

  // Aguarda sair da rota /login — redireciona para dashboard ou cursos
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 })
}

// ---------------------------------------------------------------------------
// Helper: createTestCourse
// ---------------------------------------------------------------------------
/**
 * Cria um curso de teste via UI e retorna o nome gerado.
 * Presupoe que o usuario ja esta autenticado e tem permissao para criar cursos.
 */
export async function createTestCourse(page: Page): Promise<string> {
  const timestamp = Date.now()
  const courseName = `Curso Teste E2E ${timestamp}`

  // Navega para a lista de cursos
  await page.goto('/cursos')
  await expect(page.getByRole('heading', { name: /cursos/i })).toBeVisible()

  // Abre o dialogo / pagina de criacao
  await page.getByRole('button', { name: /novo curso|criar curso/i }).click()

  // Preenche o nome
  await page.getByLabel(/nome do curso/i).fill(courseName)

  // Preenche descricao minima para habilitar o submit
  const descricaoField = page.getByLabel(/descri[çc][aã]o/i)
  if (await descricaoField.isVisible()) {
    await descricaoField.fill('Descrição gerada automaticamente pelo teste E2E.')
  }

  // Submete o formulario
  await page.getByRole('button', { name: /salvar|criar/i }).click()

  // Aguarda feedback de sucesso (toast ou redirect)
  await expect(
    page.getByText(/curso criado|salvo com sucesso/i).or(page.getByRole('alert')),
  ).toBeVisible({ timeout: 10_000 })

  return courseName
}

// ---------------------------------------------------------------------------
// Helper: logout
// ---------------------------------------------------------------------------
export async function logout(page: Page): Promise<void> {
  // Abre o menu do usuario (avatar ou botao de perfil no canto superior)
  const userMenu = page.getByRole('button', { name: /meu perfil|perfil|sair/i })
  if (await userMenu.isVisible()) {
    await userMenu.click()
  } else {
    // Fallback: busca item de menu lateral
    await page.getByRole('link', { name: /sair/i }).click()
  }

  const sairButton = page.getByRole('menuitem', { name: /sair/i })
    .or(page.getByRole('button', { name: /sair/i }))
  await sairButton.click()

  await page.waitForURL('**/login', { timeout: 10_000 })
}
