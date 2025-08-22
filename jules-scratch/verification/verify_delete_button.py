from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000/mobile-test")

        # Click the "Add Hotspot" button
        page.locator("button", has_text="Add Hotspot").click()

        # Click the newly created hotspot to select it
        page.locator(".hotspot-element").click()

        # Click the "Delete" button in the toolbar
        page.locator("button[aria-label='Delete hotspot']").click()

        # Verify that the hotspot has been deleted
        expect(page.locator(".hotspot-element")).to_have_count(0)

        page.screenshot(path="jules-scratch/verification/verification.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
