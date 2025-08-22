import { test, expect } from '@playwright/test';

test.describe('Hotspot Deletion', () => {
  test('should delete a hotspot when the delete button is clicked', async ({ page }) => {
    // Navigate to the editor test page
    await page.goto('http://localhost:3001/test/editor');

    // Wait for the editor to load
    await page.waitForSelector('.modern-slide-editor');

    // Click on the "Add Hotspot" button
    await page.click('button:has-text("Add Hotspot")');

    // Verify that a new hotspot has been added
    const hotspotSelector = '.hotspot-element';
    await page.waitForSelector(hotspotSelector);
    let hotspots = await page.$$(hotspotSelector);
    expect(hotspots.length).toBe(1);

    // Click on the hotspot to select it
    await page.click(hotspotSelector);

    // Verify that the "Delete Hotspot" button is visible
    const deleteButtonSelector = 'button:has-text("Delete Hotspot")';
    await page.waitForSelector(deleteButtonSelector);

    // Click on the "Delete Hotspot" button
    await page.click(deleteButtonSelector);

    // Verify that the hotspot has been deleted
    hotspots = await page.$$(hotspotSelector);
    expect(hotspots.length).toBe(0);
  });
});
