import { test, expect } from '@playwright/test'
import { login, createTestCourse } from './helpers'

// ---------------------------------------------------------------------------
// Suite: Cursos
// Todos os testes partem de um usuario ja autenticado.
// ---------------------------------------------------------------------------
test.describe('Cursos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  // -------------------------------------------------------------------------
  test('listagem de cursos carrega e exibe cursos', async ({ page }) => {
    await page.goto('/cursos')

    // Aguarda heading da pagina
    await expect(page.getByRole('heading', { name: /cursos/i })).toBeVisible()

    // Aguarda o estado de loading sumir (skeleton ou spinner)
    await page.waitForLoadState('networkidle')

    // Verifica que ha ao menos um curso listado OU mensagem de lista vazia
    const cursoItems = page.locator('[data-testid="curso-card"]')
      .or(page.locator('article'))
      .or(page.getByRole('listitem'))

    const count = await cursoItems.count()
    if (count === 0) {
      // Se nao ha cursos, deve exibir estado vazio
      await expect(
        page.getByText(/nenhum curso|sem cursos|lista vazia/i),
      ).toBeVisible()
    } else {
      expect(count).toBeGreaterThan(0)
    }
  })

  // -------------------------------------------------------------------------
  test('criar novo curso aparece na listagem', async ({ page }) => {
    const courseName = await createTestCourse(page)

    // Navega (ou ja esta) na listagem de cursos
    await page.goto('/cursos')
    await page.waitForLoadState('networkidle')

    // O curso recem-criado deve aparecer na lista
    await expect(
      page.getByText(courseName, { exact: false }),
    ).toBeVisible({ timeout: 15_000 })
  })

  // -------------------------------------------------------------------------
  test('editar nome do curso atualiza o nome na interface', async ({ page }) => {
    // Cria um curso para garantir que ha algo para editar
    const originalName = await createTestCourse(page)
    const updatedName = `${originalName} (Editado)`

    await page.goto('/cursos')
    await page.waitForLoadState('networkidle')

    // Localiza o card do curso criado e clica em editar
    const cursoRow = page.locator(`text=${originalName}`).first()
    await cursoRow.scrollIntoViewIfNeeded()

    // Botao de editar — pode ser um icone de lapix, link ou botao contextual
    const editButton = page
      .locator(`[data-testid="edit-curso"]`)
      .or(page.getByRole('button', { name: /editar/i }).first())
      .or(page.getByRole('link', { name: /editar/i }).first())

    // Caso seja necessario hover para revelar os controles do card
    await cursoRow.hover()
    await editButton.click()

    // Aguarda o formulario de edicao abrir (dialog ou pagina)
    const nomeField = page.getByLabel(/nome do curso/i)
    await expect(nomeField).toBeVisible({ timeout: 8_000 })

    // Limpa e preenche o novo nome
    await nomeField.clear()
    await nomeField.fill(updatedName)

    // Salva
    await page.getByRole('button', { name: /salvar|atualizar/i }).click()

    // Verifica feedback
    await expect(
      page.getByText(/atualizado|salvo com sucesso/i).or(page.getByRole('alert')),
    ).toBeVisible({ timeout: 10_000 })

    // Confirma que o novo nome aparece na interface
    await expect(page.getByText(updatedName, { exact: false })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  test('pagina de detalhe do curso carrega com modulos', async ({ page }) => {
    await page.goto('/cursos')
    await page.waitForLoadState('networkidle')

    // Clica no primeiro curso disponivel para abrir o detalhe
    const primeiroLink = page
      .getByRole('link', { name: /ver detalhes|abrir|visualizar/i }).first()
      .or(page.locator('[data-testid="curso-card"] a').first())
      .or(page.locator('article a').first())

    const hasLink = await primeiroLink.count()

    if (hasLink === 0) {
      test.skip(true, 'Nenhum curso disponivel para verificar o detalhe')
      return
    }

    await primeiroLink.click()

    // Aguarda carregar a pagina de detalhe
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/cursos\/.+/)

    // Verifica elementos da pagina de detalhe
    await expect(page.getByRole('heading').first()).toBeVisible()

    // Verifica secao de modulos — pode ser "Conteudo", "Modulos", "Aulas"
    await expect(
      page.getByText(/m[oó]dulos|conte[uú]do do curso|aulas/i),
    ).toBeVisible({ timeout: 10_000 })
  })

  // -------------------------------------------------------------------------
  test('busca de cursos filtra os resultados', async ({ page }) => {
    await page.goto('/cursos')
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/buscar|pesquisar|search/i))

    if (!(await searchInput.isVisible())) {
      test.skip(true, 'Campo de busca nao encontrado na pagina de cursos')
      return
    }

    await searchInput.fill('XYZZYXZYYZXZ_INEXISTENTE')
    await page.waitForLoadState('networkidle')

    // Com um termo que nao existe, deve exibir lista vazia
    await expect(
      page.getByText(/nenhum curso|sem resultados|nenhum resultado/i),
    ).toBeVisible({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  test('paginacao de cursos funciona corretamente', async ({ page }) => {
    await page.goto('/cursos')
    await page.waitForLoadState('networkidle')

    const nextPageButton = page.getByRole('button', { name: /pr[oó]xima|next/i })
      .or(page.getByLabel(/pr[oó]xima p[aá]gina/i))

    if (!(await nextPageButton.isVisible())) {
      // Paginacao so aparece quando ha cursos suficientes
      test.skip(true, 'Paginacao nao disponivel — insuficiente numero de cursos')
      return
    }

    await nextPageButton.click()
    await page.waitForLoadState('networkidle')

    // Verifica que a pagina mudou
    await expect(page).toHaveURL(/page=2|pagina=2|offset=/)
  })
})
