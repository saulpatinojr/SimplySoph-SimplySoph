import time
from playwright.sync_api import sync_playwright

def verify_photo_carousel():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to home page
            print("Navigating to home page...")
            page.goto("http://localhost:5173")

            # Wait for content to load
            time.sleep(5)

            # Take screenshot of the hero section where carousel is likely located
            print("Taking screenshot...")
            page.screenshot(path="verification_carousel.png", full_page=True)

            print("Verification complete. Screenshot saved as verification_carousel.png")

        except Exception as e:
            print(f"Error during verification: {e}")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_photo_carousel()
