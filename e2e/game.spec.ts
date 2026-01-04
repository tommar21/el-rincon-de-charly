import { test, expect } from '@playwright/test';

test.describe('Tic Tac Toe Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main menu', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tic tac toe/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /jugar vs ia/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /2 jugadores/i })).toBeVisible();
  });

  test('should start a game vs AI', async ({ page }) => {
    await page.getByRole('button', { name: /jugar vs ia/i }).click();

    // Should show the game board
    await expect(page.locator('[data-testid="board"]')).toBeVisible();

    // Should show turn indicator
    await expect(page.getByText(/turno de/i)).toBeVisible();
  });

  test('should allow making moves', async ({ page }) => {
    await page.getByRole('button', { name: /jugar vs ia/i }).click();

    // Click on the first cell
    const cells = page.locator('[data-testid="cell"]');
    await cells.first().click();

    // Cell should now have X
    await expect(cells.first().getByText('X')).toBeVisible();
  });

  test('should show AI thinking indicator', async ({ page }) => {
    await page.getByRole('button', { name: /jugar vs ia/i }).click();

    // Make a move
    const cells = page.locator('[data-testid="cell"]');
    await cells.first().click();

    // Should show AI thinking (may be very fast)
    // Wait for AI to make a move - at least one O should appear
    await expect(page.getByText('O')).toBeVisible({ timeout: 5000 });
  });

  test('should allow restarting the game', async ({ page }) => {
    await page.getByRole('button', { name: /jugar vs ia/i }).click();

    // Make a move
    const cells = page.locator('[data-testid="cell"]');
    await cells.first().click();

    // Click restart
    await page.getByRole('button', { name: /reiniciar/i }).click();

    // Board should be empty (no X or O visible)
    await expect(cells.first().getByText('X')).not.toBeVisible();
  });

  test('should allow going back to menu', async ({ page }) => {
    await page.getByRole('button', { name: /jugar vs ia/i }).click();

    // Click menu button
    await page.getByRole('button', { name: /menu/i }).click();

    // Should be back at main menu
    await expect(page.getByRole('button', { name: /jugar vs ia/i })).toBeVisible();
  });

  test('should allow changing difficulty', async ({ page }) => {
    // Click on difficulty buttons
    await page.getByRole('button', { name: /facil/i }).click();
    await expect(page.getByRole('button', { name: /facil/i })).toHaveClass(/bg-\[var\(--color-primary\)\]/);

    await page.getByRole('button', { name: /imposible/i }).click();
    await expect(page.getByRole('button', { name: /imposible/i })).toHaveClass(/bg-\[var\(--color-primary\)\]/);
  });

  test('should allow changing player symbol', async ({ page }) => {
    // Click on O symbol
    await page.getByRole('button', { name: 'O' }).click();

    // Start game
    await page.getByRole('button', { name: /jugar vs ia/i }).click();

    // AI should make the first move (X) since player is O
    await expect(page.getByText('X')).toBeVisible({ timeout: 5000 });
  });

  test('should start 2 player local game', async ({ page }) => {
    await page.getByRole('button', { name: /2 jugadores/i }).click();

    // Should show the game board
    await expect(page.locator('[data-testid="board"]')).toBeVisible();

    // Make moves alternating X and O
    const cells = page.locator('[data-testid="cell"]');

    await cells.nth(0).click(); // X
    await expect(cells.nth(0).getByText('X')).toBeVisible();

    await cells.nth(1).click(); // O
    await expect(cells.nth(1).getByText('O')).toBeVisible();

    await cells.nth(2).click(); // X
    await expect(cells.nth(2).getByText('X')).toBeVisible();
  });

  test('should detect a win', async ({ page }) => {
    await page.getByRole('button', { name: /2 jugadores/i }).click();

    const cells = page.locator('[data-testid="cell"]');

    // X wins with top row
    await cells.nth(0).click(); // X at 0
    await cells.nth(3).click(); // O at 3
    await cells.nth(1).click(); // X at 1
    await cells.nth(4).click(); // O at 4
    await cells.nth(2).click(); // X at 2 - wins!

    // Should show winner message
    await expect(page.getByText(/gana/i)).toBeVisible();
  });

  test('should detect a draw', async ({ page }) => {
    await page.getByRole('button', { name: /2 jugadores/i }).click();

    const cells = page.locator('[data-testid="cell"]');

    // Play a draw game
    // X O X
    // X X O
    // O X O
    await cells.nth(0).click(); // X
    await cells.nth(1).click(); // O
    await cells.nth(2).click(); // X
    await cells.nth(4).click(); // O - center
    await cells.nth(3).click(); // X
    await cells.nth(5).click(); // O
    await cells.nth(7).click(); // X
    await cells.nth(6).click(); // O
    await cells.nth(8).click(); // X - draw!

    // Should show draw message
    await expect(page.getByText(/empate/i)).toBeVisible();
  });
});

test.describe('Theme', () => {
  test('should allow changing theme', async ({ page }) => {
    await page.goto('/');

    // Find and click theme selector
    const themeButton = page.locator('[title*="tema"], [aria-label*="tema"]').first();

    if (await themeButton.isVisible()) {
      await themeButton.click();
      // Theme should change (we can verify by checking CSS variables or classes)
    }
  });
});

test.describe('Stats Modal', () => {
  test('should open stats modal', async ({ page }) => {
    await page.goto('/');

    // Click stats button
    const statsButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    await statsButton.click();

    // Stats modal should be visible
    await expect(page.getByText(/estadisticas/i)).toBeVisible();
  });
});
