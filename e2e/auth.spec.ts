import { test, expect } from '@playwright/test'
import { login, logout, TEST_EMAIL, TEST_PASSWORD } from './helpers'

// ---------------------------------------------------------------------------
// Suite: Autenticacao
// ---------------------------------------------------------------------------
test.describe('Autenticacao', () => {
  // Garante estado limpo entre testes de auth
  test.beforeEach(async ({ page }) => {
    // Remove cookies / storage para garantir sessao zerada
    await page.context().clearCookies()
    await page.goto('/login')
  })

  // -------------------------------------------------------------------------
  test('login com credenciais validas redireciona para o dashboard', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)

    // A rota pos-login pode ser /dashboard, /cursos ou /home dependendo do role
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/login')

    // Verifica que algum conteudo autenticado esta visivel
    await expect(
      page.getByRole('navigation').or(page.getByRole('main')),
    ).toBeVisible()
  })

  // -------------------------------------------------------------------------
  test('login com credenciais invalidas exibe mensagem de erro', async ({ page }) => {
    await page.getByLabel(/e-?mail/i).fill('usuario_inexistente@superclasse.com.br')
    await page.getByLabel(/senha/i).fill('senha_errada_123')
    await page.getByRole('button', { name: /entrar/i }).click()

    // Deve permanecer em /login
    await expect(page).toHaveURL(/.*\/login/)

    // Deve exibir alguma mensagem de erro
    await expect(
      page.getByText(/credenciais inv[aá]lidas|e-?mail ou senha incorretos|invalid login/i)
        .or(page.getByRole('alert'))
        .or(page.locator('[data-testid="auth-error"]')),
    ).toBeVisible({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  test('login com campo de email vazio exibe validacao do formulario', async ({ page }) => {
    await page.getByLabel(/senha/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /entrar/i }).click()

    // HTML5 validation ou validacao customizada — campo obrigatorio
    const emailInput = page.getByLabel(/e-?mail/i)
    await expect(emailInput).toBeFocused().catch(() => {
      // Fallback: verifica mensagem de campo obrigatorio
      return expect(
        page.getByText(/campo obrigat[oó]rio|e-?mail [eé] obrigat[oó]rio|preencha/i),
      ).toBeVisible()
    })
  })

  // -------------------------------------------------------------------------
  test('logout redireciona para a tela de login', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)

    // Confirma que esta autenticado
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/login')

    await logout(page)

    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  test('rota protegida redireciona para login quando nao autenticado', async ({ page }) => {
    // Tenta acessar diretamente uma rota protegida sem estar logado
    await page.goto('/cursos')

    // Deve ser redirecionado para login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10_000 })
  })

  // -------------------------------------------------------------------------
  test('rota /dashboard redireciona para login quando nao autenticado', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10_000 })
  })

  // -------------------------------------------------------------------------
  test('rota /professores redireciona para login quando nao autenticado', async ({ page }) => {
    await page.goto('/professores')
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10_000 })
  })

  // -------------------------------------------------------------------------
  test('usuario autenticado nao pode acessar /login e e redirecionado', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)

    // Tenta navegar de volta para /login
    await page.goto('/login')

    // App deve redirecionar de volta para area autenticada
    await expect(page).not.toHaveURL(/.*\/login/, { timeout: 10_000 })
  })
})
