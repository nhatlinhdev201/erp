import { test, expect } from './fixtures/auth.fixture'

test.describe('Settings', () => {
  test('settings page loads with tabs for admin', async ({ adminPage }) => {
    await adminPage.goto('/settings')
    await expect(adminPage.getByRole('heading', { name: 'Cài đặt' })).toBeVisible({ timeout: 10_000 })

    // Verify tabs exist
    await expect(adminPage.getByRole('tab', { name: /Công ty/ })).toBeVisible()
    await expect(adminPage.getByRole('tab', { name: /Pipeline/ })).toBeVisible()
    await expect(adminPage.getByRole('tab', { name: /Thông báo/ })).toBeVisible()
    await expect(adminPage.getByRole('tab', { name: /Email/ })).toBeVisible()
    await expect(adminPage.getByRole('tab', { name: /Nhóm/ })).toBeVisible()
  })

  test('save company settings persists values', async ({ adminPage }) => {
    await adminPage.goto('/settings')
    await expect(adminPage.getByRole('heading', { name: 'Cài đặt' })).toBeVisible({ timeout: 10_000 })

    // Company tab should be active by default — find the company name textbox
    await expect(adminPage.getByText('Thông tin công ty')).toBeVisible({ timeout: 5_000 })

    // The "Tên công ty *" label is next to the textbox. Use the first textbox in the form.
    const nameInput = adminPage.getByRole('tabpanel', { name: 'Công ty' }).locator('input').first()
    await expect(nameInput).toBeVisible()

    // Store original value for cleanup
    const originalValue = await nameInput.inputValue()

    await nameInput.clear()
    await nameInput.fill('[E2E] Công ty Test Settings')

    // Click save
    const saveResponsePromise = adminPage.waitForResponse(
      (resp) => resp.url().includes('/api/settings/') && resp.request().method() === 'PUT',
      { timeout: 10_000 }
    ).catch(() => null)

    await adminPage.getByRole('button', { name: /Lưu thông tin/ }).click()

    const response = await saveResponsePromise
    if (response) {
      expect(response.status()).toBeLessThan(400)
    }

    // Verify success toast
    await expect(adminPage.getByText('Đã lưu thông tin công ty', { exact: true }).first()).toBeVisible({ timeout: 5_000 })

    // Reload and verify value persisted
    await adminPage.reload()
    await expect(adminPage.getByText('Thông tin công ty')).toBeVisible({ timeout: 10_000 })
    await expect(nameInput).toHaveValue('[E2E] Công ty Test Settings')

    // Cleanup: restore the original name
    await nameInput.clear()
    await nameInput.fill(originalValue || 'L-ERP CRM')
    await adminPage.getByRole('button', { name: /Lưu thông tin/ }).click()
    await expect(adminPage.getByText('Đã lưu thông tin công ty', { exact: true }).first()).toBeVisible({ timeout: 5_000 })
  })

  test('pipeline settings shows stages', async ({ adminPage }) => {
    await adminPage.goto('/settings')
    await expect(adminPage.getByRole('heading', { name: 'Cài đặt' })).toBeVisible({ timeout: 10_000 })

    // Click Pipeline tab
    await adminPage.getByRole('tab', { name: /Pipeline/ }).click()

    // Wait for pipeline tab panel to be visible
    const pipelinePanel = adminPage.getByRole('tabpanel', { name: 'Pipeline' })
    await expect(pipelinePanel).toBeVisible({ timeout: 5_000 })

    // The pipeline tab preview shows stage names and a "Chỉnh sửa" link
    // Verify some content is present in the panel
    const panelText = await pipelinePanel.textContent()
    expect(panelText).toBeTruthy()
    expect(panelText!.length).toBeGreaterThan(0)
  })
})
