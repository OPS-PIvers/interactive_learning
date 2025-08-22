import { test, expect } from '@playwright/test';

test.describe.skip('Hotspot Deletion', () => {
  test('should delete a hotspot when the delete button is clicked', async ({ page }) => {
    // Navigate to the editor test page
    await page.goto('http://localhost:3000/test/editor');

    // Wait for the editor to load
    await page.waitForSelector('.modern-slide-editor');

    // Click on the "Add Hotspot" button
    await page.click('button:has-text("Add Hotspot")');

    // Verify that a new hotspot has been added
    const hotspotSelector = '.hotspot-element';
    await page.waitForSelector(hotspotSelector);
    await expect(page.locator(hotspotSelector)).toHaveCount(1);

    // Click on the hotspot to select it
    await page.click(hotspotSelector);

    // Click on the "Delete Hotspot" button
    await page.getByRole('button', { name: 'Delete hotspot' }).click();

    // Verify that the hotspot has been deleted
    await expect(page.locator(hotspotSelector)).toHaveCount(0);
  });
});
