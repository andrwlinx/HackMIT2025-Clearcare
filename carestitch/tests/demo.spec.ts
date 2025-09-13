import { test, expect } from '@playwright/test'

test.describe('Knee Cost Demo', () => {
  test('should display home page correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Check your knee arthroscopy costs')
    
    // Check CTA button
    await expect(page.locator('text=Start Estimate')).toBeVisible()
    
    // Check features section
    await expect(page.locator('text=Quick Estimates')).toBeVisible()
    await expect(page.locator('text=Compare Facilities')).toBeVisible()
    await expect(page.locator('text=Transparent Pricing')).toBeVisible()
    
    // Check demo notice
    await expect(page.locator('text=Demo Application')).toBeVisible()
  })

  test('should navigate to estimate page', async ({ page }) => {
    await page.goto('/')
    
    // Click Start Estimate button
    await page.click('text=Start Estimate')
    
    // Should be on estimate page
    await expect(page).toHaveURL('/estimate')
    await expect(page.locator('h1')).toContainText('Get Your Knee Arthroscopy Cost Estimate')
  })

  test('should display estimate form', async ({ page }) => {
    await page.goto('/estimate')
    
    // Check form elements
    await expect(page.locator('input[placeholder="Enter your ZIP code"]')).toBeVisible()
    await expect(page.locator('text=I have already met my deductible this year')).toBeVisible()
    await expect(page.locator('button:has-text("Find Facilities")')).toBeVisible()
    
    // Check progress indicator
    await expect(page.locator('text=Insurance Info')).toBeVisible()
    await expect(page.locator('text=Choose Facility')).toBeVisible()
    await expect(page.locator('text=Get Estimate')).toBeVisible()
  })

  test('should navigate to compare page', async ({ page }) => {
    await page.goto('/compare')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Compare Knee Arthroscopy Facilities')
    
    // Check ZIP code filter
    await expect(page.locator('input[placeholder="02118"]')).toBeVisible()
    await expect(page.locator('button:has-text("Search")')).toBeVisible()
  })

  test('should navigate to dashboard page', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Your Cost Estimates')
    
    // Check demo notice
    await expect(page.locator('text=Demo Mode')).toBeVisible()
    
    // Check mock estimates
    await expect(page.locator('text=Boston Medical Center')).toBeVisible()
    await expect(page.locator('text=Massachusetts General Hospital')).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test navigation links
    await page.click('text=Get Estimate')
    await expect(page).toHaveURL('/estimate')
    
    await page.click('text=Home')
    await expect(page).toHaveURL('/')
    
    await page.goto('/estimate')
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/dashboard')
  })
})
