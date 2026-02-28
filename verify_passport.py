from playwright.sync_api import sync_playwright

def test_passport_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Intercept firebase network calls and mock them
        def intercept_route(route):
            if "firestore.googleapis.com" in route.request.url:
                route.fulfill(status=200, content_type="application/json", body='[]')
            else:
                route.continue_()

        page.route("**/*", intercept_route)

        # Navigate to the passport page
        page.goto("http://localhost:5173/passport")
        page.wait_for_timeout(3000)

        # Take a screenshot
        page.screenshot(path="passport_landing_mocked.png")

        browser.close()

if __name__ == "__main__":
    test_passport_page()
